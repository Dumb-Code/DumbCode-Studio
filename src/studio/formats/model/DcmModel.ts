import { LO } from './../../util/ListenableObject';
import { Group, BoxBufferGeometry, BufferAttribute, Mesh, Vector3, Quaternion, Material } from "three";
import { v4 as uuidv4 } from "uuid"
import EventManager from "../../util/EventManager";
import { ProjectMaterials } from '../DcProject';
import SelectedCubeManager from '../../util/SelectedCubeManager';

const tempVector = new Vector3()
const tempQuaterion = new Quaternion()

interface EventTypes {
  "hierarchyChanged": null
  "textureSizeChanged": { width: number, height: number }
}

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

export class DCMModel extends EventManager<EventTypes> implements CubeParent {

  author: string

  texWidth: number
  texHeight: number

  maxCubeLevel: number

  cubeMap: Map<string, DCMCube>
  identifierCubeMap: Map<string, DCMCube>
  children = new LO<readonly DCMCube[]>([])

  modelCache: Group
  material?: Material

  materials?: ProjectMaterials
  selectedCubeManager?: SelectedCubeManager

  constructor() {
    super()
    this.author = "???"
    this.texWidth = 64
    this.texHeight = 64
    this.maxCubeLevel = 0

    this.cubeMap = new Map()
    this.identifierCubeMap = new Map()

    this.modelCache = new Group()

    this.children.addListener(arr => {
      if (this.material !== undefined) {
        this.onChildrenChange(arr)
      }
    })
  }

  setTextureSize(width: number, height: number) {
    this.texWidth = width
    this.texHeight = height
    this.dispatchEvent("textureSizeChanged", { width, height })
    this.traverseAll(cube => cube.updateTexture())
  }

  onCubeHierarchyChanged() {
    this.maxCubeLevel = 0
    this.cubeMap.clear()
    this.children.value.forEach(child => child.recalculateHierarchy(0, this))
    this.dispatchEvent("hierarchyChanged", null)
  }

  createModel(material: Material) {
    this.material = material
    this.onCubeHierarchyChanged()

    this.modelCache.clear()
    this.modelCache.scale.set(1 / 16, 1 / 16, 1 / 16)
    this.modelCache.position.set(0.5, 0, 0.5)

    this.children.value.forEach(child => this.modelCache.add(child.createGroup()))

    return this.modelCache
  }

  invalidateModelCache() {
    this.traverseAll(cube => cube.cubeGroup = undefined)
  }

  traverseAll(func: (cube: DCMCube) => void) {
    this.children.value.forEach(child => child.traverse(cube => func(cube)))
  }

  gatherAllCubes(arr: DCMCube[] = []) {
    this.traverseAll(c => arr.push(c))
    return arr
  }

  updateMatrixWorld(force = true) {
    this.modelCache.updateMatrixWorld(force)
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

  onChildrenChange(children: readonly DCMCube[]) {
    this.children.value.forEach(child => child.cubeGroup ? this.modelCache.remove(child.cubeGroup) : null)
    children.forEach(child => this.modelCache.add(child.createGroup()))
  }

  resetAnimations() {
    //todo: rename
    this.resetVisuals()
  }

  resetVisuals() {
    this.children.value.forEach(child => child.resetVisuals())
  }

  cloneModel() {
    let model = new DCMModel()

    model.author = this.author
    model.texWidth = this.texWidth
    model.texHeight = this.texHeight

    model.children.value = this.children.value.map(c => c.cloneCube(model))

    model.onCubeHierarchyChanged()

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

  readonly mouseState = new LO<"none" | "hover" | "selected">("none")

  model: DCMModel
  parent: CubeParent

  hierarchyLevel: number
  uvBuffer: BufferAttribute

  cubeGroup?: Group
  cubeGrowGroup?: Group
  cubeMesh?: Mesh

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
    this.identifier = uuidv4()
    this.name = new LO(name)
    this.dimension = new LO<readonly [number, number, number]>(dimension)
    this.position = new LO<readonly [number, number, number]>(rotationPoint)
    this.offset = new LO<readonly [number, number, number]>(offset)
    this.rotation = new LO<readonly [number, number, number]>(rotation)
    this.textureOffset = new LO<readonly [number, number]>(textureOffset)
    this.textureMirrored = new LO<boolean>(textureMirrored)
    this.cubeGrow = new LO<readonly [number, number, number]>(cubeGrow)
    this.children = new LO<readonly DCMCube[]>(children)
    this.model = model
    this.hierarchyLevel = 0

    this.parent = invalidParent

    let counter = 0
    while (model.cubeMap.has(this.name.value)) {
      this.name.value = name + "~" + counter
      counter += 1
    }
    model.cubeMap.set(this.name.value, this)
    model.identifierCubeMap.set(this.identifier, this)

    this.uvBuffer = new BufferAttribute(new Float32Array(new Array(6 * 4 * 2)), 2)


    this.position.addListener(values => this.updatePositionVisuals(values))
    this.rotation.addListener(values => this.updateRotationVisuals(values))
    this.cubeGrow.addListener(value => this.updateCubeGrowVisuals({ value }))

    this.offset.addListener(values => this.updateOffset(values))
    this.dimension.addListener(dimension => this.updateGeometry({ dimension }))
    
    this.textureOffset.addListener(textureOffset => this.updateTexture({ textureOffset }))
    this.textureMirrored.addListener(textureMirrored => this.updateTexture({ textureMirrored }))

    this.children.addListener(ar => this.onChildrenChange(ar))

    this.mouseState.addListener(v => {
      if (this.model.selectedCubeManager !== undefined && this.model.materials !== undefined && this.cubeMesh !== undefined) {
        switch (v) {
          case "hover":
            this.model.selectedCubeManager.onMouseOverMesh(this.cubeMesh)
            this.cubeMesh.material = this.model.materials.highlight
            break
          case "selected":
            this.model.selectedCubeManager.onCubeSelected(this)
            this.cubeMesh.material = this.model.materials.selected
            break
          case "none":
            this.model.selectedCubeManager.onMouseOffMesh(this.cubeMesh)
            this.model.selectedCubeManager.onCubeUnSelected(this)
            this.cubeMesh.material = this.model.materials.normal
            break
        }
      }
    })
  }


  createGroup() {
    if (this.cubeGroup !== undefined && this.cubeMesh !== undefined) {
      return this.cubeGroup
    }
    this.cubeGroup = new Group();
    this.cubeGroup.userData.cube = this

    this.cubeGrowGroup = new Group()
    this.cubeGrowGroup.userData.cube = this

    if (this.model.material === undefined) {
      throw new Error("Tried to create cube before model was initilized")
    }

    this.cubeMesh = new Mesh(new BoxBufferGeometry(), this.model.material)
    this.cubeMesh.userData.cube = this
    this.cubeMesh.userData.group = this.cubeGroup

    this.cubeMesh.position.set(0.5, 0.5, 0.5)
    this.cubeMesh.updateMatrix();
    this.cubeMesh.geometry.applyMatrix4(this.cubeMesh.matrix);
    this.cubeMesh.geometry.setAttribute("uv", this.uvBuffer)
    this.cubeMesh.position.set(0, 0, 0)

    this.cubeGrowGroup.add(this.cubeMesh)
    this.cubeGroup.add(this.cubeGrowGroup)

    this.cubeGroup.rotation.order = "ZYX"
    this.updateOffset()
    this.updateCubeGrowVisuals({ shouldUpdateTexture: false })
    this.updatePositionVisuals()
    this.updateRotationVisuals()

    this.onChildrenChange(this.children.value)

    return this.cubeGroup
  }

  getWorldPosition(xDelta, yDelta, zDelta, vector = new Vector3()) {
    if (this.cubeMesh === undefined) {
      throw new Error("Cube mesh was null")
    }
    let w = this.dimension[0] + this.cubeGrow[0] * 2 + 0.0001
    let h = this.dimension[1] + this.cubeGrow[1] * 2 + 0.0001
    let d = this.dimension[2] + this.cubeGrow[2] * 2 + 0.0001
    tempVector.set(xDelta * w / 16, yDelta * h / 16, zDelta * d / 16).applyQuaternion(this.cubeMesh.getWorldQuaternion(tempQuaterion))
    this.cubeMesh.getWorldPosition(vector).add(tempVector)
    return vector
  }

  recalculateHierarchy(hierarchyLevel: number, parent: CubeParent) {
    this.hierarchyLevel = hierarchyLevel
    this.parent = parent
    this.model.cubeMap.set(this.name.value, this)
    this.children.value.forEach(child => child.recalculateHierarchy(this.hierarchyLevel + 1, this))
    if (this.children.value.length === 0) {
      this.model.maxCubeLevel = Math.max(this.model.maxCubeLevel, this.hierarchyLevel)
    }
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
    this.cubeGroup?.updateMatrixWorld(force)
  }

  traverse(callback) {
    callback(this)
    this.children.value.forEach(c => c.traverse(callback))
  }

  onChildrenChange(children: readonly DCMCube[]) {
    this.children.value.forEach(child => child.cubeGroup ? this.cubeGroup?.remove(child.cubeGroup) : null)
    this.children.value = children;
    this.children.value.forEach(child => this.cubeGroup?.add(child.createGroup()))
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
    this.cubeGroup?.position.set(position[0], position[1], position[2])
  }

  updateRotationVisuals(rotation = this.rotation.value) {
    this.cubeGroup?.rotation.set(rotation[0] * Math.PI / 180, rotation[1] * Math.PI / 180, rotation[2] * Math.PI / 180)
  }

  updateCubeGrowVisuals({ value = this.cubeGrow.value, shouldUpdateTexture = true }) {
    this.cubeGrowGroup?.position.set(-value[0], -value[1], -value[2])
    this.updateGeometry({ cubeGrow: value, shouldUpdateTexture })
  }

  updateOffset(values = this.offset.value) {
    this.cubeMesh?.position.set(values[0], values[1], values[2])
  }

  updateTexture({ textureOffset = this.textureOffset.value, dimension = this.dimension.value, texWidth = this.model.texWidth, texHeight = this.model.texHeight, textureMirrored = this.textureMirrored.value } = {}) {

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