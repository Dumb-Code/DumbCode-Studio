import { v4 } from 'uuid';
import { LO } from "../../util/ListenableObject";
import { StudioSound } from '../sounds/StudioSound';
import StudioSoundInstance from '../sounds/StudioSoundInstance';
import DcaAnimation from "./DcaAnimation";

export default class DcaSoundLayer {

  readonly name: LO<string>
  readonly instances: LO<readonly DcaSoundLayerInstance[]>
  readonly locked: LO<boolean>
  readonly visible: LO<boolean>

  constructor(
    readonly animation: DcaAnimation,
    name = "New Sound Layer",
    instances: readonly DcaSoundLayerInstance[] = [],
    locked = false,
    visible = true,
    readonly identifier = v4(),
  ) {
    this.name = new LO(name)
    this.instances = new LO(instances)
    this.locked = new LO(locked)
    this.visible = new LO(visible)
  }


}

export class DcaSoundLayerInstance {

  readonly startTime: LO<number>
  readonly sound: StudioSound | null
  readonly soundInstance: StudioSoundInstance | null

  startTimeChanged = false

  constructor(
    readonly animation: DcaAnimation,
    readonly soundUUID: string,
    startTime = 0,
    readonly identifier = v4()
  ) {

    this.startTime = new LO(startTime)
    this.sound = this.animation.project.sounds.value.find(s => s.identifier === soundUUID) ?? null
    this.soundInstance = this.sound !== null ? new StudioSoundInstance(this.sound) : null

    this.startTime.addListener(() => {
      this.startTimeChanged = true
    })
  }

}