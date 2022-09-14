import { v4 } from 'uuid';
import { drawProgressionPointGraph, GraphType } from '../../../views/animator/logic/ProgressionPointGraph';
import { readFromClipboard, writeToClipboard } from '../../clipboard/Clipboard';
import { convertClipboardToKeyframe, KeyframeClipboardType, writeKeyframeForClipboard } from '../../clipboard/KeyframeClipboardType';
import { getUndefinedWritable } from '../../files/FileTypes';
import { LO } from '../../listenableobject/ListenableObject';
import { LOMap } from "../../listenableobject/ListenableObjectMap";
import SelectedCubeUndoRedoHandler from '../../undoredo/SelectedCubeUndoRedoHandler';
import UndoRedoHandler from '../../undoredo/UndoRedoHandler';
import DcProject from '../project/DcProject';
import { AnimatorGumball } from './../../../views/animator/logic/AnimatorGumball';
import { HistoryActionTypes, SectionHandle } from './../../undoredo/UndoRedoHandler';
import { NumArray } from './../../util/NumArray';
import { DCMCube, DCMModel } from './../model/DcmModel';
import AnimatorGumballConsumer, { AnimatorGumballConsumerPart } from './AnimatorGumballConsumer';
import DcaSoundLayer from './DcaSoundLayer';

const skeletal_export_named = "skeletal_export_named_"
const kfmap_position = "pos_"
const kfmap_rotation = "rot_"
const kfmap_cubegrow = "cg_"


type RootDataSectionType = {
  section_name: "root_data",
  data: {
    name: string,
    ikAnchorCubes: readonly string[],
    ikDirection: "upwards" | "downwards",
    keyframe_layers: readonly { layerId: number }[],
    propertiesMode: "local" | "global",
    time: number,

    loop_exists: boolean,
    loop_start: number,
    loop_end: number,
    loop_duration: number,

    [k: `${typeof skeletal_export_named}_${string}`]: string,
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
    [k: `${typeof kfmap_position}${string}`]: NumArray
    [k: `${typeof kfmap_rotation}${string}`]: NumArray
    [k: `${typeof kfmap_cubegrow}${string}`]: NumArray
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

export default class DcaAnimation extends AnimatorGumballConsumer {
  readonly identifier = v4()
  readonly project: DcProject

  private readonly onDirty = () => this.needsSaving.value = true

  readonly undoRedoHandler = new SelectedCubeUndoRedoHandler<UndoRedoDataType>(
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
  readonly pastedKeyframes = new LO<readonly KeyframeClipboardType[] | null>(null)

  readonly singleSelectedKeyframe = LO.createOneWayDelegateListener(this.selectedKeyframes, kfs => kfs.length === 1 ? kfs[0] : null)

  readonly time = new LO(0, this.onDirty).applyToSection(this._section, "time", true)
  readonly displayTime = new LO(0, this.onDirty)
  readonly maxTime = new LO(1, this.onDirty)
  readonly playing = new LO(false, this.onDirty)

  readonly loopData: KeyframeLoopData
  readonly loopingKeyframe: DcaKeyframe;
  readonly shouldContinueLooping = new LO(false)
  isCurrentlyLooping = false

  readonly keyframeLayers = new LO<readonly KeyframeLayerData[]>([], this.onDirty)

  readonly scroll = new LO(0, this.onDirty)
  readonly zoom = new LO(1, this.onDirty)

  // readonly lockedCubes = new LO<readonly string[]>([])
  readonly tempoaryParenting = new LOMap<string, string>() //{cube@identifier, tempParent@identifier}

  readonly keyframeStartOrDurationChanges = new Set<() => void>()

  isDraggingTimeline = false
  forceAnimationTime: number | null = null

  readonly saveableFile = new LO(false)
  readonly needsSaving = new LO(false)
  animationWritableFile = getUndefinedWritable("Animation File", ".dca")

  readonly animatorGumball: AnimatorGumball

  readonly keyframeNameOverrides = LOMap.applyToSectionStringKey(new LOMap<string, string>(), this._section, skeletal_export_named, false, "Keyframe Skeletal Override Change") //isSkeleton ? {identifier, name} : {name, identifier}
  readonly reverseKeyframeNameOverrides = new Map<string, string[]>() //name, [identifier]

  readonly soundLayers = new LO<readonly DcaSoundLayer[]>([], this.onDirty)

  private updatingTimeNaturally = false

  constructor(project: DcProject, name: string) {
    super()

    this.ikAnchorCubes.applyToSection(this._section, "ikAnchorCubes").addListener(this.onDirty)
    this.ikDirection.applyToSection(this._section, "ikDirection").addListener(this.onDirty)
    // this.lockedCubes.applyToSection(this._section, "lockedCubes").addListener(this.onDirty)

    this.name = new LO(name, this.onDirty).applyToSection(this._section, "name")
    this.project = project
    this.loopData = new KeyframeLoopData()
    this.animatorGumball = new AnimatorGumball(project)
    this.time.addListener(value => {
      if (!this.isCurrentlyLooping) {
        this.displayTime.value = value
      }
    })

    this.loopingKeyframe = new DcaKeyframe(this.project, this);

    this.loopData.exists.applyToSection(this._section, "loop_exists").addListener(this.onDirty)
    this.loopData.exists.addPostListener(() => this.onKeyframeChanged())

    this.loopData.start.applyToSection(this._section, "loop_start").addListener(this.onDirty)
    this.loopData.start.addPostListener(() => this.onKeyframeChanged())

    this.loopData.end.applyToSection(this._section, "loop_end").addListener(this.onDirty)
    this.loopData.end.addPostListener(() => this.onKeyframeChanged())

    this.loopData.duration.applyToSection(this._section, "loop_duration").addListener(this.onDirty)
    this.loopData.duration.addPostListener(() => this.onKeyframeChanged())


    this.loopData.start.addPreModifyListener((value, _, naughtyModifyValue) => {
      if (value > this.loopData.end.value) {
        const end = this.loopData.end.value
        this.loopData.end.value = value
        naughtyModifyValue(end)
      }
    })

    this.loopData.end.addPreModifyListener((value, _, naughtyModifyValue) => {
      if (value < this.loopData.start.value) {
        const start = this.loopData.start.value
        this.loopData.start.value = value
        naughtyModifyValue(start)
      }
    })

    this.needsSaving.addPreModifyListener((newValue, oldValue, naughtyModifyValue) => naughtyModifyValue(oldValue || (newValue && !this.undoRedoHandler.ignoreActions)))

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

    this.keyframeLayers.addPreModifyListener((newValue, _, naughtyModifyValue) => {
      if (newValue.length === 0) {
        naughtyModifyValue(newValue = [new KeyframeLayerData(this, 0)])
      }

      //Make sure there are enough layers for all the keyframes
      this.keyframes.value.forEach(kf => {
        if (!newValue.some(l => l.layerId === kf.layerId.value)) {
          newValue = newValue.concat(new KeyframeLayerData(this, kf.layerId.value))
        }
      })
      naughtyModifyValue(Array.from(newValue).sort((a, b) => a.layerId - b.layerId))
    })

    this.time.addListener(value => {

      this.soundLayers.value.forEach(layer => layer.instances.value.forEach(instance => {
        if (!this.playing.value) {
          if (instance.soundInstance !== null) {
            instance.soundInstance.playing.value = false
          }
          return
        }
        const timeOffset = value - instance.startTime.internalValue
        if (instance.sound !== null && instance.soundInstance !== null) {
          if (timeOffset >= 0 && timeOffset < instance.sound.duration) {
            if (!this.updatingTimeNaturally || instance.startTimeChanged) {
              instance.soundInstance.seek(timeOffset)
              instance.startTimeChanged = false
            }
            instance.soundInstance.playing.value = true
          } else {
            instance.soundInstance.playing.value = false
            const clampedTime = Math.max(0, Math.min(instance.sound.duration, timeOffset))
            instance.soundInstance.seek(clampedTime)
          }
        }
      }))
    })

    this.playing.addAndRunListener(playing => {
      this.soundLayers.value.forEach(layer => layer.instances.value.forEach(instance => {
        if (instance.soundInstance !== null) {
          instance.soundInstance.playing.value = playing
        }
      }))
    })
  }

  ensureLayerExists(layerId: number) {
    if (!this.keyframeLayers.value.some(l => l.layerId === layerId)) {
      this.keyframeLayers.value = this.keyframeLayers.value.concat(new KeyframeLayerData(this, layerId))
    }
  }

  getUndoRedoHandler(): UndoRedoHandler<any> | undefined {
    return this.undoRedoHandler
  }

  renderForGumball(): void {
    const kf = this.singleSelectedKeyframe.value
    if (kf !== null) {
      this.project.model.resetVisuals()
      this.animateAt(kf.startTime.value + kf.duration.value)
      this.project.model.updateMatrixWorld(true)
    }
  }

  getAnimatorGumball(): AnimatorGumball {
    return this.animatorGumball
  }

  getSingleSelectedPart(): LO<AnimatorGumballConsumerPart | null> {
    return this.singleSelectedKeyframe as any //TODO: Why does this need to be casted? 
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
    let time = this.time.value + delta;
    if (this.playing.value) {
      if (this.loopData.exists.value) {
        const loopStart = this.loopData.start.value
        const loopEnd = this.loopData.end.value
        const loopDuration = this.loopData.duration.value

        if (time >= loopEnd && (this.isCurrentlyLooping || this.shouldContinueLooping.value)) {
          //If the ticks are after the looping end + the looping duration, then set the ticks back.
          if (time - delta >= loopEnd + loopDuration) {
            this.time.value = time = loopStart + time - (loopEnd + loopDuration)
            this.isCurrentlyLooping = false
          } else {
            //Animate all the keyframes at the end, and animate the looping keyframe in reverse.
            const percentDone = (time - loopEnd) / loopDuration;
            this.displayTime.value = loopEnd + (loopStart - loopEnd) * percentDone
            this.loopingKeyframe.animate(time - loopEnd)
            time = loopEnd;
            this.isCurrentlyLooping = true
          }

        }
      } else {
        this.isCurrentlyLooping = false
      }

      this.updatingTimeNaturally = true
      this.time.value += delta
      this.updatingTimeNaturally = false

    }
    const skipForced = this.isDraggingTimeline || this.playing.value
    this.animateAt(skipForced ? time : (this.forceAnimationTime ?? time))
  }

  animateAt(time: number, includeInvisible: boolean = false) {
    const visibleLayers = this.keyframeLayers.value.filter(kfl => kfl.visible.value).map(kfl => kfl.layerId)
    this.keyframes.value.filter(kf => includeInvisible || visibleLayers.includes(kf.layerId.value)).forEach(kf => kf.animate(time))
  }

  createKeyframe(
    layerId = 0, identifier?: string, startTime?: number, duration?: number, selected?: boolean,
    rotation?: Map<string, NumArray>,
    position?: Map<string, NumArray>,
    cubeGrow?: Map<string, NumArray>,
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

  copyKeyframes() {
    if (this.selectedKeyframes.value.length === 0) {
      return
    }
    const kfData = this.selectedKeyframes.value.map(kf => writeKeyframeForClipboard(kf))
    writeToClipboard("keyframe", kfData)
  }

  pasteKeyframes(defined: boolean) {
    const clipBoard = readFromClipboard("keyframe")
    if (clipBoard !== null) {
      clipBoard.forEach(item => item.pasteAsDefined = defined)
      this.pastedKeyframes.value = clipBoard
    }
  }

  finishPaste() {
    if (this.pastedKeyframes.value !== null) {
      this.undoRedoHandler.startBatchActions()
      this.keyframes.value = this.keyframes.value.concat(this.pastedKeyframes.value.map(pkf => convertClipboardToKeyframe(this, pkf)))
      this.undoRedoHandler.endBatchActions("Pasted Keyframes")
      this.pastedKeyframes.value = null
    }
  }

  deleteSelectedKeyframes() {
    const selected = this.selectedKeyframes.value
    this.undoRedoHandler.startBatchActions()
    selected.forEach(kf => kf.delete())
    this.undoRedoHandler.endBatchActions(`${selected.length} Keyframe${selected.length === 1 ? "" : "s"} Deleted`, HistoryActionTypes.Remove)
  }

  deleteKeyframesLayers(layers: readonly number[] = Array.from(new Set(this.selectedKeyframes.value.map(kf => kf.layerId.value)))) {
    const selected = this.keyframes.value.filter(kf => layers.includes(kf.layerId.value))
    this.undoRedoHandler.startBatchActions()
    selected.forEach(kf => kf.delete())
    this.keyframeLayers.value
      .filter(layer => layers.includes(layer.layerId))
      .map(layer => layer.delete())
    this.undoRedoHandler.endBatchActions(`${layers.length} Keyframe Layer${selected.length === 1 ? "" : "s"} Deleted`, HistoryActionTypes.Remove)
  }

  cloneAnimation() {
    const animation = new DcaAnimation(this.project, this.name.value)

    animation.loopData.exists.value = this.loopData.exists.value
    animation.loopData.start.value = this.loopData.start.value
    animation.loopData.end.value = this.loopData.end.value
    animation.loopData.duration.value = this.loopData.duration.value

    animation.keyframes.value = this.keyframes.value.map(kf => kf.cloneBasics(animation))

    return animation
  }

  onKeyframeChanged(keyframe?: DcaKeyframe) {
    if (keyframe === this.loopingKeyframe) {
      return
    }
    this.needsSaving.value = true

    this.loopingKeyframe.rotation.clear()
    this.loopingKeyframe.position.clear()
    this.loopingKeyframe.cubeGrow.clear()

    this.project.model.resetVisuals()
    this.animateAt(this.loopData.start.value)
    const dataStart = this.captureModel()

    this.project.model.resetVisuals()
    this.animateAt(this.loopData.end.value)
    const dataEnd = this.captureModel()

    const subArrays = (a: NumArray, b: NumArray) => [
      a[0] - b[0],
      a[1] - b[1],
      a[2] - b[2],
    ] as const

    this.project.model.identifierCubeMap.forEach((cube, identifier) => {
      const start = dataStart[identifier]
      const end = dataEnd[identifier]
      if (start !== undefined && end !== undefined) {
        this.loopingKeyframe.rotation.set(cube.name.value, subArrays(start.rotation, end.rotation))
        this.loopingKeyframe.position.set(cube.name.value, subArrays(start.position, end.position))
        this.loopingKeyframe.cubeGrow.set(cube.name.value, subArrays(start.cubeGrow, end.cubeGrow))
      }
    })

    console.log(this.loopingKeyframe)

    this.loopingKeyframe.duration.value = this.loopData.duration.value
  }

  private captureModel() {
    const data: Record<string, Record<"rotation" | "position" | "cubeGrow", NumArray>> = {}

    Array.from(this.project.model.identifierCubeMap.values()).forEach(cube => {
      data[cube.identifier] = {
        rotation: [
          cube.cubeGroup.rotation.x,
          cube.cubeGroup.rotation.y,
          cube.cubeGroup.rotation.z,
        ],
        position: [
          cube.cubeGroup.position.x,
          cube.cubeGroup.position.y,
          cube.cubeGroup.position.z,
        ],
        cubeGrow: [
          cube.cubeGrowGroup.position.x,
          cube.cubeGrowGroup.position.y,
          cube.cubeGrowGroup.position.z,
        ],
      }
    })

    return data
  }

}

export type ProgressionPoint = Readonly<{ required?: boolean, x: number, y: number }>
export class DcaKeyframe extends AnimatorGumballConsumerPart {
  readonly layerId: LO<number>
  readonly project: DcProject
  readonly animation: DcaAnimation
  readonly _section: SectionHandle<UndoRedoDataType, KeyframeSectionType>

  private readonly onDirty = () => this.animation.onKeyframeChanged(this)

  readonly startTime: LO<number>
  readonly duration: LO<number>

  readonly selected: LO<boolean>

  isSettingGraph = false
  readonly graphType = new LO<GraphType>("None")
  readonly isGraphIn = new LO(true)
  readonly isGraphOut = new LO(true)
  readonly graphResolution = new LO(10)

  readonly rotation: LOMap<string, NumArray>
  readonly position: LOMap<string, NumArray>
  readonly cubeGrow: LOMap<string, NumArray>

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
    rotation?: Map<string, NumArray>,
    position?: Map<string, NumArray>,
    cubeGrow?: Map<string, NumArray>,
  ) {
    super()
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

    this.setupKeyframeListeners()

    this.layerId.addAndRunListener(layerId => {
      this.animation.ensureLayerExists(layerId)
    })
  }

  gumballGetPosition(cube: DCMCube): NumArray | undefined {
    return this.position.get(cube.name.value)
  }

  gumballGetRotation(cube: DCMCube): NumArray | undefined {
    return this.rotation.get(cube.name.value)
  }

  gumballSetPosition(cube: DCMCube, position: NumArray): void {
    this.position.set(cube.name.value, position)
  }

  gumballSetRotation(cube: DCMCube, rotation: NumArray): void {
    this.rotation.set(cube.name.value, rotation)
  }

  private setupKeyframeListeners() {
    let nextDefinedKeyframe: DcaKeyframe | null = null
    let didStartBatch = false
    const preCapturedDefinedModeData = new Map<DCMCube, {
      pos: NumArray,
      rot: NumArray,
      cg: NumArray,
    }>()
    const postCapturedDefinedModeData = new Map<DCMCube, {
      pos: NumArray,
      rot: NumArray,
      cg: NumArray,
    }>()
    // const cubeLockers: {
    //   locker: CubeLocker,
    //   position: NumArray,
    //   rotation: NumArray,
    // }[] = []
    // let isRecursing = false
    const onPreModify = () => {
      nextDefinedKeyframe = null
      didStartBatch = false
      preCapturedDefinedModeData.clear()
      // cubeLockers.length = 0

      // this.animation.project.model.resetVisuals()
      // this.animation.animateAt(this.startTime.value)
      // this.animation.project.model.updateMatrixWorld(true)
      // this.project.model.identifListToCubes(this.animation.lockedCubes.value).forEach(cube => {
      //   const pos = tempVec.copy(cube.cubeGroup.position)
      //   const quat = tempQuat.copy(cube.cubeGroup.quaternion)
      //   tempEuler.setFromQuaternion(quat, "ZYX")
      //   cubeLockers.push({
      //     locker: new CubeLocker(cube),
      //     position: [pos.x, pos.y, pos.z],
      //     rotation: [tempEuler.x * 180 / Math.PI, tempEuler.y * 180 / Math.PI, tempEuler.z * 180 / Math.PI],
      //   })
      // })

      if (this.animation.undoRedoHandler.isBatching()) {
        didStartBatch = true
        this.animation.undoRedoHandler.startBatchActions()
      } else {
        didStartBatch = false
      }

      const layer = this.animation.keyframeLayers.value.find(kfl => kfl.layerId === this.layerId.value)
      if (layer === undefined || !layer.definedMode.value) {
        return
      }

      const thisEndTime = this.startTime.value + this.duration.value
      const thisLayerEndAfterKeyframes = this.animation.keyframes.value
        .filter(kf => kf.layerId.value === this.layerId.value && kf.startTime.value + kf.duration.value > thisEndTime) //Has to end after this keyframe ends

      if (thisLayerEndAfterKeyframes.length === 0) {
        return
      }

      //Get the keyframe that ends first, after this keyframe
      const nextEndKeyframe = thisLayerEndAfterKeyframes.reduce((a, b) => (a.startTime.value + a.duration.value) < (b.startTime.value + b.duration.value) ? a : b)
      nextEndKeyframe.captureEndData(preCapturedDefinedModeData)
      nextDefinedKeyframe = nextEndKeyframe
    }

    const performModify = (
      cubeName: string,
      current: NumArray,
      target: NumArray,
      dataMap: LOMap<string, NumArray>,
      modifier = 1,
    ) => {
      if (target[0] !== current[0] || target[1] !== current[1] || target[2] !== current[2]) {
        let delta = [(target[0] - current[0]) * modifier, (target[1] - current[1]) * modifier, (target[2] - current[2]) * modifier]

        //map = map + (target - current) * modifier
        const mapValue = dataMap.get(cubeName) ?? [0, 0, 0]
        dataMap.set(cubeName, [
          mapValue[0] + delta[0],
          mapValue[1] + delta[1],
          mapValue[2] + delta[2]
        ])

      }
    }

    const onPostModify = () => {
      // if (isRecursing) {
      //   return
      // }
      // this.animation.project.model.resetVisuals()
      // this.animation.animateAt(this.startTime.value + this.duration.value, true)
      // this.animation.project.model.updateMatrixWorld(true)
      // isRecursing = true
      // cubeLockers.forEach(({ locker, position, rotation }) => {
      //   const values = CubeLocker.reconstructLockerValues(locker.cube, LockerType.POSITION_ROTATION, locker.worldMatrix)
      //   const posDelta = [values.position[0] - position[0], values.position[1] - position[1], values.position[2] - position[2]] as const
      //   const rotDelta = [values.rotation[0] - rotation[0], values.rotation[1] - rotation[1], values.rotation[2] - rotation[2]] as const
      //   if (posDelta[0] !== 0 || posDelta[1] !== 0 || posDelta[2] !== 0) {
      //     this.position.set(locker.cube.name.value, posDelta)
      //   }
      //   if (rotDelta[0] !== 0 || rotDelta[1] !== 0 || rotDelta[2] !== 0) {
      //     this.rotation.set(locker.cube.name.value, rotDelta)
      //   }
      // })
      // isRecursing = false

      if (nextDefinedKeyframe !== null) {
        nextDefinedKeyframe.captureEndData(postCapturedDefinedModeData)

        preCapturedDefinedModeData.forEach((targetValues, cube) => {
          const currentValues = postCapturedDefinedModeData.get(cube)
          if (currentValues === undefined || nextDefinedKeyframe === null) {
            return
          }

          performModify(cube.name.value, currentValues.pos, targetValues.pos, nextDefinedKeyframe.position)
          performModify(cube.name.value, currentValues.rot, targetValues.rot, nextDefinedKeyframe.rotation, 180 / Math.PI)
          performModify(cube.name.value, currentValues.cg, targetValues.cg, nextDefinedKeyframe.cubeGrow, -1)
        })
      }

      if (didStartBatch) {
        this.animation.undoRedoHandler.endBatchActions("Cube Moved")
      }

      nextDefinedKeyframe = null
      didStartBatch = false
      preCapturedDefinedModeData.clear()
    }

    this.position.addPreGlobalListener(onPreModify)
    this.rotation.addPreGlobalListener(onPreModify)
    this.cubeGrow.addPreGlobalListener(onPreModify)

    this.position.addGlobalListener(onPostModify)
    this.rotation.addGlobalListener(onPostModify)
    this.cubeGrow.addGlobalListener(onPostModify)
  }

  captureEndData(map = new Map<DCMCube, {
    pos: NumArray;
    rot: NumArray;
    cg: NumArray;
  }>()) {
    map.clear()
    this.project.model.resetVisuals()
    this.animation.animateAt(this.startTime.value + this.duration.value)
    this.project.model.identifierCubeMap.forEach(cube => {
      map.set(cube, {
        pos: [cube.cubeGroup.position.x, cube.cubeGroup.position.y, cube.cubeGroup.position.z],
        rot: [cube.cubeGroup.rotation.x, cube.cubeGroup.rotation.y, cube.cubeGroup.rotation.z],
        cg: [cube.cubeGrowGroup.position.x, cube.cubeGrowGroup.position.y, cube.cubeGrowGroup.position.z],
      })
    })
    return map
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
    this.animation.animateAt(time)
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

  animate(time: number, target?: DCMModel) {
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
    this.animatePercentage(this.getProgressionValue(ticks), target)
  }

  getProgressionValue(basePercentage: number) {
    const progressionPoints = this.progressionPoints.value
    for (let i = 0; i < progressionPoints.length - 1; i++) {
      let point = progressionPoints[i]
      let next = progressionPoints[i + 1]

      if (basePercentage >= point.x && basePercentage <= next.x) {
        let interpolateBetweenAmount = (basePercentage - point.x) / (next.x - point.x)
        return 1 - (point.y + (next.y - point.y) * interpolateBetweenAmount)
      }
    }
    return basePercentage //Shouldn't happen. There should always be at least the first and last progression point
  }

  forCubesByName(name: string, target: DCMModel | undefined, forEach: (cube: DCMCube) => void) {
    const model = target ?? this.project.model
    if (this.animation.isSkeleton.value) {
      const identifs = this.animation.reverseKeyframeNameOverrides.get(name)
      if (identifs) {
        identifs.forEach(id => {
          const cube = model.identifierCubeMap.get(id)
          if (cube) {
            forEach(cube)
          }
        })
      }
    } else if (this.animation.nameOverridesOnly.value) {
      this.animation.keyframeNameOverrides.forEach((_, identif) => {
        const cube = model.identifierCubeMap.get(identif)
        if (cube && cube.name.value === name) {
          forEach(cube)
        }
      })
    } else {
      const set = model.cubeMap.get(name)
      if (set) {
        set.forEach(c => forEach(c))
      }
    }
  }

  animatePercentage(percentageDone: number, target?: DCMModel) {
    //Animate the rotation
    this.rotation.forEach((values, key) => {
      this.forCubesByName(key, target, ({ cubeGroup: cube }) => {
        if (cube) {
          let m = percentageDone * Math.PI / 180
          cube.rotation.set(cube.rotation.x + values[0] * m, cube.rotation.y + values[1] * m, cube.rotation.z + values[2] * m)
        }
      })
    })

    //Animate the position
    this.position.forEach((values, key) => {
      this.forCubesByName(key, target, ({ cubeGroup: cube }) => {
        if (cube) {
          cube.position.set(cube.position.x + values[0] * percentageDone, cube.position.y + values[1] * percentageDone, cube.position.z + values[2] * percentageDone)
        }
      })
    })

    //Animate the cube grow
    this.cubeGrow.forEach((values, key) => {
      this.forCubesByName(key, target, (cube) => {
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
    private parentAnimation: DcaAnimation,
    readonly layerId: number,
    name = `Layer ${layerId}`,
    visible = true,
    locked = false,
    definedMode = false
  ) {
    const onDirty = () => parentAnimation.onKeyframeChanged()
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

  delete() {
    this.parentAnimation.keyframeLayers.value = this.parentAnimation.keyframeLayers.value.filter(kf => kf !== this)
    this._section.remove("Keyframe Layer Deleted")
  }
}

export class KeyframeLoopData {
  readonly exists = new LO(false)
  readonly start = new LO<number>(0)
  readonly end = new LO<number>(0)
  readonly duration = new LO<number>(0)
}