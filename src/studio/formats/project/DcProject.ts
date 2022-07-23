import { Group, MeshBasicMaterial, MeshStandardMaterial, Texture } from "three";
import { v4 as uuidv4 } from "uuid";
import CubePointTracker from "../../../views/modeler/logic/CubePointTracker";
import { createAnimatorCommandRoot } from "../../command/commands/animator/AnimatorCommands";
import { createModelingCommandRoot } from "../../command/commands/modeling/ModelingCommands";
import FileChangeListener from "../../files/FileChangeListener";
import { getUndefinedWritable, ReadableFile, readFileArrayBuffer } from '../../files/FileTypes';
import ShowcaseProperties from "../../showcase/ShowcaseProperties";
import { LO } from '../../util/ListenableObject';
import ReferenceImageHandler from "../../util/ReferenceImageHandler";
import { loadUnknownAnimation } from "../animations/DCALoader";
import DcaTabs from '../animations/DcaTabs';
import { loadModelUnknown } from "../model/DCMLoader";
import { DCMModel } from '../model/DcmModel';
import TextureManager from '../textures/TextureManager';
import { ModelerGumball } from './../../../views/modeler/logic/ModelerGumball';
import { CommandRoot } from './../../command/CommandRoot';
import UndoRedoHandler from './../../undoredo/UndoRedoHandler';
import { CubeSelectedHighlighter } from './../../util/CubeSelectedHighlighter';
import { StudioSound } from './../sounds/StudioSound';
import { loadDcProj } from "./DcProjectLoader";
import DcRemoteRepo, { RemoteRepo } from './DcRemoteRepos';

type UndoRedoDataType = {
  section_name: "root_name",
  data: {
    selected_cubes: string[]
  }
}

export default class DcProject {
  readonly identifier: string

  readonly fileChangeListener = new FileChangeListener()

  readonly undoRedoHandler: UndoRedoHandler<UndoRedoDataType> = new UndoRedoHandler(
    () => { throw new Error("Tried to add root section") },
    () => { throw new Error("Tried to remove root section") },
    (_section, property, value) => this._section.applyModification(property, value)
  )

  readonly _section = this.undoRedoHandler.createNewSection("root_name")

  readonly name: LO<string>
  readonly group = new Group()
  readonly selectionGroup = new Group()
  readonly overlaySelectionGroup = new Group()
  readonly overlayGroup = new Group()

  readonly showcaseProperties: ShowcaseProperties

  readonly model: DCMModel
  readonly projectSaveType = new LO<"unknown" | "project" | "model">("unknown")
  modelWritableFile = getUndefinedWritable("Model File", ".dcm")

  readonly projectNeedsSaving = new LO(false)
  projectWritableFile = getUndefinedWritable("Project File", ".dcproj")


  readonly textureManager: TextureManager
  readonly animationTabs: DcaTabs
  previousThreeTexture: Texture | null

  readonly sounds = new LO<readonly StudioSound[]>([])

  readonly commandRoot: CommandRoot
  readonly animatorCommandRoot: CommandRoot

  readonly cubePointTracker: CubePointTracker
  readonly modelerGumball: ModelerGumball

  readonly cubeHighlighter: CubeSelectedHighlighter

  readonly referenceImageHandler = new ReferenceImageHandler(this.selectionGroup)

  remoteLink?: {
    allData: DcRemoteRepo,
    repo: RemoteRepo
  }
  remoteUUID?: string

  constructor(name: string, model: DCMModel) {
    this.identifier = uuidv4()
    this.name = new LO(name)
    this.model = model
    model.parentProject = this
    this.showcaseProperties = new ShowcaseProperties(this)
    this.textureManager = new TextureManager(this)
    this.cubePointTracker = new CubePointTracker(this.selectedCubeManager, this.model, this.overlaySelectionGroup)
    this.modelerGumball = new ModelerGumball(this.selectedCubeManager, this.model, this.group, this.cubePointTracker)
    this.animationTabs = new DcaTabs(this)
    this.cubeHighlighter = new CubeSelectedHighlighter(this.overlayGroup, this.model)

    this.group.add(this.selectionGroup)
    this.overlayGroup.add(this.overlaySelectionGroup)
    this.selectionGroup.add(this.model.modelGroup)
    this.previousThreeTexture = null

    this.commandRoot = createModelingCommandRoot(this)
    this.commandRoot.addHelpCommand()

    this.animatorCommandRoot = createAnimatorCommandRoot(this)
    this.animatorCommandRoot.addHelpCommand()

    this.selectedCubeManager.selected.applyToSection(this._section, "selected_cubes")

    this.model.needsSaving.addListener(v => this.projectNeedsSaving.value ||= v)
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
  updateTexture(callback: (mat: MeshStandardMaterial | MeshBasicMaterial) => void) {
    callback(this.model.materials.normal)
    callback(this.model.materials.selected)
    callback(this.model.materials.highlight)
    callback(this.model.materials.export)


    this.model.materials.normal.needsUpdate = true
    this.model.materials.selected.needsUpdate = true
    this.model.materials.highlight.needsUpdate = true
    this.model.materials.export.needsUpdate = true
  }

  loadAnimation(file: ReadableFile) {
    readFileArrayBuffer(file)
      .then(buff => loadUnknownAnimation(this, file.name.substring(0, file.name.lastIndexOf(".")), buff))
      .then(animation => {
        if (!animation.isSkeleton.value) {
          animation.saveableFile.value = true
          animation.animationWritableFile = file.asWritable()
        }
        this.animationTabs.addAnimation(animation)
      })
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
      if (animaion.isSkeleton.value) {
        continue
      }
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

  onProjectLoaded() {
    this.animationTabs.animations.value.flatMap(a => a.soundLayers.value).forEach(s => s.findAllSounds())
  }
}

export const newProject = () => {
  return new DcProject("New Project", new DCMModel());
}

export const createProject = async (read: ReadableFile) => {
  const file = await read.asFile()
  if (file.name.endsWith(".dcproj")) {
    return await loadDcProj(removeFileExtension(file.name), await file.arrayBuffer(), read.asWritable())
  }
  const model = await loadModelUnknown(file.arrayBuffer(), file.name)
  const project = new DcProject(removeFileExtension(file.name), model)

  project.modelWritableFile = read.asWritable()
  project.projectSaveType.value = "model"

  return project
}

export const removeFileExtension = (fileName: string) => {
  const lastDot = fileName.lastIndexOf(".")
  if (lastDot === -1) {
    return fileName
  }
  return fileName.substring(0, lastDot)
}