import { useCallback } from "react"
import { useOptions } from "../../contexts/OptionsContext"
import { useStudio } from "../../contexts/StudioContext"
import { useModelIsolationFactory, useNoBackgroundFactory } from "../../contexts/ThreeContext"
import { useToast } from "../../contexts/ToastContext"
import { ScreenshotActionMap, ScreenshotDesciptionMap } from "./ScreenshotActions"

export const useScreenshotHook = () => {
  const { renderer, renderSingleFrame } = useStudio()

  const { selectedScreenshotAction } = useOptions()

  const { addToast } = useToast()

  const isolationFactory = useModelIsolationFactory()
  const noBackgroundFactory = useNoBackgroundFactory()

  return useCallback(async (onlyModel: boolean) => {
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
      addToast("Failed to take screenshot", "error")
      return
    }

    try {
      await ScreenshotActionMap[selectedScreenshotAction](blob)
      addToast(`Screenshot taken (${ScreenshotDesciptionMap[selectedScreenshotAction]})`, "success")
    } catch (e) {
      addToast(`Error completing action: ${selectedScreenshotAction}`, "error")
    }

  }, [selectedScreenshotAction, renderer, renderSingleFrame, isolationFactory, noBackgroundFactory, addToast])
}