import React, { useEffect } from 'react';
import { Camera, Event, Mesh, Raycaster, Vector2 } from 'three';
import { useStudio } from '../../contexts/StudioContext';
import DcProject from '../formats/project/DcProject';
import { DCMCube, DCMModel } from './../formats/model/DcmModel';
import { LO } from './ListenableObject';
export default class SelectedCubeManager {
  mouseOverDiv = false
  disabled = false
  previousEventMouse = new Vector2()
  public readonly mouse = new Vector2()

  mouseDown = false

  readonly listeners: Set<(project: DcProject) => boolean> = new Set()

  mouseOverMesh: Mesh | null = null
  readonly mouseOver: LO<string | null> = new LO<string | null>(null)
  readonly selected: LO<readonly string[]> = new LO<readonly string[]>([])

  keepCurrentCubes = false

  onMouseMove(rect: DOMRect, x: number, y: number, fromEvent: boolean) {
    this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = - ((y - rect.top) / rect.height) * 2 + 1;

    if (fromEvent) {
      this.previousEventMouse.set(x, y)
      this.mouseOverDiv = x > rect.left && x < rect.right && y > rect.top && y < rect.bottom
    }
  }

  onMouseDown() {
    this.mouseDown = true
  }

  onMouseReleasedAnywhere() {
    if (!this.mouseDown) {
      return
    }
    this.mouseDown = false
  }

  onMouseUpOnCanvas(project: DcProject, ctrlPressed: boolean) {
    if (this.mouse.x >= -1 && this.mouse.x <= 1 && this.mouse.y >= -1 && this.mouse.y <= 1) {
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
          project.model.identifierCubeMap.forEach(v => {
            if (v.selected.value) {
              v.selected.value = false
            }
          })
        }
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


  update(raycaster: Raycaster, camera: Camera, model: DCMModel) {
    if (this.disabled || !this.mouseOverDiv) {
      return
    }

    if (!this.mouseDown) {
      const intersections = this.gatherIntersections(raycaster, camera, model)
      if (intersections.length > 0) {
        const mesh = intersections[0].object as Mesh
        this.onMouseOverMesh(mesh)
      } else if (this.mouseOverMesh !== null) {
        this.onMouseOffMesh(this.mouseOverMesh)
      }
    }
  }

  gatherIntersections(raycaster: Raycaster, camera: Camera, model: DCMModel) {
    raycaster.setFromCamera(this.mouse, camera)
    return raycaster.intersectObjects(model.modelGroup.children, true)
  }

}

export const useSelectedCubeManager = () => {
  const { renderer, getSelectedProject, onFrameListeners, raycaster, getCamera, onMouseUp, transformControls } = useStudio()

  const dom = renderer.domElement
  const project = getSelectedProject()
  const { selectedCubeManager: cubeManager, model } = project

  useEffect(() => {
    const callback = () => {
      cubeManager.update(raycaster, getCamera(), model)
    }

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

    const mouseMove = (e: MouseEvent) => cubeManager.onMouseMove(dom.getBoundingClientRect(), e.clientX, e.clientY, true)
    const mouseDown = () => cubeManager.onMouseDown()
    const mouseUpAnywhere = () => cubeManager.onMouseReleasedAnywhere()

    const mouseUpCanvas = (e: React.MouseEvent) => cubeManager.onMouseUpOnCanvas(project, e.ctrlKey)
    onFrameListeners.add(callback)
    document.addEventListener("pointermove", mouseMove)
    document.addEventListener("pointerdown", mouseDown)
    document.addEventListener("pointerup", mouseUpAnywhere, true)
    onMouseUp.addListener(999, mouseUpCanvas, true)
    cubeManager.listeners.add(onMouseDownTransformControlBlocking)
    transformControls.addEventListener("axis-changed", onTransformControlsAxisHover)
    return () => {
      onFrameListeners.delete(callback)
      document.removeEventListener("pointermove", mouseMove)
      document.removeEventListener("pointerdown", mouseDown)
      document.removeEventListener("pointerup", mouseUpAnywhere, true)
      onMouseUp.removeListener(mouseUpCanvas)
      cubeManager.listeners.delete(onMouseDownTransformControlBlocking)
      transformControls.removeEventListener("axis-changed", onTransformControlsAxisHover)
    }
  }, [cubeManager, dom, raycaster, getCamera, model, onFrameListeners, project, onMouseUp, transformControls])
}