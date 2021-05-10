import { LO } from './ListenableObject';
import { DCMModel, DCMCube } from './../formats/model/DcmModel';
import { Camera, Mesh, Raycaster } from 'three';
import { useEffect } from 'react';
import { Vector2 } from 'three';
import { useStudio } from '../../contexts/StudioContext';
export default class SelectedCubeManager {
  mouseOverDiv = false
  disabled = false
  previousEventMouse = new Vector2()
  mouse = new Vector2()

  mouseOverMesh: Mesh | null = null
  mouseOver: LO<string | null> = new LO<string | null>(null)
  selected: LO<readonly string[]> = new LO<readonly string[]>([])


  onMouseMove(rect: DOMRect, x: number, y: number, fromEvent: boolean) {
    this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = - ((y - rect.top) / rect.height) * 2 + 1;

    if (fromEvent) {
      this.previousEventMouse.set(x, y)
      this.mouseOverDiv = x > rect.left && x < rect.right && y > rect.top && y < rect.bottom
    }
  }

  onMouseOffMesh(mesh: Mesh) {
    if (this.mouseOverMesh === mesh) {
      this.mouseOverMesh = null
      this.mouseOver.value = null
    }
  }

  onMouseOverMesh(mesh: Mesh) {
    if (this.mouseOverMesh !== mesh) {
      if (this.mouseOverMesh !== null) {
        const cube = this.getCube(this.mouseOverMesh)
        if (cube.mouseState.value !== "selected") {
          cube.mouseState.value = "none"
        }
      }
      this.mouseOverMesh = mesh
      this.mouseOver.value = this.getCube(mesh).identifier
    }

  }

  isSelected(mesh: Mesh) {
    return this.selected.value.includes(this.getCube(mesh).identifier)
  }

  getCube(mesh: Mesh) {
    return mesh.userData.cube as DCMCube
  }


  update(raycaster: Raycaster, camera: Camera, model: DCMModel) {
    if(!this.mouseOverDiv) {
      return
    }
    const intersections = this.gatherIntersections(raycaster, camera, model)
    // if(!mouseDown)
    if (intersections.length > 0) {
      const mesh = intersections[0].object as Mesh
      if (this.mouseOverMesh !== mesh) {
        const cube = this.getCube(mesh)
        if (cube.mouseState.value !== "selected") {
          cube.mouseState.value = "hover"
        }
      }

    } else if (this.mouseOverMesh !== null) {
      const cube = this.getCube(this.mouseOverMesh)
      if(cube.mouseState.value !== "selected") {
        cube.mouseState.value = "none"
      }
    }
  }

  gatherIntersections(raycaster: Raycaster, camera: Camera, model: DCMModel) {
    raycaster.setFromCamera(this.mouse, camera)
    return raycaster.intersectObjects(model.modelCache.children, true)
  }
}

export const useSelectedCubeManagerRef = () => {
  const { renderer, getSelectedProject, onFrameListeners, raycaster, camera } = useStudio()

  const dom = renderer.domElement
  const { selectedCubeManager: cubeManager, model } = getSelectedProject()

  useEffect(() => {
    const callback = () => {
      cubeManager.update(raycaster, camera, model)
    }
    const mouseMove = (e: MouseEvent) => {
      const rect = dom.getBoundingClientRect()
      cubeManager.onMouseMove(rect, e.clientX, e.clientY, true)
    }
    onFrameListeners.add(callback)
    document.addEventListener("mousemove", mouseMove)
    return () => {
      onFrameListeners.delete(callback)
      document.removeEventListener("mousemove", mouseMove)
    }
  }, [cubeManager, dom, raycaster, camera, model, onFrameListeners])
}