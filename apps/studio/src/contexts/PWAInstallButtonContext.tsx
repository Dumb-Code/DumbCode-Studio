import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { BeforeInstallPromptEvent } from "../types/pwainstallcontext";

type InstallState = "not-installed" | "installed" | "installing" | "can-install"

type InstallContext = {
  installState: InstallState
  install: () => void
}

const Context = createContext<InstallContext | null>(null)

export const useInstall = () => {
  const context = useContext(Context)
  if (context == null) {
    throw new Error(`useInstall must be used within a InstallContextProvider`)
  }
  return context
}
const PWAInstallButtonContext = ({ children }: { children: React.ReactNode }) => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalling, setIsInstalling] = useState(false)
  const [canInstall, setCanInstall] = useState(false)

  const updateIsInstalled = useCallback(() => typeof window !== "undefined" && window.matchMedia('(display-mode: standalone)').matches, [])
  const [isInstalled, setIsInstalled] = useState(updateIsInstalled)

  useEffect(() => {
    if (isInstalled) {
      return
    }
    const timeoutRef = setInterval(() => {
      setIsInstalled(updateIsInstalled())
    }, 100)
    return () => clearInterval(timeoutRef)
  }, [isInstalled, updateIsInstalled])

  useEffect(() => {
    const listener = (e: BeforeInstallPromptEvent) => {
      setInstallPrompt(e)
      setCanInstall(true)
    }
    window.addEventListener("beforeinstallprompt", listener)
    return () => {
      window.removeEventListener("beforeinstallprompt", listener)
    }
  }, [])

  const install = useCallback(async () => {
    if (installPrompt !== null) {
      installPrompt.prompt()
      const choice = await installPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setIsInstalling(true)
        setCanInstall(false)
      }
    }
  }, [installPrompt])

  const installState = useMemo<InstallState>(() => {
    if (isInstalled) {
      return "installed"
    }
    if (isInstalling) {
      return "installing"
    }
    if (canInstall) {
      return "can-install"
    }
    return "not-installed"
  }, [isInstalled, canInstall, isInstalling])


  const context = useMemo<InstallContext>(() => ({ installState, install }), [installState, install])
  return <Context.Provider value={context}>{children}</Context.Provider>
}

export default PWAInstallButtonContext