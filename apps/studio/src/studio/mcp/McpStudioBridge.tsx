import { useEffect, useMemo, useRef } from "react"
import { StudioTabs } from "../StudioTabs"
import { useStudio, type StudioContext } from "../../contexts/StudioContext"
import { loadUnknownAnimation, writeDCAAnimationWithFormat } from "../formats/animations/DCALoader"
import DcaAnimation, { DcaKeyframe, KeyframeLayerData, type ProgressionPoint } from "../formats/animations/DcaAnimation"
import { DCMCube } from "../formats/model/DcmModel"
import { writeModelWithFormat } from "../formats/model/DCMLoader"
import { createProject, newProject, removeFileExtension } from "../formats/project/DcProject"
import { writeDcProj } from "../formats/project/DcProjectLoader"
import { paintCubeFacesOntoRasterTexture } from "../formats/textures/TextureManager"
import { createReadableFile } from "../files/FileTypes"
import { MCP_ACTION_DESCRIPTIONS, MCP_ACTION_SCHEMA, MCP_ACTIONS, type McpActionName, type McpArgs, type McpCommandResult, type McpQueuedCommand, type Vec2, type Vec3 } from "./types"
import { PAINT_FACE_DEFINITIONS, resolvePaintFaceToken } from "./paintFaceAliases"
import CubeLocker from "../util/CubeLocker"

const POLL_INTERVAL_MS = 250
const MAX_COMMANDS_PER_POLL = 1
const CLIENT_ID_KEY = "dumbcode-studio:mcp-client-id"
const CLIENT_SECRET_KEY = "dumbcode-studio:mcp-client-secret"

type JsonObject = Record<string, unknown>
type ActionContext = { studio: StudioContext }

const isObject = (value: unknown): value is JsonObject => typeof value === "object" && value !== null && !Array.isArray(value)
const hasKey = (object: JsonObject, key: string) => Object.prototype.hasOwnProperty.call(object, key)

function asString(value: unknown, name: string): string
function asString(value: unknown, name: string, optional: true): string | undefined
function asString(value: unknown, name: string, optional = false) {
  if (value === undefined || value === null) {
    if (optional) return undefined
    throw new Error(`${name} is required`)
  }
  if (typeof value !== "string") throw new Error(`${name} must be a string`)
  return value
}

function asNumber(value: unknown, name: string): number
function asNumber(value: unknown, name: string, optional: true): number | undefined
function asNumber(value: unknown, name: string, optional = false) {
  if (value === undefined || value === null) {
    if (optional) return undefined
    throw new Error(`${name} is required`)
  }
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${name} must be a finite number`)
  return value
}

function asBoolean(value: unknown, name: string): boolean
function asBoolean(value: unknown, name: string, optional: true): boolean | undefined
function asBoolean(value: unknown, name: string, optional = false) {
  if (value === undefined || value === null) {
    if (optional) return undefined
    throw new Error(`${name} is required`)
  }
  if (typeof value !== "boolean") throw new Error(`${name} must be a boolean`)
  return value
}

function asArray(value: unknown, name: string): unknown[]
function asArray(value: unknown, name: string, optional: true): unknown[] | undefined
function asArray(value: unknown, name: string, optional = false) {
  if (value === undefined || value === null) {
    if (optional) return undefined
    throw new Error(`${name} is required`)
  }
  if (!Array.isArray(value)) throw new Error(`${name} must be an array`)
  return value
}

function asVec3(value: unknown, name: string): Vec3
function asVec3(value: unknown, name: string, optional: true): Vec3 | undefined
function asVec3(value: unknown, name: string, optional = false): Vec3 | undefined {
  if (value === undefined || value === null) {
    if (optional) return undefined
    throw new Error(`${name} is required`)
  }
  const array = asArray(value, name)
  if (array.length !== 3 || !array.every(item => typeof item === "number" && Number.isFinite(item))) {
    throw new Error(`${name} must be a [number, number, number] tuple`)
  }
  return [array[0] as number, array[1] as number, array[2] as number]
}

function asVec2(value: unknown, name: string): Vec2
function asVec2(value: unknown, name: string, optional: true): Vec2 | undefined
function asVec2(value: unknown, name: string, optional = false): Vec2 | undefined {
  if (value === undefined || value === null) {
    if (optional) return undefined
    throw new Error(`${name} is required`)
  }
  const array = asArray(value, name)
  if (array.length !== 2 || !array.every(item => typeof item === "number" && Number.isFinite(item))) {
    throw new Error(`${name} must be a [number, number] tuple`)
  }
  return [array[0] as number, array[1] as number]
}

const asMetadata = (value: unknown, name = "metadata") => {
  if (!isObject(value)) throw new Error(`${name} must be an object`)
  const metadata: Record<string, string> = {}
  Object.entries(value).forEach(([key, entry]) => {
    if (typeof entry !== "string") throw new Error(`${name}.${key} must be a string`)
    metadata[key] = entry
  })
  return metadata
}

const asProgressionPoints = (value: unknown, name = "progressionPoints") => {
  const array = asArray(value, name)
  return array.map((entry, index) => {
    if (!isObject(entry)) throw new Error(`${name}[${index}] must be an object`)
    const x = asNumber(entry.x, `${name}[${index}].x`)
    const y = asNumber(entry.y, `${name}[${index}].y`)
    const required = asBoolean(entry.required, `${name}[${index}].required`, true)
    return required === undefined ? { x, y } : { x, y, required }
  }) as readonly ProgressionPoint[]
}

const asTransformMap = (value: unknown, name: string): Map<string, Vec3> => {
  if (!isObject(value)) throw new Error(`${name} must be an object keyed by cube name`)
  const result = new Map<string, Vec3>()
  Object.entries(value).forEach(([key, entry]) => {
    const vec = asVec3(entry, `${name}.${key}`)
    result.set(key, vec)
  })
  return result
}

const randomId = () => typeof crypto !== "undefined" && "randomUUID" in crypto
  ? crypto.randomUUID()
  : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

const getClientCredentials = () => {
  let id = window.sessionStorage.getItem(CLIENT_ID_KEY)
  if (!id) {
    id = randomId()
    window.sessionStorage.setItem(CLIENT_ID_KEY, id)
  }
  let secret = window.sessionStorage.getItem(CLIENT_SECRET_KEY)
  if (!secret) {
    secret = randomId()
    window.sessionStorage.setItem(CLIENT_SECRET_KEY, secret)
  }
  return { clientId: id, secret }
}

const cubePath = (cube: DCMCube) => {
  const parts: string[] = [cube.name.value]
  let parent = cube.parent
  while (parent instanceof DCMCube) {
    parts.unshift(parent.name.value)
    parent = parent.parent
  }
  return parts.join("/")
}

const serializeCube = (cube: DCMCube): JsonObject => ({
  identifier: cube.identifier,
  id: cube.identifier,
  name: cube.name.value,
  path: cubePath(cube),
  parent: cube.parent instanceof DCMCube ? cube.parent.identifier : null,
  dimension: cube.dimension.value,
  position: cube.position.value,
  offset: cube.offset.value,
  rotation: cube.rotation.value,
  cubeGrow: cube.cubeGrow.value,
  textureOffset: cube.textureOffset.value,
  textureMirrored: cube.textureMirrored.value,
  hideChildren: cube.hideChildren.value,
  visible: cube.visible.value,
  locked: cube.locked.value,
  metadata: cube.metadata,
  hierarchyLevel: cube.hierarchyLevel,
  children: cube.children.value.map(serializeCube),
})

const serializeCubeFlat = (cube: DCMCube): JsonObject => {
  const data = serializeCube(cube)
  delete data.children
  return data
}

const serializeKeyframe = (keyframe: DcaKeyframe): JsonObject => ({
  identifier: keyframe.identifier,
  id: keyframe.identifier,
  layerId: keyframe.layerId.value,
  startTime: keyframe.startTime.value,
  duration: keyframe.duration.value,
  selected: keyframe.selected.value,
  progressionPoints: keyframe.progressionPoints.value,
  position: Object.fromEntries(keyframe.position.entries()),
  rotation: Object.fromEntries(keyframe.rotation.entries()),
  cubeGrow: Object.fromEntries(keyframe.cubeGrow.entries()),
})

const serializeLayer = (layer: KeyframeLayerData): JsonObject => ({
  layerId: layer.layerId,
  id: layer.layerId,
  name: layer.name.value,
  visible: layer.visible.value,
  locked: layer.locked.value,
  definedMode: layer.definedMode.value,
})

const serializeAnimation = (animation: DcaAnimation): JsonObject => ({
  identifier: animation.identifier,
  id: animation.identifier,
  name: animation.name.value,
  isSkeleton: animation.isSkeleton.value,
  nameOverridesOnly: animation.nameOverridesOnly.value,
  selected: animation.project.animationTabs.selectedAnimation.value === animation,
  time: animation.time.value,
  maxTime: animation.maxTime.value,
  playing: animation.playing.value,
  ikAnchorCubes: animation.ikAnchorCubes.value,
  ikDirection: animation.ikDirection.value,
  loopData: {
    exists: animation.keyframeData.exits.value,
    start: animation.keyframeData.start.value,
    end: animation.keyframeData.end.value,
    duration: animation.keyframeData.duration.value,
  },
  keyframes: animation.keyframes.value.map(serializeKeyframe),
  layers: animation.keyframeLayers.value.map(serializeLayer),
})

const serializeProject = (project: ReturnType<StudioContext["getSelectedProject"]>, selected = false): JsonObject => ({
  identifier: project.identifier,
  id: project.identifier,
  name: project.name.value,
  selected,
  projectSaveType: project.projectSaveType.value,
  projectNeedsSaving: project.projectNeedsSaving.value,
  modelNeedsSaving: project.model.needsSaving.value,
  textureWidth: project.model.textureWidth.value,
  textureHeight: project.model.textureHeight.value,
  author: project.model.author.value,
  metadata: project.model.metadata,
  selectedCubes: project.selectedCubeManager.selected.value,
  rootCubes: project.model.children.value.map(serializeCube),
  animations: project.animationTabs.animations.value.map(serializeAnimation),
  selectedAnimation: project.animationTabs.selectedAnimation.value?.identifier ?? null,
})

const resolveProject = (studio: StudioContext, selector?: unknown) => {
  if (selector === undefined || selector === null || selector === "") {
    return studio.getSelectedProject()
  }
  if (typeof selector === "number") {
    const byIndex = studio.projects[selector]
    if (!byIndex) throw new Error(`No project exists at index ${selector}`)
    return byIndex
  }
  const text = String(selector)
  const byId = studio.projects.find(project => project.identifier === text || project.name.value === text)
  if (!byId) throw new Error(`Unable to find project '${text}'`)
  return byId
}

const resolveCube = (project: ReturnType<StudioContext["getSelectedProject"]>, selector: unknown): DCMCube => {
  if (selector instanceof DCMCube) return selector
  if (typeof selector !== "string") throw new Error("cube selector must be a string")
  const byIdentifier = project.model.identifierCubeMap.get(selector)
  if (byIdentifier) return byIdentifier

  const matchesByName = project.model.cubeMap.get(selector)
  if (matchesByName?.length === 1) return matchesByName[0]
  if (matchesByName && matchesByName.length > 1) throw new Error(`Cube name '${selector}' is ambiguous; use identifier or path`)

  const matchesByPath = project.model.gatherAllCubes().filter(cube => cubePath(cube) === selector)
  if (matchesByPath.length === 1) return matchesByPath[0]
  if (matchesByPath.length > 1) throw new Error(`Cube path '${selector}' is ambiguous; use identifier`)

  throw new Error(`Unable to find cube '${selector}'`)
}

const resolveOptionalParent = (project: ReturnType<StudioContext["getSelectedProject"]>, selector: unknown) => {
  if (selector === undefined || selector === null || selector === "") return project.model
  return resolveCube(project, selector)
}

const isDescendantOf = (cube: DCMCube, possibleAncestor: DCMCube) => {
  let parent = cube.parent
  while (parent instanceof DCMCube) {
    if (parent === possibleAncestor) return true
    parent = parent.parent
  }
  return false
}

const assertValidParent = (cube: DCMCube, parent: DCMCube | ReturnType<StudioContext["getSelectedProject"]>["model"]) => {
  if (!(parent instanceof DCMCube)) return
  if (parent === cube || isDescendantOf(parent, cube)) {
    throw new Error("Cannot parent a cube to itself or one of its descendants")
  }
}

const collectSubtreePostorder = (cube: DCMCube): DCMCube[] => [
  ...cube.children.value.flatMap(collectSubtreePostorder),
  cube,
]

const resolveAnimation = (project: ReturnType<StudioContext["getSelectedProject"]>, selector?: unknown): DcaAnimation => {
  if (selector === undefined || selector === null || selector === "") {
    const selected = project.animationTabs.selectedAnimation.value
    if (selected) return selected
    throw new Error("No animation is selected")
  }
  if (typeof selector === "number") {
    const byIndex = project.animationTabs.animations.value[selector]
    if (!byIndex) throw new Error(`No animation exists at index ${selector}`)
    return byIndex
  }
  const text = String(selector)
  const found = project.animationTabs.animations.value.find(animation => animation.identifier === text || animation.name.value === text)
  if (!found) throw new Error(`Unable to find animation '${text}'`)
  return found
}

const resolveKeyframe = (animation: DcaAnimation, selector: unknown): DcaKeyframe => {
  if (selector instanceof DcaKeyframe) return selector
  if (typeof selector === "number") {
    const byIndex = animation.keyframes.value[selector]
    if (!byIndex) throw new Error(`No keyframe exists at index ${selector}`)
    return byIndex
  }
  const text = asString(selector, "keyframe")
  const found = animation.keyframes.value.find(keyframe => keyframe.identifier === text)
  if (!found) throw new Error(`Unable to find keyframe '${text}'`)
  return found
}

const getUnusedCubeName = (project: ReturnType<StudioContext["getSelectedProject"]>, requested?: string) => {
  const base = requested?.trim() || "newcube"
  if (!project.model.cubeMap.has(base)) return base
  let index = 0
  let candidate = base
  while (project.model.cubeMap.has(candidate)) {
    candidate = `${base}${index++}`
  }
  return candidate
}

type CubeParentTarget = DCMCube | ReturnType<StudioContext["getSelectedProject"]>["model"]

type CubeCreateInput = {
  name: string
  dimension: Vec3
  position: Vec3
  offset: Vec3
  rotation: Vec3
  textureOffset: Vec2
  textureMirrored: boolean
  cubeGrow: Vec3
  hideChildren: boolean
  visible: boolean
  locked: boolean
  metadata?: Record<string, string>
}

type CubeUpdateInput = {
  name?: string
  dimension?: Vec3
  position?: Vec3
  offset?: Vec3
  rotation?: Vec3
  cubeGrow?: Vec3
  textureOffset?: Vec2
  textureMirrored?: boolean
  visible?: boolean
  locked?: boolean
  hideChildren?: boolean
  metadata?: Record<string, string>
  parent?: CubeParentTarget
  hasParent: boolean
}

const parseCubeCreateInput = (project: ReturnType<StudioContext["getSelectedProject"]>, args: JsonObject): CubeCreateInput => ({
  name: getUnusedCubeName(project, asString(args.name, "name", true)),
  dimension: asVec3(args.dimension, "dimension", true) ?? [1, 1, 1],
  position: asVec3(args.position, "position", true) ?? [0, 0, 0],
  offset: asVec3(args.offset, "offset", true) ?? [0, 0, 0],
  rotation: asVec3(args.rotation, "rotation", true) ?? [0, 0, 0],
  textureOffset: asVec2(args.textureOffset, "textureOffset", true) ?? [0, 0],
  textureMirrored: asBoolean(args.textureMirrored, "textureMirrored", true) ?? false,
  cubeGrow: asVec3(args.cubeGrow, "cubeGrow", true) ?? [0, 0, 0],
  hideChildren: asBoolean(args.hideChildren, "hideChildren", true) ?? false,
  visible: asBoolean(args.visible, "visible", true) ?? true,
  locked: asBoolean(args.locked, "locked", true) ?? false,
  metadata: args.metadata === undefined ? undefined : asMetadata(args.metadata),
})

const parseCubeUpdateInput = (project: ReturnType<StudioContext["getSelectedProject"]>, args: JsonObject): CubeUpdateInput => ({
  name: asString(args.name, "name", true),
  dimension: asVec3(args.dimension, "dimension", true),
  position: asVec3(args.position, "position", true),
  offset: asVec3(args.offset, "offset", true),
  rotation: asVec3(args.rotation, "rotation", true),
  cubeGrow: asVec3(args.cubeGrow, "cubeGrow", true),
  textureOffset: asVec2(args.textureOffset, "textureOffset", true),
  textureMirrored: asBoolean(args.textureMirrored, "textureMirrored", true),
  visible: asBoolean(args.visible, "visible", true),
  locked: asBoolean(args.locked, "locked", true),
  hideChildren: asBoolean(args.hideChildren, "hideChildren", true),
  metadata: args.metadata === undefined ? undefined : asMetadata(args.metadata),
  parent: hasKey(args, "parent") ? resolveOptionalParent(project, args.parent) : undefined,
  hasParent: hasKey(args, "parent"),
})

const createCubeFromInput = (project: ReturnType<StudioContext["getSelectedProject"]>, input: CubeCreateInput) => {
  const cube = new DCMCube(
    input.name,
    input.dimension,
    input.position,
    input.offset,
    input.rotation,
    input.textureOffset,
    input.textureMirrored,
    input.cubeGrow,
    [],
    project.model,
    undefined,
    true,
    input.hideChildren,
    input.visible,
    input.locked
  )
  if (input.metadata !== undefined) cube.modifyMetadata(input.metadata)
  return cube
}

const reparentCube = (project: ReturnType<StudioContext["getSelectedProject"]>, cube: DCMCube, parent: DCMCube | typeof project.model) => {
  assertValidParent(cube, parent)
  project.model.updateMatrixWorld(true)
  const locker = new CubeLocker(cube)
  cube.parent.deleteChild(cube)
  parent.addChild(cube)
  project.model.updateMatrixWorld(true)
  locker.reconstruct()
  return cube
}

const blobToBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onerror = () => reject(reader.error ?? new Error("Unable to read blob as base64"))
  reader.onload = () => {
    const result = reader.result
    if (typeof result !== "string") {
      reject(new Error("Unexpected FileReader result"))
      return
    }
    resolve(result.split(",", 2)[1] ?? "")
  }
  reader.readAsDataURL(blob)
})

const base64ToFile = (base64: string, filename: string, mimeType?: string) => {
  const binary = atob(base64.replace(/^data:[^,]+,/, ""))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new File([bytes], filename, { type: mimeType ?? "application/octet-stream" })
}

const updateCubeFields = (project: ReturnType<StudioContext["getSelectedProject"]>, cube: DCMCube, input: CubeUpdateInput) => {
  project.model.undoRedoHandler.startBatchActions()
  try {
    if (input.name !== undefined) cube.name.value = input.name
    if (input.dimension !== undefined) cube.dimension.value = input.dimension
    if (input.position !== undefined) cube.position.value = input.position
    if (input.offset !== undefined) cube.offset.value = input.offset
    if (input.rotation !== undefined) cube.rotation.value = input.rotation
    if (input.cubeGrow !== undefined) cube.cubeGrow.value = input.cubeGrow
    if (input.textureOffset !== undefined) cube.textureOffset.value = input.textureOffset
    if (input.textureMirrored !== undefined) cube.textureMirrored.value = input.textureMirrored
    if (input.visible !== undefined) cube.visible.value = input.visible
    if (input.locked !== undefined) cube.locked.value = input.locked
    if (input.hideChildren !== undefined) cube.hideChildren.value = input.hideChildren
    if (input.metadata !== undefined) cube.modifyMetadata(input.metadata)
    if (input.hasParent && input.parent !== undefined) {
      reparentCube(project, cube, input.parent)
    }
  } finally {
    project.model.undoRedoHandler.endBatchActions("MCP Cube Updated")
  }
}

const deleteCubeWithMode = (project: ReturnType<StudioContext["getSelectedProject"]>, cube: DCMCube, keepChildren: boolean) => {
  const cubesToDelete = keepChildren ? [cube] : collectSubtreePostorder(cube)
  const deletedIds = cubesToDelete.map(child => child.identifier)

  if (keepChildren) {
    project.model.updateMatrixWorld(true)
    const lockers = cube.children.value.map(child => new CubeLocker(child))
    cube.children.value.forEach(child => {
      child.parent.deleteChild(child)
      cube.parent.addChild(child)
    })
    project.model.updateMatrixWorld(true)
    lockers.forEach(locker => locker.reconstruct())
  }

  cubesToDelete.forEach(child => {
    child.selected.value = false
    child.mouseHover.value = false
  })
  cubesToDelete.forEach(child => {
    if (!child.destroyed) child.fullyDelete()
  })
  project.selectedCubeManager.selected.value = project.selectedCubeManager.selected.value.filter(id => !deletedIds.includes(id))
  return deletedIds
}

type LoopDataUpdate = {
  exists?: boolean
  start?: number
  end?: number
  duration?: number
}

type AnimationUpdateInput = {
  name?: string
  isSkeleton?: boolean
  nameOverridesOnly?: boolean
  time?: number
  playing?: boolean
  ikDirection?: "upwards" | "downwards"
  ikAnchorCubes?: string[]
  loopData?: LoopDataUpdate
}

const parseAnimationUpdates = (project: ReturnType<StudioContext["getSelectedProject"]>, args: JsonObject): AnimationUpdateInput => {
  const ikDirection = asString(args.ikDirection, "ikDirection", true)
  if (ikDirection !== undefined && ikDirection !== "upwards" && ikDirection !== "downwards") {
    throw new Error("ikDirection must be upwards or downwards")
  }
  let loopData: LoopDataUpdate | undefined
  if (args.loopData !== undefined) {
    if (!isObject(args.loopData)) throw new Error("loopData must be an object")
    loopData = {
      exists: asBoolean(args.loopData.exists, "loopData.exists", true),
      start: asNumber(args.loopData.start, "loopData.start", true),
      end: asNumber(args.loopData.end, "loopData.end", true),
      duration: asNumber(args.loopData.duration, "loopData.duration", true),
    }
  }
  return {
    name: asString(args.name, "name", true),
    isSkeleton: asBoolean(args.isSkeleton, "isSkeleton", true),
    nameOverridesOnly: asBoolean(args.nameOverridesOnly, "nameOverridesOnly", true),
    time: asNumber(args.time, "time", true),
    playing: asBoolean(args.playing, "playing", true),
    ikDirection,
    ikAnchorCubes: args.ikAnchorCubes === undefined ? undefined : asArray(args.ikAnchorCubes, "ikAnchorCubes").map(selector => resolveCube(project, selector).identifier),
    loopData,
  }
}

const applyAnimationUpdates = (animation: DcaAnimation, input: AnimationUpdateInput) => {
  animation.undoRedoHandler.startBatchActions()
  try {
    if (input.name !== undefined) animation.name.value = input.name
    if (input.isSkeleton !== undefined) animation.isSkeleton.value = input.isSkeleton
    if (input.nameOverridesOnly !== undefined) animation.nameOverridesOnly.value = input.nameOverridesOnly
    if (input.time !== undefined) animation.time.value = input.time
    if (input.playing !== undefined) animation.playing.value = input.playing
    if (input.ikDirection !== undefined) animation.ikDirection.value = input.ikDirection
    if (input.ikAnchorCubes !== undefined) animation.ikAnchorCubes.value = input.ikAnchorCubes
    if (input.loopData !== undefined) {
      if (input.loopData.exists !== undefined) animation.keyframeData.exits.value = input.loopData.exists
      if (input.loopData.start !== undefined) animation.keyframeData.start.value = input.loopData.start
      if (input.loopData.end !== undefined) animation.keyframeData.end.value = input.loopData.end
      if (input.loopData.duration !== undefined) animation.keyframeData.duration.value = input.loopData.duration
    }
  } finally {
    animation.undoRedoHandler.endBatchActions("MCP Animation Updated")
  }
}

type TransformUpdate = readonly [string, Vec3 | null]

const asTransformUpdates = (value: unknown, name: string): TransformUpdate[] => {
  if (!isObject(value)) throw new Error(`${name} must be an object keyed by cube name`)
  return Object.entries(value).map(([key, entry]) => [key, entry === null ? null : asVec3(entry, `${name}.${key}`)!])
}

const applyTransformUpdates = (map: Map<string, Vec3>, updates: readonly TransformUpdate[]) => {
  updates.forEach(([key, value]) => {
    if (value === null) {
      map.delete(key)
    } else {
      map.set(key, value)
    }
  })
}

type KeyframeUpdateInput = {
  layerId?: number
  startTime?: number
  duration?: number
  selected?: boolean
  progressionPoints?: readonly ProgressionPoint[]
  position?: TransformUpdate[]
  rotation?: TransformUpdate[]
  cubeGrow?: TransformUpdate[]
}

const parseKeyframeUpdates = (args: JsonObject): KeyframeUpdateInput => ({
  layerId: asNumber(args.layerId, "layerId", true),
  startTime: asNumber(args.startTime, "startTime", true),
  duration: asNumber(args.duration, "duration", true),
  selected: asBoolean(args.selected, "selected", true),
  progressionPoints: args.progressionPoints === undefined ? undefined : asProgressionPoints(args.progressionPoints),
  position: args.position === undefined ? undefined : asTransformUpdates(args.position, "position"),
  rotation: args.rotation === undefined ? undefined : asTransformUpdates(args.rotation, "rotation"),
  cubeGrow: args.cubeGrow === undefined ? undefined : asTransformUpdates(args.cubeGrow, "cubeGrow"),
})

const applyKeyframeUpdates = (keyframe: DcaKeyframe, input: KeyframeUpdateInput) => {
  keyframe.animation.undoRedoHandler.startBatchActions()
  try {
    if (input.layerId !== undefined) keyframe.layerId.value = input.layerId
    if (input.startTime !== undefined) keyframe.startTime.value = input.startTime
    if (input.duration !== undefined) keyframe.duration.value = input.duration
    if (input.selected !== undefined) keyframe.selected.value = input.selected
    if (input.progressionPoints !== undefined) keyframe.progressionPoints.value = input.progressionPoints
    if (input.position !== undefined) applyTransformUpdates(keyframe.position, input.position)
    if (input.rotation !== undefined) applyTransformUpdates(keyframe.rotation, input.rotation)
    if (input.cubeGrow !== undefined) applyTransformUpdates(keyframe.cubeGrow, input.cubeGrow)
  } finally {
    keyframe.animation.undoRedoHandler.endBatchActions("MCP Keyframe Updated")
  }
}

const commandLog = (history: readonly { type?: "command" | "error", message: string, times?: number }[]) =>
  history.slice(-50).map(entry => ({ type: entry.type ?? "log", message: entry.message, times: entry.times ?? 1 }))

const asRgbOrRgba255 = (value: unknown, name: string): [number, number, number, number] => {
  const arr = asArray(value, name)
  if (arr.length !== 3 && arr.length !== 4) {
    throw new Error(`${name} must be [r,g,b] or [r,g,b,a] with integer channel values 0-255`)
  }
  for (let i = 0; i < arr.length; i++) {
    const n = asNumber(arr[i], `${name}[${i}]`)
    if (!Number.isInteger(n) || n < 0 || n > 255) {
      throw new Error(`${name}[${i}] must be an integer from 0 to 255`)
    }
  }
  const r = asNumber(arr[0], `${name}[0]`)
  const g = asNumber(arr[1], `${name}[1]`)
  const b = asNumber(arr[2], `${name}[2]`)
  const a = arr.length === 4 ? asNumber(arr[3], `${name}[3]`) : 255
  return [r, g, b, a]
}

const parseFaceIndexesForPaint = (value: unknown): readonly number[] | undefined => {
  if (value === undefined || value === null || value === "all") {
    return undefined
  }
  if (typeof value === "string") {
    if (value.trim().toLowerCase() === "all") {
      return undefined
    }
    return [resolvePaintFaceToken(value, "faces")]
  }
  const arr = asArray(value, "faces")
  return arr.map((entry, i) => resolvePaintFaceToken(entry, `faces[${i}]`))
}

const resolvePaintTargetTexture = (project: ReturnType<StudioContext["getSelectedProject"]>, textureId: unknown) => {
  const id = textureId !== undefined && textureId !== null && String(textureId) !== "" ? String(textureId) : undefined
  if (id !== undefined) {
    return project.textureManager.findTexture(id)
  }
  const selectedIds = project.textureManager.selectedGroup.value.textures.value
  if (selectedIds.length > 0) {
    return project.textureManager.findTexture(selectedIds[0]!)
  }
  const defaultIds = project.textureManager.defaultGroup.textures.value
  if (defaultIds.length > 0) {
    return project.textureManager.findTexture(defaultIds[0]!)
  }
  throw new Error("No texture to paint: add a texture to the project or select a texture group that includes one.")
}

const runAction = async (action: McpActionName, args: McpArgs, { studio }: ActionContext): Promise<unknown> => {
  const input = args as JsonObject
  switch (action) {
    case "ping":
      return { ok: true, tab: studio.settingsOpen ? "Options" : studio.activeTab.name, projectCount: studio.projects.length }

    case "get_action_schema":
      return {
        actions: MCP_ACTIONS.map(name => ({ name, description: MCP_ACTION_DESCRIPTIONS[name], args: MCP_ACTION_SCHEMA[name], endpoint: `/api/mcp/action/${name}` })),
        paintCubeTextureFaceReference: PAINT_FACE_DEFINITIONS.map(def => ({
          index: def.index,
          threeAxis: def.threeAxis,
          minecraft: def.minecraft,
          aliases: [...def.aliases],
        })),
      }

    case "get_state": {
      const selectedProject = studio.hasProject ? studio.getSelectedProject() : null
      return {
        activeTab: studio.settingsOpen ? "Options" : studio.activeTab.name,
        projectCount: studio.projects.length,
        selectedProject: selectedProject?.identifier ?? null,
        projects: studio.projects.map(project => serializeProject(project, project === selectedProject)),
        commands: asBoolean(input.includeCommands, "includeCommands", true) ? {
          model: selectedProject?.commandRoot.commands.map(command => command.formatToString()) ?? [],
          animator: selectedProject?.animatorCommandRoot.commands.map(command => command.formatToString()) ?? [],
        } : undefined,
        history: asBoolean(input.includeHistory, "includeHistory", true) && selectedProject ? {
          model: selectedProject.model.undoRedoHandler.history.value.slice(-20).map(batch => ({ reason: batch.reason, time: batch.time, actionCount: batch.actions.length })),
          animation: selectedProject.animationTabs.selectedAnimation.value?.undoRedoHandler.history.value.slice(-20).map(batch => ({ reason: batch.reason, time: batch.time, actionCount: batch.actions.length })) ?? [],
        } : undefined,
      }
    }

    case "set_active_tab": {
      const tab = asString(input.tab, "tab")
      if (tab === "Options") {
        studio.setSettingsOpen(true)
        return { activeTab: "Options" }
      }
      const target = StudioTabs.find(entry => entry.name.toLowerCase() === tab.toLowerCase())
      if (!target) throw new Error(`Unknown Studio tab '${tab}'`)
      if (target !== StudioTabs[0] && !studio.hasProject) studio.getSelectedProject()
      studio.setSettingsOpen(false)
      studio.setActiveTab(target)
      return { activeTab: target.name }
    }

    case "new_project": {
      const name = asString(input.name, "name", true)
      const project = newProject()
      if (name !== undefined) project.name.value = name
      studio.addProject(project)
      return serializeProject(project, true)
    }

    case "list_projects":
      return { projects: studio.projects.map(project => ({ identifier: project.identifier, id: project.identifier, name: project.name.value, selected: studio.hasProject && studio.getSelectedProject() === project })) }

    case "select_project": {
      const project = resolveProject(studio, input.projectId ?? input.project)
      studio.selectProject(project)
      return serializeProject(project, true)
    }

    case "rename_project": {
      const project = resolveProject(studio, input.projectId ?? input.project)
      project.name.value = asString(input.name, "name")
      return serializeProject(project, studio.getSelectedProject() === project)
    }

    case "close_project": {
      const project = resolveProject(studio, input.projectId ?? input.project)
      studio.removeProject(project)
      return { closed: project.identifier, projects: studio.projects.filter(entry => entry !== project).map(entry => ({ id: entry.identifier, name: entry.name.value })) }
    }

    case "set_model_metadata": {
      const project = resolveProject(studio, input.projectId)
      const metadata = asMetadata(input.metadata)
      project.model.modifyMetadata(metadata)
      return { metadata: project.model.metadata }
    }

    case "set_texture_size": {
      const project = resolveProject(studio, input.projectId)
      const width = asNumber(input.width, "width")
      const height = asNumber(input.height, "height")
      project.model.textureWidth.value = width
      project.model.textureHeight.value = height
      return { width: project.model.textureWidth.value, height: project.model.textureHeight.value }
    }

    case "list_cubes": {
      const project = resolveProject(studio, input.projectId)
      const includeChildren = asBoolean(input.includeChildren, "includeChildren", true) ?? true
      return { cubes: includeChildren ? project.model.children.value.map(serializeCube) : project.model.gatherAllCubes().map(serializeCubeFlat) }
    }

    case "select_cubes": {
      const project = resolveProject(studio, input.projectId)
      const mode = asString(input.mode, "mode", true) ?? "replace"
      if (!["replace", "add", "remove"].includes(mode)) throw new Error("mode must be replace, add, or remove")
      const ids = asArray(input.cubes, "cubes").map(selector => resolveCube(project, selector).identifier)
      const current = project.selectedCubeManager.selected.value
      if (mode === "replace") project.selectedCubeManager.selected.value = ids
      if (mode === "add") project.selectedCubeManager.selected.value = Array.from(new Set([...current, ...ids]))
      if (mode === "remove") project.selectedCubeManager.selected.value = current.filter(id => !ids.includes(id))
      return { selectedCubes: project.selectedCubeManager.selected.value }
    }

    case "create_cube": {
      const project = resolveProject(studio, input.projectId)
      const cubeInput = parseCubeCreateInput(project, input)
      const parent = input.siblingOf !== undefined ? resolveCube(project, input.siblingOf).parent : resolveOptionalParent(project, input.parent)
      project.model.undoRedoHandler.startBatchActions()
      try {
        const cube = createCubeFromInput(project, cubeInput)
        parent.addChild(cube)
        project.selectedCubeManager.selected.value = [cube.identifier]
        return serializeCube(cube)
      } finally {
        project.model.undoRedoHandler.endBatchActions("MCP Cube Created")
      }
    }

    case "update_cube": {
      const project = resolveProject(studio, input.projectId)
      const cube = resolveCube(project, input.cube)
      const update = parseCubeUpdateInput(project, input)
      if (update.hasParent && update.parent !== undefined) assertValidParent(cube, update.parent)
      updateCubeFields(project, cube, update)
      return serializeCube(cube)
    }

    case "set_cube_shape": {
      const project = resolveProject(studio, input.projectId)
      const cube = resolveCube(project, input.cube)
      const hasDim = input.dimension !== undefined
      const hasGrow = input.cubeGrow !== undefined
      if (!hasDim && !hasGrow) {
        throw new Error("set_cube_shape requires at least one of dimension or cubeGrow")
      }
      const dimension = hasDim ? asVec3(input.dimension, "dimension") : undefined
      const cubeGrow = hasGrow ? asVec3(input.cubeGrow, "cubeGrow") : undefined
      project.model.undoRedoHandler.startBatchActions()
      try {
        if (dimension !== undefined) cube.dimension.value = dimension
        if (cubeGrow !== undefined) cube.cubeGrow.value = cubeGrow
      } finally {
        project.model.undoRedoHandler.endBatchActions("MCP Cube Shape Updated")
      }
      return serializeCube(cube)
    }

    case "paint_cube_texture": {
      const project = resolveProject(studio, input.projectId)
      const cube = resolveCube(project, input.cube)
      const rgba = asRgbOrRgba255(input.color, "color")
      const faceIndexes = parseFaceIndexesForPaint(input.faces)
      const texture = resolvePaintTargetTexture(project, input.textureId)
      const painted = await paintCubeFacesOntoRasterTexture(project.textureManager, texture, cube, rgba, faceIndexes)
      return {
        cube: cube.identifier,
        cubeName: cube.name.value,
        texture: texture.identifier,
        textureName: texture.name.value,
        facesPainted: painted.facesPainted,
        rects: painted.rects,
      }
    }

    case "delete_cube": {
      const project = resolveProject(studio, input.projectId)
      const cubeSelectors = input.cubes !== undefined ? asArray(input.cubes, "cubes") : [input.cube]
      const cubes = Array.from(new Set(cubeSelectors.map(selector => resolveCube(project, selector))))
      const keepChildren = asBoolean(input.keepChildren, "keepChildren", true) ?? false
      const roots = keepChildren ? cubes : cubes.filter(cube => !cubes.some(other => other !== cube && isDescendantOf(cube, other)))
      const deleted: string[] = []
      project.model.undoRedoHandler.startBatchActions()
      try {
        roots.forEach(cube => deleted.push(...deleteCubeWithMode(project, cube, keepChildren)))
      } finally {
        project.model.undoRedoHandler.endBatchActions("MCP Cube Deleted")
      }
      return { deleted, keepChildren }
    }

    case "reparent_cube": {
      const project = resolveProject(studio, input.projectId)
      const cube = resolveCube(project, input.cube)
      const parent = resolveOptionalParent(project, input.parent)
      project.model.undoRedoHandler.startBatchActions()
      try {
        reparentCube(project, cube, parent)
      } finally {
        project.model.undoRedoHandler.endBatchActions("MCP Cube Reparented")
      }
      return serializeCube(cube)
    }

    case "duplicate_cube": {
      const project = resolveProject(studio, input.projectId)
      const source = resolveCube(project, input.cube)
      const parent = resolveOptionalParent(project, input.parent)
      const name = asString(input.name, "name", true)
      project.model.undoRedoHandler.startBatchActions()
      try {
        const clone = source.cloneCube(project.model)
        if (name !== undefined) clone.name.value = getUnusedCubeName(project, name)
        parent.addChild(clone)
        project.selectedCubeManager.selected.value = [clone.identifier]
        return serializeCube(clone)
      } finally {
        project.model.undoRedoHandler.endBatchActions("MCP Cube Duplicated")
      }
    }

    case "run_model_command": {
      const project = resolveProject(studio, input.projectId)
      project.commandRoot.lastCommandErrorOutput.value = ""
      project.commandRoot.runCommand(asString(input.command, "command"), false)
      const error = project.commandRoot.lastCommandErrorOutput.value
      if (error) throw new Error(error)
      return { log: commandLog(project.commandRoot.logHistory.value) }
    }

    case "run_animator_command": {
      const project = resolveProject(studio, input.projectId)
      project.animatorCommandRoot.lastCommandErrorOutput.value = ""
      project.animatorCommandRoot.runCommand(asString(input.command, "command"), false)
      const error = project.animatorCommandRoot.lastCommandErrorOutput.value
      if (error) throw new Error(error)
      return { log: commandLog(project.animatorCommandRoot.logHistory.value) }
    }

    case "list_animations": {
      const project = resolveProject(studio, input.projectId)
      return { animations: project.animationTabs.animations.value.map(serializeAnimation) }
    }

    case "create_animation": {
      const project = resolveProject(studio, input.projectId)
      const name = asString(input.name, "name", true)
      const isSkeleton = asBoolean(input.isSkeleton, "isSkeleton", true)
      const shouldSelect = asBoolean(input.select, "select", true) !== false
      const animation = DcaAnimation.createNew(project)
      if (name !== undefined) animation.name.value = name
      if (isSkeleton !== undefined) animation.isSkeleton.value = isSkeleton
      project.animationTabs.addAnimation(animation)
      if (!shouldSelect) {
        project.animationTabs.selectedAnimation.value = null
      }
      return serializeAnimation(animation)
    }

    case "select_animation": {
      const project = resolveProject(studio, input.projectId)
      const animation = resolveAnimation(project, input.animation)
      project.animationTabs.selectedAnimation.value = animation
      return serializeAnimation(animation)
    }

    case "update_animation": {
      const project = resolveProject(studio, input.projectId)
      const animation = resolveAnimation(project, input.animation)
      applyAnimationUpdates(animation, parseAnimationUpdates(project, input))
      return serializeAnimation(animation)
    }

    case "delete_animation": {
      const project = resolveProject(studio, input.projectId)
      const animation = resolveAnimation(project, input.animation)
      project.animationTabs.animations.value = project.animationTabs.animations.value.filter(entry => entry !== animation)
      project.animationTabs.tabs.value = project.animationTabs.tabs.value.filter(id => id !== animation.identifier)
      if (project.animationTabs.selectedAnimation.value === animation) project.animationTabs.selectedAnimation.value = null
      return { deleted: animation.identifier }
    }

    case "list_keyframes": {
      const project = resolveProject(studio, input.projectId)
      const animation = resolveAnimation(project, input.animation)
      return { keyframes: animation.keyframes.value.map(serializeKeyframe) }
    }

    case "create_keyframe": {
      const project = resolveProject(studio, input.projectId)
      const animation = resolveAnimation(project, input.animation)
      const layerId = asNumber(input.layerId, "layerId", true) ?? 0
      const startTime = asNumber(input.startTime, "startTime", true)
      const duration = asNumber(input.duration, "duration", true)
      const selected = asBoolean(input.selected, "selected", true)
      const rotation = input.rotation !== undefined ? asTransformMap(input.rotation, "rotation") : undefined
      const position = input.position !== undefined ? asTransformMap(input.position, "position") : undefined
      const cubeGrow = input.cubeGrow !== undefined ? asTransformMap(input.cubeGrow, "cubeGrow") : undefined
      const progressionPoints = input.progressionPoints !== undefined ? asProgressionPoints(input.progressionPoints) : undefined
      const keyframe = animation.createKeyframe(
        layerId,
        undefined,
        startTime,
        duration,
        selected,
        rotation,
        position,
        cubeGrow,
        progressionPoints
      )
      return serializeKeyframe(keyframe)
    }

    case "update_keyframe": {
      const project = resolveProject(studio, input.projectId)
      const animation = resolveAnimation(project, input.animation)
      const keyframe = resolveKeyframe(animation, input.keyframe)
      applyKeyframeUpdates(keyframe, parseKeyframeUpdates(input))
      return serializeKeyframe(keyframe)
    }

    case "delete_keyframe": {
      const project = resolveProject(studio, input.projectId)
      const animation = resolveAnimation(project, input.animation)
      const keyframe = resolveKeyframe(animation, input.keyframe)
      keyframe.delete()
      return { deleted: keyframe.identifier }
    }

    case "set_keyframe_transform": {
      const project = resolveProject(studio, input.projectId)
      const animation = resolveAnimation(project, input.animation)
      const keyframe = resolveKeyframe(animation, input.keyframe)
      const cube = resolveCube(project, input.cube)
      const cubeKey = asBoolean(input.useCubeName, "useCubeName", true) === false ? cube.identifier : cube.name.value
      const hasPosition = hasKey(input, "position")
      const hasRotation = hasKey(input, "rotation")
      const hasCubeGrow = hasKey(input, "cubeGrow")
      const position = hasPosition ? input.position === null ? null : asVec3(input.position, "position") : undefined
      const rotation = hasRotation ? input.rotation === null ? null : asVec3(input.rotation, "rotation") : undefined
      const cubeGrow = hasCubeGrow ? input.cubeGrow === null ? null : asVec3(input.cubeGrow, "cubeGrow") : undefined
      keyframe.animation.undoRedoHandler.startBatchActions()
      try {
        if (hasPosition) position === null ? keyframe.position.delete(cubeKey) : keyframe.position.set(cubeKey, position!)
        if (hasRotation) rotation === null ? keyframe.rotation.delete(cubeKey) : keyframe.rotation.set(cubeKey, rotation!)
        if (hasCubeGrow) cubeGrow === null ? keyframe.cubeGrow.delete(cubeKey) : keyframe.cubeGrow.set(cubeKey, cubeGrow!)
      } finally {
        keyframe.animation.undoRedoHandler.endBatchActions("MCP Keyframe Transform Updated")
      }
      return serializeKeyframe(keyframe)
    }

    case "list_keyframe_layers": {
      const project = resolveProject(studio, input.projectId)
      const animation = resolveAnimation(project, input.animation)
      return { layers: animation.keyframeLayers.value.map(serializeLayer) }
    }

    case "create_keyframe_layer": {
      const project = resolveProject(studio, input.projectId)
      const animation = resolveAnimation(project, input.animation)
      const existingIds = animation.keyframeLayers.value.map(layer => layer.layerId)
      const layerId = asNumber(input.layerId, "layerId", true) ?? (existingIds.length === 0 ? 0 : Math.max(...existingIds) + 1)
      if (animation.keyframeLayers.value.some(layer => layer.layerId === layerId)) throw new Error(`Layer ${layerId} already exists`)
      const name = asString(input.name, "name", true) ?? `Layer ${layerId}`
      const visible = asBoolean(input.visible, "visible", true) ?? true
      const locked = asBoolean(input.locked, "locked", true) ?? false
      const definedMode = asBoolean(input.definedMode, "definedMode", true) ?? false
      const layer = new KeyframeLayerData(
        animation,
        layerId,
        name,
        visible,
        locked,
        definedMode
      )
      animation.keyframeLayers.value = animation.keyframeLayers.value.concat(layer)
      return serializeLayer(layer)
    }

    case "update_keyframe_layer": {
      const project = resolveProject(studio, input.projectId)
      const animation = resolveAnimation(project, input.animation)
      const layerId = asNumber(input.layerId, "layerId")
      const layer = animation.keyframeLayers.value.find(entry => entry.layerId === layerId)
      if (!layer) throw new Error(`Unable to find keyframe layer ${layerId}`)
      const name = asString(input.name, "name", true)
      const visible = asBoolean(input.visible, "visible", true)
      const locked = asBoolean(input.locked, "locked", true)
      const definedMode = asBoolean(input.definedMode, "definedMode", true)
      if (name !== undefined) layer.name.value = name
      if (visible !== undefined) layer.visible.value = visible
      if (locked !== undefined) layer.locked.value = locked
      if (definedMode !== undefined) layer.definedMode.value = definedMode
      return serializeLayer(layer)
    }

    case "delete_keyframe_layer": {
      const project = resolveProject(studio, input.projectId)
      const animation = resolveAnimation(project, input.animation)
      const layerId = asNumber(input.layerId, "layerId")
      animation.deleteKeyframesLayers([layerId])
      return { deletedLayerId: layerId }
    }

    case "set_temporary_parent": {
      const project = resolveProject(studio, input.projectId)
      const animation = resolveAnimation(project, input.animation)
      const cube = resolveCube(project, input.cube)
      if (input.parent === null || input.parent === undefined || input.parent === "") {
        animation.tempoaryParenting.delete(cube.identifier)
        return { cube: cube.identifier, parent: null }
      }
      const parent = resolveCube(project, input.parent)
      animation.tempoaryParenting.set(cube.identifier, parent.identifier)
      return { cube: cube.identifier, parent: parent.identifier }
    }

    case "export_asset": {
      const project = resolveProject(studio, input.projectId)
      const format = asString(input.format, "format")
      if (format === "dcproj") {
        const blob = await writeDcProj(project)
        return { filename: `${project.name.value}.dcproj`, mimeType: "application/zip", base64: await blobToBase64(blob) }
      }
      if (format === "dcm") {
        const blob = await writeModelWithFormat(project.model, "blob")
        return { filename: `${project.name.value}.dcm`, mimeType: "application/zip", base64: await blobToBase64(blob) }
      }
      if (format === "dca") {
        const animation = resolveAnimation(project, input.animation)
        const blob = await writeDCAAnimationWithFormat(animation, "blob")
        return { filename: `${animation.name.value}.dca`, mimeType: "application/zip", base64: await blobToBase64(blob) }
      }
      throw new Error("format must be dcproj, dcm, or dca")
    }

    case "import_asset": {
      const filename = asString(input.filename, "filename")
      const base64 = asString(input.base64, "base64")
      const mimeType = asString(input.mimeType, "mimeType", true)
      const file = base64ToFile(base64, filename, mimeType)
      if (filename.endsWith(".dca")) {
        const project = resolveProject(studio, input.projectId)
        const animation = await loadUnknownAnimation(project, removeFileExtension(filename), await file.arrayBuffer())
        project.animationTabs.addAnimation(animation)
        return serializeAnimation(animation)
      }
      const project = await createProject(createReadableFile(file))
      studio.addProject(project)
      if (asBoolean(input.select, "select", true) === false) {
        const selected = studio.projects.find(entry => entry !== project)
        if (selected) studio.selectProject(selected)
      }
      return serializeProject(project, studio.getSelectedProject() === project)
    }
  }
}

type ClientCredentials = ReturnType<typeof getClientCredentials>

const postResult = async (credentials: ClientCredentials, result: McpCommandResult) => {
  const response = await fetch("/api/mcp/client/result", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...credentials, result }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`MCP result post failed (${response.status}): ${text}`)
  }
}

const executeQueuedCommand = async (credentials: ClientCredentials, command: McpQueuedCommand, context: ActionContext) => {
  let commandResult: McpCommandResult
  try {
    const result = await runAction(command.action, command.args, context)
    commandResult = { requestId: command.id, ok: true, result }
  } catch (error) {
    commandResult = {
      requestId: command.id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }
  }

  try {
    await postResult(credentials, commandResult)
  } catch (error) {
    console.error("Unable to report MCP command result", error)
  }
}

const McpStudioBridge = () => {
  const studio = useStudio()
  const context = useMemo(() => ({ studio }), [studio])
  const contextRef = useRef(context)

  useEffect(() => {
    contextRef.current = context
  }, [context])

  useEffect(() => {
    if (typeof window === "undefined") return

    const credentials = getClientCredentials()
    let cancelled = false
    let inFlight = false

    const visibilityParams = () => {
      const params = new URLSearchParams({
        maxCommands: String(MAX_COMMANDS_PER_POLL),
        visible: String(document.visibilityState === "visible"),
        focused: String(document.hasFocus()),
      })
      return params.toString()
    }

    const poll = async () => {
      if (cancelled || inFlight) return
      inFlight = true
      try {
        const response = await fetch(`/api/mcp/client/poll?${visibilityParams()}`, {
          cache: "no-store",
          headers: {
            "X-DCS-MCP-Client-Id": credentials.clientId,
            "X-DCS-MCP-Client-Secret": credentials.secret,
          },
        })
        if (response.ok) {
          const body = await response.json() as { commands?: McpQueuedCommand[] }
          const commands = body.commands ?? []
          for (const command of commands) {
            await executeQueuedCommand(credentials, command, contextRef.current)
          }
        } else {
          const text = await response.text()
          console.warn(`Unable to poll MCP commands (${response.status}): ${text}`)
        }
      } catch (error) {
        if (!cancelled) console.warn("Unable to poll MCP commands", error)
      } finally {
        inFlight = false
      }
    }

    const pollSoon = () => void poll()
    void poll()
    const interval = window.setInterval(() => void poll(), POLL_INTERVAL_MS)
    window.addEventListener("focus", pollSoon)
    window.addEventListener("pageshow", pollSoon)
    document.addEventListener("visibilitychange", pollSoon)
    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.removeEventListener("focus", pollSoon)
      window.removeEventListener("pageshow", pollSoon)
      document.removeEventListener("visibilitychange", pollSoon)
    }
  }, [])

  return null
}

export default McpStudioBridge
