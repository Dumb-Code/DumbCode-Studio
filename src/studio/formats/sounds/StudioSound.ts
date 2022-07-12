import { Howl } from 'howler';
import { v4 } from 'uuid';
import { removeFileExtension } from '../project/DcProject';
import { LO } from './../../util/ListenableObject';

const CANVAS_HEIGHT = 30
const BAR_WIDTH = 2 //px
const BARS_PER_SECOND = 2

const canvas = (typeof window !== "undefined" && document.createElement('canvas')) as HTMLCanvasElement

export class StudioSound {

  readonly identifier: string

  readonly name: LO<string>

  _audioBuffer: AudioBuffer | null = null
  _howler: Howl | null = null
  _duration: number | null = null

  _loadHowlerPromise: Promise<void> | null = null

  readonly isLoaded = new LO(false)

  constructor(
    readonly url: string,
    name: string,
    readonly extension: string,
    identifier?: string
  ) {
    this.name = new LO(name)
    this.identifier = identifier ?? v4()
  }

  get fullFileName() {
    return `${this.name.value}${this.extension.length !== 0 ? ("." + this.extension) : ""}`
  }

  get howler() {
    const value = this._howler
    if (value === null) {
      throw new Error('Sound is not loaded')
    }
    return value
  }

  get duration() {
    const value = this._duration
    if (value === null) {
      throw new Error('Sound is not loaded')
    }
    return value
  }

  async getBlob() {
    return new Blob([await fetch(this.url).then(r => r.arrayBuffer())], { type: 'audio/' + this.extension })
  }

  static loadFromFile(file: Blob, name: string): StudioSound {
    const fileName = removeFileExtension(name)
    const extension = name.split('.').pop() ?? ""
    const url = URL.createObjectURL(file)

    const sound = new StudioSound(url, fileName, extension)

    //Don't await this, as we don't want to block the main thread
    StudioSound.setupFromFile(file, sound)
    return sound
  }


  static async setupFromFile(file: Blob, sound: StudioSound) {
    await Promise.all([
      sound._loadHowlerPromise = StudioSound.setupHowler(sound),
      StudioSound.setupAudioBuffer(sound, file),
    ])
    sound.isLoaded.value = true
  }

  static async setupHowler(sound: StudioSound) {

    const fileExtension = sound.extension

    const howler = new Howl({
      src: [sound.url],
      format: fileExtension !== undefined ? [fileExtension] : undefined
    })

    await new Promise((resolve, reject) => {
      howler.once('load', () => resolve(0))
      howler.once('loaderror', (_, err) => reject(err))
    })

    sound._howler = howler
    sound._duration = howler.duration()

  }

  static async setupAudioBuffer(sound: StudioSound, file: Blob) {
    if (Howler.ctx === null) {
      await sound._loadHowlerPromise
    }
    const arraybuffer = await file.arrayBuffer()
    const audioBuffer = await Howler.ctx.decodeAudioData(arraybuffer)
    sound._audioBuffer = audioBuffer
  }

  static drawVisualization(sound: StudioSound, colour: string, fixedCanvasWidth?: number, fixedCanvasHeight?: number, middleBar?: number, rollingAverage = 0) {

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get canvas context')
    }
    const numBars = Math.floor(fixedCanvasWidth !== undefined ? fixedCanvasWidth / BAR_WIDTH : Math.ceil(sound.duration * BARS_PER_SECOND))
    canvas.width = numBars * BAR_WIDTH
    canvas.height = fixedCanvasHeight ?? CANVAS_HEIGHT
    ctx.imageSmoothingEnabled = false

    const audioBuffer = sound._audioBuffer
    if (!audioBuffer) {
      throw new Error('Sound is not loaded')
    }


    const blockSize = Math.floor(audioBuffer.getChannelData(0).length / numBars); // the number of samples in each subdivision
    let filteredData: number[] = [];
    for (let i = 0; i < numBars; i++) {
      let blockStart = blockSize * i; // the location of the first sample in the block
      let sum = 0;
      for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
        const channelData = audioBuffer.getChannelData(c);
        for (let j = 0; j < blockSize; j++) {
          sum += channelData[blockStart + j]; // find the sum of all the samples in the block
        }
      }
      filteredData.push(sum); // divide the sum by the block size to get the average
    }



    if (rollingAverage !== 0) {
      filteredData = filteredData.map((_, i) => {
        const start = Math.max(0, i - rollingAverage)
        const end = Math.min(filteredData.length, i + rollingAverage)
        const sum = filteredData.slice(start, end).reduce((a, b) => a + b, 0)
        return sum / (end - start)
      })
    }

    const max = Math.max(...filteredData)
    const multiplier = 1 / max
    const normlizedData = filteredData.map(n => n * multiplier);

    ctx.fillStyle = colour

    //normlizedData is scaled from 0 to 1
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (let i = 0; i < numBars; i++) {
      const height = normlizedData[i] * canvas.height
      ctx.fillRect(i * BAR_WIDTH, (canvas.height - height) / 2, BAR_WIDTH, height)
    }

    const middleBarVal = middleBar ?? 3
    ctx.fillRect(0, (canvas.height - middleBarVal) / 2, canvas.width, middleBarVal)

    return canvas.toDataURL('image/png')

  }
}