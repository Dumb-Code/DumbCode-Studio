import { useCallback, useEffect, useRef } from 'react';
import { Euler, Event, Group, Matrix4, Object3D, Quaternion, Vector3 } from 'three';
import { LO } from '../../../studio/util/ListenableObject';
import SelectedCubeManager from '../../../studio/util/SelectedCubeManager';
import { useStudio } from './../../../contexts/StudioContext';
import { DCMCube } from './../../../studio/formats/model/DcmModel';
import { LockerType } from './../../../studio/util/CubeLocker';

type StartingCacheData = {
  root: boolean,
  position: readonly [number, number, number]
  offset: readonly [number, number, number]
  dimension: readonly [number, number, number]
  quaternion: Quaternion,
  threeWorldPos: Vector3
}

const decomposePosition = new Vector3()
const decomposeRotation = new Quaternion()
const decomposeEuler = new Euler()
const decomposeScale = new Vector3()

const decomposePosition2 = new Vector3()
const decomposeRotation2 = new Quaternion()
const decomposeScale2 = new Vector3()

const _identityMatrix = new Matrix4()


export class ModelerGumball {

  readonly enabled = new LO(true)

  readonly mode = new LO<"object" | "gumball">("object")

  //Object Properties
  readonly object_transformMode = new LO<"translate" | "rotate" | "dimensions">("translate")

  //Object position and rotation spefic properties
  readonly object_position_type = new LO<"position" | "offset" | "rotation_point">("position")
  readonly object_position_space = new LO<"local" | "world">("local")

  readonly object_rotation_type = new LO<"rotation" | "rotation_around_point">("rotation")
  readonly object_rotation_space = new LO<"local" | "world">("local")


  //Gumball properties
  readonly gumball_move_mode = new LO<"translate" | "rotate">("translate")

  readonly transformAnchor: Object3D


  readonly startingCache = new Map<DCMCube, StartingCacheData>()

  constructor(
    public readonly selectedCubeManager: SelectedCubeManager,
    group: Group
  ) {
    this.transformAnchor = new Object3D()
    this.transformAnchor.rotation.order = "ZYX"
    group.add(this.transformAnchor)
  }
}

export const useModelerGumball = () => {
  const { getSelectedProject, transformControls } = useStudio()
  const { selectedCubeManager, modelerGumball: gumball, model } = getSelectedProject()

  const getCubes = useCallback((selected: readonly string[] = selectedCubeManager.selected.value) => {
    return selected.map(cube => model.identifierCubeMap.get(cube)).filter(c => c !== undefined) as readonly DCMCube[]
  }, [selectedCubeManager, model.identifierCubeMap])

  const selectedCubes = useRef<readonly DCMCube[]>([])

  useEffect(() => {
    const updateObjectMode = ({
      mode = gumball.object_transformMode.value,
      posSpace = gumball.object_position_space.value,
      rotSpace = gumball.object_rotation_space.value,
    }) => {
      switch (mode) {
        case "translate":
          transformControls.space = posSpace
          break
        case "rotate":
          transformControls.space = rotSpace
          break
        case "dimensions":
          transformControls.space = "local"
          break
      }
      transformControls.mode = mode
    }

    const enableDisableCallback = (val = gumball.enabled.value) => {
      transformControls.visible = transformControls.enabled = (val && selectedCubes.current.length !== 0)
    }

    const changeModeCallback = (val = gumball.mode.value) => {
      if (val === "object") {
        updateObjectMode({})
      } else { //val === "gumall"
        transformControls.space = "local"
        transformControls.mode = gumball.gumball_move_mode.value
      }
    }

    const changeObjectTransformMode = (val = gumball.object_transformMode.value) => updateObjectMode({ mode: val })
    const changeObjectPositionSpace = (val = gumball.object_position_space.value) => updateObjectMode({ posSpace: val })
    const changeObjectRotationSpace = (val = gumball.object_rotation_space.value) => updateObjectMode({ rotSpace: val })

    const updateSelectedCubes = (val: readonly string[]) => {
      selectedCubes.current = getCubes(val)
      gumball.transformAnchor['dcmCube'] = selectedCubes.current.length === 1 ? selectedCubes.current[0] : undefined
      enableDisableCallback()
    }





    //Below are the callbacks for the transform controls

    //Get the three object to perform on. For dimensions and offset translations,
    //this will be the cubes mesh, rather than the cubes group
    const getThreeObject = (cube: DCMCube): Object3D => {
      let translateSelectGroup = true
      if (gumball.object_transformMode.value === "dimensions") {
        translateSelectGroup = false
      }
      if (gumball.object_transformMode.value === "translate" && gumball.object_position_type.value === "offset") {
        translateSelectGroup = false
      }

      return translateSelectGroup ? cube.cubeGroup : cube.cubeMesh
    }

    /**
     * Runs callback with a transformed axis, the cube and any additional data.
     * Used for trasnform tools.
     */
    const forEachCube = (axisIn: Vector3, applyRoots: boolean, space: "world" | "local", callback: (axis: Vector3, cube: DCMCube, data: StartingCacheData) => void) => {
      //decompose where the gumball is right now
      gumball.transformAnchor.matrixWorld.decompose(decomposePosition, decomposeRotation, decomposeScale)
      gumball.startingCache.forEach((data, cube) => {
        if (applyRoots === true && data.root !== true) {
          return
        }
        const elem = getThreeObject(cube);

        (elem.parent?.matrixWorld ?? _identityMatrix).decompose(decomposePosition2, decomposeRotation2, decomposeScale2)
        const axis = axisIn.clone()
        if (space === 'local') {
          axis.applyQuaternion(decomposeRotation)
        }
        axis.applyQuaternion(decomposeRotation2.invert())
        callback(axis, cube, data)
      })
    }

    //When the mouse is pressed down on the transform controls
    const mouseDownTransformControls = () => {
      model.lockedCubes.createLockedCubesCache()
      gumball.startingCache.clear()
      getCubes().forEach(cube => {
        //If rotation point, then create a cube locker for the cube's offset and children
        if (gumball.object_transformMode.value === "translate" && gumball.object_position_type.value === 'rotation_point') {
          model.lockedCubes.addToLocker(cube, LockerType.OFFSET)
          cube.children.value.forEach(child => model.lockedCubes.addToLocker(child, LockerType.POSITION))
        }

        const elem = getThreeObject(cube)

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
          position: cube.position.value,
          offset: cube.offset.value,
          dimension: cube.dimension.value,
          quaternion: elem.quaternion.clone(),
          threeWorldPos: elem.getWorldPosition(elem.position.clone())
        })
      })
    }
    const onMouseUpClearCubeLockers = () => model.lockedCubes.clearCubeLockers()
    const onObjectChangeReconstruct = () => model.lockedCubes.reconstructLockedCubes()

    //The translate event
    type TranslateEvent = { type: string; length: number; parentQuaternionInv: Quaternion; axis: Vector3; }
    const translateEventTransformControls = (e: Event) => {
      e = e as TranslateEvent
      forEachCube(e.axis, true, gumball.object_position_space.value, (axis, cube, data) => {
        axis.multiplyScalar(e.length)
        let pos = axis.toArray()
        switch (gumball.object_position_type.value) {
          case 'offset':
            if (!cube.locked.value) {
              cube.offset.value = [
                pos[0] + data.offset[0],
                pos[1] + data.offset[1],
                pos[2] + data.offset[2],
              ]
            }
            break
          case 'rotation_point':
          case 'position':
            cube.position.value = [
              pos[0] + data.position[0],
              pos[1] + data.position[1],
              pos[2] + data.position[2],
            ]
            cube.cubeGroup.updateMatrixWorld(true)
            break
        }
      })
    }


    //This will cause `visible` to be true, but the `enableDisableCallback` will force it to be the right value
    transformControls.attach(gumball.transformAnchor)
    transformControls.addEventListener("mouseDown", mouseDownTransformControls)
    transformControls.addEventListener("mouseUp", onMouseUpClearCubeLockers)
    transformControls.addEventListener("objectChange", onObjectChangeReconstruct)
    transformControls.addEventListener("studioTranslate", translateEventTransformControls)

    gumball.enabled.addAndRunListener(enableDisableCallback)
    gumball.mode.addAndRunListener(changeModeCallback)
    gumball.object_transformMode.addAndRunListener(changeObjectTransformMode)
    gumball.object_position_space.addAndRunListener(changeObjectPositionSpace)
    gumball.object_rotation_space.addAndRunListener(changeObjectRotationSpace)
    selectedCubeManager.selected.addAndRunListener(updateSelectedCubes)
    return () => {
      transformControls.detach()
      transformControls.removeEventListener("mouseDown", mouseDownTransformControls)
      transformControls.removeEventListener("mouseUp", onMouseUpClearCubeLockers)
      transformControls.removeEventListener("objectChange", onObjectChangeReconstruct)
      transformControls.removeEventListener("studioTranslate", translateEventTransformControls)

      gumball.enabled.removeListener(enableDisableCallback)
      gumball.mode.removeListener(changeModeCallback)
      gumball.object_transformMode.removeListener(changeObjectTransformMode)
      gumball.object_position_space.removeListener(changeObjectPositionSpace)
      gumball.object_rotation_space.removeListener(changeObjectRotationSpace)
      selectedCubeManager.selected.removeListener(updateSelectedCubes)
    }
  }, [getCubes, model, gumball, selectedCubeManager.selected, transformControls])

}