import { createContext, PropsWithChildren, useContext, useState } from "react"
import { GridDisplayMode } from "../views/texturemapper/components/TextureMapperViewport"

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
  animator_ag: PanelValue<boolean>
  animator_se: PanelValue<boolean>

  history_list: PanelValue<boolean>

  texture_mapper_properties: PanelValue<boolean>
  texture_mapper_element_properties: PanelValue<boolean>
  texture_mapper_settings: PanelValue<boolean>

  texture_grid_type: PanelValue<GridDisplayMode>

  texture_layers: PanelValue<boolean>

  showcase_ambient_light: PanelValue<boolean>
  showcase_object_lights: PanelValue<boolean>
  showcase_shadows: PanelValue<boolean>
  showcase_screenshot: PanelValue<boolean>
  showcase_imagesettings: PanelValue<boolean>
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
const StudioPanelsContextProvider = ({ children }: PropsWithChildren<{}>) => {
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
  useValueGetterSetter(context, "animator_ag", false)
  useValueGetterSetter(context, "animator_se", false)
  useValueGetterSetter(context, "history_list", false)
  useValueGetterSetter(context, "texture_mapper_properties", true)
  useValueGetterSetter(context, "texture_mapper_element_properties", true)
  useValueGetterSetter(context, "texture_mapper_settings", true)
  useValueGetterSetter(context, "texture_layers", true)
  useValueGetterSetter(context, "texture_grid_type", "fade")
  useValueGetterSetter(context, "showcase_ambient_light", true)
  useValueGetterSetter(context, "showcase_object_lights", true)
  useValueGetterSetter(context, "showcase_shadows", true)
  useValueGetterSetter(context, "showcase_screenshot", true)
  useValueGetterSetter(context, "showcase_imagesettings", true)
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