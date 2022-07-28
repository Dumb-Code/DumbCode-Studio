import { CameraHelper, DirectionalLight } from 'three';
import { v4 } from 'uuid';
import { LO } from "../listenableobject/ListenableObject";
import { NumArray } from '../util/NumArray';
import ShowcaseView, { LightSectionType } from './ShowcaseView';

export class ShowcaseLight {
  readonly light = new DirectionalLight()
  readonly cameraHelper = new CameraHelper(this.light.shadow.camera)
  readonly name: LO<string>

  readonly colour: LO<string>
  readonly intensity: LO<number>
  readonly direction: LO<NumArray>

  readonly shadow: LO<boolean>

  readonly _section: LightSectionType

  constructor(
    private readonly view: ShowcaseView,
    readonly identifier = v4(),
    name = 'New Light',
    colour = '#ffffff',
    intensity = 1,
    direction: NumArray = [0, 5, 0],
    shadow = true,
  ) {

    this._section = this.view.undoRedoHandler.createNewSection(`light_${identifier}`)

    this._section.modifyFirst("identifier", this.identifier, () => { throw new Error("Cannot modify identifier") })

    this.name = new LO(name).applyToSection(this._section, "name")
    this.colour = new LO(colour).applyToSection(this._section, "colour")
    this.intensity = new LO(intensity).applyToSection(this._section, "intensity")
    this.direction = new LO(direction).applyToSection(this._section, "direction")
    this.shadow = new LO(shadow).applyToSection(this._section, "shadow")

    this._section.pushCreation("Light Added")
    this.view.allLights.set(identifier, this)

    this.shadow.addAndRunListener(v => this.light.castShadow = v)

    this.colour.addAndRunListener(c => this.light.color.set(c))
    this.intensity.addAndRunListener(i => this.light.intensity = i)
    this.direction.addAndRunListener(d => {
      this.light.position.set(d[0], d[1], d[2])
      this.cameraHelper.update()
    })

    this.light.shadow.bias = -0.001
    this.light.shadow.camera.left = this.light.shadow.camera.bottom = -7
    this.light.shadow.camera.right = this.light.shadow.camera.top = 7
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

  fullyDelete() {
    this._section?.remove("Light Deleted")
    this.view.lights.value = this.view.lights.value.filter(l => l !== this)
    this.view.allLights.delete(this.identifier)
  }

}