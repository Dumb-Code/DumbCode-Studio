import { LO } from '../../listenableobject/ListenableObject';
import DcProject from '../project/DcProject';
import DcaAnimation from "./DcaAnimation";

export default class DcaTabs {
  constructor(
    private readonly project: DcProject
  ) { }
  readonly animations = new LO<readonly DcaAnimation[]>([])
  readonly tabs = new LO<readonly string[]>([])
  readonly selectedAnimation = new LO<DcaAnimation | null>(null)

  addAnimation = (animation: DcaAnimation) => {
    this.animations.value = this.animations.value.concat([animation])
    this.tabs.value = this.tabs.value.concat([animation.identifier])
    this.selectedAnimation.value = animation

    animation.needsSaving.addListener(v => this.project.projectNeedsSaving.value ||= v)
  }
}