import { ReactNode, useMemo, useState } from "react"
import { ButtonWithTooltip } from "../components/Tooltips"
import { useTooltipRef } from "../contexts/TooltipContext"
import { jsonLightToShowcaseLight, JsonShowcaseView, viewToLights } from "../studio/formats/showcase/JsonShowcaseView"
import { useListenableObject } from "../studio/listenableobject/ListenableObject"
import ShowcaseView from "../studio/showcase/ShowcaseView"
import { useLocalStorage } from "../studio/util/LocalStorageHook"
import { OpenedDialogBox } from "./DialogBoxes"

const localstorageKey = "showcase-light-presets"

type LightingPreset = {
  name: string
  ambientLighting: JsonShowcaseView['ambientLight']
  lights: JsonShowcaseView['lights']
}

const defaultNewName = "New Preset"
const ShowcaseLightSavedPresets = ({ view }: { view: ShowcaseView }) => {

  const [localStorageData, setLocalStorage] = useLocalStorage(localstorageKey)

  const [newName, setNewName] = useState(defaultNewName)

  const [ambientLightColour, setAmbientLightColour] = useListenableObject(view.ambientLightColour)
  const [ambientLightIntensity, setAmbientLightIntensity] = useListenableObject(view.ambientLightIntensity)
  const [lights, setLights] = useListenableObject(view.lights)

  const viewPreset = useMemo<LightingPreset>(() => {
    return {
      name: newName,
      ambientLighting: {
        colour: ambientLightColour,
        intensity: ambientLightIntensity
      },
      lights: viewToLights(lights)
    }
  }, [newName, lights, ambientLightColour, ambientLightIntensity])

  const loadedPresets: readonly LightingPreset[] = useMemo(() => {
    const loaded = localStorageData
    if (loaded) {
      const arr = JSON.parse(loaded)
      if (Array.isArray(arr)) {
        return arr as LightingPreset[]
      }
    }
    return []
  }, [localStorageData])

  const setLoadedPresets = (presets: LightingPreset[]) => {
    setLocalStorage(JSON.stringify(presets))
  }

  const saveCurrent = () => {
    setLoadedPresets([...loadedPresets, viewPreset])
    setNewName(defaultNewName)
  }

  const deletePreset = (preset: LightingPreset) => {
    const newPresets = loadedPresets.filter(p => p !== preset)
    setLoadedPresets(newPresets)
  }


  const loadPreset = (present: LightingPreset) => {
    setAmbientLightColour(present.ambientLighting.colour)
    setAmbientLightIntensity(present.ambientLighting.intensity)
    setLights(jsonLightToShowcaseLight(present.lights, view))
    view.selectedLight.value = null
  }



  return (
    <OpenedDialogBox width="800px" height="800px" title="Lighting Presets">
      <div className="flex flex-col p-10 h-full">
        Save Current As Preset:
        <PresetEntry preset={viewPreset}>
          <input className="text-black dark:text-white dark:bg-gray-500" value={newName} onChange={e => setNewName(e.currentTarget.value)} />
        </PresetEntry>
        <div>
          <button className="icon-button" onClick={saveCurrent} >
            Save
          </button>
        </div>

        <div className="mt-10 flex-grow flex flex-col">
          Saved Presets:
          <div className="flex-grow flex flex-col bg-gray-700 rounded studio-scrollbar overflow-x-hidden overflow-y-scroll">
            {loadedPresets.map((preset, id) => (
              <PresetEntry preset={preset} key={id} onDelete={() => deletePreset(preset)} onLoad={() => loadPreset(preset)} />
            ))}
          </div>

        </div>
      </div>
    </OpenedDialogBox >
  )
}

//Get the opposite of the hex colour
const hexToRgb = (hex: string) => {
  //Thank you github copilot
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}
const rgbToHex = ({ r, g, b }: { r: number, g: number, b: number }) => {
  return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`
}

const getOppositeColour = (hex: string) => {
  const rgb = hexToRgb(hex)
  if (rgb === null) {
    return hex
  }
  return rgbToHex({
    r: 255 - rgb.r,
    g: 255 - rgb.g,
    b: 255 - rgb.b
  })
}

const PresetEntry = ({ preset, onDelete, onLoad, children }: { preset: LightingPreset, onDelete?: () => void, onLoad?: () => void, children?: ReactNode }) => {
  return (
    <div className="flex flex-row justify-between w-full border-white border p-2 my-1">
      <div className="h-8 flex flex-row items-center">
        {children ?? preset.name}
        <ColourEntry colour={preset.ambientLighting.colour} intensity={preset.ambientLighting.intensity} />
      </div>
      <div className="flex flex-row items-center justify-end flex-grow h-8">
        {preset.lights.map((light, i) => <ColourEntry key={i} colour={light.colour} intensity={light.intensity} name={light.name} />)}
        {onDelete !== undefined &&
          <ButtonWithTooltip className="icon-button ml-2" tooltip="Delete" onClick={onDelete}>
            Delete
          </ButtonWithTooltip>
        }
        {onLoad !== undefined &&
          <ButtonWithTooltip className="icon-button ml-2" tooltip="Load" onClick={onLoad}>
            Load
          </ButtonWithTooltip>
        }

      </div>

    </div>
  )
}

const ColourEntry = ({ colour, intensity, name }: { colour: string, intensity: number, name?: string }) => {
  const ref = useTooltipRef<HTMLDivElement>(() => name)
  return (
    <div ref={ref} className="h-full aspect-1 rounded-full ml-2 flex justify-center items-center" style={{
      backgroundColor: colour,
      color: getOppositeColour(colour)
    }}>
      {intensity}
    </div>
  )
}

export default ShowcaseLightSavedPresets
