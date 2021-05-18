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
                if(isDragging) {
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
        <div className="h-full bg-gray-800 pt-2">
            <div className="absolute flex flex-row w-4/5 transform -translate-y-3.5 ml-14">
                <div className="flex-grow"></div>
                <button className="bg-gray-900 px-1 rounded-tl-md pt-1 text-gray-400 hover:text-red-500 border-l-2 border-t-2 border-black">
                    <SVGStop className="h-6 w-6" />
                </button>
                <button className="bg-gray-900 px-2 text-white hover:text-lightBlue-500 border-t-2 border-black" onClick={() => setPlaying(!isPlaying)}>
                    {isPlaying
                        ? <SVGPause className="h-8 w-8" />
                        : <SVGPlay className="h-8 w-8" />
                    }
                </button>
                <button className="bg-gray-900 px-1 rounded-tr-md pt-1 text-gray-400 hover:text-yellow-400 border-r-2 border-t-2 border-black">
                    <SVGRestart className="h-6 w-6" />
                </button>
                <div className="flex-grow"></div>
            </div>
            <div className="rounded-sm bg-gray-800 h-full"
                onPointerDown={() => setIsDragging(true)}
                onPointerEnter={() => setIsHovering(true)}
                onPointerLeave={() => setIsHovering(false)}
                onClick={setBarPosition}
                ref={ref}
            >
                <div
                    className="transform -translate-y-2 bg-gray-500 w-full h-2 relative top-7 transition-transform ease-in-out cursor-pointer"
                />
                <div
                    className="transform -translate-y-3 bg-white h-2 relative top-7 -mt-1 transition-transform ease-in-out cursor-pointer"
                    style={{
                        width: 100 * (isMoving ? (mouseHoverX < position ? position : mouseHoverX) : 0) + "%"
                    }}
                />
                <div
                    className="transform -translate-y-4 bg-lightBlue-500 h-2 relative top-7 -mt-1 transition-transform ease-in-out cursor-pointer"
                    style={{
                        width: 100 * (isMoving ? (mouseHoverX < position ? mouseHoverX : position) : position) + "%"
                    }}
                />
            </div>
            <div className={(isMoving ? "h-4 w-4 opacity-100" : "opacity-0 h-0 w-0") + " cursor-pointer rounded-full bg-lightBlue-400 relative transform -translate-y-1.5 -translate-x-1/2 transition-opacity ease-in-out duration-100"}
                style={{ left: 100 * (isMoving ? mouseHoverX : position) + "%" }}
                onClick={setBarPosition}
                onPointerDown={() => setIsDragging(true)}
                onPointerEnter={() => setIsHovering(true)}
                onPointerLeave={() => setIsHovering(false)}
            >
            </div>
        </div>
    )
}

export default AnimatorScrubBar;