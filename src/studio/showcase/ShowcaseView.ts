import { v4 } from 'uuid';
import AnimatorGumballConsumer, { AnimatorGumballConsumerPart } from '../formats/animations/AnimatorGumballConsumer';
import { DCMCube } from '../formats/model/DcmModel';
import { unsafe_getThreeContext } from './../../contexts/StudioContext';
import { AnimatorGumball } from './../../views/animator/logic/AnimatorGumball';
import { LO, LOMap } from './../util/ListenableObject';
import { NumArray } from './../util/NumArray';
import { ShowcaseLight } from './ShowcaseLight';
import ShowcaseProperties from './ShowcaseProperties';

export default class ShowcaseView extends AnimatorGumballConsumer {

  readonly name: LO<string>

  readonly ambientLightColour: LO<string>
  readonly ambientLightIntensity: LO<number>

  readonly lights: LO<ShowcaseLight[]>
  readonly selectedLight = new LO<ShowcaseLight | null>(null)

  readonly animatorGumball: AnimatorGumball

  readonly position: LOMap<string, NumArray>
  readonly rotation: LOMap<string, NumArray>

  readonly cameraPosition: LO<NumArray>
  readonly cameraTarget: LO<NumArray>


  readonly constantPart = LO.combine(
    this.selectedLight,
    LO.createReadonly(new ConstantGumballPart(this)),
    (selectedLight, part) => {
      //If a light is selected, then don't have anything selected, so 
      //the animator gumball is not enabled
      if (selectedLight) {
        return null
      } else {
        return part
      }
    }
  )

  constructor(
    readonly properties: ShowcaseProperties,
    readonly identifier = v4(),
    name = 'New View',
    ambientLightColour = "#ffffff",
    ambientLightIntensity = 1,
    lights: ShowcaseLight[] = [],
    position: Map<string, NumArray> = new Map(),
    rotation: Map<string, NumArray> = new Map(),
    cameraPosition: NumArray | null = null,
    cameraTarget: NumArray | null = null
  ) {
    super()

    this.name = new LO(name)
    this.ambientLightColour = new LO(ambientLightColour)
    this.ambientLightIntensity = new LO(ambientLightIntensity)
    this.lights = new LO(lights)
    this.position = new LOMap(position)
    this.rotation = new LOMap(rotation)

    const ctx = unsafe_getThreeContext()
    const camPosition = ctx.getCamera().position
    const camTarget = ctx.controls.target

    this.cameraPosition = new LO(cameraPosition ?? [camPosition.x, camPosition.y, camPosition.z])
    this.cameraTarget = new LO(cameraTarget ?? [camTarget.x, camTarget.y, camTarget.z])

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