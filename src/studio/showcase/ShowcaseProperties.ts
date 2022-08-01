import { AmbientLight, Group, Mesh, PlaneGeometry, ShadowMapType, ShadowMaterial } from 'three';
import ShowcaseGumball from '../../views/showcase/logic/ShowcaseGumball';
import DcProject from '../formats/project/DcProject';
import { LO } from '../listenableobject/ListenableObject';
import UnsafeOperations from '../util/UnsafeOperations';
import { JsonShowcaseView, jsonToView, viewToJson } from './../formats/showcase/JsonShowcaseView';
import { ShowcaseLight } from './ShowcaseLight';
import ShowcaseView from './ShowcaseView';


export default class ShowcaseProperties {
  readonly group = new Group()

  readonly plane = new Mesh(
    new PlaneGeometry(1000, 1000, 1, 1),
    new ShadowMaterial(),
  )

  readonly gumball = new ShowcaseGumball(this)

  private readonly ambientLight = new AmbientLight()

  readonly selectedView = new LO(new ShowcaseView(this))
  readonly views = new LO<readonly ShowcaseView[]>([this.selectedView.value])

  readonly previewShadowMapSize = new LO(512)
  readonly floorShadowOpacity = new LO(0.5)

  private readonly lightGroup = new Group()

  readonly lightsCallback = (lights: readonly ShowcaseLight[]) => {
    this.lightGroup.clear()
    const mapSize = this.previewShadowMapSize.value
    lights.forEach(light => {
      this.lightGroup.add(light.light)
      light.setShadowMapSize(mapSize)
    })
  }

  readonly ambientLightColourCallback = (c: string) => this.ambientLight.color.set(c)
  readonly ambientLightIntensityCallback = (i: number) => this.ambientLight.intensity = i

  readonly shadowTypeCallback = (value: ShadowMapType) => {
    const ctx = UnsafeOperations._unsafe_getThreeContext()
    ctx.renderer.shadowMap.type = value
  }

  constructor(
    readonly project: DcProject,
  ) {
    this.plane.receiveShadow = true
    this.plane.rotation.set(-Math.PI / 2, 0, 0)
    this.group.add(this.plane)

    this.selectedView.addAndRunListener((view, oldView) => {
      oldView.ambientLightColour.removeListener(this.ambientLightColourCallback)
      oldView.ambientLightIntensity.removeListener(this.ambientLightIntensityCallback)
      oldView.lights.removeListener(this.lightsCallback)

      view.ambientLightColour.addAndRunListener(this.ambientLightColourCallback)
      view.ambientLightIntensity.addAndRunListener(this.ambientLightIntensityCallback)
      view.lights.addAndRunListener(this.lightsCallback)
    })

    this.previewShadowMapSize.addAndRunListener((value) => {
      this.selectedView.value.lights.value.forEach(light => light.setShadowMapSize(value))
    })

    this.floorShadowOpacity.addAndRunListener(opacity => this.plane.material.opacity = opacity)

    this.group.add(this.ambientLight)
    this.group.add(this.lightGroup)
  }

  addView() {
    const view = new ShowcaseView(this)
    this.views.value = [...this.views.value, view]
    this.selectedView.value = view
  }

  removeView(view: ShowcaseView) {
    const views = this.views.value
    const index = views.indexOf(view)
    this.views.value = views.filter(v => v !== view)
    if (this.selectedView.value === view) {
      const newIndex = index === views.length - 1 ? views.length - 2 : index + 1
      if (newIndex !== -1) {
        this.selectedView.value = views[newIndex]
      } else {
        if (this.views.value.length === 0) {
          this.views.value = [new ShowcaseView(this)]
        }
        this.selectedView.value = this.views.value[0]
      }
    }
  }

  loadViewsFromJson(showcaseViews: JsonShowcaseView[]) {
    const views = showcaseViews.map(json => jsonToView(this, json))
    if (views.length !== 0) {
      this.views.value = views
      this.selectedView.value = views[0]
    }
  }

  exportViewsToJson(): JsonShowcaseView[] | undefined {
    if (this.views.value.length === 0) {
      return undefined
    }
    return this.views.value.map(viewToJson)
  }

}