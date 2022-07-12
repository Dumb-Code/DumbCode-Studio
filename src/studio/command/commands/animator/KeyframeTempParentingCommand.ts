import { Matrix4 } from 'three';
import { v4 } from 'uuid';
import { HistoryActionTypes } from '../../../undoredo/UndoRedoHandler';
import { Command } from '../../Command';
import { CommandRunError } from '../../CommandRunError';
import { DCMCube } from './../../../formats/model/DcmModel';
import { captureData, reconstruct } from './KeyframeLockedCubeCommand';

const tempMatrix = new Matrix4()

const KeyframeTempParentingCommand = (addCommand: (command: Command) => void) => {
  addCommand(new Command("tempparentkf", "Create keyframes parallel to the selected keyframes, applying the temp parenting", {}, context => {
    if (context.dummy) {
      return undefined
    }

    const animation = context.getSelectedAnimation()

    if (animation === null) {
      throw new CommandRunError("No animation selected")
    }

    const model = animation.project.model

    const tempParentingArray = [...animation.tempoaryParenting.entries()]
      .map(([id, parentId]) => ({
        from: model.identifierCubeMap.get(id),
        to: model.identifierCubeMap.get(parentId),
      }))
      .filter((object): object is { from: DCMCube, to: DCMCube } => object.from !== undefined && object.to !== undefined)

    const fromCubes = tempParentingArray.map(({ from }) => from)
    const toCubes = tempParentingArray.map(({ to }) => to)


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

        const [fromCaptured, toCapturedStart] = captureData(animation, newKeyframe.startTime.value, fromCubes, toCubes)

        //some_local_matrix is the local matrix the cube would need if it was parented to the temp parent such that it's world matrix is constant
        //cubeWorldMatrix = tempParentWorldMatrix * some_local_matrix
        //'tempParentWorldMatrix * cubeWorldMatrix = some_local_matrix

        const localMatricies = fromCaptured.map(({ worldMatrix }, index) => {
          const tempParentWorldMatrixInverse = tempMatrix.copy(toCapturedStart[index].worldMatrix).invert()
          const result = tempParentWorldMatrixInverse.multiply(worldMatrix)

          //Copy into the captured data for the result
          //At this point, worldMatrix actually holds the local matrix, but it allows us to not create a new matrix 
          worldMatrix.copy(result)
          return worldMatrix
        })


        const wrongfullyMovedCubes = fromCubes.flatMap(c => c.children.value).filter(c => !fromCubes.includes(c))

        const [wrongfullyMovedCaptured, toCapturedEnd] = captureData(
          animation,
          newKeyframe.startTime.value + newKeyframe.duration.value,
          wrongfullyMovedCubes,
          toCubes
        )

        //We can do tempParentWorldMatrix * localMatrix now, to get the new world matrix
        localMatricies.forEach((matrix, index) => {
          const result = tempMatrix.copy(toCapturedEnd[index].worldMatrix).multiply(matrix)
          fromCaptured[index].worldMatrix.copy(result)
        })

        fromCaptured.forEach(d => reconstruct(d, newKeyframe))

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
export default KeyframeTempParentingCommand