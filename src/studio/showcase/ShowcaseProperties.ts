import { AmbientLight, Group } from 'three';
import { LO } from '../util/ListenableObject';
import { ShowcaseLight } from './DirectionLight';


export default class ShowcaseProperties {
  readonly group = new Group()


  private readonly ambientLight = new AmbientLight()
  readonly ambientLightColour = new LO('#ffffff')
  readonly ambientLightIntensity = new LO(1)

  private readonly lightGroup = new Group()
  readonly lights = new LO<ShowcaseLight[]>([])
  readonly selectedLight = new LO<ShowcaseLight | null>(null)

  constructor() {
    this.group.add(this.ambientLight)
    this.ambientLightColour.addAndRunListener(c => this.ambientLight.color.set(c))
    this.ambientLightIntensity.addAndRunListener(i => this.ambientLight.intensity = i)

    this.group.add(this.lightGroup)

    this.lights.addListener(lights => {
      this.lightGroup.clear()
      lights.map(light => light.light).forEach(light => this.lightGroup.add(light))
    })
  }

  addLight(light = new ShowcaseLight()) {
    this.lights.value = [...this.lights.value, light]
  }

  removeLight(light: ShowcaseLight) {
    this.lights.value = this.lights.value.filter(l => l !== light)
  }
}