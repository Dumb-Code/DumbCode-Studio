import { LO } from './../../util/ListenableObject';
import { v4 as uuidv4 } from 'uuid';
import { DCMModel } from './../model/DcmModel';

export class TextureGroup {
  readonly identifier: string;
  name: LO<string>
  textures: LO<readonly string[]>
  isDefault: boolean

  constructor(name: string, isDefault: boolean) {
    this.identifier = uuidv4()
    this.isDefault = isDefault
    this.name = new LO(name)
    this.textures = new LO([] as const as readonly string[])
  }
}

export default class TextureManager {
  readonly model: DCMModel

  selectedGroup = new LO(new TextureGroup("Default", true))
  groups = new LO<readonly TextureGroup[]>([ this.selectedGroup.value ])

  activeTexture = new LO<Texture | null>(null)
  textures = new LO<readonly Texture[]>([])
  
  constructor(model: DCMModel) {
    this.model = model
  }
}

export class Texture {
  readonly identifier: string
  name: LO<string>
  width: number
  height: number
  hidden: boolean

  constructor(model: DCMModel, name?: string, element?: HTMLImageElement) {
    if((name === undefined) !== (element === undefined)) {
      throw new Error("Either name and element need to be defined, or none need to be.");
    }

    this.identifier = uuidv4()

    this.width = model.texWidth
    this.height = model.texHeight

    if(element === undefined) {
      this.name = new LO("New Texture")
      element = document.createElement("img")
    } else {
      //We know that name is not undefined here
      this.name = new LO(name as string)
      this.width = element.naturalWidth
      this.height = element.naturalHeight
    }

    this.hidden = false
  }
}