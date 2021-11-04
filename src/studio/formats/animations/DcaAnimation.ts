import { v4 } from 'uuid';
import DcProject from '../project/DcProject';
import { LO, LOMap } from './../../util/ListenableObject';

export default class DcaAnimation {
  readonly identifier = v4()
  readonly project: DcProject

  name: LO<string>
  readonly keyframes = new LO<readonly DcaKeyframe[]>([])
  readonly selectedKeyframes = new LO<readonly DcaKeyframe[]>([])

  readonly time = new LO(0)
  readonly displayTime = new LO(0)
  readonly maxTime = new LO(1)
  readonly playing = new LO(false)
  displayTimeMatch: boolean = true

  readonly keyframeData: KeyframeLoopData
  readonly keyframeLayers = new LO<readonly KeyframeLayerData[]>([])

  readonly scroll = new LO(0)
  readonly zoom = new LO(1)

  isDraggingTimeline = false
  forceAnimationTime: number | null = null

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

  static createNew(project: DcProject) {
    const animation = new DcaAnimation(project, "New Animation")
    animation.keyframeLayers.value = animation.keyframeLayers.value.concat({ layerId: 0 })
    return animation
  }

  animate(delta: number) {
    if (this.playing.value) {
      this.time.value += delta
    }
    const time = this.time.value
    const skipForced = this.isDraggingTimeline || this.playing.value
    this.keyframes.value.forEach(kf => kf.animate(skipForced ? time : (this.forceAnimationTime ?? time)))
  }

  createKeyframe(layerId = 0) {
    const kf = new DcaKeyframe(this.project, this)
    //When startime changes, update the max time
    kf.startTime.addListener(value => {
      this.maxTime.value = Math.max(...this.keyframes.value.map(k => (k === kf ? value : k.startTime.value) + k.duration.value))
    })
    //When duration changes, update the max time
    kf.duration.addListener(value => {
      this.maxTime.value = Math.max(...this.keyframes.value.map(k => k.startTime.value + (k === kf ? value : k.duration.value)))
    })
    kf.layerId = layerId
    this.keyframes.value = this.keyframes.value.concat(kf)
    return kf
  }

}

export type ProgressionPoint = { required?: boolean, x: number, y: number }

export class DcaKeyframe {
  readonly identifier: string
  layerId: number = 0
  readonly project: DcProject
  readonly animation: DcaAnimation

  readonly startTime = new LO(0)
  readonly duration = new LO(1)

  readonly selected = new LO(false)

  readonly rotation = new LOMap<string, readonly [number, number, number]>()
  readonly position = new LOMap<string, readonly [number, number, number]>()
  readonly cubeGrow = new LOMap<string, readonly [number, number, number]>()

  readonly progressionPoints = new LO<readonly ProgressionPoint[]>([])

  skip = false

  constructor(project: DcProject, animation: DcaAnimation) {
    this.identifier = v4()
    this.project = project
    this.animation = animation

    this.progressionPoints.addListener((val, _, naughtyModifyValue) => {
      naughtyModifyValue(Array.from(val).sort((a, b) => a.x - b.x))
    })

    this.selected.addListener(value => {
      const list = this.animation.selectedKeyframes
      if (value) {
        if (!list.value.includes(this)) {
          list.value = list.value.concat(this)
        }
      } else {
        list.value = list.value.filter(val => val !== this)
      }
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
    for (let i = 0; i < progressionPoints.length - 1; i++) {
      let point = progressionPoints[i]
      let next = progressionPoints[i + 1]

      if (basePercentage > point.x && basePercentage < next.x) {
        let interpolateBetweenAmount = (basePercentage - point.x) / (next.x - point.x)
        return 1 - (point.y + (next.y - point.y) * interpolateBetweenAmount)
      }
    }
    return basePercentage //Shouldn't happen. There should always be at least the first and last progression point
  }

  animatePercentage(percentageDone: number) {
    //Animate the rotation
    this.rotation.forEach((values, key) => {
      this.project.model.cubeMap.get(key)?.forEach(({ cubeGroup: cube }) => {
        if (cube) {
          let m = percentageDone * Math.PI / 180
          cube.rotation.set(cube.rotation.x + values[0] * m, cube.rotation.y + values[1] * m, cube.rotation.z + values[2] * m)
        }
      })
    })

    //Animate the position
    this.position.forEach((values, key) => {
      this.project.model.cubeMap.get(key)?.forEach(({ cubeGroup: cube }) => {
        if (cube) {
          cube.position.set(cube.position.x + values[0] * percentageDone, cube.position.y + values[1] * percentageDone, cube.position.z + values[2] * percentageDone)
        }
      })
    })

    //Animate the cube grow
    this.cubeGrow.forEach((values, key) => {
      this.project.model.cubeMap.get(key)?.forEach((cube) => {
        if (cube) {
          let cm = cube.cubeMesh
          let cgg = cube.cubeGrowGroup

          if (cm === undefined || cgg === undefined) {
            return
          }

          cgg.position.set(cgg.position.x - values[0] * percentageDone, cgg.position.y - values[1] * percentageDone, cgg.position.z - values[2] * percentageDone)
          cm.scale.set(cm.scale.x + 2 * values[0] * percentageDone, cm.scale.y + 2 * values[1] * percentageDone, cm.scale.z + 2 * values[2] * percentageDone)

          //0 scale fucks up some three.js stuff, we need to account for that
          if (cm.scale.x === 0) {
            cm.scale.x = 0.00001
          }
          if (cm.scale.y === 0) {
            cm.scale.y = 0.00001
          }
          if (cm.scale.z === 0) {
            cm.scale.z = 0.00001
          }
        }
      })
    })
  }

  delete() {
    this.selected.value = false
    this.animation.keyframes.value = this.animation.keyframes.value.filter(kf => kf !== this)
  }
}

export class KeyframeLayerData {

  //TODO: more stuff
  constructor(
    public readonly layerId: number
  ) { }
}

export class KeyframeLoopData {
  readonly exits = new LO(false)
  readonly start = new LO<number>(0)
  readonly end = new LO<number>(0)
  readonly duration = new LO<number>(0)
}