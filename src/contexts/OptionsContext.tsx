import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { Color } from "three";
import { KeyComboKey, KeyComboMap, loadOrCreateKeyCombos, SavedKeyComboMap, updateClashes } from "../studio/keycombos/KeyCombos";
import { useStudio } from "./StudioContext";

const Context = createContext<OptionsContext | null>(null)
export type OptionsContext = {
  darkMode: boolean
  setDarkMode: (val: boolean) => void

  compactMode: boolean
  setCompactMode: (val: boolean) => void

  keyCombos: KeyComboMap,
  keyCombosChanged: () => void, //TODO: remove this anti-pattern
}

type SavedOptions = {
  darkMode: boolean,
  compactMode: boolean,
  keyCombos: SavedKeyComboMap
}

export const useOptions = () => {
  const context = useContext(Context)
  if (context == null) {
    throw new Error(`useOptions must be used within a OptionsContextProvider`)
  }
  return context
}

export const useKeyCombos = () => {
  const options = useOptions()
  return options.keyCombos
}

export const OptionsContextProvider = ({ children }: { children?: ReactNode }) => {
  const { scene, setGridColor } = useStudio()

  const loadedOptions: SavedOptions | null = useMemo(() => {
    const json = localStorage.getItem("studio_options")
    if (json === null) {
      return null
    }
    return JSON.parse(json) as SavedOptions
  }, [])

  const [darkMode, setDarkMode] = useState(loadedOptions?.darkMode ?? true)
  const [compactMode, setCompactMode] = useState(loadedOptions?.compactMode ?? false)
  const keyCombos = useMemo(() => loadOrCreateKeyCombos(loadedOptions?.keyCombos), [])

  const saveOptions = useCallback(() => {
    const data: SavedOptions = {
      darkMode: darkMode,
      compactMode: compactMode,
      keyCombos: Object.keys(keyCombos).reduce((obj, k) => {
        const key = k as KeyComboKey
        obj[key] = keyCombos[key].writeSaved()
        return obj
      }, {} as SavedKeyComboMap)
    }
    localStorage.setItem("studio_options", JSON.stringify(data))
  }, [])


  scene.background = new Color(darkMode ? 0x363636 : 0xF3F4F6)

  const wrapThenSave = (fn: (val: boolean) => void) => {
    return (val: boolean) => {
      fn(val)
      saveOptions()
    }
  }

  const keyCombosChanged = () => {
    updateClashes(keyCombos)
    saveOptions()
  }

  if (darkMode) {
    setGridColor(0x121212, 0x1c1c1c, 0x292929)
  } else {
    setGridColor(0x737373, 0x525252, 0x404040)
  }

  return (
    <Context.Provider value={{ darkMode, setDarkMode: wrapThenSave(setDarkMode), compactMode, setCompactMode: wrapThenSave(setCompactMode), keyCombos, keyCombosChanged }}>
      {children}
    </Context.Provider>
  )
}