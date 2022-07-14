import { useCallback, useMemo } from "react"
import { SVGCheck } from "../../../components/Icons"
import NumericInput from "../../../components/NumericInput"
import { ButtonWithTooltip } from "../../../components/Tooltips"
import { useOptions } from "../../../contexts/OptionsContext"
import { useInstall } from "../../../contexts/PWAInstallButtonContext"
import { useTooltipRef } from "../../../contexts/TooltipContext"
import AutoRecoveriesDialogBox from "../../../dialogboxes/AutoRecoveriesDialogBox"
import ConfirmActionDialogBox from "../../../dialogboxes/ConfirmActionDialogBox"
import { useDialogBoxes } from "../../../dialogboxes/DialogBoxes"
import AutoRecoveryFileSystem, { useIfHasBeenGivenAccess, useUsageAndQuota } from "../../../studio/autorecovery/AutoRecoveryFileSystem"
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
      <p className="text-black dark:text-white font-semibold mb-2">GENERAL OPTIONS</p>

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

      <p className="text-gray-900 text-xs font-semibold mt-5">SCREENSHOT ACTIONS</p>
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

      <AutoRecoverySection />


    </div>
  )
}

const AutoRecoverySection = () => {
  const hasBeenGivenAccess = useIfHasBeenGivenAccess()

  const {
    autoRecoveryEnabled, setAutoRecoveryEnabled,
    autoRecoverySaveTime, setAutoRecoverySaveTime
  } = useOptions()

  const isPossible = AutoRecoveryFileSystem.canAutoRecover

  const buttonClicked = useCallback(() => {
    if (isPossible && hasBeenGivenAccess === true) {
      setAutoRecoveryEnabled(!autoRecoveryEnabled)
      return
    }
    if (isPossible && hasBeenGivenAccess === false) {
      AutoRecoveryFileSystem.getOrCreateSystem()
    }
  }, [isPossible, hasBeenGivenAccess, autoRecoveryEnabled, setAutoRecoveryEnabled])

  const { setDialogBox } = useDialogBoxes()

  const openRecoveries = useCallback(() => {
    setDialogBox(() => <AutoRecoveriesDialogBox />)
  }, [setDialogBox])

  return (
    <>
      <p className="text-gray-900 text-xs font-semibold mt-5">AUTO RECOVERY</p>
      <p className={(isPossible ? "text-gray-900" : "text-red-500") + " text-xs mb-2"}>
        {isPossible ? "Manage the auto recovery process" : "Auto recovery is not supported on this browser"}
      </p>

      <button
        onClick={openRecoveries}
        className="bg-bluegreen-500 border-2 border-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700 p-1 w-36"
      >
        Open Recoveries
      </button>

      {/* NGL, this button should be split up into two different components,
          One for when we've been given access to the api (Enable | Disable)
          and one for when we haven't been given access (Get Access | Not Possible)
      */}
      <button
        onClick={buttonClicked}
        className={
          (isPossible && hasBeenGivenAccess === true && autoRecoveryEnabled ? "bg-green-500 border-2 border-green-500 dark:bg-green-600 dark:hover:bg-green-700" :
            isPossible && (hasBeenGivenAccess === false || !autoRecoveryEnabled) ? "bg-red-500 border-2 border-red-500 dark:bg-red-600 dark:hover:bg-red-700" :
              "bg-gray-500 border-2 border-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700")
          + " p-1 w-32"
        }
        disabled={!isPossible}
      >
        {isPossible ? hasBeenGivenAccess === true ? (autoRecoveryEnabled ? "Disable" : "Enable") : "Grant Access" : "Not possible"}
      </button>
      <div className="flex flex-row mt-3 w-fit">
        <div className="dark:text-white mr-3">Time between autosave:</div>
        <div>
          <NumericInput
            background="bg-gray-200 dark:bg-gray-800"
            value={autoRecoverySaveTime}
            onChange={setAutoRecoverySaveTime}
            min={1}
            isPositiveInteger
          />
        </div>
        <div className="dark:text-white ml-2">minute{autoRecoverySaveTime === 1 ? "" : "s"}</div>
      </div>
      <UsageAndQuota />

    </>
  )
}

const UsageAndQuota = () => {
  const [usage, quota, numFiles, refreshUsageAndQuota] = useUsageAndQuota()
  const usageInMb = Math.round(usage / 1024 / 1024 * 100) / 100
  const quotaInMb = Math.round(quota / 1024 / 1024)

  const tooltip = `The amount of space used by the auto recovery system.\nWhen full, the oldest files will be deleted.`
  const tooltipRef = useTooltipRef<HTMLDivElement>(tooltip)

  const dialogBoxes = useDialogBoxes()

  const openDeleteDialogBox = () => {
    if (!AutoRecoveryFileSystem.canAutoRecover) {
      return
    }
    dialogBoxes.setDialogBox(() => <ConfirmActionDialogBox
      title="Delete Recovery Data"
      description="You are about to delete all recovery data. This action cannot be undone. Are you sure you want to continue?"
      onYes={async () => {
        await AutoRecoveryFileSystem.deleteAll()
        refreshUsageAndQuota()
      }}
    />)
  }

  return (
    <>
      <div className="flex flex-row items-center mt-2 h-8  ">
        <div ref={tooltipRef} className="w-64 h-full dark:bg-gray-800 bg-gray-300 mr-2">
          {AutoRecoveryFileSystem.canAutoRecover && <div className="h-full bg-green-500 dark:bg-green-600" style={{ width: `${usage / quota * 100}%` }} />}
        </div>
        <button disabled={!AutoRecoveryFileSystem.canAutoRecover} onClick={openDeleteDialogBox} className={"icon-button h-full pr-2 " + (AutoRecoveryFileSystem.canAutoRecover ? "text-gray-500" : "")}>Delete</button>
      </div>
      <p className="text-gray-900 text-xs mb-2">{`${usageInMb} MB of ${quotaInMb} MB (${numFiles} total backups)`}</p>
    </>
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