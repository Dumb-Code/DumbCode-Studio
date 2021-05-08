import { useRef, useEffect } from 'react';
import { LO, useListenableObject } from './../../util/ListenableObject';
import { v4 as uuidv4 } from 'uuid';
import { DCMModel } from './../model/DcmModel';
import { createNamedExports } from 'typescript';

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

  readonly defaultGroup = new TextureGroup("Default", true)
  selectedGroup = new LO<TextureGroup>(this.defaultGroup)
  groups = new LO<readonly TextureGroup[]>([this.selectedGroup.value])

  activeTexture = new LO<Texture | null>(null)
  textures = new LO<readonly Texture[]>([])

  constructor(model: DCMModel) {
    this.model = model
  }

  addTexture(name?: string, element?: HTMLImageElement) {
    const texture = new Texture(this.model, name, element)
    this.textures.value = this.textures.value.concat([texture])
    this.defaultGroup.textures.value = this.defaultGroup.textures.value.concat([texture.identifier])
    return texture
  }


}

export class Texture {
  readonly identifier: string
  name: LO<string>

  element: LO<HTMLImageElement>

  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D

  width: number
  height: number
  hidden: boolean

  constructor(model: DCMModel, name?: string, element?: HTMLImageElement) {
    if ((name === undefined) !== (element === undefined)) {
      throw new Error("Either name and element need to be defined, or none need to be.");
    }

    this.identifier = uuidv4()

    if (element === undefined) {
      this.name = new LO("New Texture")
      this.width = model.texWidth
      this.height = model.texHeight
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
      this.onCanvasChanged()
    } else {
      this.ctx.drawImage(this.element.value, 0, 0, this.width, this.height)
    }
    this.hidden = false
  }

  onCanvasChanged() {
    const value = new Image()
    value.onload = () => this.element.value = value
    value.src = this.canvas.toDataURL()
  }
}

export const useTextureDomRef = <T extends HTMLElement>(texture: Texture, className?: string) => {
  const [img] = useListenableObject(texture.element)
  const ref = useRef<T>(null)

  useEffect(() => {
    if (ref.current === null) {
      throw new Error("Ref not set.")
    }
    //TODO: reuse img cloned?
    const cloned = img.cloneNode() as HTMLElement
    if (className !== undefined) {
      cloned.className = className
    }

    ref.current.appendChild(cloned)
    return () => {
      if (ref.current !== null) {
        ref.current.removeChild(cloned)
      }
    }
  }, [img])

  return ref
}