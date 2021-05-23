import { createContext, ReactNode, useContext, useState } from "react";

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
  const [darkMode, setDarkMode] = useState(true)
  const [compactMode, setCompactMode] = useState(false)
  return (
    <Context.Provider value={{ darkMode, setDarkMode, compactMode, setCompactMode }}>
      {children}
    </Context.Provider>
  )
}