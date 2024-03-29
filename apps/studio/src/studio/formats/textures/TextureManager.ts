import { Psd } from 'ag-psd';
import { useCallback } from 'react';
import { NearestFilter, Texture as ThreeTexture } from 'three';
import { v4 as uuidv4 } from 'uuid';
import { getUndefinedWritable, ListenableFileData, ReadableFile, readFileToImg, WritableFile } from '../../files/FileTypes';
import { LO, useListenableObject } from '../../listenableobject/ListenableObject';
import { useDomParent } from '../../util/DomParentRef';
import UnsafeOperations from '../../util/UnsafeOperations';
import { fitAreaWithinBounds } from '../../util/Utils';
import DcProject, { removeFileExtension } from '../project/DcProject';
import { ListenableFile, readFileArrayBuffer } from './../../files/FileTypes';
import { DCMCube, DCMModel } from './../model/DcmModel';
import { loadGroupFromPsdFile } from './GroupPhotoshopManager';
import { TextureGLManager } from './TextureGLManager';
import TextureLayer from './TextureLayer';
import { loadFromPsdFile } from './TexturePhotoshopManager';

export default class TextureManager {
  readonly project: DcProject

  readonly canvas = typeof window === "undefined" ? null! : document.createElement("canvas")
  readonly numberTimesRefreshed = new LO<number>(0)

  defaultGroup: TextureGroup
  readonly selectedGroup: LO<TextureGroup>
  readonly groups: LO<readonly TextureGroup[]>

  readonly activeTexture = new LO<Texture | null>(null)
  readonly textures = new LO<readonly Texture[]>([])

  stopRefresh = false

  constructor(project: DcProject) {
    this.project = project

    this.defaultGroup = new TextureGroup(this, "Default", true)
    this.defaultGroup.folderName.addPreModifyListener((_new, _old, naughtyModifyValue) => naughtyModifyValue('')) //Default folder should always be empty
    this.defaultGroup.folderName.value = ''
    this.selectedGroup = new LO<TextureGroup>(this.defaultGroup)
    this.groups = new LO<readonly TextureGroup[]>([this.defaultGroup])

    this.defaultGroup.textures.addPostListener(() => this.refresh())
    this.selectedGroup.addPostListener(() => this.refresh())
  }

  async addFile(readable: ReadableFile) {
    const file = await readable.asFile()
    const [img, psd] = await this.loadTextureFromFile(file)

    const texture = this.addTexture(removeFileExtension(readable.name), img, psd ?? undefined)
    await this.linkFile(readable, texture)
  }

  async linkFile(readable: ReadableFile, texture: Texture) {
    if (texture.psdData.value === null) {
      await texture.setTextureFile(readable.asWritable())
      texture.saveableFile.value = true
    } else {
      await texture.setPhotoshopFile(readable.asWritable())
    }
  }

  async loadTextureFromFile(file: File): Promise<[HTMLImageElement, Psd | null]> {
    if (file.name.endsWith(".psd")) {
      return loadFromPsdFile(await readFileArrayBuffer(file))
    }
    return [await readFileToImg(file), null]
  }

  addTexture(name?: string, element?: HTMLImageElement, psd?: Psd): Texture {
    this.stopRefresh = true
    const texture = new Texture(this, this.project.model, name, element)
    texture.psdData.value = psd ?? null
    texture.element.addListener(() => this.refresh())
    texture.needsSaving.addListener(v => this.project.projectNeedsSaving.value ||= v)
    this.textures.value = this.textures.value.concat([texture])
    this.defaultGroup.textures.value = [texture.identifier].concat(this.defaultGroup.textures.value)
    this.groups.value.forEach(g => g.unselectedTextures.value = g.unselectedTextures.value.concat(texture.identifier))
    this.stopRefresh = false
    this.refresh()
    return texture
  }

  deleteTexture(texture: Texture) {
    this.stopRefresh = true
    this.textures.value = this.textures.value.filter(t => t !== texture)
    this.groups.value.forEach(g => {
      g.unselectedTextures.value = g.unselectedTextures.value.filter(t => t !== texture.identifier)
      g.textures.value = g.textures.value.filter(t => t !== texture.identifier)
    })
    this.stopRefresh = false
    this.refresh()
  }

  findTexture(identifier: string) {
    const found = this.textures.value.find(tex => tex.identifier === identifier)
    if (found === undefined) {
      throw new Error("Unable to find texture of id " + identifier);
    }
    return found
  }

  addGroup(...groups: TextureGroup[]) {
    if (groups.length === 0) {
      return
    }

    this.stopRefresh = true
    groups.forEach(group => {
      group.needsSaving.addListener(v => this.project.projectNeedsSaving.value ||= v)
      group.textures.addPostListener(() => this.refresh())
      group.unselectedTextures.value = this.defaultGroup.textures.value.filter(t => !group.textures.value.includes(t))
    })
    const containedDefault = groups.find(groups => groups.isDefault)
    if (containedDefault) {
      this.groups.value = this.groups.value.filter(g => !g.isDefault)
      this.defaultGroup = containedDefault
    }
    this.groups.value = this.groups.value.concat(...groups)
    this.selectedGroup.value = groups[0]
    this.stopRefresh = false
    this.refresh()
  }

  refresh() {
    if (this.stopRefresh) {
      return
    }
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

    this.numberTimesRefreshed.value++
  }

  static writeToCanvas(textures: Texture[], canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")
    if (ctx === null) {
      throw new Error("Unable to get canvas context")
    }

    //Get the width/height to render. Gets the width/height needed for all textures to render fully
    // let width = textures.map(t => t.width).reduce((a, c) => Math.abs(a * c) / this._gcd(a, c), 1)
    // let height = textures.map(t => t.height).reduce((a, c) => Math.abs(a * c) / this._gcd(a, c), 1)
    let width = Math.max(...textures.map(t => t.width), 1)
    let height = Math.max(...textures.map(t => t.height), 1)


    const maxTextureSize = UnsafeOperations._unsafe_getThreeContext().renderer.capabilities.maxTextureSize / 2
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

    TextureGLManager.getInstance().render(textures.reverse().map(t => t.canvas), canvas)
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

  static drawCubeToCanvas(cube: DCMCube, width: number, height: number, ctx: CanvasRenderingContext2D, allowModifiers: boolean,
    textureWidth = cube.model.textureWidth.value,
    textureHeight = cube.model.textureHeight.value,
    textureOffset = cube.textureOffset.value,
    dimension = cube.dimension.value,
    hovered = cube.mouseHover.value,
    selected = cube.selected.value,

  ) {
    const bounds = fitAreaWithinBounds(textureWidth, textureHeight, width, height)

    const su = textureWidth / bounds.width
    const sv = textureHeight / bounds.height



    let r = 1
    let g = 1
    let b = 1
    let a = allowModifiers ? 0.2 : 1

    if (allowModifiers) {
      if (hovered) {
        g = 0.2
        b = 0.2
        a = 0.5
      } else if (selected) {
        r = 0.2
        g = 0.2
        a = 0.5
      }
    }

    let u = textureOffset[0] / su
    let v = textureOffset[1] / sv

    let w = dimension[0]
    let h = dimension[1]
    let d = dimension[2]

    let uw = w / su
    let ud = d / su

    let vh = h / sv
    let vd = d / sv

    //Draw the different faces with the different colors
    ctx.fillStyle = `rgba(${255 * r}, 0, 0, ${a})`
    ctx.fillRect(u, v + vd, ud, vh)

    ctx.fillStyle = `rgba(0, ${255 * g}, 0, ${a})`
    ctx.fillRect(u + ud, v, uw, vd)

    ctx.fillStyle = `rgba(0, 0, ${255 * b}, ${a})`
    ctx.fillRect(u + ud + uw + ud, v + vd, uw, vh)


    ctx.fillStyle = `rgba(${127 * r}, 0, 0, ${a})`
    ctx.fillRect(u + ud + uw, v + vd, ud, vh)

    ctx.fillStyle = `rgba(0, ${127 * g}, 0, ${a})`
    ctx.fillRect(u + ud + uw, v, uw, vd)

    ctx.fillStyle = `rgba(0, 0, ${127 * b}, ${a})`
    ctx.fillRect(u + ud, v + vd, uw, vh)
  }

}

export class TextureGroup {
  readonly needsSaving = new LO(false)
  readonly identifier: string;
  readonly name: LO<string>
  readonly folderName: LO<string>
  readonly textures = new LO<readonly string[]>([])
  readonly unselectedTextures = new LO<readonly string[]>([])

  readonly psdData = new LO<Psd | null>(null)

  psdFile = getUndefinedWritable("Photoshop file", ".psd")
  psdFileData: ListenableFileData | null = null

  isDefault: boolean

  constructor(
    readonly manager: TextureManager,
    name: string, isDefault: boolean
  ) {
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

    this.setPsdFile(this.psdFile)
  }

  setPsdFile = async (file: WritableFile) => {
    this.psdFile.unlink?.()
    this.psdFile = file

    if (this.psdFileData !== null) {
      this.psdFileData.dispose()
    }
    this.psdFileData = await file.startListening(this.manager.project.fileChangeListener)
    if (this.psdFileData !== null) {
      this.psdFileData.onChange = async file => {
        UnsafeOperations._unsafe_AddToast(`${file.name} has changed. Reloading...`, "info")
        await this.onPsdFileChanged(file)
      }
    }
  }

  async onPsdFileChanged(file: File) {
    const psd = await loadGroupFromPsdFile(await file.arrayBuffer(), this)
    this.psdData.value = psd
  }

  toggleTexture(texture: Texture, isInGroup: boolean, after?: string) {
    this.manager.stopRefresh = true

    const isDraggingSelected = this.textures.value.includes(texture.identifier)

    const from = isDraggingSelected ? this.textures : this.unselectedTextures
    const to = isInGroup ? this.textures : this.unselectedTextures

    from.value = from.value.filter(f => f !== texture.identifier)
    const newVal = [...to.value]
    newVal.splice(after === undefined ? to.value.length : to.value.indexOf(after), 0, texture.identifier)
    to.value = newVal

    this.manager.stopRefresh = false
    this.manager.refresh()
  }
}

export class Texture {
  readonly identifier: string
  readonly name: LO<string>
  readonly element: LO<HTMLImageElement>

  readonly saveableFile = new LO(false)
  readonly needsSaving = new LO(false)
  textureWritableFile = getUndefinedWritable("Texture File", ".png")
  textureListenableFile: ListenableFileData | null = null

  photoshopWriteableFile = getUndefinedWritable("Photoshop File", ".psd")
  photoshopListenableFile: ListenableFileData | null = null

  readonly psdData = new LO<Psd | null>(null)


  readonly canvas = new TextureLayer()

  width: number
  height: number
  readonly hidden: LO<boolean>

  constructor(
    readonly manager: TextureManager,
    model: DCMModel, name?: string, element?: HTMLImageElement) {
    if ((name === undefined) !== (element === undefined)) {
      throw new Error("Either name and element need to be defined, or none need to be.");
    }

    this.identifier = uuidv4()

    this.width = model.textureWidth.value
    this.height = model.textureHeight.value

    if (element === undefined) {
      this.name = new LO("New Texture")
      element = new Image()

      const canvas = document.createElement("canvas")
      canvas.width = this.width
      canvas.height = this.height
      const ctx = canvas.getContext("2d")!
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, this.width, this.height)
      const newElement = new Image()
      newElement.onload = () => this.element.value = newElement
      newElement.src = canvas.toDataURL("image/png")
    } else {
      //We know that name is not undefined here
      this.name = new LO(name as string)
    }

    this.element = new LO(element)


    this.element.addAndRunListener((element) => {
      if (element.naturalHeight !== 0 && element.naturalWidth !== 0) {
        this.width = element.naturalWidth
        this.height = element.naturalHeight
        this.canvas.setBackground(element)
      }
    })

    this.hidden = new LO<boolean>(false)

    const onDirty = () => this.needsSaving.value = true
    this.name.addListener(onDirty)
    this.element.addListener(onDirty)

    this.startListeningToFile(this.textureWritableFile, true)
    this.startListeningToFile(this.photoshopWriteableFile, false)
  }

  async setTextureFile(file: WritableFile) {
    this.textureWritableFile.unlink?.()
    this.textureWritableFile = file
    this.startListeningToFile(file, true)
  }

  async setPhotoshopFile(file: WritableFile) {
    this.photoshopWriteableFile.unlink?.()
    this.photoshopWriteableFile = file
    this.startListeningToFile(file, false)
  }

  private async startListeningToFile(file: ListenableFile, isTextureFile: boolean) {
    const listenableData = isTextureFile ? this.textureListenableFile : this.photoshopListenableFile

    const listenable = await file.startListening(this.manager.project.fileChangeListener)
    if (listenableData !== null) {
      listenableData.dispose()
    }
    if (isTextureFile) {
      this.textureListenableFile = listenable
    } else {
      this.photoshopListenableFile = listenable
    }
    if (listenable !== null) {
      listenable.onChange = async (file) => {
        UnsafeOperations._unsafe_AddToast(`${file.name} has changed. Reloading...`, "info")
        await this.onTextureFileChange(file)
      }
    }
  }

  async onTextureFileChange(file: File) {
    const [img, psd] = await this.manager.loadTextureFromFile(file)
    this.element.value = img
    this.psdData.value = psd
    this.needsSaving.value = false
  }

  delete() {
    if (this.textureListenableFile !== null) {
      this.textureListenableFile.dispose()
    }
    this.manager.deleteTexture(this)
  }

  async onCanvasChanged(refresh: boolean) {
    const value = new Image()
    value.onload = () => refresh && (this.element.value = value)
    value.src = await this.canvas.toDataURL()
  }
}

export const useTextureDomRef = <T extends HTMLElement>(texture: Texture, className?: string, modify?: (img: HTMLImageElement) => void) => {
  const [img] = useListenableObject(texture.element)
  const ref = useDomParent<T>(useCallback(() => {
    //TODO: reuse img cloned?
    const cloned = img.cloneNode() as HTMLImageElement
    if (className !== undefined) {
      cloned.className = className
    }
    if (modify) {
      modify(cloned)
    }
    return cloned
  }, [className, modify, img]))
  return ref
}