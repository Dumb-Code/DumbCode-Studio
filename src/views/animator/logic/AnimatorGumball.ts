import { Euler, Matrix4, Object3D, Quaternion, Vector3 } from 'three';
import { DCMCube, DCMModel } from '../../../studio/formats/model/DcmModel';
import DcProject from '../../../studio/formats/project/DcProject';
import { LO } from '../../../studio/listenableobject/ListenableObject';
import SelectedCubeManager from '../../../studio/selections/SelectedCubeManager';
import { NumArray } from './../../../studio/util/NumArray';
import { AnimatorGumballIK } from './AnimatorGumballIK';


export type StartingCacheData = {
  root: boolean,
  position: NumArray
  quaternion: Quaternion,
}

export const decomposePosition = new Vector3()
export const decomposeRotation = new Quaternion()
export const decomposeEuler = new Euler()
export const decomposeScale = new Vector3()

export const decomposePosition2 = new Vector3()
export const decomposeRotation2 = new Quaternion()
export const decomposeScale2 = new Vector3()

export const _identityMatrix = new Matrix4()

export class AnimatorGumball {
  readonly enabled = new LO(true)

  readonly mode = new LO<"object" | "gumball">("object")
  readonly space = new LO<"local" | "world">("local")

  readonly object_transformMode = new LO<"translate" | "rotate" | "translateIK">("translate")

  readonly gumball_autoRotate = new LO(true)

  readonly transformAnchor = new Object3D()
  readonly startingRot = new Vector3()
  readonly startingPos = new Vector3()

  readonly startingCache = new Map<DCMCube, StartingCacheData>()

  readonly gumballIK: AnimatorGumballIK

  public readonly selectedCubeManager: SelectedCubeManager
  private readonly model: DCMModel


  constructor(
    private readonly project: DcProject
  ) {

    this.selectedCubeManager = project.selectedCubeManager
    this.model = project.model

    const { group, overlayGroup } = project


    this.transformAnchor.rotation.order = "ZYX"
    group.add(this.transformAnchor)

    this.gumballIK = new AnimatorGumballIK(group, overlayGroup)
  }

  moveToSelected(selected = this.selectedCubeManager.selected.value) {
    if (selected.length === 0) {
      return
    }

    const cube = this.model.identifierCubeMap.get(selected[0])
    if (cube !== undefined) {
      cube.getWorldPosition(0.5, 0.5, 0.5, this.transformAnchor.position)
      if (this.gumball_autoRotate.value) {
        cube.cubeGroup.getWorldQuaternion(this.transformAnchor.quaternion)
      }
    }
  }
}

