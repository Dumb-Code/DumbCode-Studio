import Image from "next/image";
import { createContext, MouseEvent as ReactMouseEvent, MutableRefObject, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { SvgArrows, SVGEye, SVGEyeOff, SVGLocked, SVGPlus, SVGSettings, SVGUnlocked } from "../../../components/Icons";
import { useCreatePortal } from "../../../contexts/CreatePortalContext";
import { useOptions } from "../../../contexts/OptionsContext";
import { useStudio } from "../../../contexts/StudioContext";
import { useToast } from "../../../contexts/ToastContext";
import { useTooltipRef } from "../../../contexts/TooltipContext";
import { useDialogBoxes } from "../../../dialogboxes/DialogBoxes";
import KeyframeLayerDialogBox from "../../../dialogboxes/KeyframeLayerDialogBox";
import NewAnimationSoundDialogBox from "../../../dialogboxes/NewAnimationSoundDialogBox";
import { KeyframeClipboardType } from "../../../studio/clipboard/KeyframeClipboardType";
import DcaAnimation, { DcaKeyframe, KeyframeLayerData } from "../../../studio/formats/animations/DcaAnimation";
import DcaSoundLayer, { DcaSoundLayerInstance } from "../../../studio/formats/animations/DcaSoundLayer";
import { StudioSound } from "../../../studio/formats/sounds/StudioSound";
import { useListenableObject, useListenableObjectNullable, useListenableObjectToggle } from "../../../studio/listenableobject/ListenableObject";
import { HistoryActionTypes } from "../../../studio/undoredo/UndoRedoHandler";
import { useDraggbleRef } from "../../../studio/util/DraggableElementRef";
import { AnimationLayerButton, AnimationTimelineLayer, blockPerSecond, width } from "./AnimatorTimelineLayer";

//This whole thing is gross, messy and complicated.
//A lot of it is old staticfile code that's been chopped up into react code
//Not happy with this file, lots of gross stuff happeneing
//TODO: fix this file lol
const AnimatorTimeline = () => {
    const { getSelectedProject } = useStudio()
    const selectedProject = getSelectedProject()

    const [animation] = useListenableObject(selectedProject.animationTabs.selectedAnimation)
    const onBackgroundClicked = () => {
        if (!animation) {
            return
        }
        animation.selectedKeyframes.value.forEach(kf => kf.selected.value = false)
    }
    return (
        <div onClick={onBackgroundClicked} className="rounded-sm dark:bg-gray-800 bg-gray-200 h-full pt-2 overflow-x-hidden overflow-y-scroll studio-scrollbar">
            {animation !== null ?
                <AnimationLayers animation={animation} /> :
                <div className="w-full h-full flex justify-center items-center text-gray-400 dark:text-gray-600">
                    No Animation Selected
                </div>
            }
        </div>
    )
}

type ListenerEffect = (func: (scroll: number, pixelsPerSecond: number) => void) => void

export const ScrollZoomContext = createContext<{
    readonly addAndRunListener: ListenerEffect
    readonly removeListener: ListenerEffect
    readonly getPixelsPerSecond: () => number
    readonly getScroll: () => number
    readonly getDraggingKeyframeRef: () => MutableRefObject<DcaKeyframe | KeyframeClipboardType[] | null>
    readonly setHoveredLayerAndPosition: (value: number | null, clientX: number | null) => void
}>({
    addAndRunListener: () => { throw new Error("Invalid Call") },
    removeListener: () => { throw new Error("Invalid Call") },
    getPixelsPerSecond: () => 1,
    getScroll: () => 0,
    getDraggingKeyframeRef: () => { throw new Error("Invalid Call") },
    setHoveredLayerAndPosition: () => { },
})

const AnimationLayers = ({ animation }: { animation: DcaAnimation }) => {
    const [layers, setLayers] = useListenableObject(animation.keyframeLayers)
    const [keyframes] = useListenableObject(animation.keyframes)
    const [pastedKeyframes, setPastedKeyframes] = useListenableObject(animation.pastedKeyframes)

    const [hoveredLayer, setHoveredLayer] = useState<number | null>(null)
    const [hoveredLayerClientX, setHoveredLayerClientX] = useState<number | null>(null)

    const [soundLayers, setSoundLayers] = useListenableObject(animation.soundLayers)

    const listeners = useRef(new Set<(scroll: number, zoom: number) => void>())
    const addAndRunListener: ListenerEffect = useCallback(func => {
        func(animation.scroll.value, animation.zoom.value * blockPerSecond * width)
        listeners.current.add(func)
    }, [animation.scroll.value, animation.zoom.value])
    const removeListener: ListenerEffect = useCallback(func => listeners.current.delete(func), [])


    const onScrollChange = useCallback((val: number) => {
        listeners.current.forEach(l => l(val, animation.zoom.value * blockPerSecond * width))
    }, [animation.zoom.value])
    const onZoomChange = useCallback((val: number) => {
        listeners.current.forEach(l => l(animation.scroll.value, val * blockPerSecond * width))
    }, [animation.scroll.value])
    useEffect(() => {
        animation.scroll.addListener(onScrollChange)
        animation.zoom.addListener(onZoomChange)
        return () => {
            animation.scroll.removeListener(onScrollChange)
            animation.zoom.removeListener(onZoomChange)
        }
    }, [animation.scroll, animation.zoom, onScrollChange, onZoomChange, animation])

    const [keyframesByLayers, setKeyframesByLayers] = useState<{ layer: KeyframeLayerData, keyframes: (DcaKeyframe | KeyframeClipboardType)[] }[]>([])
    useEffect(() => {
        const onChange = () => {
            const result: typeof keyframesByLayers = []

            layers.forEach(layer => {
                const filtered: (DcaKeyframe | KeyframeClipboardType)[] = keyframes.filter(k => k.layerId.value === layer.layerId)
                if (pastedKeyframes !== null && hoveredLayer !== null) {
                    pastedKeyframes.filter(kf => kf.layerId === layer.layerId).forEach(kf => filtered.push(kf))
                }
                result.push({
                    layer,
                    keyframes: filtered
                })
            })
            setKeyframesByLayers(result)
        }

        const keyframesClone = [...keyframes]
        for (const kf of keyframesClone) {
            kf.layerId.addPostListener(onChange)
        }
        onChange()
        return () => {
            for (const kf of keyframesClone) {
                kf.layerId.removePostListener(onChange)
            }
        }
    }, [layers, keyframes, pastedKeyframes, hoveredLayer])


    const addLayer = useCallback((e: ReactMouseEvent) => {
        const layerId = layers.reduce((x, y) => Math.max(x, y.layerId + 1), 0)
        setLayers(layers.concat(new KeyframeLayerData(animation, layerId)))
        e.stopPropagation()
    }, [layers, animation, setLayers])

    const addSoundLayer = useCallback((e: ReactMouseEvent) => {
        const newLayer = new DcaSoundLayer(animation)
        setSoundLayers(soundLayers.concat(newLayer))
        e.stopPropagation()
    }, [soundLayers, animation, setSoundLayers])

    const getPixelsPerSecond = useCallback(() => {
        return width * blockPerSecond * animation.zoom.value
    }, [animation])
    const getScroll = useCallback(() => animation.scroll.value, [animation])

    const draggingKeyframeRef = useRef<DcaKeyframe | KeyframeClipboardType[] | null>(null)
    const getDraggingKeyframeRef = useCallback(() => draggingKeyframeRef, [])

    const setHoveredLayerAndPosition = useCallback((layer: number | null, clientX: number | null) => {
        setHoveredLayer(layer)
        setHoveredLayerClientX(clientX)
    }, [])

    const context = useMemo(() => ({
        addAndRunListener,
        removeListener,
        getPixelsPerSecond,
        getScroll,
        getDraggingKeyframeRef,
        setHoveredLayerAndPosition,
    }), [addAndRunListener, removeListener, getPixelsPerSecond, getScroll, getDraggingKeyframeRef, setHoveredLayerAndPosition])

    useEffect(() => {
        if (pastedKeyframes !== null && pastedKeyframes.length !== 0 && hoveredLayer !== null && hoveredLayerClientX !== null) {
            const first = pastedKeyframes.reduce((prev, cur) => prev.start < cur.start ? prev : cur)
            const firstId = first.originalLayerId
            const firstStart = first.originalStart

            const maxLayer = Math.max(...layers.map(layer => layer.layerId))

            const hoveredLayerStart = (hoveredLayerClientX - getScroll()) / getPixelsPerSecond()

            const newValue = pastedKeyframes.map(kft => ({
                ...kft,
                layerId: Math.min(Math.max(hoveredLayer + (kft.originalLayerId - firstId), 0), maxLayer),
                start: hoveredLayerStart + (kft.originalStart - firstStart)
            }))

            const changed = newValue.some((kft, index) => kft.layerId !== pastedKeyframes[index].layerId || kft.start !== pastedKeyframes[index].start)

            if (changed) {
                setPastedKeyframes(newValue)
            }
        }
    }, [pastedKeyframes, hoveredLayer, hoveredLayerClientX, getPixelsPerSecond, getScroll, layers, setPastedKeyframes])

    return (
        <ScrollZoomContext.Provider value={context}>
            <>
                {soundLayers.map(layer => <SoundLayer key={layer.identifier} animation={animation} soundLayer={layer} />)}
                {keyframesByLayers.map(({ layer, keyframes }) => <AnimationLayer key={layer.layerId} animation={animation} keyframes={keyframes} layer={layer} />)}
                <div className="flex flex-row">
                    <LayerButton text="Transformation Layer" addLayer={addLayer} />
                    <LayerButton text="Sound Layer" addLayer={addSoundLayer} />
                    <LayerButton text="Event Layer" addLayer={addLayer} />
                </div>
                <PastedKeyframePortal animation={animation} pastedKeyframes={pastedKeyframes} hoveredLayer={hoveredLayer} />
            </>
        </ScrollZoomContext.Provider>
    )
}


const PastedKeyframePortal = ({ animation, pastedKeyframes, hoveredLayer }: { animation: DcaAnimation, pastedKeyframes: readonly KeyframeClipboardType[] | null, hoveredLayer: number | null }) => {
    const [mouseX, setMouseX] = useState(0)
    const [mouseY, setMouseY] = useState(0)
    const createPortal = useCreatePortal()


    useEffect(() => {
        const mouseMove = (e: MouseEvent) => {
            setMouseX(e.clientX)
            setMouseY(e.clientY)
        }
        const clearPasted = () => {
            animation.pastedKeyframes.value = null
        }

        const keyPressed = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                clearPasted()
            }
        }
        document.addEventListener("mousemove", mouseMove)
        document.addEventListener("mousedown", clearPasted)
        document.addEventListener("keydown", keyPressed)
        return () => {
            document.removeEventListener("mousemove", mouseMove)
            document.removeEventListener("mousedown", clearPasted)
            document.removeEventListener("keydown", keyPressed)
        }
    }, [animation])

    const movedKeyframes = useMemo(() => {
        if (pastedKeyframes === null || pastedKeyframes.length === 0) {
            return []
        }
        const first = pastedKeyframes.reduce((prev, cur) => prev.start < cur.start ? prev : cur)
        const firstId = first.originalLayerId
        const firstStart = first.originalStart

        return pastedKeyframes.map(kf => ({
            ...kf,
            layerId: kf.originalLayerId - firstId,
            start: kf.originalStart - firstStart,
        }))
    }, [pastedKeyframes])


    if (pastedKeyframes === null || hoveredLayer !== null || pastedKeyframes.length === 0) {
        return <></>
    }

    return createPortal(
        <>
            <div
                className="absolute"
                style={{
                    left: `${mouseX}px`,
                    top: `${mouseY}px`
                }}
            >
                {movedKeyframes.map(kf => <KeyframeFromClipboard key={kf.identifier} layerColor="bg-sky-500" hoverColor="group-hover:bg-sky-300" keyframe={kf} />)}
            </div>
        </>
    )
}

const SoundLayer = ({ animation, soundLayer }: { animation: DcaAnimation, soundLayer: DcaSoundLayer }) => {
    const [sounds, setSounds] = useListenableObject(soundLayer.instances)
    const [name, setName] = useListenableObject(soundLayer.name)
    const [locked, toggleLocked] = useListenableObjectToggle(soundLayer.locked)
    const [visible, toggleVisible] = useListenableObjectToggle(soundLayer.visible)

    const deleteLayer = () => {
        animation.soundLayers.value = animation.soundLayers.value.filter(l => l !== soundLayer)
    }

    const dialogBoxes = useDialogBoxes()

    const { addToast } = useToast()

    const addNewSound = () => {
        dialogBoxes.setDialogBox(() => <NewAnimationSoundDialogBox layer={soundLayer} />)
    }

    const openLayerSettings = () => {
        addToast("Not added yet", "error")
    }

    return (
        <AnimationTimelineLayer
            animation={animation}
            deleteLayer={deleteLayer}
            keyframes={sounds}
            getStartTime={s => s.startTime.value}
            getDuration={s => s.sound?.duration ?? 1}
            getHeight={maxLayer => Math.max(1, maxLayer + 1) * 1.5}
            header={
                <>
                    <AnimationLayerHandle color="bg-blue-500" type="Transform" />
                    <input value={name} onChange={e => setName(e.target.value)} type="text" className="w-36 border-none dark:bg-gray-900 bg-gray-400 text-white rounded mr-0.5  h-6 text-s" placeholder="layer name" />
                    <AnimationLayerButton disabled={locked} onClick={addNewSound} icon={SVGPlus} />
                    <AnimationLayerButton highlighted={!visible} onClick={toggleVisible} icon={visible ? SVGEye : SVGEyeOff} negative={true} />
                    <AnimationLayerButton highlighted={locked} onClick={toggleLocked} icon={locked ? SVGLocked : SVGUnlocked} negative={true} />
                    <AnimationLayerButton icon={SVGSettings} onClick={openLayerSettings} />
                </>
            }
        >
            {sound => <SoundEntry key={sound.identifier} sound={sound} />}
        </AnimationTimelineLayer>
    )
}
const SoundEntry = ({ sound }: { sound: DcaSoundLayerInstance }) => {
    const [start, setStart] = useListenableObject(sound.startTime)
    // const [src] = useListenableObjectNullable(sound.sound?.fullImgUrl)
    const duration = sound.sound?.duration ?? 1


    const { getPixelsPerSecond, getScroll, addAndRunListener, removeListener } = useContext(ScrollZoomContext)

    const pps = getPixelsPerSecond()

    const src = useMemo(() => {
        if (sound.sound === null) {
            return null
        }
        return StudioSound.drawVisualization(sound.sound, 'white', duration * pps, 10, 1, 2)
    }, [sound.sound, duration, pps])


    const soundHandleRef = useDraggbleRef<HTMLDivElement, number>(
        useCallback(() => {
            //Start batch actions
            return sound.startTime.value
        }, [sound]),
        useCallback(({ dx, initial }) => {
            sound.startTime.value = Math.max(initial + dx / getPixelsPerSecond(), 0)
        }, [sound, getPixelsPerSecond]),
        useCallback(() => {
            //end batch actions
        }, [])
    )

    useTooltipRef<HTMLDivElement>(() => sound.sound?.name.value, undefined, soundHandleRef)
    //Updates the keyframe left and width
    const updateRefStyle = useCallback((scroll = getScroll(), pixelsPerSecond = getPixelsPerSecond()) => {
        if (soundHandleRef.current !== null) {
            soundHandleRef.current.style.left = `${sound.startTime.value * pixelsPerSecond - scroll}px`
            soundHandleRef.current.style.width = `${duration * pixelsPerSecond}px`
        }
    }, [sound, duration, getPixelsPerSecond, getScroll, soundHandleRef])

    useEffect(() => {
        addAndRunListener(updateRefStyle)
        return () => removeListener(updateRefStyle)
    }, [addAndRunListener, removeListener, updateRefStyle])

    return (
        <div
            ref={soundHandleRef}
            className="absolute h-full flex flex-col justify-center"
            style={{
                left: `${start * getPixelsPerSecond() - getScroll()}px`,
                width: `${duration * getPixelsPerSecond()}px`,
            }}
        >
            <div className="w-full bg-blue-500 bg-opacity-30 py-1 px-0 rounded-lg">
                {src &&
                    <Image
                        src={src}
                        alt="Waveform"
                        draggable={false}
                        width={duration * getPixelsPerSecond()}
                        height="10px"
                        layout="responsive"
                        objectFit="contain"
                    />
                }
            </div>
        </div>
    )
}

//Grim
const getStartTime = (kf: DcaKeyframe | KeyframeClipboardType) => kf instanceof DcaKeyframe ? kf.startTime.value : kf.start
const getDuration = (kf: DcaKeyframe | KeyframeClipboardType) => kf instanceof DcaKeyframe ? kf.duration.value : kf.duration


const AnimationLayer = ({ animation, keyframes, layer }: { animation: DcaAnimation, keyframes: (DcaKeyframe | KeyframeClipboardType)[], layer: KeyframeLayerData }) => {
    const [name, setName] = useListenableObject(layer.name)
    const [visible, toggleVisible] = useListenableObjectToggle(layer.visible)
    const [locked, toggleLocked] = useListenableObjectToggle(layer.locked)
    const dialogBox = useDialogBoxes()

    const { setHoveredLayerAndPosition, getDraggingKeyframeRef } = useContext(ScrollZoomContext)


    const colors = ["bg-sky-500", "bg-green-500", "bg-yellow-500", "bg-red-500"]
    const hoverColors = ["group-hover:bg-sky-300", "group-hover:bg-green-300", "group-hover:bg-yellow-300", "group-hover:bg-red-300"]
    const color = colors[layer.layerId % colors.length]
    const hoverColor = hoverColors[layer.layerId % colors.length]

    const addNewKeyframe = () => {
        if (locked) {
            return
        }
        animation.undoRedoHandler.startBatchActions()
        const kf = animation.createKeyframe(layer.layerId)

        animation.selectedKeyframes.value.forEach(kf => kf.selected.value = false)
        kf.selected.value = true
        kf.startTime.value = animation.time.value
        animation.undoRedoHandler.endBatchActions("Created Keyframe", HistoryActionTypes.Add)
    }

    const deleteKeyframeLayer = () => {
        if (locked) {
            return
        }
        animation.deleteKeyframesLayers([layer.layerId])
    }


    const openLayerSettings = () => {
        dialogBox.setDialogBox(() => <KeyframeLayerDialogBox layer={layer} />)
    }

    const { largeKeyframesEnabled, setLargeKeyframesEnabled } = useOptions();

    return (
        <AnimationTimelineLayer
            animation={animation}
            keyframes={keyframes}
            deleteLayer={deleteKeyframeLayer}
            getDuration={getDuration}
            getStartTime={getStartTime}
            getHeight={maxLayer => maxLayer <= 2 ? (largeKeyframesEnabled ? 3 : 1.5) : (largeKeyframesEnabled ? 3 : 1.5) + ((maxLayer - 2) * (largeKeyframesEnabled ? 1.5 : .75))}
            containerProps={draggingRef => ({
                onMouseMoveCapture: e => { //We need to listen on capture, as we need to capture the event BEFORE it reaches the keyframe and is cancled.
                    if (draggingRef.current !== null) {
                        const rects = draggingRef.current.getBoundingClientRect()
                        setHoveredLayerAndPosition(layer.layerId, e.clientX - rects.left)
                    } else {
                        setHoveredLayerAndPosition(null, null)
                    }
                    const kf = getDraggingKeyframeRef().current
                    if (!layer.locked.value && kf !== null && kf instanceof DcaKeyframe) {
                        kf.layerId.value = layer.layerId
                    }
                },
                onMouseLeave: () => {
                    setHoveredLayerAndPosition(null, null)
                },
                onClick: e => {
                    animation.finishPaste()
                    e.preventDefault()
                    e.stopPropagation()
                }

            })}
            header={
                <>
                    <AnimationLayerHandle color="bg-blue-500" type="Transform" />
                    <input value={name} onChange={e => setName(e.target.value)} type="text" className="w-36 border-none dark:bg-gray-900 bg-gray-400 text-white rounded mr-0.5  h-6 text-s" placeholder="layer name" />
                    <AnimationLayerButton disabled={locked} onClick={addNewKeyframe} icon={SVGPlus} />
                    <AnimationLayerButton highlighted={!visible} onClick={toggleVisible} icon={visible ? SVGEye : SVGEyeOff} negative={true} />
                    <AnimationLayerButton highlighted={locked} onClick={toggleLocked} icon={locked ? SVGLocked : SVGUnlocked} negative={true} />
                    <AnimationLayerButton icon={SVGSettings} onClick={openLayerSettings} />
                </>
            }
        >
            {kf => kf instanceof DcaKeyframe ?
                <KeyFrame key={kf.identifier} layerColor={color} hoverColor={hoverColor} keyframe={kf} /> :
                <KeyframeFromClipboard key={kf.identifier} layerColor={color} hoverColor={hoverColor} keyframe={kf} />
            }
        </AnimationTimelineLayer >
    )

}

const AnimationLayerHandle = ({ type, color }: { type: string, color: string }) => {

    const animationContextMenu = (e: MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    return (
        <div className={color + " rounded-full w-6 h-6 mr-1 p-1 text-white hover:cursor-move"}>
            <SvgArrows onContextMenu={() => { animationContextMenu }} />
            { /* TODO Add icons for event and sound layer types*/}
        </div>
    );
}



const KeyframeFromClipboard = ({ layerColor, hoverColor, keyframe }: { layerColor: string, hoverColor: string, keyframe: KeyframeClipboardType }) => {
    const { getPixelsPerSecond, getScroll } = useContext(ScrollZoomContext)

    return (
        <div
            style={{
                left: `${keyframe.start * getPixelsPerSecond() - getScroll()}px`,
                width: `${keyframe.duration * getPixelsPerSecond()}px`
            }}
            className="h-3 absolute group cursor-pointer"
        >
            <div
                className={`h-1 mt-1 mb-1 ${layerColor} ${hoverColor}`}
            >

            </div>
        </div>
    )
}

const KeyFrame = ({ layerColor, hoverColor, keyframe }: { layerColor: string, hoverColor: string, keyframe: DcaKeyframe }) => {
    const [start] = useListenableObject(keyframe.startTime)
    const [length] = useListenableObject(keyframe.duration)
    const [selected, setSelected] = useListenableObject(keyframe.selected)

    const [layerId] = useListenableObject(keyframe.layerId)
    const [layers] = useListenableObject(keyframe.animation.keyframeLayers)

    const isLockedLO = useMemo(() => layers.find(kfl => kfl.layerId === layerId), [layers, layerId])
    const [isLocked] = useListenableObjectNullable(isLockedLO?.locked)

    const { addAndRunListener, removeListener, getPixelsPerSecond, getScroll, getDraggingKeyframeRef } = useContext(ScrollZoomContext)

    const keyframeHandleRef = useDraggbleRef<HTMLDivElement, Map<DcaKeyframe, number>>(
        useCallback((event) => {
            getDraggingKeyframeRef().current = keyframe
            keyframe.animation.undoRedoHandler.startBatchActions()
            const keyframesToUse = [keyframe]
            if (!event.ctrlKey && keyframe.selected.value) {
                keyframesToUse.push(...keyframe.animation.selectedKeyframes.value)
            }

            return keyframesToUse.reduce((map, kf) => {
                map.set(kf, kf.startTime.value)
                return map
            }, new Map<DcaKeyframe, number>())
        }, [keyframe, getDraggingKeyframeRef]),
        useCallback(({ dx, initial }) => {
            initial.forEach((time, kf) => {
                //Validate that this animation/project/tab is open?
                kf.startTime.value = Math.max(time + dx / getPixelsPerSecond(), 0)
            })
        }, [getPixelsPerSecond]),
        useCallback(({ max }, event) => {
            getDraggingKeyframeRef().current = null
            keyframe.animation.undoRedoHandler.endBatchActions("Keyframe Dragged", HistoryActionTypes.Transformation)
            //If the mouse hasn't move then we count it as a click and not a drag
            if (max === 0) {

                if (event.ctrlKey) {
                    setSelected(!selected)
                } else {
                    const selectedKeyframes = keyframe.animation.selectedKeyframes.value
                    if (selectedKeyframes.length === 1) {
                        //One keyframe selected. If it's this, then deselect,
                        //Otherwise, select
                        const selectedKf = selectedKeyframes[0]
                        if (selectedKf === keyframe) {
                            setSelected(false)
                        } else {
                            selectedKf.selected.value = false
                            setSelected(true)
                        }
                    } else {
                        //More than one keyframe selected.
                        //We need to deselect all keyframes that aren't this
                        selectedKeyframes.forEach(kf => kf.selected.value = (kf === keyframe))
                        setSelected(true)
                    }
                }
            }
        }, [keyframe, selected, getDraggingKeyframeRef, setSelected]),
        true
    )

    //Updates the keyframe left and width
    const updateRefStyle = useCallback((scroll = getScroll(), pixelsPerSecond = getPixelsPerSecond()) => {
        if (keyframeHandleRef.current !== null) {
            keyframeHandleRef.current.style.left = `${keyframe.startTime.value * pixelsPerSecond - scroll}px`
            keyframeHandleRef.current.style.width = `${length * pixelsPerSecond}px`
        }
    }, [keyframe, length, getPixelsPerSecond, getScroll, keyframeHandleRef])

    useEffect(() => {
        addAndRunListener(updateRefStyle)
        return () => removeListener(updateRefStyle)
    }, [addAndRunListener, removeListener, updateRefStyle])

    const { largeKeyframesEnabled, setLargeKeyframesEnabled } = useOptions();

    return (
        <div
            ref={keyframeHandleRef}
            style={{
                left: `${start * getPixelsPerSecond() - getScroll()}px`,
                width: `${length * getPixelsPerSecond()}px`
            }}
            // onClick={() => setSelected(!selected)}
            className={"h-3 absolute group select-none " + (isLocked ? "pointer-events-none" : "cursor-pointer")}
        >
            <div
                className={(largeKeyframesEnabled ? "h-3 rounded-full" : "h-1") + " mt-1 mb-1 " + (isLocked ? "bg-gray-500" : (selected ? " bg-red-200 group-hover:bg-white" : `${layerColor} ${hoverColor}`))}
            >

            </div>
        </div>
    )
}

const LayerButton = ({ addLayer, text }: { addLayer: (e: ReactMouseEvent) => void, text: string }) => {
    return (
        <button onClick={addLayer} className="dark:bg-gray-900 bg-gray-400 dark:hover:bg-gray-800 hover:bg-gray-500 rounded pr-0.5 pl-1 py-1 mr-0.5 dark:text-white text-black h-6 flex flex-row">
            <SVGPlus className="h-4 w-4 mr-1" />
            <p className="text-xs mr-2">{text}</p>
        </button>
    );
}

export default AnimatorTimeline;