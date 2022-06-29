import { Euler, Quaternion, Vector3 } from 'three';
import { v4 } from 'uuid';
import CubeLocker from '../../../util/CubeLocker';
import { CommandRunError } from '../../CommandRunError';
import { HistoryActionTypes } from './../../../undoredo/UndoRedoHandler';
import { LockerType } from './../../../util/CubeLocker';
import { Command } from './../../Command';

const tempVec = new Vector3()
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

      const captureData = (time: number) => {
        model.resetVisuals()
        animation.animateAt(time)
        model.updateMatrixWorld(true)
        return cubes.map(cube => {
          const pos = tempVec.copy(cube.cubeGroup.position)
          const quat = tempQuat.copy(cube.cubeGroup.quaternion)
          tempEuler.setFromQuaternion(quat, "ZYX")
          return {
            locker: new CubeLocker(cube),
            position: [pos.x, pos.y, pos.z],
            rotation: [tempEuler.x * 180 / Math.PI, tempEuler.y * 180 / Math.PI, tempEuler.z * 180 / Math.PI],
          }
        }).sort((a, b) => a.locker.cube.hierarchyLevel - b.locker.cube.hierarchyLevel)
      }

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

        captureData(newKeyframe.startTime.value).forEach(({ locker, position, rotation }) => {
          model.resetVisuals()
          animation.animateAt(newKeyframe.startTime.value + newKeyframe.duration.value)
          model.updateMatrixWorld(true)

          const values = CubeLocker.reconstructLockerValues(locker.cube, LockerType.POSITION_ROTATION, locker.worldMatrix)
          const posDelta = [values.position[0] - position[0], values.position[1] - position[1], values.position[2] - position[2]] as const
          const rotDelta = [values.rotation[0] - rotation[0], values.rotation[1] - rotation[1], values.rotation[2] - rotation[2]] as const

          if (posDelta[0] !== 0 || posDelta[1] !== 0 || posDelta[2] !== 0) {
            newKeyframe.position.set(locker.cube.name.value, posDelta)
          }
          if (rotDelta[0] !== 0 || rotDelta[1] !== 0 || rotDelta[2] !== 0) {
            newKeyframe.rotation.set(locker.cube.name.value, rotDelta)
          }
        })
      }

      const steps = Math.round(keyframe.duration.value / 0.01)
      for (let i = 0; i < steps; i++) {
        insertEndKeyframe(i / steps, (i + 1) / steps)
      }

    })
    animation.undoRedoHandler.endBatchActions("Locked Cube Keyframe", HistoryActionTypes.Command)


  }))
}

export default KeyframeLockedCubeCommand