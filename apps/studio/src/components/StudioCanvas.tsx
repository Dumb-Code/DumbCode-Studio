import { HTMLAttributes, useEffect, useMemo, useRef } from "react";
import { useKeyComboPressed } from "../contexts/OptionsContext";
import { useStudio } from "../contexts/StudioContext";
import { useSelectedCubeHighlighter } from "../studio/cubehighlight/CubeSelectedHighlighterHook";
import { useDirectionalCube } from "../studio/directionalcube/DirectionalCubeHook";
import { useScreenshotHook } from "../studio/screenshot/ScreenshotHook";
import { useSelectedCubeManager } from "../studio/selections/SelectedCubeManagerHook";
import SelectedCubeUndoRedoHandler from "../studio/undoredo/SelectedCubeUndoRedoHandler";

export const RawCanvas = ({ autoChangeSize = true, ...props }: HTMLAttributes<HTMLDivElement> & { autoChangeSize?: boolean }) => {
  const { renderer, setSize } = useStudio()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current === null) {
      throw new Error("Error: Ref is not set");
    }

    const observer = new ResizeObserver(() => {
      if (ref.current !== null && autoChangeSize) {
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
  }, [renderer.domElement, setSize, autoChangeSize])


  return (
    <div
      ref={ref}
      className="studio-canvas-container rounded-sm bg-gray-800 h-full"
      {...props}
    />
  )
}

export const NonSelectableCanvas = (props: HTMLAttributes<HTMLDivElement>) => {

  const screenshot = useScreenshotHook()

  useKeyComboPressed(useMemo(() => ({
    common: {
      screenshot: () => screenshot(false),
      screenshot_only_model: () => screenshot(true),
    }
  }), [screenshot]), {})

  return (
    <RawCanvas
      {...props}
    />
  )
}

const StudioCanvas = ({ selectedCubeHandlerUndoRedo }: { selectedCubeHandlerUndoRedo?: SelectedCubeUndoRedoHandler<any> }) => {
  useSelectedCubeManager(selectedCubeHandlerUndoRedo)
  useSelectedCubeHighlighter()
  useDirectionalCube()

  const { onMouseUp } = useStudio()

  const startPosition = useRef({ x: 0, y: 0 })
  const movedAmount = useRef({ x: 0, y: 0 })

  return (
    <NonSelectableCanvas
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
    />
  )
}

export default StudioCanvas