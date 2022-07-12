import { useCallback, useMemo } from "react"
import { SVGCheck } from "../../../components/Icons"
import { ButtonWithTooltip } from "../../../components/Tooltips"
import { useOptions } from "../../../contexts/OptionsContext"
import { useInstall } from "../../../contexts/PWAInstallButtonContext"
import { AllScreenshotActionTypes, ScreenshotDesciptionMap } from "../../../studio/screenshot/ScreenshotActions"

const GeneralOptions = () => {
  const isChrome = useMemo(() => "chrome" in window, [])
  const isEdge = useMemo(() => isChrome && navigator.userAgent.indexOf("Edg") != -1, [isChrome])
  const { installState } = useInstall()

  const appEdit = isEdge ? "edge://apps" : "chrome://apps"

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(appEdit)
  }, [appEdit])

  const { selectedScreenshotAction, setScreenshotAction } = useOptions()

  return (
    <div className="dark:text-white">
      <p className="text-black dark:text-white font-semibold mb-2">APPLICATION OPTIONS</p>

      <p className="text-gray-900 text-xs font-semibold">INSTALL</p>
      <PWAInstallButton />

      {installState === "installed" && (isChrome || isEdge) && (
        <>
          <p className="text-gray-900 text-xs font-semibold mt-2">REVIEW</p>
          <p className="text-gray-900 text-xs mb-1">Open
            <ButtonWithTooltip onClick={copyToClipboard} tooltip="Copy to clipboard" className="text-blue-500 mx-1">{appEdit}</ButtonWithTooltip>
            to review the installed App.</p>
        </>
      )}

      <p className="text-gray-900 text-xs font-semibold mt-2">SCREENSHOT ACTIONS</p>
      <p className="text-gray-900 text-xs mb-2">Allows you to customize the way screenshots or showcase tab exports are saved.</p>
      <div className="flex flex-col w-fit">
        {AllScreenshotActionTypes.map(action => (
          <button
            key={action}
            className={
              "p-2 pr-4 rounded-md my-1 text-left flex flex-row " +
              (selectedScreenshotAction === action ? "border-2 border-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600" : "border-2 dark:border-gray-800 dark:bg-gray-800 bg-gray-300 dark-hover:dark:bg-gray-600 hover:bg-gray-200 ")
            }
            onClick={() => setScreenshotAction(action)}
          >
            {(selectedScreenshotAction === action ? <SVGCheck className="dark:text-black text-white h-6 w-6 rounded-full bg-green-600 mr-2" /> : <div className="h-6 w-6 rounded-full bg-gray-500 border-2 border-gray-300 mr-2"></div>)}
            {ScreenshotDesciptionMap[action]}
          </button>
        ))}
      </div>

    </div>
  )
}

const PWAInstallButton = () => {
  const { installState, install } = useInstall()

  const isFirefox = useMemo(() => "InstallTrigger" in window, [])

  return (
    <>
      {isFirefox && <p className="dark:text-white">Firefox is not directly supported as a PWA. Please see <a className=" text-blue-700 dark:text-blue-400" href="https://addons.mozilla.org/en-US/firefox/addon/pwas-for-firefox/">here</a> on how to install.</p>}
      <div className="flex flex-row">
        {installState === "can-install" ? (
          <button className="bg-blue-600 rounded px-2 mr-2 dark:text-white" onClick={install}>
            Install as PWA
          </button>
        ) : installState === "installed" ? (
          <button className="bg-green-600 rounded px-2 mr-2 dark:text-white">
            Installed
          </button>
        ) : installState === "installing" ? (
          <button className="bg-orange-600 rounded px-2 mr-2 dark:text-white">
            Installing
          </button>
        ) : (
          <button className="bg-red-600 rounded px-2 mr-2 dark:text-white" disabled>
            Unable to Install
          </button>
        )}

      </div>
    </>
  )
}

export default GeneralOptions