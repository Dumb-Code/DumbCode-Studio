import ShowcaseProperties from '../../showcase/ShowcaseProperties';
import ShowcaseView from '../../showcase/ShowcaseView';
import { loadToMap, ParsedKfMap } from '../animations/DCALoader';
import { ShowcaseLight } from './../../showcase/ShowcaseLight';
import { NumArray } from './../../util/NumArray';
import { writeFromMap } from './../animations/DCALoader';

export type JsonShowcaseView = {
  readonly identifier: string
  readonly name: string,
  readonly ambientLight: {
    readonly colour: string,
    readonly intensity: number
  }
  readonly pose: {
    readonly position: ParsedKfMap
    readonly rotation: ParsedKfMap
  }
  readonly camera: {
    readonly position: NumArray,
    readonly target: NumArray
  }
  readonly lights: {
    readonly identifier: string,
    readonly name: string,
    readonly colour: string,
    readonly intensity: number,
    readonly direction: NumArray,
    readonly shadow: boolean
  }[]
}

export const viewToJson = (view: ShowcaseView): JsonShowcaseView => ({
  identifier: view.identifier,
  name: view.name.value,
  ambientLight: viewToAmbientLight(view),
  pose: {
    position: writeFromMap(view.position),
    rotation: writeFromMap(view.rotation),
  },
  camera: {
    position: view.cameraPosition.value,
    target: view.cameraTarget.value,
  },
  lights: viewToLights(view.lights.value),
})

export const viewToAmbientLight = (view: ShowcaseView): JsonShowcaseView['ambientLight'] => ({
  colour: view.ambientLightColour.value,
  intensity: view.ambientLightIntensity.value
})

export const viewToLights = (lights: ShowcaseLight[]): JsonShowcaseView['lights'] => lights.map(light => ({
  identifier: light.identifier,
  name: light.name.value,
  colour: light.colour.value,
  intensity: light.intensity.value,
  direction: light.direction.value,
  shadow: light.shadow.value,
}))

export const jsonToView = (properties: ShowcaseProperties, showcase: JsonShowcaseView): ShowcaseView => {
  return new ShowcaseView(
    properties,
    showcase.identifier,
    showcase.name,
    showcase.ambientLight.colour,
    showcase.ambientLight.intensity,
    jsonLightToShowcaseLight(showcase.lights),
    loadToMap(showcase.pose.position),
    loadToMap(showcase.pose.rotation),
    showcase.camera.position,
    showcase.camera.target
  )
}

export const jsonLightToShowcaseLight = (lights: JsonShowcaseView['lights']): ShowcaseLight[] => {
  return lights.map(light => new ShowcaseLight(
    light.identifier,
    light.name,
    light.colour,
    light.intensity,
    light.direction,
  ))
}