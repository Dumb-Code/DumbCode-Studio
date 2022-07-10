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

  readonly imgUrl = new LO<string | null>(null)

  readonly duration: number

  constructor(
    public readonly howler: Howl,
    name: string,
    identifier?: string
  ) {
    this.name = new LO(name)
    this.duration = howler.duration()
    this.identifier = identifier ?? v4()
  }

  static async loadFromFile(file: ReadableFile, name: string): Promise<StudioSound> {
    const url = await readFileDataUrl(file)
    const howler = new Howl({
      src: [url],
    })

    const sound: StudioSound = await new Promise((resolve, reject) => {
      howler.once('load', () => resolve(new StudioSound(howler, name)))
      howler.once('loaderror', (_, err) => reject(err))
    })

    StudioSound.drawVisulization(sound, file, 100).then(d => sound.imgUrl.value = d)
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

    const rawData = audioBuffer.getChannelData(0)
    const blockSize = Math.floor(rawData.length / numBars); // the number of samples in each subdivision
    const filteredData = [];
    for (let i = 0; i < numBars; i++) {
      let blockStart = blockSize * i; // the location of the first sample in the block
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum = sum + Math.abs(rawData[blockStart + j]) // find the sum of all the samples in the block
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