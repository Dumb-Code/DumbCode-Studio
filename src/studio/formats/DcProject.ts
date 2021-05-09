import { WritableFile } from './../util/FileTypes';
import { DCMCube, DCMModel } from './model/DcmModel';
import { DoubleSide, Group, MeshLambertMaterial, Texture } from "three"
import { ReadableFile } from '../util/FileTypes';
import { v4 as uuidv4 } from "uuid"
import TextureManager from './textures/TextureManager';
import { LO } from '../util/ListenableObject';
import DcaTabs from './animations/DcaTabs';
import { loadDCMModel } from './model/DCMLoader';

const material = new MeshLambertMaterial({
  color: 0x777777,
  // transparent: true,
  side: DoubleSide,
  alphaTest: 0.0001,
})

export default class DcProject {
  identifier: string

  readonly name: LO<string>
  group: Group

  model: DCMModel
  modelWritableFile?: WritableFile

  textureManager: TextureManager
  animationTabs: DcaTabs
  materials: ProjectMaterials
  previousThreeTexture: Texture | null

  isDefaultProject = false

  constructor(name: string, model: DCMModel) {
    this.identifier = uuidv4()
    this.name = new LO(name)
    this.group = new Group()
    this.model = model
    this.textureManager = new TextureManager(this)
    this.animationTabs = new DcaTabs()
    this.materials = createMaterialsObject()
    this.group.add(this.model.createModel(this.materials.normal))
    this.previousThreeTexture = null
  }

  setName(name: string) {
    this.name.value = name
  }

  getName() {
    return this.name.value
  }

  /**
 * Helper method to update all the materials for the selected project.
 * @param {function} callback the material callback
 */
  updateTexture(callback: (mat: MeshLambertMaterial) => void) {
    callback(this.materials.normal)
    callback(this.materials.selected)
    callback(this.materials.highlight)

    this.materials.normal.needsUpdate = true
    this.materials.selected.needsUpdate = true
    this.materials.highlight.needsUpdate = true
  }

  /**
   * Sets the texture to all the materials for the currently selected project.
   */
  setTexture(tex: Texture) {
    this.updateTexture(m => m.map = tex)
    this.previousThreeTexture = tex
  }
}

type ProjectMaterials = {
  normal: MeshLambertMaterial;
  highlight: MeshLambertMaterial;
  selected: MeshLambertMaterial;
}
const createMaterialsObject = (): ProjectMaterials => {
  let normal = material.clone()

  let highlight = material.clone()
  highlight.emissive.setHex(0xFF0000)

  let selected = material.clone()
  selected.emissive.setHex(0x000066)

  return { normal, highlight, selected }
}



export const newProject = () => {
  const model = new DCMModel()

  model.children.push(
    new DCMCube("hello", [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0], false, [0, 0, 0], [], model),
    new DCMCube("How", [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0], false, [0, 0, 0], [], model),
    new DCMCube("How2", [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0], false, [0, 0, 0], [], model),
    new DCMCube("How3", [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0], false, [0, 0, 0], [], model),
    new DCMCube("How4", [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0], false, [0, 0, 0], [
      new DCMCube("Are", [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0], false, [0, 0, 0], [
        new DCMCube("Are2", [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0], false, [0, 0, 0], [], model)
      ], model),
    ], model),
  )
  model.onCubeHierarchyChanged()
  model.createModel(new MeshLambertMaterial())

  return new DcProject("New Project", model);
}

export const createProject = async (read: ReadableFile) => {
  const file = await read.asFile()
  const model = await loadDCMModel(file.arrayBuffer(), file.name)
  const project = new DcProject(file.name.substring(0, file.name.lastIndexOf(".")), model)

  if (read.asWritable) {
    project.modelWritableFile = read.asWritable()
  }

  return project
}