import { LO } from './../util/ListenableObject';
import { ShowcaseLight } from './DirectionLight';
import ShowcaseProperties from './ShowcaseProperties';

export default class ShowcaseView {
  readonly ambientLightColour = new LO('#ffffff')
  readonly ambientLightIntensity = new LO(1)

  readonly lights = new LO<ShowcaseLight[]>([])
  readonly selectedLight = new LO<ShowcaseLight | null>(null)

  constructor(
    readonly properties: ShowcaseProperties
  ) {

  }


  addLight(light = new ShowcaseLight()) {
    this.lights.value = [...this.lights.value, light]
  }

  removeLight(light: ShowcaseLight) {
    this.lights.value = this.lights.value.filter(l => l !== light)
  }
}