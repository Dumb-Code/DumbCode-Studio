import { LO } from './ListenableObject';
import { DCMModel, DCMCube } from './../formats/model/DcmModel';
import { Camera, Mesh, Raycaster } from 'three';
import React, { useEffect } from 'react';
import { Vector2 } from 'three';
import { useStudio } from '../../contexts/StudioContext';
import DcProject from '../formats/project/DcProject';
export default class SelectedCubeManager {
  mouseOverDiv = false
  disabled = false
  previousEventMouse = new Vector2()
  mouse = new Vector2()

  mouseDown = false
  mouseClickDown = new Vector2()

  listneres: Set<(project: DcProject) => boolean> = new Set()

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

  onMouseDown(x: number, y: number) {
    this.mouseClickDown.x = x
    this.mouseClickDown.y = y
    this.mouseDown = true
  }

  onMouseUp(project: DcProject, x: number, y: number) {
    if (!this.mouseDown) {
      return
    }
    this.mouseDown = false
    let xMove = Math.abs(this.mouseClickDown.x - x)
    let yMove = Math.abs(this.mouseClickDown.y - y)

    if (xMove < 5 && yMove < 5 && this.mouse.x >= -1 && this.mouse.x <= 1 && this.mouse.y >= -1 && this.mouse.y <= 1) {
      let ignore = false
      this.listneres.forEach(listener => {
        ignore = listener(project) || ignore
      })
      if (!ignore) {
        if (this.mouseOverMesh !== null) {
          const cube = this.getCube(this.mouseOverMesh)
          cube.selected.value = !cube.selected.value
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
    //TODO if ctrl is pressed don't do this:
    const keep = false
    if (!keep) {
      cube.model.identifierCubeMap.forEach(v => {
        if (v.selected.value) {
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
    if (!this.mouseOverDiv) {
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

export const useSelectedCubeManagerRef = () => {
  const { renderer, getSelectedProject, onFrameListeners, raycaster, camera, onMouseDown } = useStudio()

  const dom = renderer.domElement
  const project = getSelectedProject()
  const { selectedCubeManager: cubeManager, model } = project

  useEffect(() => {
    const callback = () => {
      cubeManager.update(raycaster, camera, model)
    }
    const mouseMove = (e: MouseEvent) => {
      const rect = dom.getBoundingClientRect()
      cubeManager.onMouseMove(rect, e.clientX, e.clientY, true)
    }
    const mouseDown = (e: React.MouseEvent) => {
      cubeManager.onMouseDown(e.clientX, e.clientY)
      return true
    }
    const mouseUp = (e: MouseEvent) => {
      cubeManager.onMouseUp(project, e.clientX, e.clientY)
    }
    onFrameListeners.add(callback)
    document.addEventListener("pointermove", mouseMove)
    document.addEventListener("pointerup", mouseUp, false)
    onMouseDown.addListener(999, mouseDown)
    return () => {
      onFrameListeners.delete(callback)
      document.removeEventListener("pointermove", mouseMove)
      document.removeEventListener("pointerup", mouseUp, false)
      onMouseDown.removeListener(mouseDown)
    }
  }, [cubeManager, dom, raycaster, camera, model, onFrameListeners, project, onMouseDown])
}