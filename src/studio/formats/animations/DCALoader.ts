import JSZip from "jszip";
import { v4 } from "uuid";
import { StudioBuffer } from "../../util/StudioBuffer";
import { convertMapToRecord, convertRecordToMap } from "../../util/Utils";
import { getZippedFile, OutputByType, ParseError } from "../model/DCMLoader";
import DcProject from "../project/DcProject";
import { NumArray } from './../../util/NumArray';
import DcaAnimation, { DcaKeyframe, ProgressionPoint } from "./DcaAnimation";
import { loadDCAAnimationOLD } from "./OldDcaLoader";

export const loadUnknownAnimation = async (project: DcProject, name: string, buffer: ArrayBuffer) => {
  try {
    return await loadDCAAnimation(project, name, buffer)
  } catch (e) {
    if (e instanceof ParseError) {
      console.warn(e)
      return await loadDCAAnimationOLD(project, name, new StudioBuffer(buffer))
    } else {
      throw e
    }
  }
}

export const loadToMap = (data: ParsedKfMap) => {
  const map = new Map<string, NumArray>()
  Object.keys(data).forEach(key => {
    map.set(key, data[key])
  })
  return map
}

export const writeFromMap = (map: Map<string, NumArray>): ParsedKfMap => {
  return Array.from(map.entries()).reduce((map, data) => {
    map[data[0]] = data[1]
    return map
  }, {} as ParsedKfMap)
}

const readKeyframe = (animation: DcaAnimation, kfData: ParsedKeyframeType): DcaKeyframe => {
  const kf = new DcaKeyframe(
    animation.project, animation, v4(), kfData.layerId, kfData.start, kfData.duration, false, kfData.progressionPoints,
    loadToMap(kfData.rotation), loadToMap(kfData.position), loadToMap(kfData.cubeGrow)
  )
  return kf
}

const loadDCAAnimation = async (project: DcProject, name: string, buffer: ArrayBuffer) => {
  const animation = new DcaAnimation(project, name)

  animation.undoRedoHandler.ignoreActions = true

  const data = await getZippedFile<ParsedAnimationType>(buffer, "dca_animation")

  animation.name.value = data.name

  animation.keyframes.value = data.keyframes.map(kf => readKeyframe(animation, kf))

  animation.keyframeData.exits.value = data.loopData.exists
  animation.keyframeData.start.value = data.loopData.start
  animation.keyframeData.end.value = data.loopData.end
  animation.keyframeData.duration.value = data.loopData.duration

  convertRecordToMap(data.cubeNameOverrides ?? {}, animation.keyframeNameOverrides)

  animation.isSkeleton.value = data.isSkeleton ?? false

  animation.undoRedoHandler.ignoreActions = false

  return animation
}

const writeKeyframe = (kf: DcaKeyframe): ParsedKeyframeType => ({
  start: kf.startTime.value,
  duration: kf.duration.value,
  layerId: kf.layerId.value,

  position: writeFromMap(kf.position),
  rotation: writeFromMap(kf.rotation),
  cubeGrow: writeFromMap(kf.cubeGrow),

  progressionPoints: kf.progressionPoints.value,
})

export const writeDCAAnimation = async (animation: DcaAnimation) => writeDCAAnimationWithFormat(animation, "blob")

export const writeDCAAnimationWithFormat = async <T extends keyof OutputByType>(animation: DcaAnimation, format: T): Promise<OutputByType[T]> => {
  const data: ParsedAnimationType = {
    version: 1,
    name: animation.name.value,
    keyframes: animation.keyframes.value.map(kf => writeKeyframe(kf)),
    loopData: {
      exists: animation.keyframeData.exits.value,
      start: animation.keyframeData.start.value,
      end: animation.keyframeData.end.value,
      duration: animation.keyframeData.duration.value,
    },
    cubeNameOverrides: convertMapToRecord(animation.keyframeNameOverrides),
    isSkeleton: animation.isSkeleton.value,
  }

  const stringData = JSON.stringify(data)

  const zip = new JSZip()
  zip.file("dca_animation", stringData)
  const blob = await zip.generateAsync({ type: format })
  return blob
}

type ParsedAnimationType = {
  version: number,
  name: string,
  keyframes: ParsedKeyframeType[]
  loopData: ParsedLoopdataType,
  cubeNameOverrides?: Record<string, string>
  isSkeleton?: boolean
}

export type ParsedKfMap = Record<string, NumArray>
type ParsedKeyframeType = {
  layerId: number,
  start: number,
  duration: number

  progressionPoints: readonly ProgressionPoint[]

  rotation: ParsedKfMap
  position: ParsedKfMap
  cubeGrow: ParsedKfMap
}

type ParsedLoopdataType = {
  exists: boolean,
  start: number,
  end: number,
  duration: number
}