import { DCMCube, DCMModel } from './model/DcmModel';
import { Group, MeshLambertMaterial } from "three"

export default class DcProject {
  identifier: number

  name: string
  group: Group

  model: DCMModel

  constructor(name: string, model: DCMModel) {
    this.identifier = Math.random()
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
const model = new DCMModel()
export const newProject = () => {
  const model = new DCMModel()

  model.children.push(
    new DCMCube("hello", [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0], false, [0, 0, 0], [], model),
    new DCMCube("How", [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0], false, [0, 0, 0], [], model),
    new DCMCube("How2", [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0], false, [0, 0, 0], [], model),
    new DCMCube("How3", [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0], false, [0, 0, 0], [], model),
    new DCMCube("How4", [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0], false, [0, 0, 0], [], model),
    new DCMCube("Are", [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0], false, [0, 0, 0], [], model)
  )
  model.onCubeHierarchyChanged()
  model.createModel(new MeshLambertMaterial())

  return new DcProject("New Project", model);
}
