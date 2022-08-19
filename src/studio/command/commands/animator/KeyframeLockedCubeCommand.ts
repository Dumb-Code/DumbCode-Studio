import { Euler, Matrix4, Quaternion, Vector3 } from 'three';
import { v4 } from 'uuid';
import CubeLocker from '../../../util/CubeLocker';
import { CommandRunError } from '../../CommandRunError';
import DcaAnimation, { DcaKeyframe } from './../../../formats/animations/DcaAnimation';
import { DCMCube } from './../../../formats/model/DcmModel';
import { HistoryActionTypes } from './../../../undoredo/UndoRedoHandler';
import { LockerType } from './../../../util/CubeLocker';
import { NumArray } from './../../../util/NumArray';
import { Command } from './../../Command';

const tempVec = new Vector3()
const tempVec2 = new Vector3()
const tempQuat = new Quaternion()
const tempEuler = new Euler()

const KeyframeLockedCubeCommand = (addCommand: (command: Command) => void) => {
  addCommand(new Command("lockedcubekf", "Create keyframes parallel to the selected keyframes, locking the selected cubes in place", {}, context => {
    if (context.dummy) {
      return undefined
    }

    const animation = context.getSelectedAnimation()
    const cubes = context.getCubes()

    if (animation === null) {
      throw new CommandRunError("No animation selected")
    }

    const model = animation.project.model


    const keyframes = animation.selectedKeyframes.value
    if (keyframes.length === 0) {
      throw new CommandRunError("No keyframes selected")
    }

    animation.undoRedoHandler.startBatchActions()
    keyframes.forEach(keyframe => {

      const insertEndKeyframe = (percent: number, nextPercent: number) => {
        const start = keyframe.startTime.value + keyframe.duration.value * percent
        const end = keyframe.startTime.value + keyframe.duration.value * Math.min(nextPercent, 1)
        const newKeyframe = animation.createKeyframe(
          keyframe.layerId.value,
          v4(),
          start,
          end - start,
          false
        )

        const [captured] = captureData(animation, newKeyframe.startTime.value, cubes)

        const wrongfullyMovedCubes = cubes.flatMap(c => c.children.value).filter(c => !cubes.includes(c))

        const [wrongfullyMovedCaptured] = captureData(
          animation,
          newKeyframe.startTime.value + newKeyframe.duration.value,
          wrongfullyMovedCubes,
        )

        captured.forEach(d => reconstruct(d, newKeyframe))

        model.resetVisuals()
        animation.animateAt(newKeyframe.startTime.value + newKeyframe.duration.value)
        model.updateMatrixWorld(true)

        wrongfullyMovedCaptured.forEach(cube => reconstruct(cube, newKeyframe))

      }

      const steps = Math.round(keyframe.duration.value / 0.05)
      for (let i = 0; i < steps; i++) {
        insertEndKeyframe(i / steps, (i + 1) / steps)
      }

    })
    animation.undoRedoHandler.endBatchActions("Locked Cube Keyframe", HistoryActionTypes.Command)


  }))
}

type CapturedData = {
  cube: DCMCube,
  worldMatrix: Matrix4,
  meshWorldMatrix: Matrix4,
  position: NumArray;
  rotation: NumArray;
  cubeGrow: NumArray;
}

export const captureCube = (cube: DCMCube): CapturedData => {
  const pos = tempVec.copy(cube.cubeGroup.position)
  const quat = tempQuat.copy(cube.cubeGroup.quaternion)
  tempEuler.setFromQuaternion(quat, "ZYX")
  const locker = new CubeLocker(cube)

  const cubeGrow = tempVec2.copy(cube.cubeGrowGroup.position).multiplyScalar(-1)

  return {
    cube,
    worldMatrix: locker.worldMatrix,
    meshWorldMatrix: cube.cubeMesh.matrixWorld,
    position: [pos.x, pos.y, pos.z],
    rotation: [tempEuler.x * 180 / Math.PI, tempEuler.y * 180 / Math.PI, tempEuler.z * 180 / Math.PI],
    cubeGrow: [cubeGrow.x, cubeGrow.y, cubeGrow.z]
  }
}

export const captureData = (animation: DcaAnimation, time: number, ...cubes: DCMCube[][]) => {
  animation.project.model.resetVisuals()
  animation.animateAt(time)
  animation.project.model.updateMatrixWorld(true)
  return cubes.map(cubes => cubes.map(captureCube).sort((a, b) => a.cube.hierarchyLevel - b.cube.hierarchyLevel))
}

export const reconstruct = ({ cube, worldMatrix, position, rotation }: CapturedData, newKeyframe: DcaKeyframe) => {
  const values = CubeLocker.reconstructLockerValues(cube, LockerType.POSITION_ROTATION, worldMatrix)
  const posDelta = [values.position[0] - position[0], values.position[1] - position[1], values.position[2] - position[2]] as const
  const rotDelta = [values.rotation[0] - rotation[0], values.rotation[1] - rotation[1], values.rotation[2] - rotation[2]] as const

  if (posDelta[0] !== 0 || posDelta[1] !== 0 || posDelta[2] !== 0) {
    newKeyframe.position.set(cube.name.value, posDelta)
  }
  if (rotDelta[0] !== 0 || rotDelta[1] !== 0 || rotDelta[2] !== 0) {
    newKeyframe.rotation.set(cube.name.value, rotDelta)
  }
}

export default KeyframeLockedCubeCommand