import { ProgressionPoint } from "../formats/animations/DcaAnimation";
import { writeFromMap } from "../formats/animations/DCALoader";
import { DcaKeyframe } from './../formats/animations/DcaAnimation';
import { DCMCube, DCMModel } from './../formats/model/DcmModel';

type KfMapData = Record<string, readonly [number, number, number]>

export type KeyframeClipboardType = {
  layerId: number,
  start: number,
  duration: number

  progressionPoints: readonly ProgressionPoint[]

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
    start: kf.startTime.value,
    duration: kf.duration.value,
    layerId: kf.layerId.value,

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