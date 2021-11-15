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

  static reconstructLocker(cube: DCMCube, type: LockerType, worldMatrix: Matrix4) {
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

    if (type === LockerType.POSITION || type === LockerType.POSITION_ROTATION) {
      cube.position.value = [decomposePos.x, decomposePos.y, decomposePos.z]
    }

    if (type === LockerType.ROTATION || type === LockerType.POSITION_ROTATION) {
      decomposeEuler.setFromQuaternion(decomposeRot, "ZYX")
      cube.rotation.value = [decomposeEuler.x * 180 / Math.PI, decomposeEuler.y * 180 / Math.PI, decomposeEuler.z * 180 / Math.PI]
    }

    if (type === LockerType.OFFSET) {
      cube.offset.value = [decomposePos.x, decomposePos.y, decomposePos.z]
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
