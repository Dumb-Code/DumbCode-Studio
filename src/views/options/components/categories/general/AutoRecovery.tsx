import { useCallback } from "react"
import NumericInput from "../../../../../components/NumericInput"
import { useOptions } from "../../../../../contexts/OptionsContext"
import { useTooltipRef } from "../../../../../contexts/TooltipContext"
import AutoRecoveriesDialogBox from "../../../../../dialogboxes/AutoRecoveriesDialogBox"
import ConfirmActionDialogBox from "../../../../../dialogboxes/ConfirmActionDialogBox"
import { useDialogBoxes } from "../../../../../dialogboxes/DialogBoxes"
import AutoRecoveryFileSystem, { useUsageAndQuota } from "../../../../../studio/autorecovery/AutoRecoveryFileSystem"
import { OptionCategorySection } from "../../OptionCategories"

const AutoRecoveryComponent = () => {

  const {
    autoRecoveryEnabled, setAutoRecoveryEnabled,
    autoRecoverySaveTime, setAutoRecoverySaveTime
  } = useOptions()


  const buttonClicked = useCallback(() => {
    setAutoRecoveryEnabled(!autoRecoveryEnabled)
  }, [autoRecoveryEnabled, setAutoRecoveryEnabled])

  const { setDialogBox } = useDialogBoxes()

  const openRecoveries = useCallback(() => {
    setDialogBox(() => <AutoRecoveriesDialogBox />)
  }, [setDialogBox])

  return (
    <>
      <button
        onClick={openRecoveries}
        className="bg-blue-500 dark:hover:bg-blue-700 pl-4 transition-colors duration-200 p-2 pr-4 rounded-md my-1 text-center flex flex-row w-80"
      >
        Open Recoveries
      </button>

      <button
        onClick={buttonClicked}
        className={
          (autoRecoveryEnabled ? "bg-green-500 ring-2 ring-inset ring-green-500 dark:bg-green-600 dark:hover:bg-green-700" :
            "bg-red-500 border-red-500 dark:bg-red-600 dark:hover:bg-red-700")
          + " pl-4 transition-colors duration-200 p-2 pr-4 rounded-md my-1 text-center flex flex-row w-80"
        }
      >
        {autoRecoveryEnabled ? "Enabled" : "Disabled"}
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
  const [usage, quota, numFiles] = useUsageAndQuota()
  const usageInMb = Math.round(usage / 1024 / 1024 * 100) / 100
  const quotaInMb = Math.round(quota / 1024 / 1024)

  const tooltip = `The amount of space used by the auto recovery system.\nWhen full, the oldest files will be deleted.`
  const tooltipRef = useTooltipRef<HTMLDivElement>(tooltip)

  const dialogBoxes = useDialogBoxes()

  const openDeleteDialogBox = () => {
    dialogBoxes.setDialogBox(() => <ConfirmActionDialogBox
      title="Delete Recovery Data"
      description="You are about to delete all recovery data. This action cannot be undone. Are you sure you want to continue?"
      onYes={async () => {
        await AutoRecoveryFileSystem.deleteAll()
      }}
    />)
  }

  return (
    <>
      <div className="flex flex-row items-center mt-2 h-8  ">
        <div ref={tooltipRef} className="w-64 h-full dark:bg-gray-800 bg-gray-300 mr-2">
          <div className="h-full bg-green-500 dark:bg-green-600" style={{ width: `${usage / quota * 100}%` }} />
        </div>
        <button onClick={openDeleteDialogBox} className="icon-button h-full pr-2 text-gray-500">Delete</button>
      </div>
      <p className="text-gray-900 text-xs mb-2">{`${usageInMb} MB of ${quotaInMb} MB (${numFiles} total backups)`}</p>
    </>
  )
}

const AutoRecovery: OptionCategorySection = {
  title: "Auto Recovery",
  description: "Manage the auto recovery process",
  component: AutoRecoveryComponent
}
export default AutoRecovery