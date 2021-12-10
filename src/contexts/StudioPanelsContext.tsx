import { createContext, FC, useContext, useState } from "react"

export type PanelValue<T> = {
  get: () => T
  set: (val: T) => void
}

export type StudioPanelsContext = {
  cube_list: PanelValue<boolean>
  model_cube: PanelValue<boolean>
  model_cube_size: PanelValue<number>
  model_properties: PanelValue<boolean>

  animator_cube: PanelValue<boolean>
  animator_visibility: PanelValue<boolean>
  animator_kf: PanelValue<boolean>
  animator_looping: PanelValue<boolean>
  animator_ik: PanelValue<boolean>
  animator_pp: PanelValue<boolean>

  history_list: PanelValue<boolean>

  texture_properties: PanelValue<boolean>
  texture_element_properties: PanelValue<boolean>
  texture_layers: PanelValue<boolean>
}

const Context = createContext<StudioPanelsContext | null>(null)


const useValueGetterSetter = <
  T extends keyof StudioPanelsContext,
  R = StudioPanelsContext[T] extends PanelValue<infer I> ? I : never
>(object: StudioPanelsContext, name: T, defaultValue: R) => {
  const [value, setValue] = useState(defaultValue)
  const val: PanelValue<R> = {
    get: () => value,
    set: value => setValue(value)
  }
  //@ts-expect-error
  object[name] = val
}
const StudioPanelsContextProvider: FC = ({ children }) => {
  const context: StudioPanelsContext = {} as any //We define the properties in the next lines.
  useValueGetterSetter(context, "cube_list", true)
  useValueGetterSetter(context, "model_cube", true)
  useValueGetterSetter(context, "model_cube_size", 430)
  useValueGetterSetter(context, "model_properties", true)
  useValueGetterSetter(context, "animator_cube", true)
  useValueGetterSetter(context, "animator_visibility", true)
  useValueGetterSetter(context, "animator_kf", true)
  useValueGetterSetter(context, "animator_looping", false)
  useValueGetterSetter(context, "animator_ik", false)
  useValueGetterSetter(context, "animator_pp", false)
  useValueGetterSetter(context, "history_list", false)
  useValueGetterSetter(context, "texture_properties", true)
  useValueGetterSetter(context, "texture_element_properties", true)
  useValueGetterSetter(context, "texture_layers", true)
  return (
    <Context.Provider value={context}>
      {children}
    </Context.Provider>
  )
}

export const usePanelValue = <
  T extends keyof StudioPanelsContext,
  R = StudioPanelsContext[T] extends PanelValue<infer I> ? I : never
>(name: T): [R, (val: R) => void] => {
  const context = useContext(Context)
  if (context === null) {
    throw new Error(`useProjectPageContext must be used within a ProjectPageContextProvider`)
  }
  const object = context[name] as unknown as PanelValue<R>
  if (object === undefined) {
    throw new Error(`${name} was not set on context`);
  }
  return [object.get(), value => object.set(value)]
}

export default StudioPanelsContextProvider