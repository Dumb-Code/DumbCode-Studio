import UndoRedoHandler from "../../undoredo/UndoRedoHandler";
import { LO } from "../../util/ListenableObject";
import { AnimatorGumball } from './../../../views/animator/logic/AnimatorGumball';
import { NumArray } from './../../util/NumArray';
import { DCMCube } from './../model/DcmModel';

export default class AnimatorGumballConsumer {

  readonly ikAnchorCubes = new LO<readonly string[]>([])
  readonly ikDirection = new LO<"upwards" | "downwards">("upwards")
  readonly lockedCubes = new LO<readonly string[]>([])

  getUndoRedoHandler(): UndoRedoHandler<any> | undefined {
    return undefined
  }

  renderForGumball() {

  }

  getAnimatorGumball(): AnimatorGumball {
    throw new Error("Method not implemented.");
  }

  getSingleSelectedPart(): LO<AnimatorGumballConsumerPart | null> {
    throw new Error("Method not implemented.");
  }
}

export class AnimatorGumballConsumerPart {


  gumballSetPosition(cube: DCMCube, position: NumArray) {
    throw new Error("Method not implemented.");
  }

  gumballSetRotation(cube: DCMCube, rotation: NumArray) {
    throw new Error("Method not implemented.");
  }

  gumballGetPosition(cube: DCMCube): NumArray | undefined {
    throw new Error("Method not implemented.");
  }

  wrapToSetValue(callback: () => void) {
    callback()
  }

  setPositionAbsoluteAnimated(cube: DCMCube | undefined, x: number, y: number, z: number) {
    if (cube) {
      this.gumballSetPosition(cube, [x, y, z])
    }
  }

  setRotationAbsoluteAnimated(cube: DCMCube | undefined, x: number, y: number, z: number) {
    if (cube) {
      this.gumballSetRotation(cube, [x, y, z])
    }
  }
}
