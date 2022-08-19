import { Euler, Quaternion, Vector3 } from 'three';
import { v4 } from 'uuid';
import { getWorldPositionForCube } from '../../../formats/model/DcmModel';
import { CommandRunError } from '../../CommandRunError';
import { HistoryActionTypes } from './../../../undoredo/UndoRedoHandler';
import { Command } from './../../Command';
import { captureData } from './KeyframeLockedCubeCommand';

const tempVec = new Vector3()
const tempVec2 = new Vector3()
const tempQuat = new Quaternion()
const tempEuler = new Euler()

const FloorPlaneCommand = (addCommand: (command: Command) => void) => {
  addCommand(new Command("floorplane", "Create keyframes parallel to the selected keyframes, forcing the selected cubes above the floor plane", {}, context => {
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

        const [captured] = captureData(animation, end, cubes)

        const underY = captured.map(data => {
          let min = Infinity
          for (let x = 0; x <= 1; x++) {
            for (let y = 0; y <= 1; y++) {
              for (let z = 0; z <= 1; z++) {

                data.meshWorldMatrix.decompose(tempVec, tempQuat, tempVec2)

                getWorldPositionForCube(
                  data.cube.dimension.value, data.cubeGrow,
                  tempQuat, tempVec,
                  x, y, z, tempVec2
                )

                min = Math.min(min, tempVec2.y)
              }
            }
          }

          return {
            ...data,
            y: min
          }
        }).filter(data => data.y < 0)

        if (underY.length !== 0) {
          const newKeyframe = animation.createKeyframe(
            keyframe.layerId.value,
            v4(),
            start,
            end - start,
            false
          )

          underY.forEach(data => {
            data.worldMatrix.decompose(tempVec, tempQuat, tempVec2)

            const upVectorLocal = tempVec.set(0, -data.y, 0)
            const upVector = upVectorLocal.applyQuaternion(tempQuat)

            newKeyframe.position.set(data.cube.name.value, [upVector.x * 16, upVector.y * 16, upVector.z * 16])
          })
        }


      }

      const steps = Math.round(keyframe.duration.value / 0.05)
      for (let i = 0; i < steps; i++) {
        insertEndKeyframe(i / steps, (i + 1) / steps)
      }

    })
    animation.undoRedoHandler.endBatchActions("Floor Plane Keyframe", HistoryActionTypes.Command)


  }))
}


export default FloorPlaneCommand