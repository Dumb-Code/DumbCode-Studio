import { BoxBufferGeometry, BufferAttribute, DoubleSide, Group, Mesh, MeshBasicMaterial, MeshLambertMaterial, Quaternion, Vector3 } from "three";
import { v4 as uuidv4 } from "uuid";
import UndoRedoHandler from "../../undoredo/UndoRedoHandler";
import LockedCubes from "../../util/LockedCubes";
import SelectedCubeManager from '../../util/SelectedCubeManager';
import DcProject from '../project/DcProject';
import { HistoryActionTypes, SectionHandle } from './../../undoredo/UndoRedoHandler';
import { LO, LOMap } from './../../util/ListenableObject';
import { setIntersectType } from './../../util/ObjectClickedHook';

const tempVector = new Vector3()
const tempQuaterion = new Quaternion()

export interface CubeParent {
  addChild(child: DCMCube): void
  deleteChild(child: DCMCube): void
  children: LO<readonly DCMCube[]>
  getChildren(): readonly DCMCube[]
  resetVisuals(): void
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
  },
  resetVisuals() {
    throw new Error("Invalid Call On Parent")
  }
}
Object.freeze(invalidParent)

type UndoRedoDataType = {
  section_name: "root_data",
  data: {
    author: string,
    metadata: Readonly<Record<string, string>>,
    textureWidth: number,
    textureHeight: number,
    root: readonly string[],
  }
} | {
  section_name: `cube_${string}`
  data: {
    identifier: string, //Unchaning
    metadata: Readonly<Record<string, string>>,
    name: string,
    dimension: readonly [number, number, number],
    position: readonly [number, number, number],
    offset: readonly [number, number, number],
    rotation: readonly [number, number, number],
    cubeGrow: readonly [number, number, number],
    textureOffset: readonly [number, number],
    textureMirrored: boolean,
    children: readonly string[],

    selected: boolean,
    hideChildren: boolean,

    visible: boolean,
    locked: boolean,
  }
}

export class DCMModel implements CubeParent {

  parentProject?: DcProject
  readonly undoRedoHandler = new UndoRedoHandler<UndoRedoDataType>(
    (s, d) => this.onAddSection(s, d),
    s => this.onRemoveSection(s),
    (s, p, v) => this.onModifySection(s, p, v),
  )
  readonly _section = this.undoRedoHandler.createNewSection("root_data")

  readonly author = new LO("???").applyToSection(this._section, "author")

  readonly textureWidth = new LO(64).applyToSection(this._section, "textureWidth")
  readonly textureHeight = new LO(64).applyToSection(this._section, "textureHeight")

  readonly cubeMap: Map<string, Set<DCMCube>> = new Map()
  readonly identifierCubeMap = new LOMap<string, DCMCube>()
  readonly children = new LO<readonly DCMCube[]>([]).applyMappedToSection(this._section, c => c.map(a => a.identifier) as readonly string[], s => this.identifListToCubes(s), "root")

  readonly needsSaving = new LO(false)

  readonly materials: ProjectMaterials

  readonly modelGroup: Group

  readonly selectedCubeManager = new SelectedCubeManager()
  readonly lockedCubes = new LockedCubes(this)

  readonly metadata: Readonly<Record<string, string>> = {}

  constructor() {
    this.materials = new ProjectMaterials()

    this._section.modifyFirst("metadata", this.metadata, () => { throw new Error("Tried to modify metadata") })

    this.children.addListener((newChildren, oldChildren) => {
      oldChildren.forEach(child => this.modelGroup.remove(child.cubeGroup))
      newChildren.forEach(child => {
        child.parent = this
        child.updateHirarchy(0)
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

  modifyMetadata(data: Record<string, string>) {
    Object.assign(this.metadata, data)
    this._section.modifyDirectly("metadata", this.metadata, true)
  }

  identifListToCubes(cubes: readonly string[]): readonly DCMCube[] {
    return cubes.map(c => this.identifierCubeMap.get(c)).map((c, i) => {
      if (!c) throw new Error("Cube Was not found. " + cubes[i])
      return c
    })
  }

  onAddSection<K extends UndoRedoDataType['section_name'], S extends UndoRedoDataType & { section_name: K }>(section: K, data: S['data']) {
    if (section === "root_data") {
      return
    }
    const {
      identifier, name, dimension, position,
      rotation, offset, cubeGrow, children,
      textureMirrored, textureOffset,
      selected, hideChildren, visible, locked
    } = data as (UndoRedoDataType & { section_name: `cube_${string}` })['data']
    const cube = new DCMCube(
      name, dimension, position, offset, rotation,
      textureOffset, textureMirrored, cubeGrow,
      this.identifListToCubes(children), this, identifier,
      selected, hideChildren, visible, locked)
    this.identifierCubeMap.set(identifier, cube)
  }

  onRemoveSection(section: string) {
    if (section === "root_data") {
      return
    }
    const identif = section.substring("cube_".length, section.length)
    const cube = this.identifierCubeMap.get(identif)
    if (!cube) {
      throw new Error("Tried to remove cube that could not be found " + identif);
    }
    cube.fullyDelete()
  }

  onModifySection(section_name: string, property_name: string, value: any) {
    if (section_name === "root_data") {
      this._section.applyModification(property_name, value)
    } else {
      const identif = section_name.substring("cube_".length, section_name.length)
      const cube = this.identifierCubeMap.get(identif)
      if (!cube) {
        throw new Error("Tried to modify a cube that could not be found " + identif);
      }
      cube._section.applyModification(property_name, value)
    }
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

  // cloneModel() {
  //   let model = new DCMModel()

  //   model.author.value = this.author.value
  //   model.textureWidth.value = this.textureWidth.value
  //   model.textureHeight.value = this.textureHeight.value

  //   model.children.value = this.children.value.map(c => c.cloneCube(model))

  //   return model
  // }
}

type CubeSectionType = SectionHandle<UndoRedoDataType, UndoRedoDataType & { section_name: `cube_${string}` }>
export class DCMCube implements CubeParent {
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
  readonly selected: LO<boolean>
  readonly hideChildren: LO<boolean>

  readonly visible: LO<boolean>
  readonly locked: LO<boolean>

  model: DCMModel
  parent: CubeParent

  readonly uvBuffer: BufferAttribute

  readonly cubeGroup: Group
  readonly cubeGrowGroup: Group
  readonly cubeMesh: Mesh

  //0 would be the root, 1 would be the child of the root, 2 would be the child of that ect.
  hierarchyLevel: number = -1

  readonly _section: CubeSectionType

  destroyed = false

  readonly metadata: Readonly<Record<string, string>> = {}

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
    model: DCMModel,
    readonly identifier = uuidv4(),
    selected = false,
    hideChildren = false,
    visible = true,
    locked = false
  ) {

    const onDirty = () => model.needsSaving.value = true

    //Typescript compiler throws errors when `as SectionType` isn't there, but vscode intellisense is fine with it.
    //It complains about the other section names not being assignable, meaning that `cube_${this.identifier}` is
    //Not extracting the correct section for some reason.
    this._section = model.undoRedoHandler.createNewSection(`cube_${this.identifier}`, "Cube Properties Edit") as CubeSectionType

    this._section.modifyFirst("identifier", this.identifier, () => { throw new Error("Tried to modify identifier") })
    this._section.modifyFirst("metadata", this.metadata, () => { throw new Error("Tried to modify metadata") })

    this.name = new LO(name, onDirty).applyToSection(this._section, "name", false, "Cube Name Changed")
    this.dimension = new LO(dimension, onDirty).applyToSection(this._section, "dimension", false, "Cube Dimensions Edit")
    this.position = new LO(rotationPoint, onDirty).applyToSection(this._section, "position", false, "Cube Position Edit")
    this.offset = new LO(offset, onDirty).applyToSection(this._section, "offset", false, "Cube Offset Edit")
    this.rotation = new LO(rotation, onDirty).applyToSection(this._section, "rotation", false, "Cube Rotation Edit")
    this.textureOffset = new LO(textureOffset, onDirty).applyToSection(this._section, "textureOffset", true)
    this.textureMirrored = new LO(textureMirrored, onDirty).applyToSection(this._section, "textureMirrored", true)
    this.cubeGrow = new LO(cubeGrow, onDirty).applyToSection(this._section, "cubeGrow", false, "Cube Grow Edit")
    this.children = new LO(children, onDirty).applyMappedToSection(this._section, c => c.map(a => a.identifier) as readonly string[], s => this.model.identifListToCubes(s), "children", false, "Cube Children Edit")
    this.model = model

    this.selected = new LO(selected).applyToSection(this._section, "selected", false, value => value ? "Cube Selected" : "Cube Deselected")
    this.hideChildren = new LO(hideChildren).applyToSection(this._section, "hideChildren", true)
    this.visible = new LO(visible).applyToSection(this._section, "visible", false, value => value ? "Cube Shown" : "Cube Visible", HistoryActionTypes.ToggleVisibility)
    this.locked = new LO(locked).applyToSection(this._section, "locked", false, value => value ? "Cube Locked" : "Cube Unlocked", HistoryActionTypes.LockUnlock)

    this._section.pushCreation("Cube Created")

    this.parent = invalidParent


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

    this.mouseHover.addListener(isHovering => {
      if (this.model.materials !== undefined && this.cubeMesh !== undefined) {
        if (isHovering) {
          this.model.selectedCubeManager.onMouseOverMesh(this.cubeMesh)
        } else {
          this.model.selectedCubeManager.onMouseOffMesh(this.cubeMesh)
        }
        this.updateMaterials({ hovering: isHovering })
      }
    })

    this.selected.addListener(isSelected => {
      if (this.model.materials !== undefined && this.cubeMesh !== undefined) {
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
    setIntersectType(this.cubeMesh, "cube")
    children.forEach(child => this.cubeGroup.add(child.cubeGroup))
    this.createGroup()

    this.children.addAndRunListener((newChildren, oldChildren) => {
      oldChildren.forEach(child => this.cubeGroup.remove(child.cubeGroup))
      newChildren.forEach(child => {
        child.parent = this
        child.updateHirarchy(this.hierarchyLevel + 1)
        this.cubeGroup.add(child.cubeGroup)
      })
    })

  }

  modifyMetadata(data: Record<string, string>) {
    Object.assign(this.metadata, data)
    this._section.modifyDirectly("metadata", this.metadata, true)
  }

  updateHirarchy(level: number) {
    if (this.hierarchyLevel !== level) {
      this.hierarchyLevel = level
      this.children.value.forEach(c => c.updateHirarchy(level + 1))
    }
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

  fullyDelete() {
    this.parent.deleteChild(this)
    this.cubeGroup.remove()
    this._section.remove("Cube Deleted")
    this.model.identifierCubeMap.delete(this.identifier)
    this.model.cubeMap.get(this.name.value)?.delete(this)
    this.destroyed = true
    //TODO: dispose of geometries?
  }

  getWorldPosition(xDelta: number, yDelta: number, zDelta: number, vector = new Vector3()) {
    const dims = this.dimension.value
    const cg = this.cubeGrow.value
    let w = dims[0] + cg[0] * 2 + 0.0001
    let h = dims[1] + cg[1] * 2 + 0.0001
    let d = dims[2] + cg[2] * 2 + 0.0001
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
    const cube: DCMCube = new DCMCube(this.name.value.replace(/~\d+$/, ""), this.dimension.value, this.position.value, this.offset.value,
      this.rotation.value, this.textureOffset.value, this.textureMirrored.value, this.cubeGrow.value,
      this.children.value.map(c => c.cloneCube(model)), model)
    Object.assign(cube.metadata, this.metadata)
    return cube
  }

  updateMatrixWorld(force = true) {
    this.cubeGroup.updateMatrixWorld(force)
  }

  traverse(callback: (cube: DCMCube) => void) {
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