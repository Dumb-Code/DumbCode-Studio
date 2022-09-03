import { LO } from "../../listenableobject/ListenableObject";
import UndoRedoHandler from "../../undoredo/UndoRedoHandler";
import { AnimatorGumball } from './../../../views/animator/logic/AnimatorGumball';
import { NumArray } from './../../util/NumArray';
import { DCMCube } from './../model/DcmModel';

export default class AnimatorGumballConsumer {

  readonly ikAnchorCubes = new LO<readonly string[]>([])
  readonly ikDirection = new LO<"upwards" | "downwards">("upwards")

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

  gumballGetRotation(cube: DCMCube): NumArray | undefined {
    throw new Error("Method not implemented.");
  }

  wrapToSetValue(callback: () => void) {
    callback()
  }

  setPositionAbsoluteAnimated(cube: DCMCube | undefined, x: number, y: number, z: number) {
    if (cube) {
      const [cx, cy, cz] = this.gumballGetPosition(cube) ?? [0, 0, 0]
      this.gumballSetPosition(cube, [x - cx, y - cy, z - cz])
    }
  }

  setRotationAbsoluteAnimated(cube: DCMCube | undefined, x: number, y: number, z: number) {
    if (cube) {
      const [cx, cy, cz] = this.gumballGetRotation(cube) ?? [0, 0, 0]
      this.gumballSetRotation(cube, [x - cx, y - cy, z - cz])
    }
  }
}
