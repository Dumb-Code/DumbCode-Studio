import { Group, BoxBufferGeometry, BufferAttribute, Mesh, Vector3, Quaternion, EventDispatcher, Material } from "three";
import { v4 as uuidv4 } from "uuid"

const tempVector = new Vector3()
const tempQuaterion = new Quaternion()

const hierarchyChangedEvent = { type: "hierarchyChanged" }
const textureSizeChangedEvent = { type: "textureSizeChanged", width: 64, height: 64 }


export interface CubeParent {
  addChild(child: DCMCube, silent?: boolean): void
  deleteChild(child: DCMCube, silent?: boolean): void
  getChildren(): DCMCube[]
  children: DCMCube[]
  onChildrenChange(children?: DCMCube[], silent?: boolean): void
}

const invalidParent: CubeParent = {
  addChild() {
    throw new Error("Invalid Call On Parent")
  },
  deleteChild() {
    throw new Error("Invalid Call On Parent")
  },
  getChildren() {
    throw new Error("Invalid Call On Parent")
  },
  children: [],
  onChildrenChange() {
    throw new Error("Invalid Call On Parent")
  }
}
Object.freeze(invalidParent)

export class DCMModel extends EventDispatcher implements CubeParent {

  author: string

  texWidth: number
  texHeight: number

  maxCubeLevel: number

  cubeMap: Map<string, DCMCube>
  identifierCubeMap: Map<string, DCMCube>
  children: DCMCube[]

  modelCache: Group
  material?: Material

  constructor() {
    super()
    this.author = "???"
    this.texWidth = 64
    this.texHeight = 64
    this.maxCubeLevel = 0

    this.cubeMap = new Map()
    this.identifierCubeMap = new Map()
    this.children = []

    this.modelCache = new Group()
  }

  setTextureSize(width: number, height: number) {
    this.texWidth = textureSizeChangedEvent.width = width
    this.texHeight = textureSizeChangedEvent.height = height
    this.dispatchEvent(textureSizeChangedEvent)
    this.traverseAll(cube => cube.updateTexture())
  }

  onCubeHierarchyChanged() {
    this.maxCubeLevel = 0
    this.cubeMap.clear()
    this.children.forEach(child => child.recalculateHierarchy(0, this))
    this.dispatchEvent(hierarchyChangedEvent)
  }

  createModel(material: Material) {
    this.material = material
    this.onCubeHierarchyChanged()

    this.modelCache.clear()
    this.modelCache.scale.set(1 / 16, 1 / 16, 1 / 16)
    this.modelCache.position.set(0.5, 0, 0.5)

    this.children.forEach(child => this.modelCache.add(child.createGroup()))

    return this.modelCache
  }

  invalidateModelCache() {
    this.traverseAll(cube => cube.cubeGroup = undefined)
  }

  traverseAll(func: (cube: DCMCube) => void) {
    this.children.forEach(child => child.traverse(cube => func(cube)))
  }

  gatherAllCubes(arr: DCMCube[] = []) {
    this.traverseAll(c => arr.push(c))
    return arr
  }

  updateMatrixWorld(force = true) {
    this.modelCache.updateMatrixWorld(force)
  }

  addChild(child: DCMCube, silent = false) {
    this.onChildrenChange(this.children.concat(child), silent)
  }

  deleteChild(child: DCMCube, silent = false) {
    this.onChildrenChange(this.children.filter(c => c !== child), silent)
  }

  getChildren() {
    return this.children
  }

  onChildrenChange(childern = this.children, silent = false) {
    this.children.forEach(child => child.cubeGroup ? this.modelCache.remove(child.cubeGroup) : null)
    this.children = childern;
    this.children.forEach(child => this.modelCache.add(child.createGroup()))
    if (!silent) {
      this.onCubeHierarchyChanged()
    }
  }

  resetAnimations() {
    //todo: rename
    this.resetVisuals()
  }

  resetVisuals() {
    this.children.forEach(child => child.resetVisuals())
  }

  cloneModel() {
    let model = new DCMModel()

    model.author = this.author
    model.texWidth = this.texWidth
    model.texHeight = this.texHeight

    model.children = this.children.map(c => c.cloneCube(model))

    model.onCubeHierarchyChanged()

    return model
  }
}

export class DCMCube implements CubeParent {
  identifier: string
  name: string
  dimension: [number, number, number]
  rotationPoint: [number, number, number]
  offset: [number, number, number]
  rotation: [number, number, number]
  textureOffset: [number, number]
  textureMirrored: boolean
  cubeGrow: [number, number, number]
  children: DCMCube[]

  model: DCMModel
  parent: CubeParent
  
  hierarchyLevel: number
  uvBuffer: BufferAttribute

  cubeGroup?: Group
  cubeGrowGroup?: Group
  cubeMesh?: Mesh

  constructor(
    name: string,
    dimension: [number, number, number],
    rotationPoint: [number, number, number],
    offset: [number, number, number],
    rotation: [number, number, number],
    textureOffset: [number, number],
    textureMirrored: boolean,
    cubeGrow: [number, number, number],
    children: DCMCube[],
    model: DCMModel) {
    this.identifier = uuidv4()
    this.name = name
    this.dimension = dimension
    this.rotationPoint = rotationPoint
    this.offset = offset
    this.rotation = rotation
    this.textureOffset = textureOffset
    this.textureMirrored = textureMirrored
    this.cubeGrow = cubeGrow
    this.children = children
    this.model = model
    this.hierarchyLevel = 0

    this.parent = invalidParent

    let counter = 0
    while (model.cubeMap.has(this.name)) {
      this.name = name + "~" + counter
      counter += 1
    }
    model.cubeMap.set(this.name, this)
    model.identifierCubeMap.set(this.identifier, this)

    this.uvBuffer = new BufferAttribute(new Float32Array(new Array(6 * 4 * 2)), 2)

  }


  createGroup() {
    if (this.cubeGroup !== undefined && this.cubeMesh !== undefined) {
      return this.cubeGroup
    }
    this.cubeGroup = new Group();
    this.cubeGroup.userData.cube = this

    this.cubeGrowGroup = new Group()
    this.cubeGrowGroup.userData.cube = this

    if(this.model.material === undefined) {
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
    this.updatePosition()
    this.updateRotation()
    this.updateOffset()
    this.updateCubeGrow()

    this.onChildrenChange(this.children, true)

    return this.cubeGroup
  }

  getWorldPosition(xDelta, yDelta, zDelta, vector = new Vector3()) {
    if(this.cubeMesh === undefined) {
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
    this.model.cubeMap.set(this.name, this)
    this.children.forEach(child => child.recalculateHierarchy(this.hierarchyLevel + 1, this))
    if (this.children.length === 0) {
      this.model.maxCubeLevel = Math.max(this.model.maxCubeLevel, this.hierarchyLevel)
    }
  }

  addChild(child: DCMCube, silent = false) {
    this.onChildrenChange(this.children.concat(child), silent)
  }

  deleteChild(child: DCMCube, silent = false) {
    this.onChildrenChange(this.children.filter(c => c !== child), silent)
  }

  getChildren() {
    return this.children
  }

  cloneCube(model = this.model) {
    return new DCMCube(this.name.replace(/~\d+$/, ""), this.dimension, this.rotationPoint, this.offset,
      this.rotation, this.textureOffset, this.textureMirrored, this.cubeGrow,
      this.children.map(c => c.cloneCube(model)), model)
  }

  updateMatrixWorld(force = true) {
    this.cubeGroup?.updateMatrixWorld(force)
  }

  traverse(callback) {
    callback(this)
    this.children.forEach(c => c.traverse(callback))
  }

  onChildrenChange(children = this.children, silent = false) {
    this.children.forEach(child => child.cubeGroup ? this.cubeGroup?.remove(child.cubeGroup) : null)
    this.children = children;
    this.children.forEach(child => this.cubeGroup?.add(child.createGroup()))
    if (!silent) {
      this.model.onCubeHierarchyChanged()
    }
  }

  getAllChildrenCubes(arr: DCMCube[] = [], includeSelf = false) {
    if (includeSelf) {
      arr.push(this)
    }
    this.children.forEach(c => {
      c.getAllChildrenCubes(arr)
      arr.push(c)
    })
    return arr
  }

  resetVisuals() {
    this.children.forEach(child => child.resetVisuals())

    this.updateGeometry({ shouldUpdateTexture: false })
    this.updateCubeGrow()
    this.updatePositionVisuals()
    this.updateRotationVisuals()
  }

  updateGeometry({ dimension = this.dimension, cubeGrow = this.cubeGrow, shouldUpdateTexture = true } = {}) {
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

  updatePositionVisuals(position = this.rotationPoint) {
    this.cubeGroup?.position.set(position[0], position[1], position[2])
  }

  updateRotationVisuals(rotation = this.rotation) {
    this.cubeGroup?.rotation.set(rotation[0] * Math.PI / 180, rotation[1] * Math.PI / 180, rotation[2] * Math.PI / 180)
  }

  updateCubeGrowVisuals(value = this.cubeGrow) {
    this.cubeGrowGroup?.position.set(-value[0], -value[1], -value[2])
    this.updateGeometry({ cubeGrow: value })
  }

  updateTexture({ textureOffset = this.textureOffset, dimension = this.dimension, texWidth = this.model.texWidth, texHeight = this.model.texHeight, textureMirrored = this.textureMirrored } = {}) {

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

  updateCubeName(value = this.name) {
    this.name = value;
  }

  updateDimension(values = this.dimension, visualOnly = false) {
    if (visualOnly !== true) {
      this.dimension = [Math.round(values[0]), Math.round(values[1]), Math.round(values[2])]
    }
    this.updateGeometry({ dimension: values })
  }

  updateCubeGrow(value = this.cubeGrow, visualOnly = false) {
    if (visualOnly !== true) {
      this.cubeGrow = value
    }
    this.updateCubeGrowVisuals(value)
  }

  updateTextureOffset(values = this.textureOffset, visualOnly = false) {
    if (visualOnly !== true) {
      this.textureOffset = [Math.round(values[0]), Math.round(values[1])]
    }
    this.updateTexture({ textureOffset: values })
  }

  updateTextureMirrored(value = this.textureMirrored, visualOnly = false) {
    if (visualOnly !== true) {
      this.textureMirrored = value
    }
    this.updateTexture({ textureMirrored: value })
  }

  updateOffset(values = this.offset, visualOnly = false) {
    if (visualOnly !== true) {
      this.offset = values
    }
    this.cubeMesh?.position.set(values[0], values[1], values[2])
  }

  updatePosition(values = this.rotationPoint, visualOnly = false) {
    if (visualOnly !== true) {
      this.rotationPoint = values
    }
    this.updatePositionVisuals(values)
  }

  updateRotation(values = this.rotation, visualOnly = false) {
    if (visualOnly !== true) {
      this.rotation = values
    }
    this.updateRotationVisuals(values)
  }

  _genereateFaceData(face, tm, toff, tw, th, offU, offV, heightU, heightV) {

    let u = toff[0]
    let v = toff[1]

    if (tm) {
      offU += heightU
      heightU *= -1
    }

    let uMin = (u + offU) / tw
    let vMin = (v + offV) / th
    let uMax = (u + offU + heightU) / tw
    let vMax = (v + offV + heightV) / th

    this.uvBuffer.set([
      uMax, vMax,
      uMin, vMax,
      uMax, vMin,
      uMin, vMin,
    ], face * 8)
  }
}