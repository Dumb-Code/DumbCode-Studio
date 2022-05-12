import JSZip from "jszip";
import { StudioBuffer } from "../../util/StudioBuffer";
import { convertMapToRecord, convertRecordToMap } from "../../util/Utils";
import { getZippedFile, ParseError } from "../model/DCMLoader";
import DcProject from "../project/DcProject";
import { LOMap } from './../../util/ListenableObject';
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

const loadToMap = (map: LOMap<string, readonly [number, number, number]>, data: ParsedKfMap) => {
  Object.keys(data).forEach(key => {
    map.setSilently(key, data[key])
  })
}

const writeFromMap = (map: LOMap<string, readonly [number, number, number]>): ParsedKfMap => {
  return Array.from(map.entries()).reduce((map, data) => {
    map[data[0]] = data[1]
    return map
  }, {} as ParsedKfMap)
}

const loadDCAAnimation = async (project: DcProject, name: string, buffer: ArrayBuffer) => {
  const animation = new DcaAnimation(project, name)

  const data = await getZippedFile<ParsedAnimationType>(buffer, "dca_animation")

  animation.name.value = data.name

  const mapKeyframe = (kfData: ParsedKeyframeType): DcaKeyframe => {
    const kf = new DcaKeyframe(project, animation)

    kf.startTime.value = kfData.start
    kf.duration.value = kfData.duration
    kf.layerId = kfData.layerId

    loadToMap(kf.position, kfData.position)
    loadToMap(kf.rotation, kfData.rotation)
    loadToMap(kf.cubeGrow, kfData.cubeGrow)

    kf.progressionPoints.value = kf.progressionPoints.value.concat(kfData.progressionPoints)

    return kf
  }

  animation.keyframes.value = data.keyframes.map(kf => mapKeyframe(kf))

  animation.keyframeData.exits.value = data.loopData.exists
  animation.keyframeData.start.value = data.loopData.start
  animation.keyframeData.end.value = data.loopData.end
  animation.keyframeData.duration.value = data.loopData.duration

  convertRecordToMap(data.cubeNameOverrides ?? {}, animation.keyframeNameOverrides)

  animation.isSkeleton.value = data.isSkeleton ?? false

  return animation
}

export const writeDCAAnimation = async (animation: DcaAnimation) => {

  const mapKeyframe = (kf: DcaKeyframe): ParsedKeyframeType => ({
    start: kf.startTime.value,
    duration: kf.duration.value,
    layerId: kf.layerId,

    position: writeFromMap(kf.position),
    rotation: writeFromMap(kf.rotation),
    cubeGrow: writeFromMap(kf.cubeGrow),

    progressionPoints: kf.progressionPoints.value,
  })

  const data: ParsedAnimationType = {
    version: 1,
    name: animation.name.value,
    keyframes: animation.keyframes.value.map(kf => mapKeyframe(kf)),
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
  const blob = await zip.generateAsync({ type: "blob" })
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

type ParsedKfMap = Record<string, readonly [number, number, number]>
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