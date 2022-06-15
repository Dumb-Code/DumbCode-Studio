import { v4 } from 'uuid';
import { drawProgressionPointGraph, GraphType } from '../../../views/animator/logic/ProgressionPointGraph';
import UndoRedoHandler from '../../undoredo/UndoRedoHandler';
import { getUndefinedWritable } from '../../util/FileTypes';
import DcProject from '../project/DcProject';
import { AnimatorGumball } from './../../../views/animator/logic/AnimatorGumball';
import { HistoryActionTypes, SectionHandle } from './../../undoredo/UndoRedoHandler';
import { LO, LOMap } from './../../util/ListenableObject';
import { DCMCube } from './../model/DcmModel';

const skeletal_export_named = "skeletal_export_named_"
const kfmap_position = "pos_"
const kfmap_rotation = "rot_"
const kfmap_cubegrow = "cg_"

type RootDataSectionType = {
  section_name: "root_data",
  data: {
    name: string,
    keyframes: readonly string[],
    ikAnchorCubes: readonly string[],
    keyframe_layers: readonly { layerId: number }[],
    propertiesMode: "local" | "global",
    time: number,
    [k: `${typeof skeletal_export_named}_${string}`]: string
  }
}

type KeyframeSectionType = {
  section_name: `keyframe_${string}`
  data: {
    identifier: string, //Unchanging
    selected: boolean,
    startTime: number,
    duration: number,
    layerId: number,
    progressionPoints: readonly ProgressionPoint[]

    //Maps:
    [k: `${typeof kfmap_position}${string}`]: readonly [number, number, number]
    [k: `${typeof kfmap_rotation}${string}`]: readonly [number, number, number]
    [k: `${typeof kfmap_cubegrow}${string}`]: readonly [number, number, number]
  }
}

type KeyframeLayerSectionType = {
  section_name: `layer_${number}`
  data: {
    layerId: number,
    name: string
    visible: boolean
    locked: boolean
    definedMode: boolean
  }
}

type UndoRedoDataType = RootDataSectionType | KeyframeSectionType | KeyframeLayerSectionType

export default class DcaAnimation {
  readonly identifier = v4()
  readonly project: DcProject

  private readonly onDirty = () => this.needsSaving.value = true

  readonly undoRedoHandler = new UndoRedoHandler<UndoRedoDataType>(
    (s, d) => this.onAddSection(s, d),
    s => this.onRemoveSection(s),
    (s, p, v) => this.onModifySection(s, p, v),
  )
  readonly _section = this.undoRedoHandler.createNewSection("root_data")


  readonly isSkeleton = new LO(false)
  readonly nameOverridesOnly = new LO(false)

  readonly name: LO<string>
  readonly propertiesMode = new LO<"local" | "global">("global", this.onDirty).applyToSection(this._section, "propertiesMode")
  readonly keyframes = new LO<readonly DcaKeyframe[]>([], this.onDirty) //We don't apply this to undo/redo, as keyframes are sections and therefore handled with onAddSection/onRemoveSection
  readonly selectedKeyframes = new LO<readonly DcaKeyframe[]>([], this.onDirty)

  readonly time = new LO(0, this.onDirty).applyToSection(this._section, "time", true)
  readonly displayTime = new LO(0, this.onDirty)
  readonly maxTime = new LO(1, this.onDirty)
  readonly playing = new LO(false, this.onDirty)
  displayTimeMatch: boolean = true

  readonly keyframeData: KeyframeLoopData
  readonly keyframeLayers = new LO<readonly KeyframeLayerData[]>([], this.onDirty)

  readonly scroll = new LO(0, this.onDirty)
  readonly zoom = new LO(1, this.onDirty)

  readonly ikAnchorCubes = new LO<readonly string[]>([], this.onDirty).applyToSection(this._section, "ikAnchorCubes")

  readonly keyframeStartOrDurationChanges = new Set<() => void>()

  isDraggingTimeline = false
  forceAnimationTime: number | null = null

  readonly saveableFile = new LO(false)
  readonly needsSaving = new LO(false)
  animationWritableFile = getUndefinedWritable("Animation File", ".dca")

  readonly animatorGumball: AnimatorGumball

  readonly keyframeNameOverrides = LOMap.applyToSectionStringKey(new LOMap<string, string>(), this._section, skeletal_export_named, false, "Keyframe Skeletal Override Change") //isSkeleton ? {identifier, name} : {name, identifier}
  readonly reverseKeyframeNameOverrides = new Map<string, string[]>() //name, [identifier]

  constructor(project: DcProject, name: string) {
    this.name = new LO(name, this.onDirty).applyToSection(this._section, "name")
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

  onAddSection<K extends UndoRedoDataType['section_name']>(section: K, dataIn: any) {
    if (section === "root_data") {
      return
    } else if (section.startsWith("keyframe_")) {
      const data = dataIn as KeyframeSectionType['data']
      const {
        identifier, startTime, duration,
        progressionPoints, layerId, selected
      } = data
      this.createKeyframe(
        layerId, identifier, startTime, duration, selected,
        LOMap.extractSectionDataToMap(data, kfmap_rotation, s => s),
        LOMap.extractSectionDataToMap(data, kfmap_position, s => s),
        LOMap.extractSectionDataToMap(data, kfmap_cubegrow, s => s),
        progressionPoints
      )
    } else if (section.startsWith("layer_")) {
      const data = dataIn as KeyframeLayerSectionType['data']
      const { layerId, name, visible, locked, definedMode } = data
      this.keyframeLayers.value = this.keyframeLayers.value.concat(new KeyframeLayerData(this, layerId, name, visible, locked, definedMode))
    }
  }

  onRemoveSection(section: string) {
    if (section === "root_data") {
      return
    } else if (section.startsWith("keyframe_")) {
      const identif = section.substring("keyframe_".length, section.length)
      const kf = this.keyframes.value.find(kf => kf.identifier === identif)
      if (!kf) {
        throw new Error("Tried to remove keyframe that could not be found " + identif);
      }
      kf.delete()
    } else if (section.startsWith("layer_")) {
      const id = parseInt(section.substring("layer_".length, section.length))
      const layer = this.keyframeLayers.value.find(layer => layer.layerId === id)
      if (!layer) {
        throw new Error("Tried to remove keyframe layer that could not be found " + id);
      }
      this.keyframeLayers.value = this.keyframeLayers.value.filter(l => l !== layer)
    }
  }

  onModifySection(section_name: string, property_name: string, value: any) {
    if (section_name === "root_data") {
      this._section.applyModification(property_name, value)
    } else if (section_name.startsWith("keyframe_")) {
      const identif = section_name.substring("keyframe_".length, section_name.length)
      const kf = this.keyframes.value.find(kf => kf.identifier === identif)
      if (!kf) {
        throw new Error("Tried to modify keyframe that could not be found " + identif);
      }
      kf._section.applyModification(property_name, value)
    } else if (section_name.startsWith("layer_")) {
      const id = parseInt(section_name.substring("layer_".length, section_name.length))
      const layer = this.keyframeLayers.value.find(layer => layer.layerId === id)
      if (!layer) {
        throw new Error("Tried to modify keyframe layer that could not be found " + id);
      }
      layer._section.applyModification(property_name, value)
    }
  }

  callKeyframePositionsChanged() {
    Array.from(this.keyframeStartOrDurationChanges).forEach(f => f())
  }

  static createNew(project: DcProject) {
    const animation = new DcaAnimation(project, "New Animation")
    animation.keyframeLayers.value = animation.keyframeLayers.value.concat(new KeyframeLayerData(animation, 0))
    return animation
  }

  animate(delta: number) {
    if (this.playing.value) {
      this.time.value += delta
    }
    const time = this.time.value
    const skipForced = this.isDraggingTimeline || this.playing.value
    const playTime = skipForced ? time : (this.forceAnimationTime ?? time)

    const visibleLayers = this.keyframeLayers.value.filter(kfl => kfl.visible.value).map(kfl => kfl.layerId)

    this.keyframes.value.filter(kf => visibleLayers.includes(kf.layerId.value)).forEach(kf => kf.animate(playTime))
  }

  createKeyframe(
    layerId = 0, identifier?: string, startTime?: number, duration?: number, selected?: boolean,
    rotation?: Map<string, readonly [number, number, number]>,
    position?: Map<string, readonly [number, number, number]>,
    cubeGrow?: Map<string, readonly [number, number, number]>,
    progressionPoints?: readonly ProgressionPoint[],
  ) {
    const kf = new DcaKeyframe(this.project, this, identifier, layerId, startTime, duration, selected, progressionPoints, rotation, position, cubeGrow)
    //When startime changes, update the max time
    kf.startTime.addListener(value => {
      this.maxTime.value = Math.max(...this.keyframes.value.map(k => (k === kf ? value : k.startTime.value) + k.duration.value))
    })
    //When duration changes, update the max time
    kf.duration.addListener(value => {
      this.maxTime.value = Math.max(...this.keyframes.value.map(k => k.startTime.value + (k === kf ? value : k.duration.value)))
    })

    kf.layerId.value = layerId
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
  readonly layerId: LO<number>
  readonly project: DcProject
  readonly animation: DcaAnimation
  readonly _section: SectionHandle<UndoRedoDataType, KeyframeSectionType>

  private readonly onDirty = () => this.animation.needsSaving.value = true

  readonly startTime: LO<number>
  readonly duration: LO<number>

  readonly selected: LO<boolean>

  isSettingGraph = false
  readonly graphType = new LO<GraphType>("None")
  readonly isGraphIn = new LO(true)
  readonly isGraphOut = new LO(true)
  readonly graphResolution = new LO(10)

  readonly rotation: LOMap<string, readonly [number, number, number]>
  readonly position: LOMap<string, readonly [number, number, number]>
  readonly cubeGrow: LOMap<string, readonly [number, number, number]>

  readonly progressionPoints: LO<readonly ProgressionPoint[]>

  skip = false

  _previousForcedValue: number | null = null

  constructor(
    project: DcProject, animation: DcaAnimation,
    readonly identifier = v4(),
    layerId = 0,
    startTime = 0,
    duration = 1,
    selected = false,
    progressionPoints: readonly ProgressionPoint[] = [{ x: 0, y: 1, required: true }, { x: 1, y: 0, required: true }],
    rotation?: Map<string, readonly [number, number, number]>,
    position?: Map<string, readonly [number, number, number]>,
    cubeGrow?: Map<string, readonly [number, number, number]>,
  ) {
    this.project = project
    this.animation = animation


    //Typescript compiler throws errors when `keyframe_a` isn't there. We can trick it to know that `keyframe_{identifier}` is of type `keyframe_{string}`
    this._section = animation.undoRedoHandler.createNewSection(`keyframe_${this.identifier}` as `keyframe_a`, "Keyframe Properties Edit")
    this._section.modifyFirst("identifier", this.identifier, () => { throw new Error("Tried to modify identifier") })
    this.layerId = new LO(layerId, this.onDirty).applyToSection(this._section, "layerId")
    this.startTime = new LO(startTime, this.onDirty).applyToSection(this._section, "startTime")
    this.duration = new LO(duration, this.onDirty).applyToSection(this._section, "duration")
    this.selected = new LO(selected, this.onDirty).applyToSection(this._section, "selected")

    this.rotation = LOMap.applyToSectionStringKey(new LOMap(rotation, this.onDirty), this._section, kfmap_rotation, false, "Rotations Changed")
    this.position = LOMap.applyToSectionStringKey(new LOMap(position, this.onDirty), this._section, kfmap_position, false, "Positions Changed")
    this.cubeGrow = LOMap.applyToSectionStringKey(new LOMap(cubeGrow, this.onDirty), this._section, kfmap_cubegrow, false, "Cube Grow Changed")

    this.progressionPoints = new LO(progressionPoints, this.onDirty).applyToSection(this._section, "progressionPoints")

    this._section.pushCreation("Keyframe Created", HistoryActionTypes.Add)

    this.progressionPoints.addListener(pp => {
      if (!this.isSettingGraph) {
        this.graphType.value = pp.length === 2 ? "None" : "Custom"
      }
    })

    this.graphType.addListener(type => {
      if (type !== "None" && type !== "Custom")
        this.createProgressionPointsGraph({ type })
    })
    this.isGraphIn.addListener(isIn => this.createProgressionPointsGraph({ isIn }))
    this.isGraphOut.addListener(isOut => this.createProgressionPointsGraph({ isOut }))
    this.graphResolution.addListener(resolution => this.createProgressionPointsGraph({ resolution }))


    this.startTime.addListener(() => this.animation.callKeyframePositionsChanged())
    this.duration.addListener(() => this.animation.callKeyframePositionsChanged())

    this.progressionPoints.addPreModifyListener((val, _, naughtyModifyValue) => {
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

  createProgressionPointsGraph({ type = this.graphType.value, resolution = this.graphResolution.value, isIn = this.isGraphIn.value, isOut = this.isGraphOut.value }) {
    const points = drawProgressionPointGraph(type, resolution, isIn, isOut)
    this.isSettingGraph = true
    this.progressionPoints.value = points
    this.isSettingGraph = false
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

      if (basePercentage >= point.x && basePercentage < next.x) {
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
    this._section.remove("Keyframe Deleted")
  }

  cloneBasics(animation: DcaAnimation) {
    const keyframe = animation.createKeyframe(this.layerId.value)

    keyframe.startTime.value = this.startTime.value
    keyframe.duration.value = this.duration.value

    keyframe.rotation.putAllSilently(this.rotation)
    keyframe.position.putAllSilently(this.position)
    keyframe.cubeGrow.putAllSilently(this.cubeGrow)

    return keyframe
  }
}
export class KeyframeLayerData {

  readonly _section: SectionHandle<UndoRedoDataType, KeyframeLayerSectionType>

  readonly name: LO<string>
  readonly visible: LO<boolean>
  readonly locked: LO<boolean>
  readonly definedMode: LO<boolean>

  constructor(
    parentAnimation: DcaAnimation,
    readonly layerId: number,
    name = `Layer ${layerId}`,
    visible = true,
    locked = false,
    definedMode = false
  ) {
    const onDirty = () => parentAnimation.needsSaving.value = true
    this._section = parentAnimation.undoRedoHandler.createNewSection(`layer_${this.layerId}` as `layer_0`) //layer_0 is to trick the compiler to knowing that layer_{layerid} a number 
    this._section.modifyFirst("layerId", this.layerId, () => { throw new Error("Tried to modify layerId") })

    this.name = new LO(name, onDirty).applyToSection(this._section, "name")
    this.visible = new LO(visible, onDirty).applyToSection(this._section, "visible")
    this.locked = new LO(locked, onDirty).applyToSection(this._section, "locked")
    this.definedMode = new LO(definedMode, onDirty).applyToSection(this._section, "definedMode")

    //When locked, we need to deselect these keyframes
    this.locked.addListener(newValue => {
      if (newValue) {
        parentAnimation.selectedKeyframes.value = parentAnimation.selectedKeyframes.value.filter(kf => kf.layerId.value !== this.layerId)
      }
    })

    if (this.layerId !== 0) {
      this._section.pushCreation("Layer Created")
    }
  }
}

export class KeyframeLoopData {
  readonly exits = new LO(false)
  readonly start = new LO<number>(0)
  readonly end = new LO<number>(0)
  readonly duration = new LO<number>(0)
}