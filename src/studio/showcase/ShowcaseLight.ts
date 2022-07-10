import { DirectionalLight } from 'three';
import { v4 } from 'uuid';
import { LO } from "../util/ListenableObject";
import { NumArray } from '../util/NumArray';

export class ShowcaseLight {


  readonly light = new DirectionalLight()

  readonly name: LO<string>

  readonly colour: LO<string>
  readonly intensity: LO<number>
  readonly direction: LO<NumArray>

  readonly shadow = new LO(true)

  constructor(
    readonly identifer = v4(),
    name = 'New Light',
    colour = '#ffffff',
    intensity = 1,
    direction: NumArray = [0, 5, 0]
  ) {
    this.name = new LO(name)
    this.colour = new LO(colour)
    this.intensity = new LO(intensity)
    this.direction = new LO(direction)

    this.shadow.addAndRunListener(v => this.light.castShadow = v)

    this.colour.addAndRunListener(c => this.light.color.set(c))
    this.intensity.addAndRunListener(i => this.light.intensity = i)
    this.direction.addAndRunListener(d => this.light.position.set(d[0], d[1], d[2]))

    this.light.shadow.bias = -0.001
  }

  setShadowMapSize(size: number) {
    this.light.shadow.mapSize.width = size
    this.light.shadow.mapSize.height = size

    if (this.light.shadow.map !== null) {
      this.light.shadow.map.dispose()
      this.light.shadow.map = null as any
    }
    this.light.shadow.needsUpdate = true
  }

}