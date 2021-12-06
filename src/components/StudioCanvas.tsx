import { useEffect, useRef } from "react";
import { useStudio } from "../contexts/StudioContext";
import { useSelectedCubeManager } from "../studio/util/SelectedCubeManager";

const StudioCanvas = () => {
  const { renderer, setSize, onMouseUp } = useStudio()
  useSelectedCubeManager()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current === null) {
      throw new Error("Error: Ref is not set");
    }
    const observer = new ResizeObserver(() => {
      if (ref.current !== null) {
        setSize(ref.current.clientWidth, ref.current.clientHeight)
      }
    })

    const currentRef = ref.current
    observer.observe(currentRef)
    setSize(currentRef.clientWidth, currentRef.clientHeight)
    currentRef.appendChild(renderer.domElement)

    return () => {
      observer.disconnect()
      currentRef.removeChild(renderer.domElement)
    }
  }, [renderer.domElement, setSize])

  const startPosition = useRef({ x: 0, y: 0 })
  const movedAmount = useRef({ x: 0, y: 0 })

  return (
    <div
      ref={ref}
      onPointerDown={e => {
        movedAmount.current = { x: 0, y: 0 }
        startPosition.current = { x: e.clientX, y: e.clientY }
      }}
      onPointerMove={e => {
        movedAmount.current.x = Math.max(movedAmount.current.x, Math.abs(e.clientX - startPosition.current.x))
        movedAmount.current.y = Math.max(movedAmount.current.y, Math.abs(e.clientY - startPosition.current.y))
      }}
      onPointerUp={e => {
        if (movedAmount.current.x <= 1 && movedAmount.current.y <= 1) {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur()
          }
          onMouseUp.fireEvent(e)
        }

      }}

      className="studio-canvas-container rounded-sm bg-gray-800 h-full"
    />
  )
}

export default StudioCanvas