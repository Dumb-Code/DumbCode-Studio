import { getUndefinedWritable } from './../util/FileTypes';
import { DCMModel } from './model/DcmModel';
import { Group, MeshLambertMaterial, Texture } from "three"
import { ReadableFile } from '../util/FileTypes';
import { v4 as uuidv4 } from "uuid"
import TextureManager from './textures/TextureManager';
import { LO } from '../util/ListenableObject';
import DcaTabs from './animations/DcaTabs';
import { loadDCMModel } from './model/DCMLoader';
import SelectedCubeManager from '../util/SelectedCubeManager';

export default class DcProject {
  identifier: string

  readonly name: LO<string>
  group: Group

  readonly model: DCMModel
  readonly saveableFile = new LO(false)
  modelWritableFile = getUndefinedWritable("Model File", [".dcm"])

  textureManager: TextureManager
  animationTabs: DcaTabs
  previousThreeTexture: Texture | null

  selectedCubeManager = new SelectedCubeManager()

  constructor(name: string, model: DCMModel) {
    this.identifier = uuidv4()
    this.name = new LO(name)
    this.group = new Group()
    this.model = model
    model.parentProject = this
    this.textureManager = new TextureManager(this)
    this.animationTabs = new DcaTabs()
    this.model.selectedCubeManager = this.selectedCubeManager
    this.group.add(this.model.modelGroup)
    this.previousThreeTexture = null
  }

  /**
 * Helper method to update all the materials for the selected project.
 * @param {function} callback the material callback
 */
  updateTexture(callback: (mat: MeshLambertMaterial) => void) {
    callback(this.model.materials.normal)
    callback(this.model.materials.selected)
    callback(this.model.materials.highlight)

    this.model.materials.normal.needsUpdate = true
    this.model.materials.selected.needsUpdate = true
    this.model.materials.highlight.needsUpdate = true
  }

  /**
   * Sets the texture to all the materials for the currently selected project.
   */
  setTexture(tex: Texture) {
    this.updateTexture(m => m.map = tex)
    this.previousThreeTexture = tex
  }

  renameCube(oldName: string, newName: string) {
    for (let animaion of this.animationTabs.animations.value) {
      for (let keyframe of animaion.keyframes.value) {
        for (let map of [keyframe.position, keyframe.rotation, keyframe.cubeGrow]) {
          const value = map.get(oldName)
          if (value !== undefined) {
            map.set(newName, value)
            map.delete(oldName)
          }
        }
      }
    }
  }
}

export const newProject = () => {
  return new DcProject("New Project", new DCMModel());
}

export const createProject = async (read: ReadableFile) => {
  const file = await read.asFile()
  const model = await loadDCMModel(file.arrayBuffer(), file.name)
  const project = new DcProject(getProjectName(file.name), model)

  project.saveableFile.value = true
  project.modelWritableFile = read.asWritable()

  return project
}

export const getProjectName = (name: string) => name.substring(0, name.lastIndexOf("."))