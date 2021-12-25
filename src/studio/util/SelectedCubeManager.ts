import { useEffect } from 'react';
import { Event, Mesh, Object3D, Vector2 } from 'three';
import { useStudio } from '../../contexts/StudioContext';
import DcProject from '../formats/project/DcProject';
import { DCMCube } from './../formats/model/DcmModel';
import { LO } from './ListenableObject';
export default class SelectedCubeManager {
  disabled = false
  public readonly mouse = new Vector2()

  readonly listeners: Set<(project: DcProject) => boolean> = new Set()

  mouseOverMesh: Mesh | null = null
  readonly mouseOver: LO<string | null> = new LO<string | null>(null)
  readonly selected: LO<readonly string[]> = new LO<readonly string[]>([])

  keepCurrentCubes = false

  onMouseUpOnCanvas(project: DcProject, ctrlPressed: boolean) {
    let ignore = false
    this.listeners.forEach(listener => {
      ignore = listener(project) || ignore
    })
    if (!ignore) {
      if (this.mouseOverMesh !== null) {
        const cube = this.getCube(this.mouseOverMesh)
        this.keepCurrentCubes = ctrlPressed
        cube.selected.value = !cube.selected.value
        this.keepCurrentCubes = false
      } else {
        project.model.undoRedoHandler.startBatchActions()
        project.model.identifierCubeMap.forEach(v => {
          if (v.selected.value) {
            v.selected.value = false
          }
        })
        project.model.undoRedoHandler.endBatchActions(`Cubes Deselected`)
      }
    }
  }

  onCubeSelected(cube: DCMCube) {
    if (!this.keepCurrentCubes) {
      cube.model.identifierCubeMap.forEach(v => {
        if (v !== cube && v.selected.value) {
          v.selected.value = false
        }
      })
      this.selected.value = [cube.identifier]
    } else {
      this.selected.value = this.selected.value.concat(cube.identifier)
    }
  }

  onCubeUnSelected(cube: DCMCube) {
    if (this.selected.value.includes(cube.identifier)) {
      this.selected.value = this.selected.value.filter(l => l !== cube.identifier)
    }
  }

  onMouseOffMesh(mesh: Mesh) {
    if (this.mouseOverMesh === mesh) {
      this.mouseOverMesh = null
      this.mouseOver.value = null
      this.getCube(mesh).mouseHover.value = false
    }
  }

  onMouseOverMesh(mesh: Mesh) {
    if (this.mouseOverMesh !== mesh) {
      if (this.mouseOverMesh !== null) {
        this.getCube(this.mouseOverMesh).mouseHover.value = false
      }
      this.mouseOverMesh = mesh
      const cube = this.getCube(mesh)
      this.mouseOver.value = cube.identifier
      cube.mouseHover.value = true
    }
  }

  isSelected(mesh: Mesh) {
    return this.selected.value.includes(this.getCube(mesh).identifier)
  }

  getCube(mesh: Mesh) {
    return mesh.userData.cube as DCMCube
  }


  update(intersected?: Object3D) {
    if (this.disabled) {
      return
    }

    if (intersected instanceof Mesh) {
      this.onMouseOverMesh(intersected as Mesh)
    } else if (this.mouseOverMesh !== null) {
      this.onMouseOffMesh(this.mouseOverMesh)
    }
  }

  // gatherIntersections(raycaster: Raycaster, camera: Camera, model: DCMModel) {
  //   raycaster.setFromCamera(this.mouse, camera)
  //   return raycaster.intersectObjects(model.modelGroup.children, true)
  // }

}

export const useSelectedCubeManager = () => {
  const { renderer, getSelectedProject, onFrameListeners, raycaster, getCamera, onMouseUp, transformControls } = useStudio()

  const dom = renderer.domElement
  const project = getSelectedProject()
  const { selectedCubeManager: cubeManager, model } = project

  useEffect(() => {
    //When the transform controls are in use, block this
    const onMouseDownTransformControlBlocking = () => {
      return transformControls.dragging && transformControls.axis !== null
    }


    const onTransformControlsAxisHover = (e: Event) => {
      const value = e.value as string | null
      if (value === null) {
        //Also show tooltip
        cubeManager.disabled = false
        // callback()
      } else {
        //Also hide tooltip
        cubeManager.disabled = true
        if (cubeManager.mouseOverMesh !== null) {
          cubeManager.onMouseOffMesh(cubeManager.mouseOverMesh)
        }
      }
    }

    cubeManager.listeners.add(onMouseDownTransformControlBlocking)
    transformControls.addEventListener("axis-changed", onTransformControlsAxisHover)
    return () => {
      cubeManager.listeners.delete(onMouseDownTransformControlBlocking)
      transformControls.removeEventListener("axis-changed", onTransformControlsAxisHover)
    }
  }, [cubeManager, dom, raycaster, getCamera, model, onFrameListeners, project, onMouseUp, transformControls])
}