import { v4 } from "uuid";
import DcaAnimation, { ProgressionPoint } from "../formats/animations/DcaAnimation";
import { loadToMap, writeFromMap } from "../formats/animations/DCALoader";
import { DcaKeyframe } from './../formats/animations/DcaAnimation';
import { DCMCube, DCMModel } from './../formats/model/DcmModel';

type KfMapData = Record<string, readonly [number, number, number]>

export type KeyframeClipboardType = {
  identifier: string,
  layerId: number,
  start: number,
  duration: number

  originalLayerId: number,
  originalStart: number,

  progressionPoints: readonly ProgressionPoint[]

  pasteAsDefined?: boolean

  additionalData: {
    rotation: KfMapData
    position: KfMapData
    cubeGrow: KfMapData
  }

  definedData: {
    rotation: KfMapData
    position: KfMapData
    cubeGrow: KfMapData
  }
}

const writeDefinedMap = (
  model: DCMModel, elements: Map<string, any>,
  elementGetter: (cube: DCMCube) => { x: number, y: number, z: number },
  originalElementGetter: (cube: DCMCube) => readonly [number, number, number],
  elementModifier = 1
): KfMapData => {
  return Array.from(elements.keys())
    .map(cubeName => model.cubeMap.get(cubeName))
    .filter((set): set is Set<DCMCube> => set !== undefined)
    .flatMap(set => Array.from(set))
    .reduce((data, cube) => {
      const element = elementGetter(cube)
      const original = originalElementGetter(cube)
      data[cube.name.value] = [element.x * elementModifier - original[0], element.y * elementModifier - original[1], element.z * elementModifier - original[2]]
      return data
    }, {} as KfMapData)
}
export const writeKeyframeForClipboard = (kf: DcaKeyframe): KeyframeClipboardType => {
  const model = kf.animation.project.model
  model.resetVisuals()
  kf.animation.animateAt(kf.startTime.value + kf.duration.value)

  const definedRotation = writeDefinedMap(model, kf.rotation, cube => cube.cubeGroup.rotation, cube => cube.rotation.value)
  const definedPosition = writeDefinedMap(model, kf.position, cube => cube.cubeGroup.position, cube => cube.position.value)
  const definedCubeGrow = writeDefinedMap(model, kf.cubeGrow, cube => cube.cubeGrowGroup.position, cube => cube.cubeGrow.value, -1)

  return {
    identifier: v4(),
    start: kf.startTime.value,
    duration: kf.duration.value,
    layerId: kf.layerId.value,

    originalLayerId: kf.layerId.value,
    originalStart: kf.startTime.value,

    progressionPoints: kf.progressionPoints.value,

    additionalData: {
      position: writeFromMap(kf.position),
      rotation: writeFromMap(kf.rotation),
      cubeGrow: writeFromMap(kf.cubeGrow),
    },

    definedData: {
      position: definedPosition,
      rotation: definedRotation,
      cubeGrow: definedCubeGrow
    }
  }
}

export const convertClipboardToKeyframe = (animation: DcaAnimation, item: KeyframeClipboardType) => {
  const data = item.pasteAsDefined ? convertDefinedDataToAdditional(animation, item) : item.additionalData
  return new DcaKeyframe(
    animation.project, animation, v4(), item.layerId, item.start, item.duration, false, item.progressionPoints,
    loadToMap(data.rotation), loadToMap(data.position), loadToMap(data.cubeGrow)
  )
}

const convertDefinedDataToAdditional = (animation: DcaAnimation, item: KeyframeClipboardType): KeyframeClipboardType['additionalData'] => {
  const model = animation.project.model

  model.resetVisuals()
  animation.animateAt(item.start + item.duration)


  return {
    rotation: convertDefinedMapToAdditional(model, item.definedData.rotation, cube => cube.cubeGroup.rotation, cube => cube.rotation.value),
    position: convertDefinedMapToAdditional(model, item.definedData.position, cube => cube.cubeGroup.position, cube => cube.position.value),
    cubeGrow: convertDefinedMapToAdditional(model, item.definedData.cubeGrow, cube => cube.cubeGrowGroup.position, cube => cube.cubeGrow.value, -1),
  }
}

const convertDefinedMapToAdditional = (
  model: DCMModel, elements: KfMapData,
  elementGetter: (cube: DCMCube) => { x: number, y: number, z: number },
  originalElementGetter: (cube: DCMCube) => readonly [number, number, number],
  elementModifier = 1
) => {
  return Object.keys(elements)
    .map(cubeName => model.cubeMap.get(cubeName))
    .filter((set): set is Set<DCMCube> => set !== undefined)
    .flatMap(set => Array.from(set))
    .reduce((data, cube) => {
      const currentValue = elementGetter(cube)
      const originalValue = originalElementGetter(cube)
      const wantedDelta = elements[cube.name.value]

      const wantedValue = [
        originalValue[0] + wantedDelta[0],
        originalValue[1] + wantedDelta[1],
        originalValue[2] + wantedDelta[2],
      ] as const

      const currentToWanted = [
        wantedValue[0] - currentValue.x * elementModifier,
        wantedValue[1] - currentValue.y * elementModifier,
        wantedValue[2] - currentValue.z * elementModifier,
      ] as const

      data[cube.name.value] = currentToWanted

      return data
    }, {} as KfMapData)
}