import { Howl } from 'howler';
import { v4 } from 'uuid';
import { ReadableFile, readFileArrayBuffer, readFileDataUrl } from './../../files/FileTypes';
import { LO } from './../../util/ListenableObject';

const CANVAS_HEIGHT = 30
const BAR_WIDTH = 2 //px
const BARS_PER_SECOND = 2

const canvas = (typeof window !== "undefined" && document.createElement('canvas')) as HTMLCanvasElement

export class StudioSound {

  readonly identifier: string

  readonly name: LO<string>

  readonly _howler = new LO<Howl | null>(null)
  readonly _duration = new LO<number | null>(null)
  readonly imgUrl = new LO<string | null>(null)

  readonly isLoaded = new LO(false)

  constructor(
    name: string,
    identifier?: string
  ) {
    this.name = new LO(name)
    this.identifier = identifier ?? v4()

    this._howler.addListener(h => {
      if (h) {
        this._duration.value = h.duration()
      }
      this.isLoaded.value = h !== null
    })
  }

  get howler() {
    const value = this._howler.value
    if (value === null) {
      throw new Error('Sound is not loaded')
    }
    return value
  }

  get duration() {
    const value = this._duration.value
    if (value === null) {
      throw new Error('Sound is not loaded')
    }
    return value
  }

  static async setupFromFile(file: ReadableFile, sound: StudioSound) {
    const url = await readFileDataUrl(file)

    const howler = new Howl({
      src: [url],
    })

    await new Promise((resolve, reject) => {
      howler.once('load', () => resolve(0))
      howler.once('loaderror', (_, err) => reject(err))
    })

    sound._howler.value = howler

    sound.imgUrl.value = await StudioSound.drawVisulization(sound, file, 100)
  }

  static loadFromFile(file: ReadableFile, name: string): StudioSound {
    const sound = new StudioSound(name)
    StudioSound.setupFromFile(file, sound)
    return sound
  }

  static async drawVisulization(sound: StudioSound, file: ReadableFile, fixedNumberOfBars?: number) {
    const arraybuffer = await readFileArrayBuffer(file)

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get canvas context')
    }

    const numBars = fixedNumberOfBars !== undefined ? fixedNumberOfBars : Math.ceil(sound.duration * BARS_PER_SECOND)
    canvas.width = numBars * BAR_WIDTH
    canvas.height = CANVAS_HEIGHT
    ctx.imageSmoothingEnabled = false

    const audioBuffer = await Howler.ctx.decodeAudioData(arraybuffer)

    const blockSize = Math.floor(audioBuffer.getChannelData(0).length / numBars); // the number of samples in each subdivision
    const filteredData: number[] = [];
    for (let i = 0; i < numBars; i++) {
      let blockStart = blockSize * i; // the location of the first sample in the block
      let sum = 0;
      for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
        const channelData = audioBuffer.getChannelData(c);
        for (let j = 0; j < blockSize; j++) {
          sum += channelData[blockStart + j]; // find the sum of all the samples in the block
        }
      }
      filteredData.push(sum / blockSize); // divide the sum by the block size to get the average
    }

    const max = Math.max(...filteredData)
    const multiplier = 1 / max
    const normlizedData = filteredData.map(n => n * multiplier);

    //normlizedData is scaled from 0 to 1
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (let i = 0; i < numBars; i++) {
      ctx.fillStyle = '#fff'
      const height = normlizedData[i] * CANVAS_HEIGHT
      ctx.fillRect(i * BAR_WIDTH, (CANVAS_HEIGHT - height) / 2, BAR_WIDTH, height)
    }

    const middleBar = 5
    ctx.fillRect(0, (CANVAS_HEIGHT - middleBar) / 2, canvas.width, middleBar)

    return canvas.toDataURL('image/png')

  }
}