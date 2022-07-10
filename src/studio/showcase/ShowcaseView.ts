import { v4 } from 'uuid';
import AnimatorGumballConsumer, { AnimatorGumballConsumerPart } from '../formats/animations/AnimatorGumballConsumer';
import { DCMCube } from '../formats/model/DcmModel';
import { AnimatorGumball } from './../../views/animator/logic/AnimatorGumball';
import { LO, LOMap } from './../util/ListenableObject';
import { NumArray } from './../util/NumArray';
import { ShowcaseLight } from './ShowcaseLight';
import ShowcaseProperties from './ShowcaseProperties';

export default class ShowcaseView extends AnimatorGumballConsumer {

  readonly identifier = v4()

  readonly name = new LO<string>("New View")

  readonly ambientLightColour = new LO('#ffffff')
  readonly ambientLightIntensity = new LO(1)

  readonly lights = new LO<ShowcaseLight[]>([])
  readonly selectedLight = new LO<ShowcaseLight | null>(null)

  readonly animatorGumball: AnimatorGumball

  readonly position = new LOMap<string, NumArray>()
  readonly rotation = new LOMap<string, NumArray>()

  readonly constantPart = LO.createReadonly(new ConstantGumballPart(this))

  constructor(
    readonly properties: ShowcaseProperties
  ) {
    super()
    this.animatorGumball = new AnimatorGumball(this.properties.project)
  }


  addLight(light = new ShowcaseLight()) {
    this.lights.value = [...this.lights.value, light]
  }

  removeLight(light: ShowcaseLight) {
    this.lights.value = this.lights.value.filter(l => l !== light)
  }

  renderForGumball(): void {
    const model = this.properties.project.model
    model.resetVisuals()

    this.position.forEach((value, key) => {
      const cube = model.identifierCubeMap.get(key)
      if (cube) {
        const current = cube.position.value
        cube.updatePositionVisuals([
          current[0] + value[0],
          current[1] + value[1],
          current[2] + value[2]
        ])
      }
    })

    this.rotation.forEach((value, key) => {
      const cube = model.identifierCubeMap.get(key)
      if (cube) {
        const current = cube.rotation.value
        cube.updateRotationVisuals([
          current[0] + value[0],
          current[1] + value[1],
          current[2] + value[2]
        ])
      }
    })
  }


  getAnimatorGumball(): AnimatorGumball {
    return this.animatorGumball
  }

  getSingleSelectedPart(): LO<AnimatorGumballConsumerPart | null> {
    return this.constantPart as any //TODO: fix the cast here
  }

}

class ConstantGumballPart extends AnimatorGumballConsumerPart {
  constructor(
    readonly view: ShowcaseView
  ) {
    super()
  }

  gumballGetPosition(cube: DCMCube): NumArray | undefined {
    return this.view.position.get(cube.identifier)
  }

  gumballGetRotation(cube: DCMCube): NumArray | undefined {
    return this.view.rotation.get(cube.identifier)
  }

  gumballSetPosition(cube: DCMCube, position: NumArray): void {
    this.view.position.set(cube.identifier, position)
  }

  gumballSetRotation(cube: DCMCube, rotation: NumArray): void {
    this.view.rotation.set(cube.identifier, rotation)
  }
}