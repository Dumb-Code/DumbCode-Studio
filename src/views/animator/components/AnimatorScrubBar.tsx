import { useCallback, useEffect, useRef, useState } from "react";
import { SVGPause, SVGPlay, SVGRestart, SVGStop } from "../../../components/Icons";
import { useStudio } from "../../../contexts/StudioContext";
import { useListenableObject, useListenableObjectNullable } from "../../../studio/util/ListenableObject";

const AnimatorScrubBar = () => {
    const { getSelectedProject } = useStudio()
    const project = getSelectedProject()

    const [animation] = useListenableObject(project.animationTabs.selectedAnimation)

    const [isHovering, setIsHovering] = useState(false)
    const [isDragging, setIsDragging] = useState(false)

    const [mouseHoverX, setMouseHoverX] = useState(0)

    const mouseHoverXRef = useRef(0)
    mouseHoverXRef.current = mouseHoverX

    const [isPlaying, setPlaying] = useListenableObjectNullable(animation?.playing)

    const [valueGiven, setValueGiven] = useListenableObjectNullable(animation?.displayTime)
    const value = valueGiven ?? 0
    const [maxGiven] = useListenableObjectNullable(animation?.maxTime)
    const max = maxGiven ?? 1

    const ref = useRef<HTMLDivElement>(null)

    const isMoving = isHovering || isDragging

    useEffect(() => {
        if (animation !== null) {
            animation.isDraggingTimeline = isDragging
            return () => {
                animation.isDraggingTimeline = false
            }
        }
    }, [isDragging, animation])


    const setBarPosition = useCallback(() => {
        if (animation !== null) {
            setValueGiven(mouseHoverXRef.current * max)
            animation.time.value = mouseHoverXRef.current * max
        }
    }, [animation, mouseHoverXRef, max, setValueGiven])


    useEffect(() => {
        const pointerUp = () => {
            if (isDragging) {
                setIsDragging(false)
            }
        }
        const pointerMove = (e: MouseEvent) => {
            if (isMoving && ref.current !== null) {
                const { x: min, width } = ref.current.getBoundingClientRect()
                let x = e.pageX - min
                if (x < 0) x = 0
                if (x > width) x = width
                setMouseHoverX(x / width)
                if (isDragging) {
                    setBarPosition()
                }
            }
        }

        document.addEventListener("pointerup", pointerUp)
        document.addEventListener("pointermove", pointerMove)
        return () => {
            document.removeEventListener("pointerup", pointerUp)
            document.removeEventListener("pointermove", pointerMove)
        }
    }, [isDragging, isMoving, setBarPosition])

    const position = Math.min(value / max, 1)

    return (
        <div className="flex flex-col items-center justify-end h-full dark:bg-gray-800 bg-white pt-2">
            <div className="flex-grow relative w-full">
                <div className="absolute bottom-0 left-0 right-0 flex flex-row w-full">
                    <div className="flex-grow"></div>
                    <button className="dark:bg-gray-900 bg-gray-200 px-1 rounded-tl-md pt-1 dark:text-gray-400 text-black hover:text-red-500 border-l-2 border-t-2 dark:border-black border-white">
                        <SVGStop className="h-6 w-6" />
                    </button>
                    <button className="dark:bg-gray-900 bg-gray-200 px-2 dark:text-white text-gray-900 hover:text-sky-500 border-t-2 dark:border-black border-white" onClick={() => setPlaying(!isPlaying)}>
                        {isPlaying
                            ? <SVGPause className="h-8 w-8" />
                            : <SVGPlay className="h-8 w-8" />
                        }
                    </button>
                    <button className="dark:bg-gray-900 bg-gray-200 px-1 rounded-tr-md pt-1 dark:text-gray-400 text-black hover:text-yellow-400 border-r-2 border-t-2 dark:border-black border-white">
                        <SVGRestart className="h-6 w-6" />
                    </button>
                    <div className="flex-grow"></div>
                </div>
            </div>
            <div className="rounded-sm dark:bg-gray-800 bg-gray-200 w-full h-2 relative"
                onPointerDown={() => setIsDragging(true)}
                onPointerEnter={() => setIsHovering(true)}
                onPointerLeave={() => setIsHovering(false)}
                onClick={setBarPosition}
                ref={ref}
            >
                <div className="absolute bg-gray-500 w-full h-full" />
                <div
                    className="absolute dark:bg-white bg-gray-600 w-full h-full transition-transform ease-in-out cursor-pointer"
                    style={{
                        width: 100 * (isMoving ? (mouseHoverX < position ? position : mouseHoverX) : 0) + "%"
                    }}
                />
                <div
                    className="absolute bg-sky-500 w-full h-full transition-transform ease-in-out cursor-pointer"
                    style={{
                        width: 100 * (isMoving ? (mouseHoverX < position ? mouseHoverX : position) : position) + "%"
                    }}
                />
                <div
                    className={(isMoving ? "h-4 w-4 opacity-100" : "opacity-0 h-0 w-0") + " cursor-pointer rounded-full bg-sky-400 relative transform -translate-y-1/4 -translate-x-1/2 transition-opacity ease-in-out duration-100"}
                    style={{ left: 100 * (isMoving ? mouseHoverX : position) + "%" }}
                />
            </div>

        </div>
    )
}

export default AnimatorScrubBar;