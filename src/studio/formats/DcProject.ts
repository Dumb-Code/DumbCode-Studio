import { loadDCMModel } from './model/DCMLoader';
import { WritableFile } from './../util/FileTypes';
import { DCMCube, DCMModel } from './model/DcmModel';
import { Group, MeshLambertMaterial } from "three"
import { ReadableFile } from '../util/FileTypes';
import { v4 as uuidv4 } from "uuid"

export default class DcProject {
  identifier: string

  name: string
  group: Group

  model: DCMModel
  modelWritableFile?: WritableFile

  constructor(name: string, model: DCMModel) {
    this.identifier = uuidv4()
    this.name = name
    this.group = new Group()
    this.model = model
  }

  setName(name: string) {
    this.name = name
  }

  getName() {
    return this.name
  }
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

export const createProject = async(read: ReadableFile) => {
  const file = await read.asFile()
  const model = await loadDCMModel(file.arrayBuffer(), file.name)
  const project = new DcProject(file.name.substring(0, file.name.lastIndexOf(".")), model)
  
  if(read.asWritable) {
    project.modelWritableFile = read.asWritable()
  }

  return project
}