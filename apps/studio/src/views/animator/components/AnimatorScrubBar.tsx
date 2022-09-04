import { SVGLink, SVGPause, SVGPlay, SVGRestart, SVGStop } from "@dumbcode/shared/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NumericInput from "../../../components/NumericInput";
import { ButtonWithTooltip } from "../../../components/Tooltips";
import { useKeyComboPressed, useKeyCombos } from "../../../contexts/OptionsContext";
import DcaAnimation from "../../../studio/formats/animations/DcaAnimation";
import { useListenableObject, useListenableObjectNullable } from "../../../studio/listenableobject/ListenableObject";

const AnimatorScrubBar = ({ animation }: { animation: DcaAnimation | null }) => {
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

    const [shouldContinueLooping, setShouldContinueLooping] = useListenableObjectNullable(animation?.shouldContinueLooping)

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

    const setTimeAt = useCallback((time: number) => {
        if (animation !== null) {
            setValueGiven(time)
            animation.time.value = time
        }
    }, [animation, setValueGiven])

    const setBarPosition = useCallback(() => {
        if (animation !== null) {
            setTimeAt(mouseHoverXRef.current * max)
        }
    }, [setTimeAt, mouseHoverXRef, max, animation])


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

    const onToggle = useCallback(() => {
        setPlaying(!isPlaying)
        if (!isPlaying && animation?.time.value === 0) {
            setShouldContinueLooping(true)
        }
    }, [isPlaying, setPlaying])

    const onRestart = useCallback(() => {
        setTimeAt(0)
        setPlaying(true)
        setShouldContinueLooping(true)
    }, [setTimeAt, setPlaying])

    const onStop = useCallback(() => {
        setTimeAt(0)
        setPlaying(false)
    }, [setTimeAt, setPlaying])

    const toggleLooping = () => {
        setShouldContinueLooping(!shouldContinueLooping)
    }

    useKeyComboPressed(
        useMemo(() => ({
            animator: {
                pause_or_play: onToggle,
                restart_animation: onRestart,
                stop_animation: onStop,
            }
        }), [onToggle, onRestart, onStop]),
        { blurActiveElement: false }
    )

    const keycombos = useKeyCombos().animator.combos

    const [stopName] = useListenableObject(keycombos.stop_animation.displayName)
    const [pauseName] = useListenableObject(keycombos.pause_or_play.displayName)
    const [resetName] = useListenableObject(keycombos.restart_animation.displayName)
    const [loopingName] = useListenableObject(keycombos.toggle_looping.displayName)


    return (
        <div className="flex flex-col items-center justify-end h-full dark:bg-gray-800 bg-white">
            <div className="flex-grow relative w-full">
                <div className="absolute bottom-0 left-0 right-0 flex flex-row w-full">
                    <div className="flex-grow"></div>
                    <ButtonWithTooltip tooltip={`Stop Animation (${stopName})`} onClick={onStop} className="z-10 dark:bg-gray-900 bg-gray-200 px-1 rounded-tl-md pt-1 dark:text-gray-400 text-black hover:text-red-500 border-l-2 border-t-2 dark:border-black border-white">
                        <SVGStop className="h-6 w-6" />
                    </ButtonWithTooltip>
                    <ButtonWithTooltip tooltip={`${isPlaying ? "Pause" : "Play"} Animation (${pauseName})`} onClick={onToggle} className="z-10 dark:bg-gray-900 bg-gray-200 px-2 dark:text-white text-gray-900 hover:text-sky-500 border-t-2 dark:border-black border-white">
                        {isPlaying
                            ? <SVGPause className="h-8 w-8" />
                            : <SVGPlay className="h-8 w-8" />
                        }
                    </ButtonWithTooltip>
                    <ButtonWithTooltip tooltip={`Restart Animation (${resetName})`} onClick={onRestart} className="z-10 dark:bg-gray-900 bg-gray-200 px-1 pt-1 dark:text-gray-400 text-black hover:text-yellow-400 border-t-2 dark:border-black border-white">
                        <SVGRestart className="h-6 w-6" />
                    </ButtonWithTooltip>
                    <ButtonWithTooltip tooltip={`Toggle Looping (${loopingName})`} onClick={toggleLooping}
                        className={"z-10 dark:bg-gray-900 bg-gray-200 px-1 rounded-tr-md pt-1 border-r-2 border-t-2 dark:border-black border-white " + (shouldContinueLooping ? "text-blue-500" : "dark:text-gray-400 text-black")}>
                        <SVGLink className="h-6 w-6" />
                    </ButtonWithTooltip>
                    <div className="flex-grow"></div>
                </div>
            </div>
            <div className="w-full h-full flex flex-row items-center mr-2">
                <div className="h-6 ml-1.5 mr-1">
                    <NumericInput
                        hideArrows
                        value={valueGiven}
                        onChange={setTimeAt}
                    />
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

        </div>
    )
}

export default AnimatorScrubBar;