import { LO, useListenableObject } from './../../util/ListenableObject';
import { v4 as uuidv4 } from 'uuid';
import { DCMModel } from './../model/DcmModel';
import { useDomParent } from '../../util/DomParentRef';
import DcProject from '../DcProject';
import { CanvasTexture, NearestFilter } from 'three';

export default class TextureManager {
  readonly project: DcProject

  readonly canvas: HTMLCanvasElement
  readonly canvasContext: CanvasRenderingContext2D

  readonly defaultGroup: TextureGroup
  readonly selectedGroup: LO<TextureGroup>
  readonly groups: LO<readonly TextureGroup[]>

  activeTexture = new LO<Texture | null>(null)
  textures = new LO<readonly Texture[]>([])

  constructor(project: DcProject) {
    this.project = project

    this.defaultGroup = new TextureGroup("Default", true)
    this.selectedGroup = new LO<TextureGroup>(this.defaultGroup)
    this.groups = new LO<readonly TextureGroup[]>([this.selectedGroup.value])

    this.canvas = document.createElement("canvas")
    const ctx = this.canvas.getContext("2d")
    if (ctx === null) {
      throw new Error("Unable to get canvas context")
    }
    this.canvasContext = ctx
    this.canvasContext.imageSmoothingEnabled = false
  }

  addTexture(name?: string, element?: HTMLImageElement) {
    const texture = new Texture(this.project.model, name, element)
    texture.element.addListener(() => this.refresh())
    this.textures.value = this.textures.value.concat([texture])
    this.defaultGroup.textures.value = [texture.identifier].concat(this.defaultGroup.textures.value)
    this.refresh()
    return texture
  }

  findTexture(identifier: string) {
    const found = this.textures.value.find(tex => tex.identifier === identifier)
    if (found === undefined) {
      throw new Error("Unable to find texture of id " + identifier);
    }
    return found
  }

  refresh() {
    const textures = this.selectedGroup.value.textures.value
      .map(t => this.findTexture(t))
      .filter(t => !t.hidden.value)


    //Get the width/height to render. Gets the width/height needed for all textures to render fully
    const width = this.canvas.width = textures.map(t => t.width).reduce((a, c) => Math.abs(a * c) / this._gcd(a, c), 1)
    const height = this.canvas.height = textures.map(t => t.height).reduce((a, c) => Math.abs(a * c) / this._gcd(a, c), 1)

    //Draw white if no textures
    if (this.textures.value.length === 0) {
      this.canvasContext.fillStyle = `rgba(255, 255, 255, 1)`
      this.canvasContext.fillRect(0, 0, width, height)
    } else {
      this.canvasContext.clearRect(0, 0, width, height)
    }

    textures.reverse().forEach(t => this.canvasContext.drawImage(t.canvas, 0, 0, width, height))

    const tex = new CanvasTexture(this.canvas)
    tex.needsUpdate = true
    tex.flipY = false
    tex.magFilter = NearestFilter;
    tex.minFilter = NearestFilter;

    this.project.setTexture(tex)
  }

  /**
    * Greatest common dividor
    */
  _gcd(a: number, b: number) {
    if (!b) {
      return Math.abs(a);
    }

    return this._gcd(b, a % b);
  }

}

export class TextureGroup {
  readonly identifier: string;
  readonly name: LO<string>
  readonly textures: LO<readonly string[]>
  isDefault: boolean

  constructor(name: string, isDefault: boolean) {
    this.identifier = uuidv4()
    this.isDefault = isDefault
    this.name = new LO(name)
    this.textures = new LO([] as const as readonly string[])
  }
}

export class Texture {
  readonly identifier: string
  readonly name: LO<string>
  readonly element: LO<HTMLImageElement>

  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D

  width: number
  height: number
  readonly hidden: LO<boolean>

  constructor(model: DCMModel, name?: string, element?: HTMLImageElement) {
    if ((name === undefined) !== (element === undefined)) {
      throw new Error("Either name and element need to be defined, or none need to be.");
    }

    this.identifier = uuidv4()

    if (element === undefined) {
      this.name = new LO("New Texture")
      this.width = model.textureWidth.value
      this.height = model.textureHeight.value
      element = document.createElement("img")
    } else {
      //We know that name is not undefined here
      this.name = new LO(name as string)
      this.width = element.naturalWidth
      this.height = element.naturalHeight
    }

    this.element = new LO(element)
    this.canvas = document.createElement("canvas")
    this.canvas.width = this.width
    this.canvas.height = this.height

    const ctx = this.canvas.getContext("2d")
    if (ctx === null) throw new Error("Unable to create 2D context");
    this.ctx = ctx

    this.ctx.imageSmoothingEnabled = false

    if (name === undefined) {
      this.ctx.fillStyle = "rgba(255, 255, 255, 1)"
      this.ctx.fillRect(0, 0, this.width, this.height)
      this.onCanvasChanged(false)
    } else {
      this.ctx.drawImage(this.element.value, 0, 0, this.width, this.height)
    }
    this.hidden = new LO<boolean>(false)
  }

  onCanvasChanged(refresh: boolean) {
    const value = new Image()
    value.onload = () => this.element.value = value
    value.src = this.canvas.toDataURL()
  }
}

export const useTextureDomRef = <T extends HTMLElement>(texture: Texture, className?: string) => {
  const [img] = useListenableObject(texture.element)
  const ref = useDomParent<T>(() => {
    //TODO: reuse img cloned?
    const cloned = img.cloneNode() as HTMLElement
    if (className !== undefined) {
      cloned.className = className
    }
    return cloned
  })
  return ref
}