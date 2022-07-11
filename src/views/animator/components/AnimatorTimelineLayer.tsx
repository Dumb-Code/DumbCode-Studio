import { HTMLProps, ReactNode, RefObject, useCallback, useContext, useEffect, useRef, useState } from "react"
import { SVGTrash } from "../../../components/Icons"
import { useOptions } from "../../../contexts/OptionsContext"
import DcaAnimation from "../../../studio/formats/animations/DcaAnimation"
import { useDraggbleRef } from "../../../studio/util/DraggableElementRef"
import { ScrollZoomContext } from "./AnimatorTimeline"

export const blockPerSecond = 10
export const width = 24

class OffsetKeyframeInLayer<T> {
  constructor(
    public keyframe: T,
    public offsetLevel: number
  ) { }
}

const isInbetween = (min: number, delta: number, test: number) => test >= min && test <= min + delta

//Grim 

type HasIdentif = { identifier: string }

export const AnimationTimelineLayer = <T extends HasIdentif,>({ animation, keyframes, getStartTime, getDuration, getHeight, deleteLayer, header, children, containerProps }: {
  animation: DcaAnimation, keyframes: T[],
  getStartTime: (kf: T) => number,
  getDuration: (kf: T) => number,
  getHeight: (numLayers: number) => number,
  deleteLayer: () => void,
  children: (kf: T) => ReactNode,
  header?: ReactNode,

  containerProps?: (draggingRef: RefObject<HTMLDivElement>) => HTMLProps<HTMLDivElement>
}) => {
  const canKeyframeBeInsertedAtTimelinelayer = (keyframe: T, layerData?: OffsetKeyframeInLayer<T>[]) => {
    if (layerData === undefined) {
      return true
    }

    return !layerData.some(d =>
      isInbetween(getStartTime(d.keyframe), getDuration(d.keyframe), getStartTime(keyframe)) ||
      isInbetween(getStartTime(keyframe), getDuration(keyframe), getStartTime(d.keyframe))
    )
  }

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
  const map = new Map<number, OffsetKeyframeInLayer<T>[]>()
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


  const divHeight = getHeight(maxLayer)//maxLayer <= 2 ? 1.5 : 1.5 + ((maxLayer - 2) * .75)
  // const colors = ["bg-sky-500", "bg-green-500", "bg-yellow-500", "bg-red-500"]
  // const hoverColors = ["group-hover:bg-sky-300", "group-hover:bg-green-300", "group-hover:bg-yellow-300", "group-hover:bg-red-300"]
  // const color = colors[layer.layerId % colors.length]
  // const hoverColor = hoverColors[layer.layerId % colors.length]

  const draggingRef = useDraggbleRef<HTMLDivElement, number>(
    useCallback(() => animation.scroll.value, [animation]),
    useCallback(({ dx, initial }) => animation.scroll.value = Math.max(initial - dx, 0), [animation]),
    useCallback(({ max }, event) => {
      if (max === 0) {
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

  const containerPropsValue = containerProps?.(draggingRef)

  return (
    <div onClick={e => e.stopPropagation()} className="flex flex-row m-0.5 mt-0" style={{ height: divHeight + 'rem' }}>
      <div className="flex flex-row">
        {header}
      </div>
      <div className="relative w-full">
        <div
          ref={draggingRef}

          {...containerPropsValue}
          className={"flex flex-col w-full h-full overflow-hidden " + (containerPropsValue?.className ?? "")}
        >
          {layers.map((layer, i) =>
            <TimelineLayer key={i} keyframes={layer}>{children}</TimelineLayer>
          )}
        </div>
        <div ref={timeMarkerRef} className="absolute bg-blue-900 w-1 h-7 -top-0.5" />
      </div>
      <div className="flex flex-row ml-1">
        <AnimationLayerButton icon={SVGTrash} onClick={deleteLayer} highlighted={true} negative={true} hoverOnly={true} />
      </div>
    </div>
  )
}

const TimelineLayer = <T extends HasIdentif,>({ keyframes, children }: { keyframes: T[], children: (t: T) => ReactNode }) => {
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
      {keyframes.map(kf => children(kf))}
    </div>
  )
}

export const AnimationLayerButton = ({ onClick, icon: Icon, disabled, highlighted, negative, hoverOnly }: { onClick?: () => void, icon: ({ className }: { className: string }) => JSX.Element, disabled?: boolean, highlighted?: boolean, negative?: boolean, hoverOnly?: boolean }) => {
  return (
    <button disabled={disabled} onClick={onClick}
      className={
        (highlighted ?
          (negative ?
            "dark:hover:bg-red-800 hover:bg-red-500 " +
            (!hoverOnly && "dark:bg-red-900 bg-red-400 ")
            :
            "dark:hover:bg-blue-800 hover:bg-blue-500 " +
            (!hoverOnly && "dark:bg-blue-900 bg-blue-400 ")
          )
          : "dark:bg-gray-900 bg-gray-400 dark:hover:bg-gray-800 hover:bg-gray-500 "
        ) +
        " rounded pr-0.5 pl-1 py-1 mr-0.5 h-6 " +
        (hoverOnly && "dark:bg-gray-900 bg-gray-400 ") +
        (disabled ? "cursor-not-allowed dark:text-gray-500 text-gray-500" : " dark:text-white text-black")}><Icon className="h-4 w-4 mr-1" /></button>
  )
}