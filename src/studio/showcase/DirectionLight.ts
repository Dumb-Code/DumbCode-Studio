import { DirectionalLight } from 'three';
import { v4 } from 'uuid';
import { LO } from "../util/ListenableObject";
import { NumArray } from './../util/NumArray';

export class ShowcaseLight {

  readonly identifer = v4()

  readonly light = new DirectionalLight()

  readonly name: LO<string>

  readonly colour: LO<string>
  readonly intensity: LO<number>
  readonly direction: LO<NumArray>

  constructor(
    name = 'New Light',
    colour = '#ffffff',
    intensity = 1,
    direction: NumArray = [0, 1, 0]
  ) {
    this.name = new LO(name)
    this.colour = new LO(colour)
    this.intensity = new LO(intensity)
    this.direction = new LO(direction)

    this.colour.addAndRunListener(c => this.light.color.set(c))
    this.intensity.addAndRunListener(i => this.light.intensity = i)
    this.direction.addAndRunListener(d => this.light.position.set(d[0], d[1], d[2]))
  }

}