import { Mesh, Object3D, Vector2 } from 'three';
import { DCMCube, DCMModel } from '../formats/model/DcmModel';
import DcProject from '../formats/project/DcProject';
import { LO } from '../listenableobject/ListenableObject';
import SelectedCubeUndoRedoHandler from '../undoredo/SelectedCubeUndoRedoHandler';
export default class SelectedCubeManager {
  disabled = false
  public readonly mouse = new Vector2()

  readonly listeners: Set<(project: DcProject) => boolean> = new Set()

  mouseOverMesh: Mesh | null = null
  readonly mouseOver: LO<string | null> = new LO<string | null>(null)
  readonly selected: LO<readonly string[]> = new LO<readonly string[]>([])

  keepCurrentCubes = false

  isSettingCubeSelected = false

  activeUndoRedoHandler?: SelectedCubeUndoRedoHandler<any>

  constructor(
    private readonly model: DCMModel
  ) { }

  onMouseUpOnCanvas(project: DcProject, ctrlPressed: boolean) {
    let ignore = false
    this.listeners.forEach(listener => {
      ignore = listener(project) || ignore
    })
    if (!ignore) {
      this.clickOnHovered(ctrlPressed)
    }
  }

  deselectAll() {
    this.model.undoRedoHandler.startBatchActions()
    this.model.identifierCubeMap.forEach(v => {
      if (v.selected.value) {
        v.selected.value = false
      }
    })
    this.model.undoRedoHandler.endBatchActions(`Cubes Deselected`)
  }

  clickOnHovered(ctrlPressed: boolean) {
    if (this.mouseOverMesh !== null) {
      const cube = this.getCube(this.mouseOverMesh)
      return this.clickOnCube(cube, ctrlPressed)
    }
    this.deselectAll()
    return false
  }

  clickOnCube(cube: DCMCube, ctrlPressed: boolean) {
    const project = cube.model.parentProject
    if (!project) {
      return false
    }
    //When selected:
    //  - if ctrl is pressed, we deselect, keeping the current cubes
    //  - if more than one cube is selected, we deselect all OTHER cubes
    //  - else, we deslect this cube
    //
    //When not selected:
    //  - if ctrl is pressed, select THIS cube, and keep the other cubes
    //  - else, we only select THIS cube
    if (cube.selected.value) {
      this.activeUndoRedoHandler?.startBatchActions()
      if (ctrlPressed || this.selected.value.length === 1) {
        cube.selected.value = false
        this.activeUndoRedoHandler?.endBatchActions(`Cube Deselected`)
      } else {
        //If other cubes are selected too
        //Using `setSelected` won't do anything, as it's already selected.
        //We can call onCubeSelected to essentially deselect the other cubes
        this.onCubeSelected(cube)
        cube.model.undoRedoHandler.endBatchActions(`Cubes Selected`)
      }
    } else {
      this.keepCurrentCubes = ctrlPressed
      this.activeUndoRedoHandler?.startBatchActions()
      cube.selected.value = true
      this.activeUndoRedoHandler?.endBatchActions(`Cube Selected`)
      this.keepCurrentCubes = false
    }
    return true
  }

  onCubeSelected(cube: DCMCube) {
    if (this.isSettingCubeSelected) {
      return
    }
    this.isSettingCubeSelected = true
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
    this.isSettingCubeSelected = false
  }

  onCubeUnSelected(cube: DCMCube) {
    if (this.isSettingCubeSelected) {
      return
    }
    this.isSettingCubeSelected = true
    if (this.selected.value.includes(cube.identifier)) {
      this.selected.value = this.selected.value.filter(l => l !== cube.identifier)
    }
    this.isSettingCubeSelected = false
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
