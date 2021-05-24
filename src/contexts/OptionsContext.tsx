import { createContext, ReactNode, useContext, useState } from "react";
import { Color } from "three";
import { useStudio } from "./StudioContext";

const Context = createContext<OptionsContext | null>(null)
export type OptionsContext = {
  darkMode: boolean
  setDarkMode: (val: boolean) => void

  compactMode: boolean
  setCompactMode: (val: boolean) => void
}

export const useOptions = () => {
  const context = useContext(Context)
  if (context == null) {
    throw new Error(`useOptions must be used within a OptionsContextProvider`)
  }
  return context
}

export const OptionsContextProvider = ({ children }: { children?: ReactNode }) => {
  const { scene } = useStudio()
  const [darkMode, setDarkMode] = useState(true)
  const [compactMode, setCompactMode] = useState(false)

  scene.background = new Color(darkMode ? 0x363636 : 0xF3F4F6)

  return (
    <Context.Provider value={{ darkMode, setDarkMode, compactMode, setCompactMode }}>
      {children}
    </Context.Provider>
  )
}