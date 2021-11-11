import { useCallback, useEffect, useRef } from 'react';
import { Group, Object3D } from 'three';
import { LO } from '../../../studio/util/ListenableObject';
import SelectedCubeManager from '../../../studio/util/SelectedCubeManager';
import { useStudio } from './../../../contexts/StudioContext';
import { DCMCube } from './../../../studio/formats/model/DcmModel';
export class ModelerGumball {

  readonly enabled = new LO(true)

  readonly mode = new LO<"object" | "gumball">("object")

  //Object Properties
  readonly object_transformMode = new LO<"translate" | "rotate" | "dimension">("translate")

  //Object position and rotation spefic properties
  readonly object_position_type = new LO<"position" | "offset" | "rotation_point">("position")
  readonly object_position_space = new LO<"local" | "world">("local")

  readonly object_rotation_type = new LO<"rotation" | "rotation_around_point">("rotation")
  readonly object_rotation_space = new LO<"local" | "world">("local")


  //Gumball properties
  readonly gumball_move_mode = new LO<"translate" | "rotate">("translate")

  readonly transformAnchor: Object3D

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

  const selectedCubes = useRef(getCubes())

  useEffect(() => {
    const updateObjectMode = ({
      mode = gumball.object_transformMode.value,
      posSpace = gumball.object_position_space.value,
      rotSpace = gumball.object_rotation_space.value,
    }) => {
      //--- Debug code ---
      if (mode === "dimension") return alert("Not yet added <3")
      mode = mode as "translate" | "rotate" | "dimension"
      //------------------

      switch (mode) {
        case "translate":
          transformControls.space = posSpace
          break
        case "rotate":
          transformControls.space = rotSpace
          break
        case "dimension":
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
      enableDisableCallback()
    }

    //This will cause `visible` to be true, but the next line will force it to be the right value
    transformControls.attach(gumball.transformAnchor)

    gumball.enabled.addAndRunListener(enableDisableCallback)
    gumball.mode.addAndRunListener(changeModeCallback)
    gumball.object_transformMode.addAndRunListener(changeObjectTransformMode)
    gumball.object_position_space.addAndRunListener(changeObjectPositionSpace)
    gumball.object_rotation_space.addAndRunListener(changeObjectRotationSpace)
    selectedCubeManager.selected.addListener(updateSelectedCubes)
    return () => {
      transformControls.detach()
      gumball.enabled.removeListener(enableDisableCallback)
      gumball.mode.removeListener(changeModeCallback)
      gumball.object_transformMode.removeListener(changeObjectTransformMode)
      gumball.object_position_space.removeListener(changeObjectPositionSpace)
      gumball.object_rotation_space.removeListener(changeObjectRotationSpace)
      selectedCubeManager.selected.removeListener(updateSelectedCubes)
    }
  }, [getCubes, gumball, selectedCubeManager.selected, transformControls])

}