import { AmbientLight, Group } from 'three';
import ShowcaseGumball from '../../views/showcase/logic/ShowcaseGumball';
import { LO } from '../util/ListenableObject';
import { ShowcaseLight } from './DirectionLight';
import ShowcaseView from './ShowcaseView';


export default class ShowcaseProperties {
  readonly group = new Group()

  readonly gumball = new ShowcaseGumball(this)

  private readonly ambientLight = new AmbientLight()

  readonly selectedView: LO<ShowcaseView>
  readonly views: LO<readonly ShowcaseView[]>

  private readonly lightGroup = new Group()

  readonly lightsCallback = (lights: ShowcaseLight[]) => {
    this.lightGroup.clear()
    lights.forEach(light => this.lightGroup.add(light.light))
  }

  readonly ambientLightColourCallback = (c: string) => this.ambientLight.color.set(c)
  readonly ambientLightIntensityCallback = (i: number) => this.ambientLight.intensity = i


  constructor(
    views: readonly ShowcaseView[] = [],
  ) {
    if (views.length === 0) {
      views = [new ShowcaseView(this)]
    }
    this.views = new LO(views)
    this.selectedView = new LO(views[0])

    this.selectedView.addAndRunListener((view, oldView) => {
      oldView.ambientLightColour.removeListener(this.ambientLightColourCallback)
      oldView.ambientLightIntensity.removeListener(this.ambientLightIntensityCallback)
      oldView.lights.removeListener(this.lightsCallback)

      view.ambientLightColour.addAndRunListener(this.ambientLightColourCallback)
      view.ambientLightIntensity.addAndRunListener(this.ambientLightIntensityCallback)
      view.lights.addAndRunListener(this.lightsCallback)
    })

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