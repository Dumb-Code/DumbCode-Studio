import { AmbientLight, Group, Mesh, PlaneGeometry, ShadowMapType, ShadowMaterial } from 'three';
import { unsafe_getThreeContext } from '../../contexts/StudioContext';
import ShowcaseGumball from '../../views/showcase/logic/ShowcaseGumball';
import DcProject from '../formats/project/DcProject';
import { LO } from '../util/ListenableObject';
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

  readonly selectedView: LO<ShowcaseView>
  readonly views: LO<readonly ShowcaseView[]>

  readonly previewShadowMapSize = new LO(512)
  readonly floorShadowOpacity = new LO(0.5)

  private readonly lightGroup = new Group()

  readonly lightsCallback = (lights: ShowcaseLight[]) => {
    this.lightGroup.clear()
    const mapSize = this.previewShadowMapSize.value
    lights.forEach(light => {
      this.lightGroup.add(light.light)
      light.light.castShadow = this.selectedView.value.shadow.value
      light.setShadowMapSize(mapSize)
    })
  }

  readonly ambientLightColourCallback = (c: string) => this.ambientLight.color.set(c)
  readonly ambientLightIntensityCallback = (i: number) => this.ambientLight.intensity = i

  readonly shadowCallback = (value: boolean) => {
    const ctx = unsafe_getThreeContext()
    ctx.renderer.shadowMap.enabled = value

    this.project.model.traverseAll(cube => {
      cube.cubeMesh.castShadow = value
      cube.cubeMesh.receiveShadow = value
    })
    this.selectedView.value.lights.value.forEach(light => light.light.castShadow = value)
  }
  readonly shadowTypeCallback = (value: ShadowMapType) => {
    const ctx = unsafe_getThreeContext()
    ctx.renderer.shadowMap.type = value
  }

  constructor(
    readonly project: DcProject,
    views: readonly ShowcaseView[] = [],
  ) {
    this.plane.receiveShadow = true
    this.plane.rotation.set(-Math.PI / 2, 0, 0)
    this.group.add(this.plane)
    if (views.length === 0) {
      views = [new ShowcaseView(this)]
    }
    this.views = new LO(views)
    this.selectedView = new LO(views[0])

    this.selectedView.addAndRunListener((view, oldView) => {
      oldView.ambientLightColour.removeListener(this.ambientLightColourCallback)
      oldView.ambientLightIntensity.removeListener(this.ambientLightIntensityCallback)
      oldView.lights.removeListener(this.lightsCallback)
      oldView.shadow.removeListener(this.shadowCallback)

      view.ambientLightColour.addAndRunListener(this.ambientLightColourCallback)
      view.ambientLightIntensity.addAndRunListener(this.ambientLightIntensityCallback)
      view.lights.addAndRunListener(this.lightsCallback)
      view.shadow.addAndRunListener(this.shadowCallback)
    })

    this.previewShadowMapSize.addAndRunListener((value) => {
      this.selectedView.value.lights.value.forEach(light => light.setShadowMapSize(value))
    })

    this.floorShadowOpacity.addListener(opacity => this.plane.material.opacity = opacity)

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

}