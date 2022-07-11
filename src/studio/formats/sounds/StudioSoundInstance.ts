import { LO } from './../../util/ListenableObject';
import { StudioSound } from './StudioSound';

export default class StudioSoundInstance {

  private soundId = -1

  readonly playing = new LO(false)

  constructor(
    readonly sound: StudioSound
  ) {
    this.playing.addListener(playing => {
      if (playing) {
        if (this.soundId === -1) {
          //Play a new sound, and when that ends, stop playing
          this.soundId = this.sound.howler.play()
          this.sound.howler.on("end", () => {
            this.playing.value = false
          }, this.soundId)
        } else {
          //Else the sound is paused, so resume it
          this.sound.howler.play(this.soundId)
        }
      } else {
        //Else the sound is playing, so pause it
        this.sound.howler.pause(this.soundId)
      }
    })

  }

  dispose() {
    if (this.soundId === -1) {
      return
    }
    this.sound.howler.off("end", undefined, this.soundId)
  }

  seek(time: number) {
    if (this.soundId === -1) {
      return
    }
    this.sound.howler.seek(time, this.soundId)
  }

  seekForTime() {
    return this.sound.howler.seek(this.soundId)
  }

  getPlaybackPosition() {
    return this.sound.howler.seek(this.soundId)
  }
}