import { v4 } from 'uuid';
import { LO } from "../../util/ListenableObject";
import DcProject from '../project/DcProject';
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

  findAllSounds() {
    this.instances.value.forEach(instance => instance.findSounds())
  }

}

export class DcaSoundLayerInstance {

  readonly startTime: LO<number>
  sound: StudioSound | null = null
  soundInstance: StudioSoundInstance | null = null

  startTimeChanged = false

  constructor(
    readonly project: DcProject,
    readonly soundName: string,
    startTime = 0,
    readonly identifier = v4()
  ) {

    this.startTime = new LO(startTime)
    this.findSounds()

    this.startTime.addListener(() => {
      this.startTimeChanged = true
    })
  }

  findSounds() {
    this.sound = this.project.sounds.value.find(s => s.name.value === this.soundName) ?? null
    this.soundInstance = this.sound !== null ? new StudioSoundInstance(this.sound) : null
  }

}