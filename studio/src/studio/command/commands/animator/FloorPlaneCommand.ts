import { Euler, Quaternion, Vector3 } from 'three';
import { v4 } from 'uuid';
import { AnimatorGumball } from '../../../../views/animator/logic/AnimatorGumball';
import AnimatorGumballConsumer, { AnimatorGumballConsumerPart } from '../../../formats/animations/AnimatorGumballConsumer';
import DcaAnimation from '../../../formats/animations/DcaAnimation';
import { getWorldPositionForCube } from '../../../formats/model/DcmModel';
import { LO } from '../../../listenableobject/ListenableObject';
import { CommandRunError } from '../../CommandRunError';
import { DcaKeyframe } from './../../../formats/animations/DcaAnimation';
import UndoRedoHandler, { HistoryActionTypes } from './../../../undoredo/UndoRedoHandler';
import { NumArray } from './../../../util/NumArray';
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

      const steps = Math.round(keyframe.duration.value / 0.05)

      //We need to compute the data beforehand as the keep the X and Z values correct.
      //Otherwise, the cube can "slip" around:
      //Slipping: https://cdn.discordapp.com/attachments/741335776473907320/1010872742960173127/msedge_yEFexR3ghH.gif
      //Not slipping: https://cdn.discordapp.com/attachments/741335776473907320/1010875454883893268/msedge_XQVJzd2JVM.gif
      const computeData = (nextPercent: number) => {
        const end = keyframe.startTime.value + keyframe.duration.value * Math.min(nextPercent, 1)

        const [captured] = captureData(animation, end, cubes)

        return captured.map(data => {
          //Get the minimum point of each of the 8 corners of the cube.
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


          //Get the cubes poisition, and if any part of the cube is below 0,
          //move the world position up by that amount
          const worldPosition = data.cube.cubeGroup.getWorldPosition(tempVec2)
          if (min < 0) {
            worldPosition.y -= min
          }


          //Convert to array as worldPosition is a Vector3 and thus will be reused
          const worldPos: NumArray = [worldPosition.x, worldPosition.y, worldPosition.z]


          return {
            ...data,
            y: min,
            worldPos
          }
        }).filter(data => data.y < 0)
      }

      //Compute all the datas for each step
      type ComputedData = ReturnType<typeof computeData>[number]
      const computedData: ComputedData[][] = []
      for (let i = 0; i < steps; i++) {
        computedData[i] = computeData((i + 1) / steps)
      }


      const insertEndKeyframe = (index: number, percent: number, nextPercent: number) => {
        const start = keyframe.startTime.value + keyframe.duration.value * percent
        const end = keyframe.startTime.value + keyframe.duration.value * Math.min(nextPercent, 1)

        const underY = computedData[index]

        if (underY.length !== 0) {
          const newKeyframe = animation.createKeyframe(
            keyframe.layerId.value,
            v4(),
            start,
            end - start,
            false
          )

          const delegate = new DelegateAnimatorGumballConsumer(animation, newKeyframe)

          underY.forEach(data => {

            //OLD way of only moving the cubes:
            // //Using data.worldMatrix, we want to get the world up vector in the cube's local space.
            // data.parentWorldMatrix.decompose(tempVec, tempQuat, tempVec2)
            // const up = tempVec2.set(0, 1, 0)
            // const localUp = up.applyQuaternion(tempQuat.invert()).multiplyScalar(-data.y * 16)
            // newKeyframe.position.set(data.cube.name.value, [localUp.x, localUp.y, localUp.z])

            const ik = animation.animatorGumball.gumballIK

            ik.begin(
              delegate, [data.cube],
              delegate.ikAnchorCubes.value,
              delegate.ikDirection.value,
            )

            //We need to subtract the starting pos, as it's added on in `objectChange`.
            //We could add options to not add, but it's easier just to subtract.
            ik.anchor.position.set(data.worldPos[0], data.worldPos[1], data.worldPos[2])
              .sub(ik.startingPosOffset)

            ik.objectChange(
              delegate, newKeyframe, [data.cube]
            )

            ik.end()
          })


        }


      }

      for (let i = 0; i < steps; i++) {
        insertEndKeyframe(i, i / steps, (i + 1) / steps)
      }

    })
    animation.undoRedoHandler.endBatchActions("Floor Plane Keyframe", HistoryActionTypes.Command)


  }))
}

class DelegateAnimatorGumballConsumer implements AnimatorGumballConsumer {

  constructor(
    private readonly animation: DcaAnimation,
    private readonly keyframe: DcaKeyframe,
  ) { }

  get ikAnchorCubes(): LO<readonly string[]> {
    return this.animation.ikAnchorCubes
  }
  get ikDirection(): LO<'upwards' | 'downwards'> {
    return LO.createReadonly<'upwards' | 'downwards'>('upwards')
  }
  getUndoRedoHandler(): UndoRedoHandler<any> | undefined {
    return this.animation.undoRedoHandler
  }
  renderForGumball(): void {
    this.animation.project.model.resetVisuals()
    const kf = this.keyframe
    this.animation.animateAt(kf.startTime.value + kf.duration.value)
    this.animation.project.model.updateMatrixWorld(true)
  }
  getAnimatorGumball(): AnimatorGumball {
    return this.animation.animatorGumball
  }
  getSingleSelectedPart(): LO<AnimatorGumballConsumerPart | null> {
    return LO.createReadonly<AnimatorGumballConsumerPart | null>(this.keyframe)
  }

}

export default FloorPlaneCommand