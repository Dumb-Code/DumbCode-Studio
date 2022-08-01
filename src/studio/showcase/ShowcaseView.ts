import { v4 } from 'uuid';
import AnimatorGumballConsumer, { AnimatorGumballConsumerPart } from '../formats/animations/AnimatorGumballConsumer';
import { DCMCube } from '../formats/model/DcmModel';
import { LO } from '../listenableobject/ListenableObject';
import { LOMap } from "../listenableobject/ListenableObjectMap";
import SelectedCubeUndoRedoHandler from '../undoredo/SelectedCubeUndoRedoHandler';
import UndoRedoHandler, { SectionHandle } from '../undoredo/UndoRedoHandler';
import UnsafeOperations from '../util/UnsafeOperations';
import { AnimatorGumball } from './../../views/animator/logic/AnimatorGumball';
import { NumArray } from './../util/NumArray';
import { ShowcaseLight } from './ShowcaseLight';
import ShowcaseProperties from './ShowcaseProperties';

const view_position = "pos_"
const view_rotation = "rot_"

type UndoRedoDataType = {
  section_name: "root_data",
  data: {
    name: string,
    ambientLightColour: string,
    ambientLightIntensity: number,
    cameraPosition: NumArray,
    cameraTarget: NumArray,

    lights: readonly string[]
    selectedLight?: string,

    [k: `${typeof view_position}${string}`]: NumArray
    [k: `${typeof view_rotation}${string}`]: NumArray
  }
} | {
  section_name: `light_${string}`
  data: {
    identifier: string, //Unchanging
    name: string,
    colour: string,
    intensity: number,
    direction: NumArray,
    shadow: boolean
  }
}

export type LightSectionType = SectionHandle<UndoRedoDataType, UndoRedoDataType & { section_name: `light_${string}` }>


export default class ShowcaseView extends AnimatorGumballConsumer {

  readonly name: LO<string>

  readonly ambientLightColour: LO<string>
  readonly ambientLightIntensity: LO<number>

  readonly allLights = new Map<string, ShowcaseLight>()
  readonly lights: LO<readonly ShowcaseLight[]>
  readonly selectedLight = new LO<ShowcaseLight | null>(null)

  readonly animatorGumball: AnimatorGumball

  readonly position: LOMap<string, NumArray>
  readonly rotation: LOMap<string, NumArray>

  readonly cameraPosition: LO<NumArray>
  readonly cameraTarget: LO<NumArray>

  readonly undoRedoHandler = new SelectedCubeUndoRedoHandler<UndoRedoDataType>(
    (s, d) => this.onAddSection(s, d),
    s => this.onRemoveSection(s),
    (s, p, v) => this.onModifySection(s, p, v),
  )

  private readonly _section = this.undoRedoHandler.createNewSection("root_data")


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
    lights: readonly ShowcaseLight[] = [],
    position: Map<string, NumArray> = new Map(),
    rotation: Map<string, NumArray> = new Map(),
    cameraPosition: NumArray | null = null,
    cameraTarget: NumArray | null = null
  ) {
    super()

    this.name = new LO(name).applyToSection(this._section, "name")
    this.ambientLightColour = new LO(ambientLightColour).applyToSection(this._section, "ambientLightColour")
    this.ambientLightIntensity = new LO(ambientLightIntensity).applyToSection(this._section, "ambientLightIntensity")
    this.lights = new LO(lights).applyMappedToSection(this._section, c => c.map(a => a.identifier) as readonly string[], s => this.identifListToLights(s), "lights")
    this.position = LOMap.applyToSectionStringKey(new LOMap(position), this._section, view_position, false, "Position Changed")
    this.rotation = LOMap.applyToSectionStringKey(new LOMap(rotation), this._section, view_rotation, false, "Rotation Changed")

    this.selectedLight.applyMappedToSection(this._section, c => c ? c.identifier : undefined, s => s ? this.allLights.get(s) ?? null : null, "selectedLight")

    const ctx = UnsafeOperations._unsafe_getThreeContext()
    const camPosition = ctx.getCamera().position
    const camTarget = ctx.controls.target

    this.cameraPosition = new LO(cameraPosition ?? [camPosition.x, camPosition.y, camPosition.z] as const).applyToSection(this._section, "cameraPosition")
    this.cameraTarget = new LO(cameraTarget ?? [camTarget.x, camTarget.y, camTarget.z] as const).applyToSection(this._section, "cameraTarget")

    this.animatorGumball = new AnimatorGumball(this.properties.project)
  }

  identifListToLights(lights: readonly string[]): readonly ShowcaseLight[] {
    return lights.map(c => this.allLights.get(c)).map((c, i) => {
      if (!c) throw new Error("Light Was not found. " + lights[i])
      return c
    })
  }

  onAddSection<K extends UndoRedoDataType['section_name']>(section: K, data: any) {
    if (section === "root_data") {
      return
    }
    const {
      identifier, name, colour,
      direction, intensity, shadow
    } = data as (UndoRedoDataType & { section_name: `light_${string}` })['data']

    this.allLights.set(identifier, new ShowcaseLight(
      this, identifier, name, colour, intensity, direction, shadow
    ))
  }

  onRemoveSection(section: string) {
    if (section === "root_data") {
      return
    }
    const identif = section.substring("light_".length, section.length)
    const light = this.allLights.get(identif)
    if (!light) {
      throw new Error("Tried to remove light that could not be found " + identif);
    }
    light.fullyDelete()
  }

  onModifySection(section_name: string, property_name: string, value: any) {
    if (section_name === "root_data") {
      this._section.applyModification(property_name, value)
    } else {
      const identif = section_name.substring("light_".length, section_name.length)
      const light = this.allLights.get(identif)
      if (!light) {
        throw new Error("Tried to modify a light that could not be found " + identif);
      }
      light._section?.applyModification(property_name, value)
    }
  }


  addLight() {
    this.undoRedoHandler.startBatchActions()
    this.lights.value = [...this.lights.value, new ShowcaseLight(this)]
    this.undoRedoHandler.endBatchActions("Light Added")
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

  getUndoRedoHandler(): UndoRedoHandler<any> | undefined {
    return this.undoRedoHandler
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