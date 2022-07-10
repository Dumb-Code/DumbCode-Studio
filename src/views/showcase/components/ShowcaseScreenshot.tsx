import CollapsableSidebarPannel from "../../../components/CollapsableSidebarPannel"
import { ButtonWithTooltip } from "../../../components/Tooltips"
import { useStudio } from "../../../contexts/StudioContext"
import { useScreenshotHook } from "../../../studio/screenshot/ScreenshotHook"

const ShowcaseScreenshot = () => {
  const { renderer, setSize, getSelectedProject } = useStudio()
  const screenshot = useScreenshotHook()

  const runScreenshot = () => {
    const showcase = getSelectedProject().showcaseProperties
    const view = showcase.selectedView.value
    const lights = view.lights.value
    lights.forEach(light => light.setShadowMapSize(renderer.capabilities.maxTextureSize / 2))
    screenshot(true)
    lights.forEach(light => light.setShadowMapSize(showcase.previewShadowMapSize.value))
  }

  const screenshowWithResolution = (width: number, height: number) => () => {
    const element = renderer.domElement
    const oldWidth = element.width
    const oldHeight = element.height

    setSize(width, height)

    runScreenshot()

    setSize(oldWidth, oldHeight)
  }

  return (
    <CollapsableSidebarPannel title="SCREENSHOT" heightClassname="h-48" panelName="showcase_screenshot">
      <ScreenshotButton resolution="Current Resolution" onClick={runScreenshot} />
      <ScreenshotButton resolution="1080 × 1920" onClick={screenshowWithResolution(1080, 1920)} />
      <ScreenshotButton resolution="3840 × 2160 (4K)" onClick={screenshowWithResolution(3840, 2160)} />
      <ScreenshotButton resolution="7680 × 4320 (8K)" onClick={screenshowWithResolution(7680, 4320)} />
    </CollapsableSidebarPannel>
  )
}

const ScreenshotButton = ({ resolution, onClick }: { resolution: string, onClick: () => void }) => {
  return (
    <div className="flex flex-row mt-2 first:mt-0">
      <ButtonWithTooltip onClick={onClick} tooltip="Take Screenshot" className="flex justify-center bg-blue-500 p-2 rounded w-full mx-3 dark:text-white">
        Screenshot - {resolution}
      </ButtonWithTooltip>
    </div>
  )
}

export default ShowcaseScreenshot