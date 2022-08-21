import { MouseEvent as ReactMouseEvent, useCallback, useEffect, useRef, useState } from "react";
import { MoveableDividerArea } from "../DividerArea";

const StudioGridDivider = ({ divider }: { divider: MoveableDividerArea }) => {
  const side = divider.moveableData.moveableSide
  const horizontal = side === "left" || side === "right"

  const [isDragging, setIsDragging] = useState(false)

  const mouseStart = useRef({ x: 0, y: 0 })

  const clampNewValue = useCallback((newValue: number) => {
    const { from, to } = divider.moveableData
    return Math.min(Math.max(newValue, from), to)
  }, [divider.moveableData])

  useEffect(() => {
    if (!isDragging) {
      return
    }
    const areaValue = divider.moveableData.areaValueNum
    const startValue = areaValue.value

    const onMouseMoveGlobally = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const delta = horizontal ? mouseStart.current.x - clientX : mouseStart.current.y - clientY
      areaValue.value = clampNewValue(startValue + delta)
    }
    const onMouseUpGlobally = (e: MouseEvent) => {
      setIsDragging(false)
    }

    document.addEventListener("mousemove", onMouseMoveGlobally)
    document.addEventListener("mouseup", onMouseUpGlobally)
    return () => {
      document.removeEventListener("mousemove", onMouseMoveGlobally)
      document.removeEventListener("mouseup", onMouseUpGlobally)
    }
  }, [setIsDragging, isDragging, horizontal, divider.moveableData.areaValueNum, clampNewValue])

  const beginDragging = (e: ReactMouseEvent) => {
    mouseStart.current = { x: e.clientX, y: e.clientY }
    setIsDragging(true)
    e.stopPropagation()
    e.preventDefault()
  }

  let className = ""
  if (side === "left") {
    className = "-translate-x-1/2 left-0"
  } else if (side === "right") {
    className = "translate-x-1/2 right-0"
  } else if (side === "top") {
    className = "-translate-y-1/2 top-0"
  } else if (side === "bottom") {
    className = "translate-y-1/2 bottom-0"
  }


  return (
    <div
      className={`absolute bg-black ${className} ` + (horizontal ? "h-full w-2" : "w-full h-2")}
      style={{
        gridArea: divider.moveableData.area.gridName,
      }}

      onMouseDown={beginDragging}
    />
  )
}

export default StudioGridDivider;