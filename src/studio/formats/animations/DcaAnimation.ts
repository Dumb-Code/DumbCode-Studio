import { v4 } from 'uuid';
import { LO, LOMap } from './../../util/ListenableObject';
import DcProject from '../DcProject';

export default class DcaAnimation {
  readonly identifier = v4()
  readonly project: DcProject

  name: LO<string>
  readonly keyframes = new LO<readonly DcaKeyframe[]>([])

  readonly time = new LO(0)
  readonly displayTime = new LO(0)
  readonly maxTime = new LO(1)
  readonly playing = new LO(false)
  displayTimeMatch: boolean = true

  readonly keyframeData: KeyframeLoopData
  readonly keyframeLayers = new LO<readonly KeyframeLayerData[]>([])

  readonly scroll = new LO(0)
  readonly zoom = new LO(1)

  constructor(project: DcProject, name: string) {
    this.name = new LO(name)
    this.project = project
    this.keyframeData = new KeyframeLoopData()

    this.time.addListener(value => {
      if (this.displayTimeMatch) {
        this.displayTime.value = value
      }
    })

    this.keyframes.addListener(value => {
      this.maxTime.value = Math.max(...value.map(k => k.startTime.value + k.duration.value))
    })
  }

  animate(delta: number) {
    if(this.playing.value) {
      this.time.value += delta
    }
    
    this.keyframes.value.forEach(kf => kf.animate(this.time.value))
  }
}

export type ProgressionPoint = { required?: boolean, x: number, y: number }

export class DcaKeyframe {
  readonly identifier: string
  layerId: number = 0
  readonly project: DcProject

  readonly startTime = new LO(0)
  readonly duration = new LO(0)

  readonly rotation = new LOMap<string, readonly [number, number, number]>()
  readonly position = new LOMap<string, readonly [number, number, number]>()
  readonly cubeGrow = new LOMap<string, readonly [number, number, number]>()

  readonly progressionPoints = new LO<readonly ProgressionPoint[]>([])

  skip = false

  constructor(project: DcProject) {
    this.identifier = v4()
    this.project = project

    this.progressionPoints.addListener((val, _, naughtyModifyValue) => {
      naughtyModifyValue(Array.from(val).sort((a, b) => a.x - b.x))
    })
  }

  animate(time: number) {
    //If below 0, then don't even bother animating
    let ticks = (time - this.startTime.value) / this.duration.value
    if (ticks <= 0 || this.skip) {
      return
    }
    //Clamp at 1
    if (ticks > 1) {
      ticks = 1
    }
    this.animatePercentage(this.getProgressionValue(ticks))
  }

  getProgressionValue(basePercentage: number) {
    const progressionPoints = this.progressionPoints.value
    for(let i = 0; i < progressionPoints.length - 1; i++) {
        let point = progressionPoints[i]
        let next = progressionPoints[i + 1]

        if(basePercentage > point.x && basePercentage < next.x) {
            let interpolateBetweenAmount = (basePercentage - point.x) / (next.x - point.x)
            return 1 - (point.y + (next.y - point.y) * interpolateBetweenAmount)
        }
    }
    return basePercentage //Shouldn't happen. There should always be at least the first and last progression point
  }

  animatePercentage(percentageDone: number) {
    //Animate the rotation
    this.rotation.forEach((values, key) => {
        let cube = this.project.model.cubeMap.get(key)?.cubeGroup
        if(cube) {
            let m = percentageDone*Math.PI/180
            cube.rotation.set(cube.rotation.x + values[0]*m, cube.rotation.y + values[1]*m, cube.rotation.z + values[2]*m)
        }
    })

    //Animate the position
    this.position.forEach((values, key) => {
        let cube = this.project.model.cubeMap.get(key)?.cubeGroup
        if(cube) {
            cube.position.set(cube.position.x + values[0]*percentageDone, cube.position.y + values[1]*percentageDone, cube.position.z + values[2]*percentageDone)
        }
    })

    //Animate the cube grow
    this.cubeGrow.forEach((values, key) => {
        let cube = this.project.model.cubeMap.get(key)
        if(cube) {
            let cm = cube.cubeMesh
            let cgg = cube.cubeGrowGroup

            if(cm === undefined || cgg === undefined) {
              return
            }

            cgg.position.set(cgg.position.x - values[0]*percentageDone, cgg.position.y - values[1]*percentageDone, cgg.position.z - values[2]*percentageDone)
            cm.scale.set(cm.scale.x + 2*values[0]*percentageDone, cm.scale.y + 2*values[1]*percentageDone, cm.scale.z + 2*values[2]*percentageDone)

            //0 scale fucks up some three.js stuff, we need to account for that
            if(cm.scale.x === 0) {
                cm.scale.x = 0.00001
            }
            if(cm.scale.y === 0) {
                cm.scale.y = 0.00001
            }
            if(cm.scale.z === 0) {
                cm.scale.z = 0.00001
            }
        }
    })
  }
}

export class KeyframeLayerData {

  //TODO: more stuff
  constructor(
    public readonly layerId: number
  ) {}
}

export class KeyframeLoopData {
  readonly exits = new LO(false)
  readonly start = new LO<number>(0)
  readonly end = new LO<number>(0)
  readonly duration = new LO<number>(0)
}