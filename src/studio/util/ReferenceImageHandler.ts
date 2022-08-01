import { useEffect } from 'react';
import { DoubleSide, Group, Mesh, MeshBasicMaterial, NearestFilter, Object3D, PlaneBufferGeometry, Texture } from 'three';
import { ReadableFile } from '../files/FileTypes';
import { LO } from '../listenableobject/ListenableObject';
import { setIntersectType } from '../selections/ObjectClickedDataHandler';
import { useStudio } from './../../contexts/StudioContext';
import { NumArray } from './NumArray';
export default class ReferenceImageHandler {

  readonly group: Group

  readonly images = new LO<readonly ReferenceImage[]>([])
  readonly selectedImage = new LO<ReferenceImage | null>(null)

  private intersected?: ReferenceImage

  readonly mode = new LO<"translate" | "rotate" | "scale">("translate")
  readonly space = new LO<"local" | "world">("local")


  constructor(
    group: Group,
  ) {
    this.group = new Group()
    //We override the render order, as the model is rendered with translucent textures,
    //Thus it can render wrong. This is to prevent that as much as possible.
    //https://cdn.discordapp.com/attachments/741335776473907320/999832740344119326/studiotest7.gif
    this.group.renderOrder = 1
    group.add(this.group)
  }

  uploadFile = async (readFile: ReadableFile) => {
    const file = await readFile.asFile()
    const reader = new FileReader()
    reader.onload = () => {
      const res = reader.result
      if (typeof res === "string") {
        const img = document.createElement("img")
        img.onload = () => {
          this.images.value = this.images.value.concat(new ReferenceImage(this, img, readFile.name))
        }
        img.src = res
      }
    }
    reader.readAsDataURL(file)
  }

  update = (object?: Object3D) => {
    const intersected = object?.userData?.['img'] as ReferenceImage | undefined

    if (this.intersected === intersected) {
      return
    }
    if (this.intersected && this.intersected !== this.selectedImage.value) {
      this.intersected.mesh.material = this.intersected.normal
      this.intersected.overlayMesh.visible = false
    }
    if (intersected && intersected !== this.selectedImage.value) {
      intersected.mesh.material = intersected.highlight
      intersected.overlayMesh.visible = true
      intersected.overlayMesh.material = intersected.overlayHighlight
    }
    this.intersected = intersected
  }

  onMouseUp = () => {
    if (this.selectedImage.value) {
      const selected = this.selectedImage.value
      selected.mesh.material = selected.normal
      selected.overlayMesh.visible = false
    }
    if (this.intersected) {
      const selected = this.intersected
      selected.mesh.material = selected.selected
      selected.overlayMesh.visible = true
      selected.overlayMesh.material = selected.overlaySelected
    }
    this.selectedImage.value = this.intersected ?? null
  }

}

const startSize = 2

export class ReferenceImage {
  readonly name: LO<string>;
  readonly opacity: LO<number>
  readonly canSelect: LO<boolean>
  readonly hidden: LO<boolean>

  readonly position: LO<NumArray>
  readonly rotation: LO<NumArray>

  readonly scale: LO<number>
  readonly flipX: LO<boolean>
  readonly flipY: LO<boolean>

  readonly mesh: Mesh<PlaneBufferGeometry, MeshBasicMaterial>
  readonly overlayMesh: Mesh<PlaneBufferGeometry, MeshBasicMaterial>

  readonly normal: MeshBasicMaterial
  readonly highlight: MeshBasicMaterial
  readonly selected: MeshBasicMaterial

  readonly overlayHighlight: MeshBasicMaterial
  readonly overlaySelected: MeshBasicMaterial

  constructor(
    private readonly handler: ReferenceImageHandler,
    readonly img: HTMLImageElement,
    name: string,
    opacity = 100,
    canSelect = true,
    hidden = false,
    position: NumArray = [0, 0, 0],
    rotation: NumArray = [0, 0, 0],
    scale = 1,
    flipX = false,
    flipY = false,
  ) {
    this.name = new LO(name)
    this.opacity = new LO(opacity)
    this.canSelect = new LO(canSelect)
    this.hidden = new LO(hidden)

    this.position = new LO(position)
    this.rotation = new LO(rotation)

    this.scale = new LO(scale)
    this.flipX = new LO(flipX)
    this.flipY = new LO(flipY)

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
    this.normal = new MeshBasicMaterial({ map: texture, side: DoubleSide, transparent: true, opacity })

    this.highlight = this.normal.clone()
    this.highlight.color.setHex(0xFFAAAA)
    this.overlayHighlight = new MeshBasicMaterial({ side: DoubleSide, transparent: true, opacity: 0.25, color: 0xFFAAAA })

    this.selected = this.normal.clone()
    this.selected.color.setHex(0xAAAAFF)
    this.overlaySelected = new MeshBasicMaterial({ side: DoubleSide, transparent: true, opacity: 0.25, color: 0xAAAAFF })

    const geometry = new PlaneBufferGeometry(width, height)
    this.mesh = new Mesh(geometry, this.normal)

    this.overlayMesh = new Mesh(geometry)
    this.overlayMesh.visible = false
    this.mesh.add(this.overlayMesh)

    setIntersectType(this.mesh, "refimg", () => this.canSelect.value && !this.hidden.value)
    this.mesh.userData['img'] = this
    this.handler.group.add(this.mesh)

    this.opacity.addAndRunListener(v => {
      const val = v / 100
      this.normal.opacity = val
      this.highlight.opacity = val
      this.selected.opacity = val
    })

    this.position.addAndRunListener(value => this.mesh.position.fromArray(value))
    this.rotation.addAndRunListener(value => {
      this.mesh.rotation.set(
        value[0] * Math.PI / 180,
        value[1] * Math.PI / 180,
        value[2] * Math.PI / 180
      )
    })


    const updateScale = ({ scale = this.scale.value, flipX = this.flipX.value, flipY = this.flipY.value } = {}) => {
      this.mesh.scale.set(
        flipX ? -scale : scale,
        flipY ? -scale : scale,
        scale
      )
    }
    this.scale.addAndRunListener(scale => updateScale({ scale }))
    this.flipX.addListener(flipX => updateScale({ flipX }))
    this.flipY.addListener(flipY => updateScale({ flipY }))

    this.hidden.addAndRunListener(hidden => this.mesh.visible = !hidden)
  }

  delete() {
    this.handler.group.remove(this.mesh)
    if (this.handler.selectedImage.value === this) {
      this.handler.selectedImage.value = null;
    }
    this.handler.images.value = this.handler.images.value.filter(img => img !== this)
  }
}

export const useReferenceImageTransform = (image: ReferenceImage) => {
  const { getSelectedProject, onMouseUp, transformControls } = useStudio()
  const { referenceImageHandler, selectedCubeManager, modelerGumball } = getSelectedProject()
  useEffect(() => {
    const updateTransformControls = ({ blockedReasons = modelerGumball.blockedReasons.value, mode = referenceImageHandler.mode.value, space = referenceImageHandler.space.value }) => {
      transformControls.visible = true
      transformControls.enabled = blockedReasons.length === 0

      transformControls.mode = mode
      transformControls.space = space
    }

    const objectChange = () => {
      if (transformControls.mode === "translate") {
        image.position.value = [
          image.mesh.position.x,
          image.mesh.position.y,
          image.mesh.position.z
        ]
        return
      }

      if (transformControls.mode === "rotate") {
        image.rotation.value = [
          image.mesh.rotation.x * 180 / Math.PI,
          image.mesh.rotation.y * 180 / Math.PI,
          image.mesh.rotation.z * 180 / Math.PI
        ]
      }

      if (transformControls.mode === "scale") {
        let value: number
        if (transformControls.axis?.includes("X")) {
          value = image.mesh.scale.x
        } else if (transformControls.axis?.includes("Y")) {
          value = image.mesh.scale.y
        } else {
          value = image.mesh.scale.z
        }
        image.scale.value = value
        image.flipX.value = image.mesh.scale.x !== image.mesh.scale.z
        image.flipX.value = image.mesh.scale.y !== image.mesh.scale.z
      }
    }

    const updateBlocked = (blockedReasons: readonly string[]) => updateTransformControls({ blockedReasons })
    const updateMode = (mode: "translate" | "rotate" | "scale") => updateTransformControls({ mode })
    const updateSpace = (space: "local" | "world") => updateTransformControls({ space })

    transformControls.attach(image.mesh)
    transformControls.addEventListener("objectChange", objectChange)
    modelerGumball.blockedReasons.addAndRunListener(updateBlocked)
    referenceImageHandler.mode.addListener(updateMode)
    referenceImageHandler.space.addListener(updateSpace)
    return () => {
      transformControls.detach()
      transformControls.removeEventListener("objectChange", objectChange)
      modelerGumball.blockedReasons.removeListener(updateBlocked)
      referenceImageHandler.mode.removeListener(updateMode)
      referenceImageHandler.space.removeListener(updateSpace)
    }
  }, [image, onMouseUp, referenceImageHandler, selectedCubeManager, transformControls, modelerGumball.blockedReasons])
}
