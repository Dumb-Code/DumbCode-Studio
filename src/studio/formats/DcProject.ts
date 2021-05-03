import { DCMModel } from './model/DcmModel';
import { Group } from "three"

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

export const newProject = () => new DcProject("New Project", new DCMModel())