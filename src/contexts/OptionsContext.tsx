import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Color } from "three";
import KeyCombo from "../studio/keycombos/KeyCombo";
import { KeyComboCategory, KeyComboKey, KeyComboMap, loadOrCreateKeyCombos, SavedKeyComboMap, updateClashes } from "../studio/keycombos/KeyCombos";
import { useStudio } from "./StudioContext";

const Context = createContext<OptionsContext | null>(null)
export type OptionsContext = {
  darkMode: boolean
  setDarkMode: (val: boolean) => void

  compactMode: boolean
  setCompactMode: (val: boolean) => void

  readonly keyCombos: KeyComboMap,
  keyCombosChanged: () => void, //TODO: remove this anti-pattern
}

type SavedOptions = {
  readonly darkMode: boolean,
  readonly compactMode: boolean,
  readonly keyCombos: SavedKeyComboMap
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
}) => {
  const options = useOptions()
  useEffect(() => {
    const handlerPairs = Object.keys(handlers)
      .flatMap(c => {
        const category = c as KeyComboCategory
        const keyCat = options.keyCombos[category].combos as Record<string, KeyCombo>
        const handlerCat = handlers[category] as Record<string, () => void>
        if (handlerCat === undefined) {
          return []
        }
        return Object.keys(handlerCat)
          .map(k => ({ combo: keyCat[k], handler: handlerCat[k] }))
      })

    const listener = (e: KeyboardEvent) => {
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
  }, [handlers, options.keyCombos])
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
  const keyCombos = useMemo(() => loadOrCreateKeyCombos(loadedOptions?.keyCombos), [loadedOptions?.keyCombos])

  const saveOptions = useCallback(() => {
    const data: SavedOptions = {
      darkMode: darkMode,
      compactMode: compactMode,
      keyCombos: Object.keys(keyCombos).reduce((obj, c) => {
        const category = c as KeyComboCategory
        const keyCat = keyCombos[category].combos as Record<string, KeyCombo>

        obj[category] = Object.keys(keyCombos[category].combos).reduce((obj, key) => {
          obj[key] = keyCat[key].writeSaved()
          return obj
        }, {} as SavedKeyComboMap[typeof category])

        return obj
      }, {} as SavedKeyComboMap)
    }
    localStorage.setItem("studio_options", JSON.stringify(data))
  }, [darkMode, compactMode, keyCombos])


  scene.background = new Color(darkMode ? 0x363636 : 0xF3F4F6)

  const wrapThenSave = (fn: (val: boolean) => void) => {
    return (val: boolean) => {
      fn(val)
      saveOptions()
    }
  }

  const keyCombosChanged = useCallback(() => {
    updateClashes(keyCombos)
    saveOptions()
  }, [keyCombos, saveOptions])
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