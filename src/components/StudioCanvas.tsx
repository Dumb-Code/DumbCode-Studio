import { HTMLAttributes, useCallback, useEffect, useMemo, useRef } from "react";
import { useKeyComboPressed, useOptions } from "../contexts/OptionsContext";
import { useStudio } from "../contexts/StudioContext";
import { useModelIsolationFactory, useNoBackgroundFactory } from "../contexts/ThreeContext";
import { useToast } from "../contexts/ToastContext";
import { ScreenshotActionMap, ScreenshotDesciptionMap } from "../studio/screenshot/ScreenshotActions";
import { useSelectedCubeHighlighter } from "../studio/util/CubeSelectedHighlighter";
import { useSelectedCubeManager } from "../studio/util/SelectedCubeManager";

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

const StudioCanvas = () => {
  const { onMouseUp, renderer, renderSingleFrame } = useStudio()
  useSelectedCubeManager()
  useSelectedCubeHighlighter()

  const { selectedScreenshotAction } = useOptions()

  const { addToast } = useToast()

  const isolationFactory = useModelIsolationFactory()
  const noBackgroundFactory = useNoBackgroundFactory()

  const screenshot = useCallback(async (onlyModel: boolean) => {
    let resetIsolation = onlyModel ? isolationFactory() : null
    let resetBackground = onlyModel ? noBackgroundFactory() : null

    renderSingleFrame(!onlyModel)

    if (resetIsolation !== null) {
      resetIsolation()
    }
    if (resetBackground !== null) {
      resetBackground()
    }

    const blob = await new Promise<Blob | null>(resolve => {
      renderer.domElement.toBlob(blob => resolve(blob))
    })
    if (blob === null) {
      addToast("Failed to take screenshot")
      return
    }

    try {
      await ScreenshotActionMap[selectedScreenshotAction](blob)
      addToast(`Screenshot taken (${ScreenshotDesciptionMap[selectedScreenshotAction]})`)
    } catch (e) {
      addToast(`Error completing action: ${selectedScreenshotAction}`)
    }

  }, [selectedScreenshotAction, renderer, renderSingleFrame, isolationFactory, noBackgroundFactory, addToast])

  useKeyComboPressed(useMemo(() => ({
    common: {
      screenshot: () => screenshot(false),
      screenshot_only_model: () => screenshot(true),
    }
  }), [screenshot]), {})

  const startPosition = useRef({ x: 0, y: 0 })
  const movedAmount = useRef({ x: 0, y: 0 })
  return (
    <RawCanvas
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