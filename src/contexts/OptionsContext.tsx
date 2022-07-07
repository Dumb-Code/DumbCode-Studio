import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Color } from "three";
import KeyCombo from "../studio/keycombos/KeyCombo";
import { KeyComboCategory, KeyComboKey, KeyComboMap, loadOrCreateKeyCombos, SavedKeyComboMap, updateClashes } from "../studio/keycombos/KeyCombos";
import { ScreenshotActionType } from "../studio/screenshot/ScreenshotActions";
import { useStudio } from "./StudioContext";

type ThemeSetting = "light" | "dark" | "auto";

const Context = createContext<OptionsContext | null>(null)
export type OptionsContext = {
  darkMode: boolean
  isSystemDark: boolean,
  theme: ThemeSetting,
  setTheme: (val: ThemeSetting) => void

  selectedScreenshotAction: ScreenshotActionType
  setScreenshotAction: (action: ScreenshotActionType) => void

  compactMode: boolean
  setCompactMode: (val: boolean) => void

  readonly keyCombos: KeyComboMap,
  keyCombosChanged: () => void, //TODO: remove this anti-pattern
}

type SavedOptions = {
  readonly theme: ThemeSetting,
  readonly compactMode: boolean,
  readonly keyCombos: SavedKeyComboMap
  readonly selectedScreenshotAction: ScreenshotActionType
}

export const useOptions = () => {
  const context = useContext(Context)
  if (context == null) {
    throw new Error(`useOptions must be used within a OptionsContextProvider`)
  }
  return context
}

export const useKeyCombos = () => {
  return useOptions().keyCombos
}

export const useKeyComboPressed = (handlers: {
  [category in KeyComboCategory]?: {
    [combo in KeyComboKey<category>]?: () => void
  }
}, { blurActiveElement = true } = {}) => {
  const studioOptions = useOptions()
  useEffect(() => {
    const handlerPairs = Object.keys(handlers)
      .flatMap(c => {
        const category = c as KeyComboCategory
        const keyCat = studioOptions.keyCombos[category].combos as Record<string, KeyCombo>
        const handlerCat = handlers[category] as Record<string, () => void>
        if (handlerCat === undefined) {
          return []
        }
        return Object.keys(handlerCat)
          .map(k => ({ combo: keyCat[k], handler: handlerCat[k] }))
          .filter(({ combo, handler }) => combo !== undefined && handler !== undefined)
      })

    const listener = (e: KeyboardEvent) => {
      if (!blurActiveElement && document.activeElement?.nodeName === "INPUT") {
        return
      }
      const found = handlerPairs.find(pair => pair.combo.matches(e))
      if (found !== undefined && found.handler !== undefined) {
        if (document.activeElement instanceof HTMLInputElement) {
          document.activeElement.blur()
        }
        found.handler()
        e.preventDefault()
        e.stopPropagation()
      }
    }

    document.addEventListener("keydown", listener)
    return () => document.removeEventListener("keydown", listener)
  }, [handlers, studioOptions.keyCombos, blurActiveElement])
}

export const OptionsContextProvider = ({ children }: { children?: ReactNode }) => {
  const { scene, setGridColor } = useStudio()

  const loadedOptions: SavedOptions | null = useMemo(() => {
    if (typeof window === "undefined") {
      return null
    }
    const json = localStorage.getItem("studio_options")
    if (json === null) {
      return null
    }
    return JSON.parse(json) as SavedOptions
  }, [])


  const [theme, setTheme] = useState<ThemeSetting>("auto") //We want the theme to default "auto" for SSG. This is overriden below.
  const [isSystemDark, setIsSystemDark] = useState(true)  //We want the dark theme to default true for SSG. This is overriden below.
  const [compactMode, setCompactMode] = useState(loadedOptions?.compactMode ?? false)
  const keyCombos = useMemo(() => loadOrCreateKeyCombos(loadedOptions?.keyCombos), [loadedOptions?.keyCombos])
  const [selectedScreenshotAction, setScreenshotAction] = useState<ScreenshotActionType>(loadedOptions?.selectedScreenshotAction ?? "copy_to_clipboard")

  const darkMode = useMemo(() => theme === "auto" ? isSystemDark : theme === "dark", [theme, isSystemDark])

  const saveOptions = useCallback(() => {
    const data: SavedOptions = {
      theme: theme,
      compactMode: compactMode,
      keyCombos: Object.keys(keyCombos).reduce((obj, c) => {
        const category = c as KeyComboCategory
        const keyCat = keyCombos[category].combos as Record<string, KeyCombo>

        obj[category] = Object.keys(keyCombos[category].combos).reduce((obj, key) => {
          obj[key] = keyCat[key].writeSaved()
          return obj
        }, {} as SavedKeyComboMap[typeof category])

        return obj
      }, {} as SavedKeyComboMap),
      selectedScreenshotAction: selectedScreenshotAction
    }
    localStorage.setItem("studio_options", JSON.stringify(data))
  }, [compactMode, keyCombos, theme, selectedScreenshotAction])
  useEffect(() => saveOptions(), [saveOptions])


  useEffect(() => {
    setTheme(loadedOptions?.theme ?? "auto")
    if (window.matchMedia !== undefined) {
      const query = window.matchMedia('(prefers-color-scheme: dark)')
      setIsSystemDark(query.matches)
      const listener = (event: MediaQueryListEvent) => {
        setIsSystemDark(event.matches)
      }
      query.addEventListener("change", listener)
      return () => query.removeEventListener("change", listener)
    }


  }, [loadedOptions?.theme])


  //When rendered SSR, scene is undefined
  if (scene !== undefined) {
    scene.background = new Color(darkMode ? 0x363636 : 0xF3F4F6)
  }


  const keyCombosChanged = useCallback(() => {
    updateClashes(keyCombos)
    saveOptions()
  }, [keyCombos, saveOptions])

  //When rendered SSR, setGridColor is undefined
  if (setGridColor) {
    if (darkMode) {
      setGridColor(0x121212, 0x1c1c1c, 0x292929)
    } else {
      setGridColor(0x737373, 0x525252, 0x404040)
    }

  }
  return (
    <Context.Provider value={{ darkMode, isSystemDark, theme, setTheme, compactMode, setCompactMode, setScreenshotAction, selectedScreenshotAction, keyCombos, keyCombosChanged }}>
      {children}
    </Context.Provider>
  )
}