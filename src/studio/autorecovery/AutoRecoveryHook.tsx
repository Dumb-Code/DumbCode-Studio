import { useCallback, useEffect, useMemo } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { useLocalStorage } from '../util/LocalStorageHook';
import AutoRecoveryFileSystem, { useIfHasBeenGivenAccess } from './AutoRecoveryFileSystem';


export const useAutoRecoveryFileSystem = () => {
  const canAutoRecover = useMemo(() => AutoRecoveryFileSystem.canAutoRecover, [])
  const hasBeenGivenAccess = useIfHasBeenGivenAccess()
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