import { DoubleSide, Group, Mesh, MeshBasicMaterial, NearestFilter, PlaneBufferGeometry, Texture } from 'three';
import { LO } from './ListenableObject';
export default class ReferenceImageHandler {

  readonly group: Group

  readonly opened = new LO(false)
  readonly images = new LO<readonly ReferenceImage[]>([])

  constructor(
    group: Group,
  ) {
    this.group = new Group()
    group.add(this.group)
  }

}

const startSize = 2

export class ReferenceImage {
  readonly name: LO<string>;
  readonly opacity: LO<number>
  readonly canSelect: LO<boolean>

  private readonly mesh: Mesh<PlaneBufferGeometry, MeshBasicMaterial>
  constructor(
    handler: ReferenceImageHandler,
    readonly img: HTMLImageElement,
    name = "New Reference Image",
    opacity = 100,
    canSelect = true
  ) {
    this.name = new LO(name)
    this.opacity = new LO(opacity)
    this.canSelect = new LO(canSelect)

    this.opacity.addListener(val => this.mesh.material.opacity = val)

    const texture = new Texture(img)
    texture.needsUpdate = true
    texture.flipY = true
    texture.magFilter = NearestFilter
    texture.minFilter = NearestFilter

    //Get an element with maximum width/height of startSize
    const aspect = img.naturalWidth / img.naturalHeight
    const width = aspect > 1 ? startSize : startSize * aspect
    const height = aspect > 1 ? startSize / aspect : startSize

    //Create the mesh
    const mat = new MeshBasicMaterial({ map: texture, side: DoubleSide, transparent: true, opacity })
    const geometry = new PlaneBufferGeometry(width, height)
    this.mesh = new Mesh(geometry, mat)
    handler.group.add(this.mesh)
  }
}