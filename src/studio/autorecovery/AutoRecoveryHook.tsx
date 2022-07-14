import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useOptions } from '../../contexts/OptionsContext';
import { useStudio } from '../../contexts/StudioContext';
import { useToast } from '../../contexts/ToastContext';
import { writeDcProj } from '../formats/project/DcProjectLoader';
import { useLocalStorage } from '../util/LocalStorageHook';
import AutoRecoveryFileSystem, { useIfHasBeenGivenAccess } from './AutoRecoveryFileSystem';


export const useAutoRecovery = () => {
  useAutoRecoveryListener()
  const canAutoRecover = useMemo(() => AutoRecoveryFileSystem.canAutoRecover, [])
  const hasBeenGivenAccess = useIfHasBeenGivenAccess()

  //The dismiss is to allow the user to never see the toast again. 
  //Auto recovery will still be enablable in the settings.
  const [hasBeenDismissedStr, setHasBeenDismissed] = useLocalStorage("autoRecoveryHasBeenDismissed")
  const hasBeenDismissed = hasBeenDismissedStr === "true"

  const { addToast } = useToast()

  const attemptToGiveAccess = useCallback(async () => {
    if (canAutoRecover) {
      const fs = await AutoRecoveryFileSystem.getOrCreateSystem()
      if (fs !== null) {
        addToast('Auto recovery has been enabled', 'success')
      } else {
        addToast('Unable to enable auto recovery', 'error')
      }
    }
  }, [canAutoRecover, addToast])

  useEffect(() => {
    if (!canAutoRecover || (hasBeenGivenAccess !== false) || hasBeenDismissed) {
      return
    }

    setTimeout(() => {
      addToast(() => <AutoRecoveryToast attemptToGiveAccess={attemptToGiveAccess} dismis={() => setHasBeenDismissed("true")} />, "info")
    }, 1000)

  }, [canAutoRecover, hasBeenGivenAccess, hasBeenDismissed, addToast, attemptToGiveAccess, setHasBeenDismissed])
}

const AutoRecoveryToast = ({ attemptToGiveAccess, dismis }: { attemptToGiveAccess: () => void, dismis: () => void }) => {
  return (
    <div className='flex flex-col flex-grow justify-between'>
      Auto recovery is disabled.
      <div className='flex flex-row'>
        <button onClick={attemptToGiveAccess} className='w-full icon-button mr-1 flex items-center justify-center'>Enable</button>
        <button onClick={dismis} className='w-full icon-button mr-1 flex items-center justify-center'>Dismiss</button>

      </div>
    </div>
  )
}

//This is where the actual auto recovery saving happens.
const useAutoRecoveryListener = () => {
  const { hasProject, getSelectedProject } = useStudio()

  const { autoRecoveryEnabled, autoRecoverySaveTime } = useOptions()

  const timeSinceLastSave = useRef(Date.now())

  useEffect(() => {
    if (!hasProject || !autoRecoveryEnabled || !AutoRecoveryFileSystem.canAutoRecover) {
      return
    }
    const project = getSelectedProject()

    //We do the auto recovery listening when the mouse moves,
    //or a key is pressed, so that if the user is afk and makes no changes,
    //Their autosave history is not filled up
    const checkAutoRecovery = async () => {
      const now = Date.now()
      //autoRecoverySaveTime is in minutes, so we need to convert to ms
      if (now - timeSinceLastSave.current > autoRecoverySaveTime * 60000) {
        timeSinceLastSave.current = now

        const blob = await writeDcProj(project)
        const file = await AutoRecoveryFileSystem.getFile(`${now}-${project.name.value}`)

        if (file !== null) {
          const writer = await new Promise<FileWriter>((resolve, reject) => file.createWriter(resolve, reject))
          console.log(writer.write(blob))
        }

      }
    }
    document.addEventListener("mousemove", checkAutoRecovery)
    document.addEventListener("keydown", checkAutoRecovery)
    return () => {
      document.removeEventListener("mousemove", checkAutoRecovery)
      document.removeEventListener("keydown", checkAutoRecovery)
    }

  }, [hasProject, getSelectedProject, autoRecoveryEnabled, autoRecoverySaveTime])

}