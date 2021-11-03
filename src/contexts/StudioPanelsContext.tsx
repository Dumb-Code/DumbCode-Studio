import { createContext, FC, useContext, useState } from "react"

type Togglable = {
  get: () => boolean
  set: (val: boolean) => void
}
const emptyToggle: Togglable = {
  get: () => false,
  set: () => { }
}
export type StudioPanelsContext = {
  model_cube: Togglable

  animator_cube: Togglable
  animator_kf: Togglable
  animator_looping: Togglable
  animator_ik: Togglable
  animator_pp: Togglable
}

const defaultValue: StudioPanelsContext = {
  model_cube: emptyToggle,
  animator_cube: emptyToggle,
  animator_kf: emptyToggle,
  animator_looping: emptyToggle,
  animator_ik: emptyToggle,
  animator_pp: emptyToggle
}

const Context = createContext(defaultValue)


const useBooleanGetterSetter = (object: StudioPanelsContext, name: keyof StudioPanelsContext, defaultValue: boolean) => {
  const [value, setValue] = useState(defaultValue)
  object[name] = {
    get: () => value,
    set: value => setValue(value)
  }
}
const StudioPanelsContextProvider: FC = ({ children }) => {
  const context = { ...defaultValue }
  useBooleanGetterSetter(context, "model_cube", true)
  useBooleanGetterSetter(context, "animator_cube", true)
  useBooleanGetterSetter(context, "animator_kf", true)
  useBooleanGetterSetter(context, "animator_looping", false)
  useBooleanGetterSetter(context, "animator_ik", false)
  useBooleanGetterSetter(context, "animator_pp", false)
  return (
    <Context.Provider value={context}>
      {children}
    </Context.Provider>
  )
}

export const usePanelToggle: (name: keyof StudioPanelsContext) => [boolean, (val: boolean) => void] = name => {
  const object = useContext(Context)[name]
  return [object.get(), value => object.set(value)]
}

export default StudioPanelsContextProvider