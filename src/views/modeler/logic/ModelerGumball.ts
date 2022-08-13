import { Euler, Group, Matrix4, Object3D, Quaternion, Vector3 } from 'three';
import { LO } from '../../../studio/listenableobject/ListenableObject';
import SelectedCubeManager from '../../../studio/selections/SelectedCubeManager';
import { DCMCube, DCMModel } from './../../../studio/formats/model/DcmModel';
import { NumArray } from './../../../studio/util/NumArray';
import CubePointTracker from './CubePointTracker';

export type StartingCacheData = {
  root: boolean,
  position: NumArray
  offset: NumArray
  dimension: NumArray
  quaternion: Quaternion,
  threeWorldPos: Vector3
}

/**
 * Aligns an vec3 to the closest axis.
 */
export function alignAxis(axis: Vector3) {
  let xn = Math.abs(axis.x);
  let yn = Math.abs(axis.y);
  let zn = Math.abs(axis.z);

  if ((xn >= yn) && (xn >= zn)) {
    axis.set(axis.x > 0 ? 1 : -1, 0, 0)
  } else if ((yn > xn) && (yn >= zn)) {
    axis.set(0, axis.y > 0 ? 1 : -1, 0)
  } else if ((zn > xn) && (zn > yn)) {
    axis.set(0, 0, axis.z > 0 ? 1 : -1)
  } else {
    axis.set(0, 0, 0)
  }
}

export const decomposePosition = new Vector3()
export const decomposeRotation = new Quaternion()
export const decomposeEuler = new Euler()
export const decomposeScale = new Vector3()

export const decomposePosition2 = new Vector3()
export const decomposeRotation2 = new Quaternion()
export const decomposeScale2 = new Vector3()

const totalPosition = new Vector3()

export const _identityMatrix = new Matrix4()


export class ModelerGumball {

  readonly enabled = new LO(true)

  readonly mode = new LO<"object" | "gumball">("object")
  readonly space = new LO<"local" | "world">("local")


  //Object Properties
  readonly object_transformMode = new LO<"translate" | "rotate" | "dimensions">("translate")

  //Object position and rotation spefic properties
  readonly object_position_type = new LO<"position" | "offset" | "rotation_point">("position")
  readonly object_rotation_type = new LO<"rotation" | "rotation_around_point">("rotation")


  //Gumball properties
  readonly gumball_move_mode = new LO<"translate" | "rotate">("translate")
  readonly gumball_auto_move = new LO(true)

  readonly transformAnchor = new Object3D()

  readonly blockedReasons = new LO<readonly string[]>([])

  readonly startingCache = new Map<DCMCube, StartingCacheData>()

  constructor(
    public readonly selectedCubeManager: SelectedCubeManager,
    private readonly model: DCMModel,
    group: Group,
    private readonly cubePointTracker: CubePointTracker,
  ) {
    this.transformAnchor.rotation.order = "ZYX"
    group.add(this.transformAnchor)
  }

  //For dimensions and offset translations,
  //this will return false, otherwise it will return true.
  shouldTransformGroup() {
    if (this.object_transformMode.value === "dimensions") {
      return false
    }
    if (this.object_transformMode.value === "translate" && this.object_position_type.value === "offset") {
      return false
    }
    return true
  }

  //Get the three object to perform on. For dimensions and offset translations,
  //this will be the cubes mesh, rather than the cubes group
  getThreeObject(cube: DCMCube): Object3D {
    return this.shouldTransformGroup() ? cube.cubeGroup : cube.cubeMesh
  }

  moveToCustomPoint() {
    this.cubePointTracker.enable(p => this.transformAnchor.position.copy(p))
  }

  /**
   * Moves the anchor to the avarage position of the cubes, and the first cubes rotation
   */
  moveGumballToSelected({ selected = this.selectedCubeManager.selected.value, position = true, rotation = true }) {
    if (selected.length === 0) {
      return
    }

    totalPosition.set(0, 0, 0)
    let firstSelected = selected[0]

    //Iterate over the cubes, adding the world position to `totalPostiion`, and setting the rotation if is the first cube.
    selected.forEach(identifier => {
      const cube = this.model.identifierCubeMap.get(identifier)
      if (cube === undefined) {
        return
      }
      const elem = this.getThreeObject(cube)
      elem.matrixWorld.decompose(decomposePosition, decomposeRotation, decomposeScale)

      totalPosition.add(decomposePosition)

      if (cube.identifier === firstSelected && rotation) {
        this.transformAnchor.quaternion.copy(decomposeRotation)
      }
    })

    //Set the position to the avarage of the totalPosition
    if (position === true) {
      this.transformAnchor.position.copy(totalPosition).divideScalar(selected.length)
    }
  }
}

