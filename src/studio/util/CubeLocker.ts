import { Euler, Matrix4, Object3D, Quaternion, Vector3 } from 'three';
import { DCMCube } from './../formats/model/DcmModel';

export enum LockerType {
  POSITION_ROTATION, //legacy 0
  OFFSET, //legacy 1
  POSITION, //legacy 2
  ROTATION, //legacy 3
}

const resultMat = new Matrix4()
const decomposePos = new Vector3()
const decomposeRot = new Quaternion()
const decomposeScale = new Vector3()
const decomposeEuler = new Euler()

export default class CubeLocker {

  private readonly worldMatrix: Matrix4

  constructor(
    public readonly cube: DCMCube,
    private readonly type: LockerType = LockerType.POSITION_ROTATION,
  ) {
    this.worldMatrix = getElementFromCube(cube, type).matrixWorld.clone()
  }

  reconstruct() {
    CubeLocker.reconstructLocker(this.cube, this.type, this.worldMatrix)
  }

  static reconstructLockerFromLocker(locker: CubeLocker) {
    return CubeLocker.reconstructLocker(locker.cube, locker.type, locker.worldMatrix)
  }

  static reconstructLockerValues<T extends LockerType>(cube: DCMCube, type: T, worldMatrix: Matrix4):
    T extends LockerType.POSITION_ROTATION ? { position: [number, number, number], rotation: [number, number, number] } :
    T extends LockerType.POSITION ? { position: [number, number, number] } :
    T extends LockerType.ROTATION ? { rotation: [number, number, number] } :
    T extends LockerType.OFFSET ? { offset: [number, number, number] } : never {

    //      parent_world_matrix * local_matrix = world_matrix
    //  =>  local_matrix = 'parent_world_matrix * world_matrix
    const cubeElement = getElementFromCube(cube, type)
    const parent = cubeElement.parent

    if (parent !== null) {
      resultMat.copy(parent.matrixWorld).invert()
    } else {
      console.warn("Attempted to get parent of object, but found null.", cubeElement)
      resultMat.identity()
    }
    const localMatrix = resultMat.multiply(worldMatrix)

    localMatrix.decompose(decomposePos, decomposeRot, decomposeScale)
    decomposeEuler.setFromQuaternion(decomposeRot, "ZYX")

    const position = [decomposePos.x, decomposePos.y, decomposePos.z]
    const rotation = [decomposeEuler.x * 180 / Math.PI, decomposeEuler.y * 180 / Math.PI, decomposeEuler.z * 180 / Math.PI]

    switch (type) {
      case LockerType.POSITION_ROTATION:
        return {
          position,
          rotation,
        } as any
      case LockerType.POSITION:
        return {
          position,
        } as any
      case LockerType.ROTATION:
        return {
          rotation,
        } as any
      case LockerType.OFFSET:
        return {
          offset: position,
        } as any
    }
    return {} as any
  }

  static reconstructLocker<T extends LockerType>(cube: DCMCube, type: T, worldMatrix: Matrix4) {
    const values = CubeLocker.reconstructLockerValues<T>(cube, type, worldMatrix) as any

    if ((type === LockerType.POSITION || type === LockerType.POSITION_ROTATION)) {
      cube.position.value = values.position
    }

    if (type === LockerType.ROTATION || type === LockerType.POSITION_ROTATION) {
      cube.rotation.value = values.rotation
    }

    if (type === LockerType.OFFSET) {
      cube.offset.value = values.offset
    }
  }
}



function getElementFromCube(cube: DCMCube, type: LockerType): Object3D {
  switch (type) {
    case LockerType.POSITION_ROTATION:
    case LockerType.POSITION:
    case LockerType.ROTATION:
      return cube.cubeGroup
    case LockerType.OFFSET:
      return cube.cubeMesh
  }
}
