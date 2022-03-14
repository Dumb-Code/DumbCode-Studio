import { Group, MeshBasicMaterial, MeshLambertMaterial, Texture } from "three";
import { v4 as uuidv4 } from "uuid";
import CubePointTracker from "../../../views/modeler/logic/CubePointTracker";
import { createModelingCommandRoot } from "../../command/commands/modeling/ModelingCommands";
import { getUndefinedWritable, ReadableFile } from '../../util/FileTypes';
import { LO } from '../../util/ListenableObject';
import ReferenceImageHandler from "../../util/ReferenceImageHandler";
import DcaTabs from '../animations/DcaTabs';
import { loadModelUnknown } from "../model/DCMLoader";
import { DCMModel } from '../model/DcmModel';
import TextureManager from '../textures/TextureManager';
import { ModelerGumball } from './../../../views/modeler/logic/ModelerGumball';
import { CommandRoot } from './../../command/CommandRoot';
import { CubeSelectedHighlighter } from './../../util/CubeSelectedHighlighter';
import { RemoteRepo } from './DcRemoteRepos';

export default class DcProject {
  readonly identifier: string

  readonly name: LO<string>
  readonly group = new Group()
  readonly selectionGroup = new Group()
  readonly overlayGroup = new Group()

  readonly model: DCMModel
  readonly saveableFile = new LO(false)
  modelWritableFile = getUndefinedWritable("Model File", ".dcm")

  readonly textureManager: TextureManager
  readonly animationTabs: DcaTabs
  previousThreeTexture: Texture | null

  readonly commandRoot: CommandRoot

  readonly cubePointTracker: CubePointTracker
  readonly modelerGumball: ModelerGumball

  readonly cubeHighlighter: CubeSelectedHighlighter

  readonly referenceImageHandler = new ReferenceImageHandler(this.selectionGroup)

  remoteLink?: RemoteRepo
  remoteUUID?: string

  constructor(name: string, model: DCMModel) {
    this.identifier = uuidv4()
    this.name = new LO(name)
    this.model = model
    model.parentProject = this
    this.textureManager = new TextureManager(this)
    this.cubePointTracker = new CubePointTracker(this.selectedCubeManager, this.model, this.selectionGroup)
    this.modelerGumball = new ModelerGumball(this.selectedCubeManager, this.model, this.group, this.cubePointTracker)
    this.animationTabs = new DcaTabs()
    this.cubeHighlighter = new CubeSelectedHighlighter(this.overlayGroup, this.model)

    this.group.add(this.selectionGroup)
    this.selectionGroup.add(this.model.modelGroup)
    this.previousThreeTexture = null

    this.commandRoot = createModelingCommandRoot(this)
    this.commandRoot.addHelpCommand()
  }

  get selectedCubeManager() {
    return this.model.selectedCubeManager
  }

  get lockedCubes() {
    return this.model.lockedCubes
  }

  /**
 * Helper method to update all the materials for the selected project.
 * @param {function} callback the material callback
 */
  updateTexture(callback: (mat: MeshLambertMaterial | MeshBasicMaterial) => void) {
    callback(this.model.materials.normal)
    callback(this.model.materials.selected)
    callback(this.model.materials.highlight)
    callback(this.model.materials.export)


    this.model.materials.normal.needsUpdate = true
    this.model.materials.selected.needsUpdate = true
    this.model.materials.highlight.needsUpdate = true
    this.model.materials.export.needsUpdate = true
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
  const model = await loadModelUnknown(file.arrayBuffer(), file.name)
  const project = new DcProject(getProjectName(file.name), model)

  project.saveableFile.value = true
  project.modelWritableFile = read.asWritable()

  return project
}

export const getProjectName = (name: string) => name.substring(0, name.lastIndexOf("."))