import { Group } from "three"

export default class DcProject {
  identifier: number
  name: string
  group: Group
  
  constructor(name: string) {
    this.identifier = Math.random()
    this.name = name
    this.group = new Group()
  }

  setName(name: string) {
    this.name = name
  }

  getName() {
    return this.name
  }
}