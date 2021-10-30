import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { SVGEye, SVGLocked, SVGPlus, SVGSettings } from "../../../components/Icons";
import { useOptions } from "../../../contexts/OptionsContext";
import { useStudio } from "../../../contexts/StudioContext";
import DcaAnimation, { DcaKeyframe, KeyframeLayerData } from "../../../studio/formats/animations/DcaAnimation";
import { useDraggbleRef } from "../../../studio/util/DraggableElementRef";
import { useListenableObject } from "../../../studio/util/ListenableObject";

const AnimatorTimeline = () => {
    const { getSelectedProject } = useStudio()
    const selectedProject = getSelectedProject()

    const [animation] = useListenableObject(selectedProject.animationTabs.selectedAnimation)
    return (
        <div className="rounded-sm dark:bg-gray-800 bg-gray-200 h-full pt-2 overflow-x-hidden overflow-y-scroll">
            {animation !== null && <AnimationLayers animation={animation} />}
        </div>
    )
}

type ListenerEffect = (func: (scroll: number, zoom: number) => void) => void

const ScrollZoomContext = createContext<{
    readonly addListener: ListenerEffect
    readonly removeListener: ListenerEffect
    readonly scroll: number
    readonly zoom: number
}>({
    addListener: () => { throw new Error("Invalid Call") },
    removeListener: () => { throw new Error("Invalid Call") },
    scroll: 0,
    zoom: 1,
})

const AnimationLayers = ({ animation }: { animation: DcaAnimation }) => {
    const [layers, setLayers] = useListenableObject(animation.keyframeLayers)
    const [keyframes] = useListenableObject(animation.keyframes)

    const listeners = useRef(new Set<(scroll: number, zoom: number) => void>())
    const scroll = useRef(animation.scroll.value)
    const zoom = useRef(animation.zoom.value)
    const addListener: ListenerEffect = useCallback(func => {
        func(scroll.current, zoom.current)
        listeners.current.add(func)
    }, [])
    const removeListener: ListenerEffect = useCallback(func => listeners.current.delete(func), [])


    const onScrollChange = useCallback((val: number) => {
        scroll.current = val
        listeners.current.forEach(l => l(scroll.current, zoom.current))
    }, [])
    useEffect(() => {
        animation.scroll.addListener(onScrollChange)

        const toAdd: KeyframeLayerData[] = [...layers]
        let changed = false
        keyframes.forEach(kf => {
            if (!toAdd.some(l => l.layerId === kf.layerId)) {
                toAdd.push(new KeyframeLayerData(kf.layerId))
                changed = true
            }
        })
        if (changed) {
            setLayers(toAdd)
        }

        return () => animation.scroll.removeListener(onScrollChange)
    }, [keyframes, layers, setLayers, animation.scroll, onScrollChange])

    const context = {
        addListener,
        removeListener,
        zoom: zoom.current,
        scroll: scroll.current
    }

    return (
        <ScrollZoomContext.Provider value={context}>
            {layers.map(l =>
                <AnimationLayer key={l.layerId} animation={animation} keyframes={keyframes.filter(k => k.layerId === l.layerId)} layer={l} />
            )}
        </ScrollZoomContext.Provider>
    )
}

class OffsetKeyframeInLayer {
    constructor(
        public keyframe: DcaKeyframe,
        public offsetLevel: number
    ) { }
}

const isInbetween = (min: number, delta: number, test: number) => test > min && test < min + delta

const canKeyframeBeInsertedAtTimelinelayer = (keyframe: DcaKeyframe, layerData?: OffsetKeyframeInLayer[]) => {
    if (layerData === undefined) {
        return true
    }

    return !layerData.some(d =>
        isInbetween(d.keyframe.startTime.value, d.keyframe.duration.value, keyframe.startTime.value) ||
        isInbetween(keyframe.startTime.value, keyframe.duration.value, d.keyframe.startTime.value)
    )
}

const AnimationLayer = ({ animation, keyframes, layer }: { animation: DcaAnimation, keyframes: DcaKeyframe[], layer: KeyframeLayerData }) => {
    const { maxLayer, layers } = useMemo(() => {
        let maxLayer = 0
        const sorted = keyframes.sort((a, b) => a.startTime.value - b.startTime.value)
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

        return {
            maxLayer,
            layers: Array.from(map.values()).map(a => a.map(l => l.keyframe))
        }
    }, [keyframes])

    const divHeight = maxLayer <= 2 ? 1.5 : 1.5 + ((maxLayer - 2) * .75)
    const colors = ["bg-lightBlue-500", "bg-green-500", "bg-yellow-500", "bg-red-500"]
    const color = colors[layer.layerId % colors.length]

    const draggingRef = useDraggbleRef<HTMLDivElement, number>(
        () => animation.scroll.value,
        ({ dx, initial }) => animation.scroll.value = Math.max(initial - dx, 0)
    )

    const timeMarkerRef = useDraggbleRef<HTMLDivElement, number>(
        () => {
            animation.isDraggingTimeline = true
            return animation.time.value
        },
        ({ dx, initial }) => animation.time.value = Math.max(dx / (blockPerSecond * width) + initial, 0),
        () => animation.isDraggingTimeline = false
    )

    const timeRef = useRef(animation.time.value)
    const scrollRef = useRef(animation.scroll.value)


    const { addListener, removeListener } = useContext(ScrollZoomContext)


    useEffect(() => {
        const updateAndSetLeft = () => {
            const ref = timeMarkerRef.current
            if (ref === null) {
                return
            }
            const amount = timeRef.current * width * blockPerSecond - scrollRef.current
            ref.style.display = amount < 0 ? "none" : "initial"
            ref.style.left = `${amount}px`
        }
        const scrollCallback = (scroll: number) => {
            scrollRef.current = scroll
            updateAndSetLeft()
        }
        addListener(scrollCallback)

        const timeCallback = (time: number) => {
            timeRef.current = time
            updateAndSetLeft()
        }
        animation.time.addListener(timeCallback)

        return () => {
            removeListener(scrollCallback)
            animation.time.removeListener(timeCallback)
        }
    }, [addListener, removeListener, timeMarkerRef, animation.time])


    return (
        <div className="flex flex-row m-0.5 mt-0" style={{ height: divHeight + 'rem' }}>
            <div className="flex flex-row">
                <input type="text" className="w-36 border-none dark:bg-gray-900 bg-gray-400 text-white rounded mr-0.5 pt-0.5 h-6 text-s" placeholder="layer name" />
                <button className="dark:bg-gray-900 bg-gray-400 dark:hover:bg-gray-800 hover:bg-gray-500 rounded pr-0.5 pl-1 py-1 mr-0.5 dark:text-white text-black h-6"><SVGPlus className="h-4 w-4 mr-1" /></button>
                <button className="dark:bg-gray-900 bg-gray-400 dark:hover:bg-gray-800 hover:bg-gray-500 rounded pr-0.5 pl-1 py-1 mr-0.5 dark:text-white text-black h-6"><SVGEye className="h-4 w-4 mr-1" /></button>
                <button className="dark:bg-gray-900 bg-gray-400 dark:hover:bg-gray-800 hover:bg-gray-500 rounded pr-0.5 pl-1 py-1 mr-0.5 dark:text-white text-black h-6"><SVGLocked className="h-4 w-4 mr-1" /></button>
                <button className="dark:bg-gray-900 bg-gray-400 dark:hover:bg-gray-800 hover:bg-gray-500 rounded pr-0.5 pl-1 py-1 mr-0.5 dark:text-white text-black h-6"><SVGSettings className="h-4 w-4 mr-1" /></button>
            </div>
            <div className="relative w-full">
                <div ref={draggingRef} className="flex flex-col w-full h-full overflow-hidden">
                    <TimelineLayers color={color} animation={animation} layers={layers} />
                </div>
                <div ref={timeMarkerRef} className="absolute bg-blue-900 w-1 h-7 -top-0.5" />
            </div>
        </div>
    )
}

const blockPerSecond = 10
const width = 24

const TimelineLayers = ({ color, animation, layers }: { color: string, animation: DcaAnimation, layers: DcaKeyframe[][] }) => {
    return (<>
        {layers.map((layer, i) =>
            <TimelineLayer key={i} keyframes={layer} color={color} animation={animation} />
        )}
    </>)
}

const TimelineLayer = ({ color, keyframes, animation }: { color: string, keyframes: DcaKeyframe[], animation: DcaAnimation }) => {
    const ref = useRef<HTMLDivElement>(null)

    const { darkMode } = useOptions()

    const { addListener, removeListener, scroll } = useContext(ScrollZoomContext)
    useEffect(() => {
        const callback = (scroll: number) => {
            if (ref.current !== null) {
                ref.current.style.backgroundPositionX = `${-scroll}px`
            }
        }
        addListener(callback)
        return () => removeListener(callback)
    }, [addListener, removeListener])
    return (
        <div ref={ref} className="bg-gray-900 relative h-full " style={{ backgroundPositionX: `${-scroll}px`, backgroundImage: `repeating-linear-gradient(90deg, ${darkMode ? "#363636" : "#D4D4D4"}  0px, ${darkMode ? "#363636" : "#D4D4D4"}  ${width - 1}px, ${darkMode ? "#4A4A4A" : "#404040"}  ${width - 1}px, ${darkMode ? "#4A4A4A" : "#404040"}  ${width}px)` }}>
            {keyframes.map(kf =>
                <KeyFrame key={kf.identifier} layerColor={color} animation={animation} keyframe={kf} />
            )}
        </div>
    )
}

const KeyFrame = ({ layerColor, keyframe, animation }: { layerColor: string, animation: DcaAnimation, keyframe: DcaKeyframe }) => {
    const [start] = useListenableObject(keyframe.startTime)
    const [length] = useListenableObject(keyframe.duration)
    const [selected, setSelected] = useListenableObject(keyframe.selected)

    const ref = useRef<HTMLDivElement>(null)

    const { addListener, removeListener, scroll } = useContext(ScrollZoomContext)
    useEffect(() => {
        const callback = (scroll: number) => {
            // if (ref.current === null) {
            //     throw new Error("Ref not set")
            // }
            if (ref.current !== null) {
                ref.current.style.left = `${start * width * blockPerSecond - scroll}px`
                ref.current.style.width = `${length * width * blockPerSecond}px`
            }
        }
        addListener(callback)
        return () => removeListener(callback)
    }, [length, start, addListener, removeListener])

    return (
        <div
            ref={ref}
            onClick={() => setSelected(!selected)}
            className={"h-1 mt-1 mb-1.5 absolute " + (selected ? " bg-red-200" : layerColor)}
            style={{ left: `${(start + scroll) * width * blockPerSecond}px`, width: `${(length + scroll) * width * blockPerSecond}px` }}
        >
        </div>
    )
}

export default AnimatorTimeline;