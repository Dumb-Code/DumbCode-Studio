import { useCallback, useEffect, useRef } from 'react';
import { Euler, Event, Group, Matrix4, Object3D, Quaternion, Vector3 } from 'three';
import { DCMCube, DCMModel } from '../../../studio/formats/model/DcmModel';
import SelectedCubeManager from '../../../studio/util/SelectedCubeManager';
import { useStudio } from './../../../contexts/StudioContext';
import { DcaKeyframe } from './../../../studio/formats/animations/DcaAnimation';
import { LO, useListenableObject } from './../../../studio/util/ListenableObject';
import { AnimatorGumballIK } from './AnimatorGumballIK';


type StartingCacheData = {
  root: boolean,
  position: readonly [number, number, number]
  quaternion: Quaternion,
}

const decomposePosition = new Vector3()
const decomposeRotation = new Quaternion()
const decomposeEuler = new Euler()
const decomposeScale = new Vector3()

const decomposePosition2 = new Vector3()
const decomposeRotation2 = new Quaternion()
const decomposeScale2 = new Vector3()

const _identityMatrix = new Matrix4()


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

  constructor(
    public readonly selectedCubeManager: SelectedCubeManager,
    private readonly model: DCMModel,
    group: Group,
    overlayGroup: Group,
  ) {
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

      this.gumballIK.anchor.position.copy(this.transformAnchor.position)
      this.gumballIK.anchor.quaternion.copy(this.transformAnchor.quaternion)
    }
  }
}

export const useAnimatorGumball = () => {
  const { getSelectedProject, transformControls, onFrameListeners } = useStudio()
  const { selectedCubeManager, animationTabs, modelerGumball, model, cubePointTracker } = getSelectedProject()
  const gumballBlockedReasons = modelerGumball.blockedReasons
  const [selectedAnim] = useListenableObject(animationTabs.selectedAnimation)

  const getCubes = useCallback((selected: readonly string[] = selectedCubeManager.selected.value) => {
    return selected.map(cube => model.identifierCubeMap.get(cube)).filter(c => c !== undefined) as readonly DCMCube[]
  }, [selectedCubeManager, model.identifierCubeMap])

  const selectedCubes = useRef<readonly DCMCube[]>([])

  useEffect(() => {
    if (selectedAnim === null) {
      return
    }
    const animation = selectedAnim

    const gumball = animation.animatorGumball

    //TODO: move the callbacks to the AnimatorGumball class
    const updateObjectMode = ({
      mode = gumball.object_transformMode.value,
      space = gumball.space.value,
    }) => {
      transformControls.space = space

      switch (mode) {
        case "translateIK":
          transformControls.mode = "translate"
          transformControls.attach(gumball.gumballIK.anchor)
          gumball.gumballIK.begin(selectedCubes.current, animation.ikAnchorCubes.value)
          break
        default:
          transformControls.mode = mode
          transformControls.attach(gumball.transformAnchor)
          gumball.gumballIK.end()
      }
    }

    const updateTransformControlsVisability = ({ enabled = gumball.enabled.value, blockedReasons = gumballBlockedReasons.value, gumballMode = gumball.mode.value, keyframesSelected = animation.selectedKeyframes.value.length }) => {
      const visible = enabled && (gumballMode === "gumball" || (selectedCubes.current.length !== 0 && keyframesSelected === 1))
      transformControls.visible = visible
      transformControls.enabled = visible && blockedReasons.length === 0
    }

    const enableDisableCallback = (enabled: boolean) => {
      updateTransformControlsVisability({ enabled })
    }

    const updateBlockedReasons = (reasons: readonly string[]) => {
      updateTransformControlsVisability({ blockedReasons: reasons })
    }

    const updateSelectedKeyframes = (keyframes: readonly DcaKeyframe[]) => {
      updateTransformControlsVisability({ keyframesSelected: keyframes.length })
    }

    const changeModeCallback = (val = gumball.mode.value) => {
      if (val === "object") {
        updateObjectMode({})
      } else { //val === "gumall"
        transformControls.attach(gumball.transformAnchor)
        transformControls.space = gumball.space.value
        transformControls.mode = "rotate"
        gumball.gumballIK.end()
      }
      updateTransformControlsVisability({ gumballMode: val })
    }

    const changeGumballSpace = (val = gumball.space.value) => {
      if (gumball.mode.value === "object") {
        updateObjectMode({ space: val })
      } else {
        transformControls.space = val
      }
    }


    const changeObjectTransformMode = (val = gumball.object_transformMode.value) => updateObjectMode({ mode: val })

    const updateSelectedCubes = (val: readonly string[]) => {
      selectedCubes.current = getCubes(val)
      gumball.transformAnchor['dcmCube'] = selectedCubes.current.length === 1 ? selectedCubes.current[0] : undefined
      if (gumball.gumball_autoRotate.value) {
        gumball.moveToSelected(val)
      }
      if (gumball.mode.value === "object" && gumball.object_transformMode.value === "translateIK") {
        gumball.gumballIK.begin(selectedCubes.current, animation.ikAnchorCubes.value)
      }
      updateTransformControlsVisability({})
    }

    const updateIKAnchors = (val: readonly string[]) => {
      if (gumball.mode.value === "object" && gumball.object_transformMode.value === "translateIK") {
        gumball.gumballIK.begin(selectedCubes.current, val)
      }
    }

    const moveOnFrame = () => {
      if (!transformControls.dragging) {
        gumball.moveToSelected()
      }
    }


    //Below are the callbacks for the transform controls

    const runWhenObjectSelected = <T extends any[]>(func: (...args: T) => void) => (...args: T) => {
      if (gumball.mode.value === "object") {
        func(...args)
      }
    }

    //Runs callback with a transformed axis, the cube and any additional data.
    //Used for trasnform tools.
    const forEachCube = (axisIn: Vector3, applyRoots: boolean, space: "world" | "local", callback: (axis: Vector3, cube: DCMCube, data: StartingCacheData) => void) => {
      //decompose where the gumball is right now
      gumball.transformAnchor.matrixWorld.decompose(decomposePosition, decomposeRotation, decomposeScale)
      gumball.startingCache.forEach((data, cube) => {
        if (applyRoots === true && data.root !== true) {
          return
        }
        const elem = cube.cubeGroup;

        (elem.parent?.matrixWorld ?? _identityMatrix).decompose(decomposePosition2, decomposeRotation2, decomposeScale2)
        const axis = axisIn.clone()
        if (space === 'local') {
          axis.applyQuaternion(decomposeRotation)
        }
        axis.applyQuaternion(decomposeRotation2.invert())
        callback(axis, cube, data)
      })
    }

    const objectChangeReconstructIK = runWhenObjectSelected(() => {
      const selectedKfs = animation.selectedKeyframes.value
      if (selectedKfs.length !== 1) {
        return
      }
      if (gumball.object_transformMode.value === "translateIK") {
        gumball.gumballIK.objectChange(selectedAnim, selectedKfs[0], selectedCubes.current)
      }
    })
    const mouseDownTransformControls = runWhenObjectSelected(() => {
      const selectedKfs = animation.selectedKeyframes.value
      if (selectedKfs.length !== 1) {
        return
      }
      const kf = selectedKfs[0]
      const cubes = selectedCubes.current
      if (gumball.object_transformMode.value === "translateIK") {
        return
      }

      model.resetVisuals()
      animation.animate(0)

      gumball.startingCache.clear()
      cubes.forEach(cube => {
        const elem = cube.cubeGroup

        let parent = cube.parent
        //Only move the cubes that don't have a parent moving too.
        let root = true
        while (parent instanceof DCMCube) {
          if (parent.selected.value) {
            root = false
            break
          }
          parent = parent.parent
        }
        gumball.startingCache.set(cube, {
          root: root,
          position: kf.position.get(cube.name.value) ?? [0, 0, 0],
          quaternion: elem.quaternion.clone()
        })
      })
    })

    //The translate event
    type TranslateEvent = { type: string; length: number; parentQuaternionInv: Quaternion; axis: Vector3; }
    const translateEventTransformControls = runWhenObjectSelected((evt: Event) => {
      if (gumball.object_transformMode.value === "translateIK") {
        return
      }
      const selectedKfs = animation.selectedKeyframes.value
      if (selectedKfs.length !== 1) {
        return
      }
      const kf = selectedKfs[0]
      const e = evt as TranslateEvent
      forEachCube(e.axis, true, gumball.space.value, (axis, cube, data) => {
        axis.multiplyScalar(e.length)
        let pos = axis.toArray()
        const position = [
          pos[0] + data.position[0],
          pos[1] + data.position[1],
          pos[2] + data.position[2],
        ] as const
        kf.position.set(cube.name.value, position)
        cube.updatePositionVisuals(position)
        cube.updateMatrixWorld()
      })
    })

    //The rotate event
    type RotateEvent = { type: string, rotationAxis: Vector3; rotationAngle: number; parentQuaternionInv: Quaternion; }
    const rotateEventTransformControls = runWhenObjectSelected((evt: Event) => {
      if (gumball.object_transformMode.value === "translateIK") {
        return
      }
      const selectedKfs = animation.selectedKeyframes.value
      if (selectedKfs.length !== 1) {
        return
      }
      const kf = selectedKfs[0]
      const e = evt as RotateEvent
      forEachCube(e.rotationAxis, true, gumball.space.value, (axis, cube, data) => {
        decomposeRotation2.setFromAxisAngle(axis, e.rotationAngle)
        decomposeRotation2.multiply(data.quaternion).normalize()

        decomposeEuler.setFromQuaternion(decomposeRotation2, "ZYX")
        const rotation = [
          decomposeEuler.x * 180 / Math.PI,
          decomposeEuler.y * 180 / Math.PI,
          decomposeEuler.z * 180 / Math.PI
        ] as const
        kf.rotation.set(cube.name.value, rotation)
        cube.updateRotationVisuals(rotation)
        cube.updateMatrixWorld()
      })
    })

    //This will cause `visible` to be true, but the `enableDisableCallback` will force it to be the right value
    transformControls.attach(gumball.transformAnchor)
    transformControls.addEventListener("mouseDown", mouseDownTransformControls)
    transformControls.addEventListener("objectChange", objectChangeReconstructIK)
    transformControls.addEventListener("studioTranslate", translateEventTransformControls)
    transformControls.addEventListener("studioRotate", rotateEventTransformControls)

    gumball.enabled.addAndRunListener(enableDisableCallback)
    gumballBlockedReasons.addAndRunListener(updateBlockedReasons)
    gumball.mode.addAndRunListener(changeModeCallback)
    gumball.object_transformMode.addAndRunListener(changeObjectTransformMode)
    gumball.space.addAndRunListener(changeGumballSpace)

    onFrameListeners.add(moveOnFrame)
    selectedCubeManager.selected.addAndRunListener(updateSelectedCubes)
    animation.selectedKeyframes.addListener(updateSelectedKeyframes)
    animation.ikAnchorCubes.addListener(updateIKAnchors)

    return () => {
      transformControls.detach()
      transformControls.removeEventListener("mouseDown", mouseDownTransformControls)
      transformControls.removeEventListener("objectChange", objectChangeReconstructIK)
      transformControls.removeEventListener("studioTranslate", translateEventTransformControls)
      transformControls.removeEventListener("studioRotate", rotateEventTransformControls)

      gumball.enabled.removeListener(enableDisableCallback)
      gumballBlockedReasons.removeListener(updateBlockedReasons)
      gumball.mode.removeListener(changeModeCallback)
      gumball.object_transformMode.removeListener(changeObjectTransformMode)
      gumball.space.removeListener(changeGumballSpace)

      onFrameListeners.delete(moveOnFrame)
      selectedCubeManager.selected.removeListener(updateSelectedCubes)
      animation.selectedKeyframes.removeListener(updateSelectedKeyframes)
      animation.ikAnchorCubes.removeListener(updateIKAnchors)

      gumball.gumballIK.end()

    }
  }, [getCubes, model, selectedCubeManager.selected, transformControls, cubePointTracker, selectedAnim, gumballBlockedReasons, onFrameListeners])

}