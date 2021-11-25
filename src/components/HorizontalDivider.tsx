import { useEffect, useRef, useState } from "react"

const HorizontalDivider = ({ max, min, value, setValue, toggleDragging }: { min: number, max: number, value: number, setValue: (value: number) => void, toggleDragging: (value: boolean) => void }) => {
  const divRef = useRef<HTMLDivElement>(null)

  const [dragging, setDragging] = useState(false)
  const startingValue = useRef(value)
  const startingDrag = useRef(0)

  useEffect(() => {
    if (!dragging) {
      return
    }
    const mouseMove = (e: MouseEvent) => {
      const dragged = startingDrag.current - e.clientY
      setValue(Math.max(Math.min(startingValue.current + dragged, max), min))
    }

    const mouseUp = () => {
      clearEvents()
      setDragging(false)
      toggleDragging(false)
    }

    const clearEvents = () => {
      document.removeEventListener("mousemove", mouseMove)
      document.removeEventListener("mouseup", mouseUp)
    }

    document.addEventListener("mousemove", mouseMove)
    document.addEventListener("mouseup", mouseUp)

    return clearEvents
  }, [dragging, max, min, setValue, toggleDragging])

  return (
    <div ref={divRef} className="w-full relative">
      <div onMouseDown={e => {
        startingValue.current = value
        startingDrag.current = e.clientY
        setDragging(true)
        toggleDragging(true)
      }} style={{ 'cursor': 'n-resize' }} className="absolute left-0 right-0 h-2"></div>
    </div>
  )
}

export default HorizontalDivider