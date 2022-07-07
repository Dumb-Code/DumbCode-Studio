import { createContext, PropsWithChildren, ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useCreatePortal } from "./CreatePortalContext"

type ContextType = {
  clearTooltip: () => void
  setTooltip: (tooltip: (() => ReactNode) | string, x: number, y: number) => void
}
export const TooltipContext = createContext<ContextType>({
  clearTooltip: () => { },
  setTooltip: () => { },
})

type TooltipData = {
  readonly tooltip: () => ReactNode,
  readonly xPos: number,
  readonly yPos: number
}

//Clamp a value between 0 and max, with width.
//Clamps with the padding
function clampWithPadding(value: number, width: number, max: number) {
  const clampPadding = 5
  if (value < clampPadding) {
    return clampPadding
  }
  if (value + width > max - clampPadding) {
    return max - width - clampPadding
  }
  return value
}


const TooltipContextProvider = ({ children }: PropsWithChildren<{}>) => {
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null)
  const createPortal = useCreatePortal()

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const current = containerRef.current
    if (current === null || tooltipData === null) {
      return
    }
    //We want to center on the x axis the tooltip 15px above the mouse
    // Hence the width/2 and height-15
    const left = clampWithPadding(tooltipData.xPos - current.clientWidth / 2, current.clientWidth, window.innerWidth)
    const top = clampWithPadding(tooltipData.yPos - current.clientHeight - 5, current.clientHeight, window.innerHeight)

    current.style.left = `${left}px`
    current.style.top = `${top}px`
  }, [tooltipData])

  const tooltip = useMemo<ContextType>(() => ({
    setTooltip: (tooltip, xPos, yPos) => {
      if (typeof tooltip === "function") {
        setTooltipData({ tooltip, xPos, yPos })
      } else if (typeof tooltip === "string") {
        setTooltipData({ tooltip: () => tooltip, xPos, yPos })
      }
    },
    clearTooltip: () => setTooltipData(null)
  }), [])

  const tooltipValue = useMemo(() => {
    if (tooltipData === null) {
      return null
    }

    const res = tooltipData.tooltip()
    if (typeof res === "string") {
      return res.split(/\n|\\+n/).map((s, i) => <div key={i}>{s || <span className="opacity-0">_empty</span>}</div>)
    }
    return res
  }, [tooltipData])

  return (
    <TooltipContext.Provider value={tooltip}>
      {children}
      {tooltipValue !== null && tooltipValue !== undefined && createPortal(
        <div
          ref={containerRef}
          className="absolute text-center border border-black p-0.5 dark:text-gray-300 dark:bg-gray-800 bg-gray-300"
        >
          {tooltipValue}
        </div>
      )}
    </TooltipContext.Provider>
  )
}

export const useTooltipRef = <T extends HTMLElement,>(TooltipElement: (() => ReactNode) | null | string, delay = 500) => {
  const ref = useRef<T>(null)

  const tooltip = useContext(TooltipContext)
  const mousePosition = useRef<{ x: number, y: number }>({ x: -1, y: -1 })
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (TooltipElement === null) {
      return
    }
    const mouseEnter = (e: MouseEvent) => {
      mousePosition.current = { x: e.clientX, y: e.clientY }
      tooltip.clearTooltip() //Shouldn't need to be called, but we will just in case
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        tooltip.setTooltip(TooltipElement, mousePosition.current.x, mousePosition.current.y)
      }, delay)
      e.preventDefault()
      e.stopPropagation()
    }

    const mouseLeave = (e: MouseEvent) => {
      tooltip.clearTooltip()
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = undefined
      }
      e.preventDefault()
      e.stopPropagation()
    }

    const mouseMove = (e: MouseEvent) => {
      mousePosition.current = { x: e.clientX, y: e.clientY }
      e.preventDefault()
      e.stopPropagation()
    }

    const current = ref.current
    if (current !== null) {
      current.addEventListener('mouseenter', mouseEnter)
      current.addEventListener('mouseleave', mouseLeave)
      current.addEventListener('mousemove', mouseMove)
    }
    return () => {
      if (current !== null) {
        current.removeEventListener('mouseenter', mouseEnter)
        current.removeEventListener('mouseenter', mouseLeave)
        current.removeEventListener('mousemove', mouseMove)
      }
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = undefined
      }
    }
  }, [TooltipElement, delay, tooltip])

  return ref
}

export default TooltipContextProvider