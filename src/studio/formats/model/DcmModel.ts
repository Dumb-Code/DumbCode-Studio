import { BoxBufferGeometry, BufferAttribute, DoubleSide, Group, Matrix4, Matrix4Tuple, Mesh, MeshBasicMaterial, MeshStandardMaterial, Quaternion, Vector3 } from "three";
import { v4 as uuidv4 } from "uuid";
import { readFromClipboard, writeToClipboard } from "../../clipboard/Clipboard";
import { writeCubesForClipboard } from "../../clipboard/CubeClipboardType";
import CubeLocker, { LockerType } from "../../util/CubeLocker";
import LockedCubes from "../../util/LockedCubes";
import { NumArray } from "../../util/NumArray";
import SelectedCubeManager from "../../util/SelectedCubeManager";
import DcProject from '../project/DcProject';
import { readCubesForClipboard } from './../../clipboard/CubeClipboardType';
import UndoRedoHandler, { HistoryActionTypes, SectionHandle } from './../../undoredo/UndoRedoHandler';
import { LO, LOMap } from './../../util/ListenableObject';
import { setIntersectType } from './../../util/ObjectClickedHook';
import { ModelTextureCoordinates } from './ModelTextureCoordinates';

const tempVector = new Vector3()
const tempQuaterion = new Quaternion()
const tempMatrix = new Matrix4()

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
    root: readonly string[],
  }
} | {
  section_name: `cube_${string}`
  data: {
    identifier: string, //Unchanging
    metadata: Readonly<Record<string, string>>,
    name: string,
    dimension: NumArray,
    position: NumArray,
    offset: NumArray,
    rotation: NumArray,
    cubeGrow: NumArray,
    children: readonly string[],

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

  readonly cubeMap: Map<string, Set<DCMCube>> = new Map()
  readonly identifierCubeMap = new LOMap<string, DCMCube>()
  readonly children = new LO<readonly DCMCube[]>([]).applyMappedToSection(this._section, c => c.map(a => a.identifier) as readonly string[], s => this.identifListToCubes(s), "root")

  pastedInWorld: boolean | null = null

  readonly needsSaving = new LO(false)

  readonly materials: ProjectMaterials

  readonly modelGroup: Group

  readonly lockedCubes = new LockedCubes(this)
  readonly selectedCubeManager = new SelectedCubeManager(this)

  readonly metadata: Readonly<Record<string, string>> = {}

  readonly textureCoordinates = new ModelTextureCoordinates(this)

  constructor() {
    this.materials = new ProjectMaterials()

    this._section.modifyFirst("metadata", this.metadata, () => { throw new Error("Tried to modify metadata") })

    this.needsSaving.addPreModifyListener((newValue, oldValue, naughtyModifyValue) => naughtyModifyValue(oldValue || (newValue && !this.undoRedoHandler.ignoreActions)))

    this.children.addListener((newChildren, oldChildren) => {
      oldChildren.forEach(child => this.modelGroup.remove(child.cubeGroup))
      newChildren.forEach(child => {
        child.parent = this
        child.updateHirarchy(0)
        this.modelGroup.add(child.cubeGroup)
      })
    })

    const refreshTextures = () => this.traverseAll(cube => cube.updateTexture())
    this.textureWidth.addPostListener(refreshTextures)
    this.textureHeight.addPostListener(refreshTextures)

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

  get textureWidth() {
    return this.textureCoordinates.textureWidth
  }

  get textureHeight() {
    return this.textureCoordinates.textureHeight
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

  onAddSection<K extends UndoRedoDataType['section_name']>(section: K, data: any) {
    if (section === "root_data") {
      return
    }
    const {
      identifier, name, dimension, position,
      rotation, offset, cubeGrow, children,
      hideChildren, visible, locked
    } = data as (UndoRedoDataType & { section_name: `cube_${string}` })['data']

    const coords = this.textureCoordinates.getCoordinates(identifier)
    const cube = new DCMCube(
      name, dimension, position, offset, rotation,
      coords.coords.value, coords.mirrored.value, cubeGrow,
      this.identifListToCubes(children), this, identifier,
      true, hideChildren, visible, locked)
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
      cube._section?.applyModification(property_name, value)
    }
  }

  copyCubes(copyAllChildren: boolean) {
    const selected = this.selectedCubeManager.selected.value
    if (selected.length !== 0) {
      writeToClipboard("cube", writeCubesForClipboard(this, this.identifListToCubes(selected), copyAllChildren))
    }
  }

  pasteCubes(worldPosition: boolean) {
    const cubes = readFromClipboard("cube")
    if (cubes !== null) {
      this.children.dontUpdateSection = true
      this.children.value = this.children.value.concat(readCubesForClipboard(this, cubes))
      this.children.dontUpdateSection = false
      this.pastedInWorld = worldPosition
    }
  }

  startPaste() {
    this.children.dontUpdateSection = true
    this.children.value = this.children.value.filter(cube => {
      if (cube.hasBeenPastedNeedsPlacement) {
        return false
      }
      return true
    })
    this.children.dontUpdateSection = false
  }

  finishPaste(): boolean {
    this.resetVisuals()

    let pasted = false
    this.traverseAll(cube => {
      if (cube.pastedWorldMatrix !== undefined) {
        pasted = true
        if (this.pastedInWorld && cube.cubeGroup.parent !== null) {
          CubeLocker.reconstructLocker(cube, LockerType.POSITION_ROTATION, tempMatrix.fromArray(cube.pastedWorldMatrix))
        }
        cube.hasBeenPastedNeedsPlacement = false
        cube.pastedWorldMatrix = undefined
        cube.cubeMesh.visible = cube.visible.value
      }
    })

    this.pastedInWorld = null


    return pasted
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
  readonly dimension: LO<NumArray>
  readonly position: LO<NumArray>
  readonly offset: LO<NumArray>
  readonly rotation: LO<NumArray>
  readonly cubeGrow: LO<NumArray>
  readonly children: LO<readonly DCMCube[]>

  readonly mouseHover = new LO(false)
  readonly selected: LO<boolean>
  readonly hideChildren: LO<boolean>

  readonly visible: LO<boolean>
  readonly locked: LO<boolean>

  readonly model: DCMModel
  parent: CubeParent

  readonly uvBuffer: BufferAttribute

  readonly cubeGroup: Group
  readonly cubeGrowGroup: Group
  readonly cubeMesh: Mesh

  //0 would be the root, 1 would be the child of the root, 2 would be the child of that ect.
  hierarchyLevel: number = -1

  pastedWorldMatrix?: Readonly<Matrix4Tuple>
  hasBeenPastedNeedsPlacement = false
  readonly needsDraggingStart = new LO(false)

  _section?: CubeSectionType

  destroyed = false

  readonly metadata: Readonly<Record<string, string>> = {}

  constructor(
    name: string,
    dimension: NumArray,
    rotationPoint: NumArray,
    offset: NumArray,
    rotation: NumArray,
    textureOffset: NumArray<2>,
    textureMirrored: boolean,
    cubeGrow: NumArray,
    children: readonly DCMCube[],
    model: DCMModel,
    readonly identifier = uuidv4(),
    applyToSectionNow = true,
    hideChildren = false,
    visible = true,
    locked = false
  ) {

    const onDirty = () => model.needsSaving.value = true


    this.name = new LO(name, onDirty)
    this.dimension = new LO(dimension, onDirty)
    this.position = new LO(rotationPoint, onDirty)
    this.offset = new LO(offset, onDirty)
    this.rotation = new LO(rotation, onDirty)
    this.cubeGrow = new LO(cubeGrow, onDirty)
    this.children = new LO(children, onDirty)
    this.model = model

    this.selected = LO.createOneWayDelegateListener(model.selectedCubeManager.selected, selected => selected.includes(this.identifier))//.applyToSection(this._section, "selected", false, value => value ? "Cube Selected" : "Cube Deselected")
    this.hideChildren = new LO(hideChildren, onDirty)
    this.visible = new LO(visible, onDirty)
    this.locked = new LO(locked, onDirty)

    this.model.textureCoordinates.setCoordinates(this.identifier, textureOffset, textureMirrored)

    if (applyToSectionNow) {
      this.applyToSection()
    }

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
      if (this.model.materials !== undefined && this.cubeMesh !== undefined && this.model.parentProject !== undefined) {
        if (isHovering) {
          this.model.parentProject.selectedCubeManager.onMouseOverMesh(this.cubeMesh)
        } else {
          this.model.parentProject.selectedCubeManager.onMouseOffMesh(this.cubeMesh)
        }
        this.updateMaterials({ hovering: isHovering })
      }
    })

    this.selected.addListener(isSelected => {
      if (this.model.materials !== undefined && this.cubeMesh !== undefined && this.model.parentProject !== undefined) {
        if (isSelected) {
          this.model.parentProject.selectedCubeManager.onCubeSelected(this)
        } else {
          this.model.parentProject.selectedCubeManager.onCubeUnSelected(this)
        }
        this.updateMaterials({ selected: isSelected })
      }
    })

    this.cubeGroup = new Group();
    this.cubeGrowGroup = new Group()
    this.cubeMesh = new Mesh(new BoxBufferGeometry(), this.model.materials.normal)
    this.cubeMesh.castShadow = true
    this.cubeMesh.receiveShadow = true
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

  get textureMirrored() {
    return this.model.textureCoordinates.getCoordinates(this.identifier).mirrored
  }

  get textureOffset() {
    return this.model.textureCoordinates.getCoordinates(this.identifier).coords
  }

  applyToSection() {
    //Typescript compiler throws errors when `as SectionType` isn't there, but vscode intellisense is fine with it.
    //It complains about the other section names not being assignable, meaning that `cube_${this.identifier}` is
    //Not extracting the correct section for some reason.
    this._section = this.model.undoRedoHandler.createNewSection(`cube_${this.identifier}`, "Cube Properties Edit") as CubeSectionType

    this._section.modifyFirst("identifier", this.identifier, () => { throw new Error("Tried to modify identifier") })
    this._section.modifyFirst("metadata", this.metadata, () => { throw new Error("Tried to modify metadata") })

    this.name.applyToSection(this._section, "name", false, "Cube Name Changed")
    this.dimension.applyToSection(this._section, "dimension", false, "Cube Dimensions Edit")
    this.position.applyToSection(this._section, "position", false, "Cube Position Edit")
    this.offset.applyToSection(this._section, "offset", false, "Cube Offset Edit")
    this.rotation.applyToSection(this._section, "rotation", false, "Cube Rotation Edit")
    this.cubeGrow.applyToSection(this._section, "cubeGrow", false, "Cube Grow Edit")
    this.children.applyMappedToSection(this._section, c => c.map(a => a.identifier) as readonly string[], s => this.model.identifListToCubes(s), "children", false, "Cube Children Edit")

    this.hideChildren.applyToSection(this._section, "hideChildren", true)
    this.visible.applyToSection(this._section, "visible", false, value => value ? "Cube Shown" : "Cube Visible", HistoryActionTypes.ToggleVisibility)
    this.locked.applyToSection(this._section, "locked", false, value => value ? "Cube Locked" : "Cube Unlocked", HistoryActionTypes.LockUnlock)

    this._section.pushCreation("Cube Created")

  }

  modifyMetadata(data: Record<string, string>) {
    Object.assign(this.metadata, data)
    this._section?.modifyDirectly("metadata", this.metadata, true)
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
    this._section?.remove("Cube Deleted")
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

  _genereateFaceData(face: number, tm: boolean, toff: NumArray<2>, tw: number, th: number, offU: number, offV: number, heightU: number, heightV: number) {

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


const material = new MeshStandardMaterial({
  color: 0x777777,
  transparent: true,
  side: DoubleSide,
  alphaTest: 0.0001,
})

const exportMaterial = new MeshBasicMaterial({
  alphaTest: 0.0001
})
export class ProjectMaterials {
  readonly normal: MeshStandardMaterial
  readonly highlight: MeshStandardMaterial
  readonly selected: MeshStandardMaterial

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