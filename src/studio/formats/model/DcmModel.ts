import { LO, LOMap } from './../../util/ListenableObject';
import { Group, BoxBufferGeometry, BufferAttribute, Mesh, Vector3, Quaternion, MeshLambertMaterial, DoubleSide, MeshBasicMaterial } from "three";
import { v4 as uuidv4 } from "uuid"
import DcProject from '../project/DcProject';
import SelectedCubeManager from '../../util/SelectedCubeManager';

const tempVector = new Vector3()
const tempQuaterion = new Quaternion()

export interface CubeParent {
  addChild(child: DCMCube): void
  deleteChild(child: DCMCube): void
  children: LO<readonly DCMCube[]>
  getChildren(): readonly DCMCube[]
}

const invalidParent: CubeParent = {
  addChild() {
    throw new Error("Invalid Call On Parent")
  },
  deleteChild() {
    throw new Error("Invalid Call On Parent")
  },
  children: new LO<readonly DCMCube[]>([]),
  getChildren() {
    throw new Error("Invalid Call On Parent")
  }
}
Object.freeze(invalidParent)

export class DCMModel implements CubeParent {

  parentProject?: DcProject
  readonly author = new LO("???")

  readonly textureWidth = new LO(64)
  readonly textureHeight = new LO(64)

  cubeMap: Map<string, Set<DCMCube>>
  readonly identifierCubeMap = new LOMap<string, DCMCube>()
  readonly children = new LO<readonly DCMCube[]>([])

  readonly needsSaving = new LO(false)

  readonly materials: ProjectMaterials

  readonly modelGroup: Group

  selectedCubeManager?: SelectedCubeManager

  constructor() {
    this.cubeMap = new Map()

    this.materials = new ProjectMaterials()

    this.children.addListener((newChildren, oldChildren) => {
      oldChildren.forEach(child => this.modelGroup.remove(child.cubeGroup))
      newChildren.forEach(child => {
        child.parent = this
        this.modelGroup.add(child.cubeGroup)
      })
    })

    const refreshTextures = () => this.traverseAll(cube => cube.updateTexture())
    this.textureWidth.addListener(refreshTextures)
    this.textureHeight.addListener(refreshTextures)

    const onDirty = () => this.needsSaving.value = true
    this.children.addListener(onDirty)
    this.textureWidth.addListener(onDirty)
    this.textureHeight.addListener(onDirty)
    this.author.addListener(onDirty)

    this.modelGroup = new Group()
    this.modelGroup.clear()
    this.modelGroup.scale.set(1 / 16, 1 / 16, 1 / 16)
    this.modelGroup.position.set(0.5, 0, 0.5)
  }

  traverseAll(func: (cube: DCMCube) => void) {
    this.children.value.forEach(child => child.traverse(cube => func(cube)))
  }

  gatherAllCubes(arr: DCMCube[] = []) {
    this.traverseAll(c => arr.push(c))
    return arr
  }

  updateMatrixWorld(force = true) {
    this.modelGroup.updateMatrixWorld(force)
  }

  addChild(child: DCMCube) {
    this.children.value = this.children.value.concat(child)
  }

  deleteChild(child: DCMCube) {
    this.children.value = this.children.value.filter(c => c !== child)
  }

  getChildren() {
    return this.children.value
  }

  resetVisuals() {
    this.children.value.forEach(child => child.resetVisuals())
  }

  cloneModel() {
    let model = new DCMModel()

    model.author.value = this.author.value
    model.textureWidth.value = this.textureWidth.value
    model.textureHeight.value = this.textureHeight.value

    model.children.value = this.children.value.map(c => c.cloneCube(model))

    return model
  }
}

export class DCMCube implements CubeParent {
  identifier: string
  readonly name: LO<string>
  readonly dimension: LO<readonly [number, number, number]>
  readonly position: LO<readonly [number, number, number]>
  readonly offset: LO<readonly [number, number, number]>
  readonly rotation: LO<readonly [number, number, number]>
  readonly textureOffset: LO<readonly [number, number]>
  readonly textureMirrored: LO<boolean>
  readonly cubeGrow: LO<readonly [number, number, number]>
  readonly children: LO<readonly DCMCube[]>

  readonly mouseHover = new LO(false)
  readonly selected = new LO(false)

  readonly visible = new LO(true)
  readonly locked = new LO(false)

  model: DCMModel
  parent: CubeParent

  readonly uvBuffer: BufferAttribute

  readonly cubeGroup: Group
  readonly cubeGrowGroup: Group
  readonly cubeMesh: Mesh

  constructor(
    name: string,
    dimension: readonly [number, number, number],
    rotationPoint: readonly [number, number, number],
    offset: readonly [number, number, number],
    rotation: readonly [number, number, number],
    textureOffset: readonly [number, number],
    textureMirrored: boolean,
    cubeGrow: readonly [number, number, number],
    children: readonly DCMCube[],
    model: DCMModel) {

    const onDirty = () => model.needsSaving.value = true
    this.identifier = uuidv4()
    this.name = new LO(name, onDirty)
    this.dimension = new LO<readonly [number, number, number]>(dimension, onDirty)
    this.position = new LO<readonly [number, number, number]>(rotationPoint, onDirty)
    this.offset = new LO<readonly [number, number, number]>(offset, onDirty)
    this.rotation = new LO<readonly [number, number, number]>(rotation, onDirty)
    this.textureOffset = new LO<readonly [number, number]>(textureOffset, onDirty)
    this.textureMirrored = new LO<boolean>(textureMirrored, onDirty)
    this.cubeGrow = new LO<readonly [number, number, number]>(cubeGrow, onDirty)
    this.children = new LO<readonly DCMCube[]>(children, onDirty)
    this.model = model

    this.parent = invalidParent

    let counter = 0
    while (model.cubeMap.has(this.name.value)) {
      this.name.value = name + "~" + counter
      counter += 1
    }
    model.identifierCubeMap.set(this.identifier, this)
    this.pushNameToModel()

    this.uvBuffer = new BufferAttribute(new Float32Array(new Array(6 * 4 * 2)), 2)

    this.name.addListener((newValue, oldValue) => {
      this.model.parentProject?.renameCube(oldValue, newValue)
      this.model.cubeMap.get(oldValue)?.delete(this)
      this.pushNameToModel(newValue)
    })

    this.position.addListener(values => this.updatePositionVisuals(values))
    this.rotation.addListener(values => this.updateRotationVisuals(values))
    this.cubeGrow.addListener(value => this.updateCubeGrowVisuals({ value }))

    this.offset.addListener(values => this.updateOffset(values))
    this.dimension.addListener(dimension => this.updateGeometry({ dimension }))

    this.textureOffset.addListener(textureOffset => this.updateTexture({ textureOffset }))
    this.textureMirrored.addListener(textureMirrored => this.updateTexture({ textureMirrored }))

    this.visible.addListener(visible => this.cubeMesh.visible = visible)

    this.children.addListener((newChildren, oldChildren) => {
      oldChildren.forEach(child => this.cubeGroup.remove(child.cubeGroup))
      newChildren.forEach(child => {
        child.parent = this
        this.cubeGroup.add(child.cubeGroup)
      })
    })

    this.mouseHover.addListener(isHovering => {
      if (this.model.selectedCubeManager !== undefined && this.model.materials !== undefined && this.cubeMesh !== undefined) {
        if (isHovering) {
          this.model.selectedCubeManager.onMouseOverMesh(this.cubeMesh)
        } else {
          this.model.selectedCubeManager.onMouseOffMesh(this.cubeMesh)
        }
        this.updateMaterials({ hovering: isHovering })
      }
    })

    this.selected.addListener(isSelected => {
      if (this.model.selectedCubeManager !== undefined && this.model.materials !== undefined && this.cubeMesh !== undefined) {
        if (isSelected) {
          this.model.selectedCubeManager.onCubeSelected(this)
        } else {
          this.model.selectedCubeManager.onCubeUnSelected(this)
        }
        this.updateMaterials({ selected: isSelected })
      }
    })

    this.cubeGroup = new Group();
    this.cubeGrowGroup = new Group()
    this.cubeMesh = new Mesh(new BoxBufferGeometry(), this.model.materials.normal)
    children.forEach(child => this.cubeGroup.add(child.cubeGroup))
    this.createGroup()
  }

  updateMaterials({ selected = this.selected.value, hovering = this.mouseHover.value }) {
    if (selected) {
      this.cubeMesh.material = this.model.materials.selected
    } else if (hovering) {
      this.cubeMesh.material = this.model.materials.highlight
    } else {
      this.cubeMesh.material = this.model.materials.normal
    }
  }

  pushNameToModel(name = this.name.value) {
    if (name !== this.name.value) {
      this.model.cubeMap.get(this.name.value)?.delete(this)
    }
    const set = this.model.cubeMap.get(name) ?? new Set()
    set.add(this)
    this.model.cubeMap.set(name, set)
  }

  createGroup() {
    this.setUserData()

    this.cubeMesh.position.set(0.5, 0.5, 0.5)
    this.cubeMesh.updateMatrix();
    this.cubeMesh.geometry.applyMatrix4(this.cubeMesh.matrix);
    this.cubeMesh.geometry.setAttribute("uv", this.uvBuffer)
    this.cubeMesh.position.set(0, 0, 0)

    this.cubeGrowGroup.add(this.cubeMesh)
    this.cubeGroup.add(this.cubeGrowGroup)

    this.cubeGroup.rotation.order = "ZYX"
    this.updateOffset()
    this.updateCubeGrowVisuals({})
    this.updatePositionVisuals()
    this.updateRotationVisuals()
  }

  setUserData() {
    this.cubeGroup.userData.cube = this
    this.cubeGrowGroup.userData.cube = this
    this.cubeMesh.userData.cube = this
    this.cubeMesh.userData.group = this.cubeGroup
  }

  removeUserData() {
    delete this.cubeGroup.userData.cube
    delete this.cubeGrowGroup.userData.cube
    delete this.cubeMesh.userData.cube
    delete this.cubeMesh.userData.group
  }

  getWorldPosition(xDelta, yDelta, zDelta, vector = new Vector3()) {
    let w = this.dimension[0] + this.cubeGrow[0] * 2 + 0.0001
    let h = this.dimension[1] + this.cubeGrow[1] * 2 + 0.0001
    let d = this.dimension[2] + this.cubeGrow[2] * 2 + 0.0001
    tempVector.set(xDelta * w / 16, yDelta * h / 16, zDelta * d / 16).applyQuaternion(this.cubeMesh.getWorldQuaternion(tempQuaterion))
    this.cubeMesh.getWorldPosition(vector).add(tempVector)
    return vector
  }

  addChild(child: DCMCube) {
    this.children.value = this.children.value.concat(child)
  }

  deleteChild(child: DCMCube) {
    this.children.value = this.children.value.filter(c => c !== child)
  }

  getChildren() {
    return this.children.value
  }

  cloneCube(model = this.model) {
    return new DCMCube(this.name.value.replace(/~\d+$/, ""), this.dimension.value, this.position.value, this.offset.value,
      this.rotation.value, this.textureOffset.value, this.textureMirrored.value, this.cubeGrow.value,
      this.children.value.map(c => c.cloneCube(model)), model)
  }

  updateMatrixWorld(force = true) {
    this.cubeGroup.updateMatrixWorld(force)
  }

  traverse(callback) {
    callback(this)
    this.children.value.forEach(c => c.traverse(callback))
  }

  getAllChildrenCubes(arr: DCMCube[] = [], includeSelf = false) {
    if (includeSelf) {
      arr.push(this)
    }
    this.children.value.forEach(c => {
      c.getAllChildrenCubes(arr)
      arr.push(c)
    })
    return arr
  }

  resetVisuals() {
    this.children.value.forEach(child => child.resetVisuals())

    this.updateCubeGrowVisuals({ shouldUpdateTexture: false })
    this.updatePositionVisuals()
    this.updateRotationVisuals()
  }

  updateGeometry({ dimension = this.dimension.value, cubeGrow = this.cubeGrow.value, shouldUpdateTexture = true } = {}) {
    let w = dimension[0] + cubeGrow[0] * 2
    let h = dimension[1] + cubeGrow[1] * 2
    let d = dimension[2] + cubeGrow[2] * 2

    if (w === 0) {
      w = 0.001
    }
    if (h === 0) {
      h = 0.001
    }
    if (d === 0) {
      d = 0.001
    }

    this.cubeMesh?.scale.set(w, h, d)
    if (shouldUpdateTexture) {
      this.updateTexture({ dimension })
    }
  }

  updatePositionVisuals(position = this.position.value) {
    this.cubeGroup.position.set(position[0], position[1], position[2])
  }

  updateRotationVisuals(rotation = this.rotation.value) {
    this.cubeGroup.rotation.set(rotation[0] * Math.PI / 180, rotation[1] * Math.PI / 180, rotation[2] * Math.PI / 180)
  }

  updateCubeGrowVisuals({ value = this.cubeGrow.value, shouldUpdateTexture = true }) {
    this.cubeGrowGroup.position.set(-value[0], -value[1], -value[2])
    this.updateGeometry({ cubeGrow: value, shouldUpdateTexture })
  }

  updateOffset(values = this.offset.value) {
    this.cubeMesh.position.set(values[0], values[1], values[2])
  }

  updateTexture({ textureOffset = this.textureOffset.value, dimension = this.dimension.value, texWidth = this.model.textureWidth.value, texHeight = this.model.textureHeight.value, textureMirrored = this.textureMirrored.value } = {}) {

    let tm = textureMirrored
    let to = textureOffset
    let tw = texWidth
    let th = texHeight

    let w = dimension[0]
    let h = dimension[1]
    let d = dimension[2]

    this._genereateFaceData(tm ? 1 : 0, tm, to, tw, th, d, d + h, -d, -h)
    this._genereateFaceData(tm ? 0 : 1, tm, to, tw, th, d + w + d, d + h, -d, -h)
    this._genereateFaceData(2, tm, to, tw, th, d, 0, w, d)
    this._genereateFaceData(3, tm, to, tw, th, d + w, d, w, -d)
    this._genereateFaceData(4, tm, to, tw, th, d + w + d + w, d + h, -w, -h)
    this._genereateFaceData(5, tm, to, tw, th, d + w, d + h, -w, -h)

    this.uvBuffer.needsUpdate = true
  }

  _genereateFaceData(face: number, tm: boolean, toff: readonly [number, number], tw: number, th: number, offU: number, offV: number, heightU: number, heightV: number) {

    let u = toff[0]
    let v = toff[1]

    if (tm) {
      offU += heightU
      heightU *= -1
    }

    const off = 0.001

    let uMin = (u + offU) / tw
    let vMin = (v + offV) / th
    let uMax = (u + offU + heightU) / tw
    let vMax = (v + offV + heightV) / th

    if (uMin < uMax) {
      uMin += off
      uMax -= off
    } else {
      uMin -= off
      uMax += off
    }

    if (vMin < vMax) {
      vMin += off
      vMax -= off
    } else {
      vMin -= off
      vMax += off
    }

    this.uvBuffer.set([
      uMax, vMax,
      uMin, vMax,
      uMax, vMin,
      uMin, vMin,
    ], face * 8)
  }
}


const material = new MeshLambertMaterial({
  color: 0x777777,
  // transparent: true,
  side: DoubleSide,
  alphaTest: 0.0001,
})

const exportMaterial = new MeshBasicMaterial({
  alphaTest: 0.0001
})
export class ProjectMaterials {
  readonly normal: MeshLambertMaterial
  readonly highlight: MeshLambertMaterial
  readonly selected: MeshLambertMaterial

  readonly export: MeshBasicMaterial

  constructor() {
    this.normal = material.clone()

    this.highlight = material.clone()
    this.highlight.emissive.setHex(0xFF0000)

    this.selected = material.clone()
    this.selected.emissive.setHex(0x000066)

    this.export = exportMaterial.clone()
  }
}