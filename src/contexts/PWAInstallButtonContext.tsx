import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface BeforeInstallPromptEvent extends Event {

  /**
   * Returns an array of DOMString items containing the platforms on which the event was dispatched.
   * This is provided for user agents that want to present a choice of versions to the user such as,
   * for example, "web" or "play" which would allow the user to chose between a web version or
   * an Android version.
   */
  readonly platforms: Array<string>;

  /**
   * Returns a Promise that resolves to a DOMString containing either "accepted" or "dismissed".
   */
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;

  /**
   * Allows a developer to show the install prompt at a time of their own choosing.
   * This method returns a Promise.
   */
  prompt(): Promise<void>;

}

declare global {
  interface WindowEventMap {
    "beforeinstallprompt": BeforeInstallPromptEvent
  }
}

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