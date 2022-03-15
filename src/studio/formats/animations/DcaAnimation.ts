import { v4 } from 'uuid';
import { getUndefinedWritable } from '../../util/FileTypes';
import DcProject from '../project/DcProject';
import { AnimatorGumball } from './../../../views/animator/logic/AnimatorGumball';
import { LO, LOMap } from './../../util/ListenableObject';
import { DCMCube } from './../model/DcmModel';

const cubeMetadataAnimationNameOverrideKey = "animation_name"

export default class DcaAnimation {
  readonly identifier = v4()
  readonly project: DcProject

  private readonly onDirty = () => this.needsSaving.value = true

  readonly isSkeleton = new LO(false)
  readonly nameOverridesOnly = new LO(false)

  readonly name: LO<string>
  readonly propertiesMode = new LO<"local" | "global">("global", this.onDirty)
  readonly keyframes = new LO<readonly DcaKeyframe[]>([], this.onDirty)
  readonly selectedKeyframes = new LO<readonly DcaKeyframe[]>([], this.onDirty)

  readonly time = new LO(0, this.onDirty)
  readonly displayTime = new LO(0, this.onDirty)
  readonly maxTime = new LO(1, this.onDirty)
  readonly playing = new LO(false, this.onDirty)
  displayTimeMatch: boolean = true

  readonly keyframeData: KeyframeLoopData
  readonly keyframeLayers = new LO<readonly KeyframeLayerData[]>([], this.onDirty)

  readonly scroll = new LO(0, this.onDirty)
  readonly zoom = new LO(1, this.onDirty)

  readonly ikAnchorCubes = new LO<readonly string[]>([], this.onDirty)

  readonly keyframeStartOrDurationChanges = new Set<() => void>()

  isDraggingTimeline = false
  forceAnimationTime: number | null = null

  readonly saveableFile = new LO(false)
  readonly needsSaving = new LO(false)
  animationWritableFile = getUndefinedWritable("Animation File", ".dca")

  readonly animatorGumball: AnimatorGumball

  readonly keyframeNameOverrides = new LOMap<string, string>() //identifier, name
  readonly reverseKeyframeNameOverrides = new Map<string, string[]>() //name, [identifier]

  constructor(project: DcProject, name: string) {
    this.name = new LO(name, this.onDirty)
    this.project = project
    this.keyframeData = new KeyframeLoopData()
    this.animatorGumball = new AnimatorGumball(project.selectedCubeManager, project.model, project.group, project.overlayGroup)
    this.time.addListener(value => {
      if (this.displayTimeMatch) {
        this.displayTime.value = value
      }
    })

    this.keyframes.addListener(value => {
      this.maxTime.value = Math.max(...value.map(k => k.startTime.value + k.duration.value))
    })

    this.keyframeNameOverrides.addGlobalListener(() => {
      this.reverseKeyframeNameOverrides.clear()
      this.keyframeNameOverrides.forEach((nameOverride, identifier) => {
        const array = this.reverseKeyframeNameOverrides.get(nameOverride) ?? []
        array.push(identifier)
        this.reverseKeyframeNameOverrides.set(nameOverride, array)
      })
    })
  }

  callKeyframePositionsChanged() {
    Array.from(this.keyframeStartOrDurationChanges).forEach(f => f())
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

  cloneAnimation() {
    const animation = new DcaAnimation(this.project, this.name.value)

    animation.keyframeData.exits.value = this.keyframeData.exits.value
    animation.keyframeData.start.value = this.keyframeData.start.value
    animation.keyframeData.end.value = this.keyframeData.end.value
    animation.keyframeData.duration.value = this.keyframeData.duration.value

    animation.keyframes.value = this.keyframes.value.map(kf => kf.cloneBasics(animation))

    return animation
  }

}

export type ProgressionPoint = { required?: boolean, x: number, y: number }

export class DcaKeyframe {
  readonly identifier: string
  layerId: number = 0
  readonly project: DcProject
  readonly animation: DcaAnimation

  private readonly onDirty = () => this.animation.needsSaving.value = true

  readonly startTime = new LO(0, this.onDirty)
  readonly duration = new LO(1, this.onDirty)

  readonly selected = new LO(false, this.onDirty)

  readonly rotation = new LOMap<string, readonly [number, number, number]>(this.onDirty)
  readonly position = new LOMap<string, readonly [number, number, number]>(this.onDirty)
  readonly cubeGrow = new LOMap<string, readonly [number, number, number]>(this.onDirty)

  readonly progressionPoints = new LO<readonly ProgressionPoint[]>([], this.onDirty)

  skip = false

  _previousForcedValue: number | null = null

  constructor(project: DcProject, animation: DcaAnimation) {
    this.identifier = v4()
    this.project = project
    this.animation = animation


    this.startTime.addListener(() => this.animation.callKeyframePositionsChanged())
    this.duration.addListener(() => this.animation.callKeyframePositionsChanged())

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

  _oneSelectedCube() {
    const list = this.project.selectedCubeManager.selected.value
    if (list.length !== 1) {
      return
    }
    const cube = this.project.model.identifierCubeMap.get(list[0])
    if (!cube) {
      return
    }
    return cube
  }

  wrapToSetValue(callback: () => void) {
    this.skip = true
    this.project.model.resetVisuals()
    const time = this.startTime.value + this.duration.value
    this.animation.keyframes.value.forEach(kf => kf.animate(time))
    callback()
    this.skip = false
  }

  setPositionAbsolute(x: number, y: number, z: number, cube = this._oneSelectedCube()) {
    this.wrapToSetValue(() => this.setPositionAbsoluteAnimated(cube, x, y, z))
  }
  setPositionAbsoluteAnimated(cube: DCMCube | undefined, x: number, y: number, z: number) {
    if (!cube) return
    const pos = cube.cubeGroup.position
    this.position.set(cube.name.value, [
      x - pos.x,
      y - pos.y,
      z - pos.z,
    ])
  }

  setRotationAbsolute(x: number, y: number, z: number, cube = this._oneSelectedCube()) {
    this.wrapToSetValue(() => this.setRotationAbsoluteAnimated(cube, x, y, z))
  }
  setRotationAbsoluteAnimated(cube: DCMCube | undefined, x: number, y: number, z: number) {
    if (!cube) return
    const rotation = cube.cubeGroup.rotation
    this.rotation.set(cube.name.value, [
      x - (rotation.x * 180 / Math.PI),
      y - (rotation.y * 180 / Math.PI),
      z - (rotation.z * 180 / Math.PI),
    ])
  }

  setCubeGrowAbsolute(x: number, y: number, z: number, cube = this._oneSelectedCube()) {
    this.wrapToSetValue(() => this.setCubeGrowAbsoluteAnimated(cube, x, y, z))
  }
  setCubeGrowAbsoluteAnimated(cube: DCMCube | undefined, x: number, y: number, z: number) {
    if (!cube) return
    const pos = cube.cubeGrowGroup.position //This is all inversed. We need to do `values - (-pos)`, so `values + pos`
    this.cubeGrow.set(cube.name.value, [
      x + pos.x,
      y + pos.y,
      z + pos.z,
    ])
  }

  animate(time: number) {
    if (this.skip) {
      return
    }
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

  forCubesByName(name: string, forEach: (cube: DCMCube) => void) {
    if (this.animation.isSkeleton.value) {
      const identifs = this.animation.reverseKeyframeNameOverrides.get(name)
      if (identifs) {
        identifs.forEach(id => {
          const cube = this.project.model.identifierCubeMap.get(id)
          if (cube) {
            forEach(cube)
          }
        })
      }
    } else if (this.animation.nameOverridesOnly.value) {
      this.animation.keyframeNameOverrides.forEach((_, identif) => {
        const cube = this.project.model.identifierCubeMap.get(identif)
        if (cube && cube.name.value === name) {
          forEach(cube)
        }
      })
    } else {
      const set = this.project.model.cubeMap.get(name)
      if (set) {
        set.forEach(c => forEach(c))
      }
    }
  }

  animatePercentage(percentageDone: number) {
    //Animate the rotation
    this.rotation.forEach((values, key) => {
      this.forCubesByName(key, ({ cubeGroup: cube }) => {
        if (cube) {
          let m = percentageDone * Math.PI / 180
          cube.rotation.set(cube.rotation.x + values[0] * m, cube.rotation.y + values[1] * m, cube.rotation.z + values[2] * m)
        }
      })
    })

    //Animate the position
    this.position.forEach((values, key) => {
      this.forCubesByName(key, ({ cubeGroup: cube }) => {
        if (cube) {
          cube.position.set(cube.position.x + values[0] * percentageDone, cube.position.y + values[1] * percentageDone, cube.position.z + values[2] * percentageDone)
        }
      })
    })

    //Animate the cube grow
    this.cubeGrow.forEach((values, key) => {
      this.forCubesByName(key, (cube) => {
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
      })
    })
  }

  delete() {
    this.selected.value = false
    this.animation.keyframes.value = this.animation.keyframes.value.filter(kf => kf !== this)
  }

  cloneBasics(animation: DcaAnimation) {
    const keyframe = animation.createKeyframe(this.layerId)

    keyframe.startTime.value = this.startTime.value
    keyframe.duration.value = this.duration.value

    keyframe.rotation.putAllSilently(this.rotation)
    keyframe.position.putAllSilently(this.position)
    keyframe.cubeGrow.putAllSilently(this.cubeGrow)

    return keyframe
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