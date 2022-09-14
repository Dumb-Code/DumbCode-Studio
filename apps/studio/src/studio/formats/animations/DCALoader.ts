import JSZip from "jszip";
import { v4 } from "uuid";
import { StudioBuffer } from "../../util/StudioBuffer";
import { convertMapToRecord, convertRecordToMap } from "../../util/Utils";
import { getZippedFile, OutputByType, ParseError } from "../model/DCMLoader";
import DcProject from "../project/DcProject";
import { NumArray } from './../../util/NumArray';
import DcaAnimation, { DcaKeyframe, ProgressionPoint } from "./DcaAnimation";
import DcaSoundLayer, { DcaSoundLayerInstance } from "./DcaSoundLayer";
import { loadDCAAnimationOLD } from "./OldDcaLoader";

export const loadUnknownAnimation = async (project: DcProject, name: string, buffer: ArrayBuffer) => {
  try {
    return await loadDCAAnimation(project, name, buffer)
  } catch (e) {
    if (e instanceof ParseError) {
      // console.warn(e)
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

  animation.loopData.exists.value = data.loopData.exists
  animation.loopData.start.value = data.loopData.start
  animation.loopData.end.value = data.loopData.end
  animation.loopData.duration.value = data.loopData.duration

  convertRecordToMap(data.cubeNameOverrides ?? {}, animation.keyframeNameOverrides)

  if (data.soundLayers !== undefined) {
    animation.soundLayers.value = data.soundLayers.map(layer => {
      const instances = layer.sounds.map(sound => new DcaSoundLayerInstance(project, sound.soundName, sound.start, sound.identifier))
      return new DcaSoundLayer(animation, layer.name, instances, layer.locked, layer.visible)
    })
  }

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
      exists: animation.loopData.exists.value,
      start: animation.loopData.start.value,
      end: animation.loopData.end.value,
      duration: animation.loopData.duration.value,
    },
    cubeNameOverrides: convertMapToRecord(animation.keyframeNameOverrides),
    isSkeleton: animation.isSkeleton.value,
    soundLayers: animation.soundLayers.value.map(layer => ({
      identifier: layer.identifier,
      sounds: layer.instances.value.map(sound => ({
        identifier: sound.identifier,
        soundName: sound.soundName,
        start: sound.startTime.value,
      })),
      name: layer.name.value,
      locked: layer.locked.value,
      visible: layer.visible.value,
    }))
  }

  const stringData = JSON.stringify(data)

  //TODO: save sound uuids instead of `soundName`, and have DcaSoundLayerInstance load the sound from the uuid instead of the name
  //Also, save the sound uuid to a data.json (that needs to be created)

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
  soundLayers?: ParsedSoundLayerType[]
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

type ParsedSoundLayerType = {
  sounds: ParsedSoundType[]
  identifier: string
  name: string
  locked: boolean
  visible: boolean
}

type ParsedSoundType = {
  soundName: string,
  identifier: string,
  start: number,
}