import { createContext, MouseEvent as ReactMouseEvent, MutableRefObject, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { SvgArrows, SVGEye, SVGEyeOff, SVGLocked, SVGPlus, SVGSettings, SVGTrash, SVGUnlocked } from "../../../components/Icons";
import { useCreatePortal } from "../../../contexts/CreatePortalContext";
import { useOptions } from "../../../contexts/OptionsContext";
import { useStudio } from "../../../contexts/StudioContext";
import { KeyframeClipboardType } from "../../../studio/clipboard/KeyframeClipboardType";
import DcaAnimation, { DcaKeyframe, KeyframeLayerData } from "../../../studio/formats/animations/DcaAnimation";
import { HistoryActionTypes } from "../../../studio/undoredo/UndoRedoHandler";
import { useDraggbleRef } from "../../../studio/util/DraggableElementRef";
import { useListenableObject, useListenableObjectNullable, useListenableObjectToggle } from "../../../studio/util/ListenableObject";

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
            {animation !== null && <AnimationLayers animation={animation} />}
        </div>
    )
}

type ListenerEffect = (func: (scroll: number, pixelsPerSecond: number) => void) => void

const ScrollZoomContext = createContext<{
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

        const toAdd: KeyframeLayerData[] = [...layers]
        let changed = false
        keyframes.forEach(kf => {
            if (!toAdd.some(l => l.layerId === kf.layerId.value)) {
                toAdd.push(new KeyframeLayerData(animation, kf.layerId.value))
                changed = true
            }
        })
        if (changed) {
            setLayers(toAdd)
        }

        return () => {
            animation.scroll.removeListener(onScrollChange)
            animation.zoom.removeListener(onZoomChange)
        }
    }, [keyframes, layers, setLayers, animation.scroll, animation.zoom, onScrollChange, onZoomChange, animation])

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
                {keyframesByLayers.map(({ layer, keyframes }) => <AnimationLayer key={layer.layerId} animation={animation} keyframes={keyframes} layer={layer} />)}
                <div className="flex flex-row">
                    <button onClick={addLayer} className="dark:bg-gray-900 bg-gray-400 dark:hover:bg-gray-800 hover:bg-gray-500 rounded pr-0.5 pl-1 py-1 mr-0.5 dark:text-white text-black h-6 flex flex-row"><SVGPlus className="h-4 w-4 mr-1" /><p className="text-xs mr-2">Transformation Layer</p></button>
                    <button onClick={addLayer} className="dark:bg-gray-900 bg-gray-400 dark:hover:bg-gray-800 hover:bg-gray-500 rounded pr-0.5 pl-1 py-1 mr-0.5 dark:text-white text-black h-6 flex flex-row"><SVGPlus className="h-4 w-4 mr-1" /><p className="text-xs mr-2">Sound Layer</p></button>
                    <button onClick={addLayer} className="dark:bg-gray-900 bg-gray-400 dark:hover:bg-gray-800 hover:bg-gray-500 rounded pr-0.5 pl-1 py-1 mr-0.5 dark:text-white text-black h-6 flex flex-row"><SVGPlus className="h-4 w-4 mr-1" /><p className="text-xs mr-2">Event Layer</p></button>
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

class OffsetKeyframeInLayer {
    constructor(
        public keyframe: DcaKeyframe | KeyframeClipboardType,
        public offsetLevel: number
    ) { }
}

const isInbetween = (min: number, delta: number, test: number) => test >= min && test <= min + delta

//Grim
const getStartTime = (kf: DcaKeyframe | KeyframeClipboardType) => kf instanceof DcaKeyframe ? kf.startTime.value : kf.start
const getDuration = (kf: DcaKeyframe | KeyframeClipboardType) => kf instanceof DcaKeyframe ? kf.duration.value : kf.duration
const canKeyframeBeInsertedAtTimelinelayer = (keyframe: DcaKeyframe | KeyframeClipboardType, layerData?: OffsetKeyframeInLayer[]) => {
    if (layerData === undefined) {
        return true
    }

    return !layerData.some(d =>
        isInbetween(getStartTime(d.keyframe), getDuration(d.keyframe), getStartTime(keyframe)) ||
        isInbetween(getStartTime(keyframe), getDuration(keyframe), getStartTime(d.keyframe))
    )
}

const AnimationLayer = ({ animation, keyframes, layer }: { animation: DcaAnimation, keyframes: (DcaKeyframe | KeyframeClipboardType)[], layer: KeyframeLayerData }) => {
    const [name, setName] = useListenableObject(layer.name)
    const [visible, toggleVisible] = useListenableObjectToggle(layer.visible)
    const [locked, toggleLocked] = useListenableObjectToggle(layer.locked)

    const { addAndRunListener, removeListener, getPixelsPerSecond, getScroll, getDraggingKeyframeRef, setHoveredLayerAndPosition } = useContext(ScrollZoomContext)

    //Hacky stuff, but essentially I need this to re-render whenever a keyframe "moves" (start time changes or duration changes)
    const [, hackyRerender] = useState(0)
    useEffect(() => {
        const listener = () => {
            hackyRerender(v => v + 1)
        }
        animation.keyframeStartOrDurationChanges.add(listener)
        return () => {
            animation.keyframeStartOrDurationChanges.delete(listener)
        }
    })

    let maxLayer = 0
    const sorted = keyframes.sort((a, b) => getStartTime(a) - getStartTime(b))
    const map = new Map<number, OffsetKeyframeInLayer[]>()
    sorted.forEach(kf => {
        let layer = 0
        while (!canKeyframeBeInsertedAtTimelinelayer(kf, map.get(layer))) {
            layer++
        }

        maxLayer = Math.max(maxLayer, layer)
        let data = map.get(layer)
        if (data === undefined) {
            data = []
            map.set(layer, data)
        }

        data.push(new OffsetKeyframeInLayer(kf, layer))
    })

    let layers = Array.from(map.values()).map(a => a.map(l => l.keyframe))

    //We need to ensure that if there are no keyframe, the backround still shows
    if (layers.length === 0) {
        layers = [[]]
    }


    const divHeight = maxLayer <= 2 ? 1.5 : 1.5 + ((maxLayer - 2) * .75)
    const colors = ["bg-sky-500", "bg-green-500", "bg-yellow-500", "bg-red-500"]
    const hoverColors = ["group-hover:bg-sky-300", "group-hover:bg-green-300", "group-hover:bg-yellow-300", "group-hover:bg-red-300"]
    const color = colors[layer.layerId % colors.length]
    const hoverColor = hoverColors[layer.layerId % colors.length]

    const draggingRef = useDraggbleRef<HTMLDivElement, number>(
        useCallback(() => animation.scroll.value, [animation]),
        useCallback(({ dx, initial }) => animation.scroll.value = Math.max(initial - dx, 0), [animation]),
        useCallback(({ max }, event) => {
            if (max < 2) {
                animation.selectedKeyframes.value.forEach(kf => kf.selected.value = false)
                event.stopPropagation()
            }
        }, [animation])
    )

    //We need to subscribe to 'wheel' manually, as by default react does it passively.
    useEffect(() => {
        const current = draggingRef.current
        const callback = (e: WheelEvent) => {
            if (current === null) {
                return
            }
            const modifier = 1.05
            if (e.deltaY !== 0) {
                if (e.ctrlKey) {
                    animation.scroll.value = Math.max(animation.scroll.value + e.deltaY, 0)
                } else {
                    const val = e.deltaY < 0 ? 1 / modifier : modifier

                    const newPixelsPerSecond = width * blockPerSecond * animation.zoom.value * val

                    //Updates the scroll so that the mouseX position is kept constant.
                    //Essentially zooms into where the mouse is
                    const pixelPoint = animation.scroll.value + e.clientX - current.getBoundingClientRect().left
                    const secondsPoint = pixelPoint / getPixelsPerSecond()
                    const newPixelPoint = secondsPoint * newPixelsPerSecond
                    const changeInPixles = newPixelPoint - pixelPoint


                    animation.scroll.value = Math.max(animation.scroll.value + changeInPixles, 0)

                    animation.zoom.value *= val
                }
            }
            e.stopPropagation()
            e.preventDefault()
        }
        if (current !== null) {
            current.addEventListener('wheel', callback)
        }
        return () => {
            if (current !== null) {
                current.removeEventListener('wheel', callback)
            }
        }
    }, [animation.zoom, draggingRef, animation.scroll, getPixelsPerSecond])

    const timeMarkerRef = useDraggbleRef<HTMLDivElement, number>(
        useCallback(() => {
            animation.isDraggingTimeline = true
            return animation.time.value
        }, [animation]),
        useCallback(({ dx, initial }) => animation.time.value = Math.max(dx / getPixelsPerSecond() + initial, 0), [animation, getPixelsPerSecond]),
        useCallback(() => animation.isDraggingTimeline = false, [animation])
    )

    const timeRef = useRef(animation.time.value)


    const updateAndSetLeft = useCallback((scroll = getScroll(), pixelsPerSecond = getPixelsPerSecond()) => {
        const ref = timeMarkerRef.current
        if (ref === null) {
            return
        }
        const amount = timeRef.current * pixelsPerSecond - scroll
        ref.style.display = amount < 0 ? "none" : "initial"
        ref.style.left = `${amount}px`
    }, [getPixelsPerSecond, getScroll, timeMarkerRef])
    useEffect(() => {
        addAndRunListener(updateAndSetLeft)

        const timeCallback = (time: number) => {
            timeRef.current = time
            updateAndSetLeft()
        }
        animation.time.addListener(timeCallback)

        return () => {
            removeListener(updateAndSetLeft)
            animation.time.removeListener(timeCallback)
        }
    }, [addAndRunListener, removeListener, timeMarkerRef, animation.time, getPixelsPerSecond, getScroll, updateAndSetLeft])

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

    return (
        <div onClick={e => e.stopPropagation()} className="flex flex-row m-0.5 mt-0" style={{ height: divHeight + 'rem' }}>
            <div className="flex flex-row">
                <AnimationLayerHandle color="bg-blue-500" type="Transform" />
                <input value={name} onChange={e => setName(e.target.value)} type="text" className="w-36 border-none dark:bg-gray-900 bg-gray-400 text-white rounded mr-0.5  h-6 text-s" placeholder="layer name" />
                <AnimationLayerButton disabled={locked} onClick={addNewKeyframe} icon={SVGPlus} />
                <AnimationLayerButton onClick={toggleVisible} icon={visible ? SVGEye : SVGEyeOff} />
                <AnimationLayerButton highlighted={locked} onClick={toggleLocked} icon={locked ? SVGLocked : SVGUnlocked} />
                <AnimationLayerButton icon={SVGSettings} />
            </div>
            <div className="relative w-full">
                <div
                    ref={draggingRef}
                    onMouseMoveCapture={e => { //We need to listen on capture, as we need to capture the event BEFORE it reaches the keyframe and is cancled.
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
                    }}
                    onMouseLeave={() => {
                        setHoveredLayerAndPosition(null, null)
                    }}
                    onClick={e => {
                        animation.finishPaste()
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                    className="flex flex-col w-full h-full overflow-hidden"
                >
                    <TimelineLayers color={color} hoverColor={hoverColor} layers={layers} />
                </div>
                <div ref={timeMarkerRef} className="absolute bg-blue-900 w-1 h-7 -top-0.5" />
            </div>
            <div className="flex flex-row ml-1">
                <AnimationLayerButton icon={SVGTrash} />
            </div>
        </div>
    )
}

const AnimationLayerHandle = ({ type, color }: { type: string, color: string }) => {
    return (
        <div className={color + " rounded-full w-6 h-6 mr-1 p-1 text-white hover:cursor-move"}>
            <SvgArrows />
            { /* TODO Add icons for event and sound layer types*/}
        </div>
    );
}

const AnimationLayerButton = ({ onClick, icon: Icon, disabled, highlighted }: { onClick?: () => void, icon: ({ className }: { className: string }) => JSX.Element, disabled?: boolean, highlighted?: boolean }) => {
    return (
        <button disabled={disabled} onClick={onClick} className={(highlighted ? "dark:bg-blue-900 bg-blue-400 dark:hover:bg-blue-800 hover:bg-blue-500 " : "dark:bg-gray-900 bg-gray-400 dark:hover:bg-gray-800 hover:bg-gray-500 ") + "rounded pr-0.5 pl-1 py-1 mr-0.5 h-6 " + (disabled ? "cursor-not-allowed dark:text-gray-500 text-gray-500" : "dark:text-white text-black")}><Icon className="h-4 w-4 mr-1" /></button>
    )
}

const blockPerSecond = 10
const width = 24

const TimelineLayers = ({ color, hoverColor, layers }: { color: string, hoverColor: string, layers: (DcaKeyframe | KeyframeClipboardType)[][] }) => {
    return (<>
        {layers.map((layer, i) =>
            <TimelineLayer key={i} keyframes={layer} color={color} hoverColor={hoverColor} />
        )}
    </>)
}

const TimelineLayer = ({ color, hoverColor, keyframes }: { color: string, hoverColor: string, keyframes: (DcaKeyframe | KeyframeClipboardType)[] }) => {
    const ref = useRef<HTMLDivElement>(null)

    const { darkMode } = useOptions()

    const { addAndRunListener, removeListener, getScroll, getPixelsPerSecond } = useContext(ScrollZoomContext)

    const updateRefStyle = useCallback((scroll = getScroll(), pixelsPerSecond = getPixelsPerSecond()) => {
        if (ref.current !== null) {
            ref.current.style.backgroundPositionX = `${-scroll}px`
            const bgWidth = pixelsPerSecond / blockPerSecond
            ref.current.style.backgroundImage =
                `repeating-linear-gradient(90deg, 
                    ${darkMode ? "#363636" : "#D4D4D4"} 0px, 
                    ${darkMode ? "#363636" : "#D4D4D4"}  ${bgWidth - 1}px, 
                    ${darkMode ? "#4A4A4A" : "#404040"}  ${bgWidth - 1}px, 
                    ${darkMode ? "#4A4A4A" : "#404040"}  ${bgWidth}px)`
            ref.current.style.backgroundSize = `${bgWidth}px    `
        }
    }, [darkMode, getPixelsPerSecond, getScroll])

    //Change the element style when scroll or zoom changes.
    useEffect(() => {
        addAndRunListener(updateRefStyle)
        return () => removeListener(updateRefStyle)
    }, [addAndRunListener, removeListener, updateRefStyle])
    return (
        <div ref={ref} className="bg-gray-900 relative h-full">
            {keyframes.map(kf => kf instanceof DcaKeyframe ?
                <KeyFrame key={kf.identifier} layerColor={color} hoverColor={hoverColor} keyframe={kf} /> :
                <KeyframeFromClipboard key={kf.identifier} layerColor={color} hoverColor={hoverColor} keyframe={kf} />
            )}
        </div>
    )
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

    return (
        <div
            ref={keyframeHandleRef}
            style={{
                left: `${start * getPixelsPerSecond() - getScroll()}px`,
                width: `${length * getPixelsPerSecond()}px`
            }}
            // onClick={() => setSelected(!selected)}
            className={"h-3 absolute group " + (isLocked ? "pointer-events-none" : "cursor-pointer")}
        >
            <div
                className={"h-1 mt-1 mb-1 " + (isLocked ? "bg-gray-500" : (selected ? " bg-red-200 group-hover:bg-white" : `${layerColor} ${hoverColor}`))}
            >

            </div>
        </div>
    )
}

export default AnimatorTimeline;