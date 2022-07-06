import { NearestFilter, Texture as ThreeTexture } from 'three';
import { v4 as uuidv4 } from 'uuid';
import { unsafe_getThreeContext } from '../../../contexts/StudioContext';
import { useDomParent } from '../../util/DomParentRef';
import DcProject from '../project/DcProject';
import { LO, useListenableObject } from './../../util/ListenableObject';
import { DCMModel } from './../model/DcmModel';

export default class TextureManager {
  readonly project: DcProject

  readonly canvas: HTMLCanvasElement

  readonly defaultGroup: TextureGroup
  readonly selectedGroup: LO<TextureGroup>
  readonly groups: LO<readonly TextureGroup[]>

  readonly activeTexture = new LO<Texture | null>(null)
  readonly textures = new LO<readonly Texture[]>([])

  constructor(project: DcProject) {
    this.project = project

    this.defaultGroup = new TextureGroup("Default", true)
    this.defaultGroup.folderName.addPreModifyListener((_new, _old, naughtyModifyValue) => naughtyModifyValue('')) //Default folder should always be empty
    this.defaultGroup.folderName.value = ''
    this.selectedGroup = new LO<TextureGroup>(this.defaultGroup)
    this.groups = new LO<readonly TextureGroup[]>([this.defaultGroup])

    this.defaultGroup.textures.addPostListener(() => this.refresh())
    this.selectedGroup.addPostListener(() => this.refresh())

    this.canvas = document.createElement("canvas")
  }

  addTexture(name?: string, element?: HTMLImageElement) {
    const texture = new Texture(this.project.model, name, element)
    texture.element.addListener(() => this.refresh())
    texture.needsSaving.addListener(v => this.project.projectNeedsSaving.value ||= v)
    this.textures.value = this.textures.value.concat([texture])
    this.defaultGroup.textures.value = [texture.identifier].concat(this.defaultGroup.textures.value)
    this.groups.value.forEach(g => g.unselectedTextures.value = g.unselectedTextures.value.concat(texture.identifier))
    return texture
  }

  findTexture(identifier: string) {
    const found = this.textures.value.find(tex => tex.identifier === identifier)
    if (found === undefined) {
      throw new Error("Unable to find texture of id " + identifier);
    }
    return found
  }

  addGroup(...groups: TextureGroup[]) {
    groups.forEach(group => {
      group.needsSaving.addListener(v => this.project.projectNeedsSaving.value ||= v)
      group.textures.addPostListener(() => this.refresh())
      group.unselectedTextures.value = this.defaultGroup.textures.value
    })
    this.groups.value = this.groups.value.concat(...groups)
  }

  refresh() {
    const textures = this.selectedGroup.value.textures.value
      .map(t => this.findTexture(t))
      .filter(t => !t.hidden.value)


    TextureManager.writeToCanvas(textures, this.canvas)

    const tex = new ThreeTexture(this.canvas)
    tex.needsUpdate = true
    tex.flipY = false
    tex.magFilter = NearestFilter;
    tex.minFilter = NearestFilter;

    this.project.setTexture(tex)
  }

  static writeToCanvas(textures: Texture[], canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")
    if (ctx === null) {
      throw new Error("Unable to get canvas context")
    }

    //Get the width/height to render. Gets the width/height needed for all textures to render fully
    let width = textures.map(t => t.width).reduce((a, c) => Math.abs(a * c) / this._gcd(a, c), 1)
    let height = textures.map(t => t.height).reduce((a, c) => Math.abs(a * c) / this._gcd(a, c), 1)

    const maxTextureSize = unsafe_getThreeContext().renderer.capabilities.maxTextureSize
    const scale = maxTextureSize / Math.max(width, height);

    if (scale < 1) {
      width *= scale
      height *= scale
    }

    canvas.width = width
    canvas.height = height

    ctx.imageSmoothingEnabled = false

    //Draw white if no textures
    if (textures.length === 0) {
      ctx.fillStyle = `rgba(255, 255, 255, 1)`
      ctx.fillRect(0, 0, width, height)
    } else {
      ctx.clearRect(0, 0, width, height)
    }

    textures.reverse().forEach(t => ctx.drawImage(t.canvas, 0, 0, width, height))
  }

  /**
    * Greatest common dividor
    */
  static _gcd(a: number, b: number): number {
    if (!b) {
      return Math.abs(a);
    }

    return this._gcd(b, a % b);
  }

}

export class TextureGroup {
  readonly needsSaving = new LO(false)
  readonly identifier: string;
  readonly name: LO<string>
  readonly folderName: LO<string>
  readonly textures = new LO<readonly string[]>([])
  readonly unselectedTextures = new LO<readonly string[]>([])
  isDefault: boolean

  constructor(name: string, isDefault: boolean) {
    this.identifier = uuidv4()
    this.isDefault = isDefault
    this.name = new LO(name)
    this.folderName = new LO(name.toLowerCase())

    this.name.addListener(value => this.folderName.value = value.toLowerCase())

    const onDirty = () => this.needsSaving.value = true

    this.name.addListener(onDirty)
    this.folderName.addListener(onDirty)
    this.textures.addListener(onDirty)
    this.unselectedTextures.addListener(onDirty)
  }

  toggleTexture(texture: Texture, isInGroup: boolean, after?: string) {
    const isDraggingSelected = this.textures.value.includes(texture.identifier)

    const from = isDraggingSelected ? this.textures : this.unselectedTextures
    const to = isInGroup ? this.textures : this.unselectedTextures

    if (from === to) {
      return
    }

    from.value = from.value.filter(f => f !== texture.identifier)
    const newVal = [...to.value]
    newVal.splice(after === undefined ? to.value.length : to.value.indexOf(after), 0, texture.identifier)
    to.value = newVal
  }
}

export class Texture {
  readonly identifier: string
  readonly name: LO<string>
  readonly element: LO<HTMLImageElement>

  readonly needsSaving = new LO(false)

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

    const onDirty = () => this.needsSaving.value = true
    this.name.addListener(onDirty)

  }

  onCanvasChanged(refresh: boolean) {
    const value = new Image()
    value.onload = () => this.element.value = value
    value.src = this.canvas.toDataURL()
  }
}

export const useTextureDomRef = <T extends HTMLElement>(texture: Texture, className?: string, modify?: (img: HTMLImageElement) => void) => {
  const [img] = useListenableObject(texture.element)
  const ref = useDomParent<T>(() => {
    //TODO: reuse img cloned?
    const cloned = img.cloneNode() as HTMLImageElement
    if (className !== undefined) {
      cloned.className = className
    }
    if (modify) {
      modify(cloned)
    }
    return cloned
  })
  return ref
}