import { SVGPlus, SVGSave, SVGTrash } from "@dumbcode/shared/icons"
import { useCallback } from "react"
import Checkbox from "../../../components/Checkbox"
import CollapsableSidebarPannel from "../../../components/CollapsableSidebarPannel"
import { DblClickEditLO } from "../../../components/DoubleClickToEdit"
import NumericInput from "../../../components/NumericInput"
import { ButtonWithTooltip } from "../../../components/Tooltips"
import { useStudio } from "../../../contexts/StudioContext"
import { useDialogBoxes } from "../../../dialogboxes/DialogBoxes"
import ShowcaseLightSavedPresetsDialogBox from "../../../dialogboxes/ShowcaseLightSavedPresets"
import { LO, useListenableObject, useListenableObjectNullable } from "../../../studio/listenableobject/ListenableObject"
import { ShowcaseLight } from "../../../studio/showcase/ShowcaseLight"
import ShowcaseProperties from "../../../studio/showcase/ShowcaseProperties"

const ShowcaseLights = () => {
  return (
    <>
      <CollapsableSidebarPannel title="AMBIENT LIGHT" heightClassname="h-auto" panelName="showcase_ambient_light">
        <AmbientLightSection />
      </CollapsableSidebarPannel>
      <CollapsableSidebarPannel title="DIRECTIONAL LIGHTS" heightClassname="h-auto" panelName="showcase_object_lights">
        <DirectionalLightSection />
      </CollapsableSidebarPannel>
      <CollapsableSidebarPannel title="SHADOWS" heightClassname="h-auto" panelName="showcase_shadows">
        <ShadowSection />
      </CollapsableSidebarPannel>
    </>
  )
}

const ShadowSection = () => {
  const { getSelectedProject, renderer } = useStudio()
  const showcase = getSelectedProject().showcaseProperties
  const [view] = useListenableObject(showcase.selectedView)

  const [floorOpacity, setFloorOpacity] = useListenableObject(showcase.floorShadowOpacity)
  const [shadowMapSize, setShadowMapSize] = useListenableObject(showcase.previewShadowMapSize)

  const current = Math.floor(Math.log2(shadowMapSize))
  const maxMapSizePow2 = Math.floor(Math.log2(renderer.capabilities.maxTextureSize)) - 1


  return (
    <div>
      <div className="px-2 py-1">
        <p className="ml-1 dark:text-gray-400 text-black text-xs flex-grow uppercase">Shadow Quality</p>
        <input type="range" value={current} min={0} max={maxMapSizePow2} onInput={e => setShadowMapSize(Math.pow(2, e.currentTarget.valueAsNumber))} />
      </div>
      <div className="px-2 py-1">
        <p className="ml-1 dark:text-gray-400 text-black text-xs flex-grow uppercase">Floor Shadow Opacity</p>
        <input type="range" step={0.01} value={floorOpacity} min={0} max={1} onInput={e => setFloorOpacity(e.currentTarget.valueAsNumber)} />
      </div>
    </div>
  )
}

const AmbientLightSection = () => {
  const { getSelectedProject } = useStudio()
  const showcase = getSelectedProject().showcaseProperties

  const [veiw] = useListenableObject(showcase.selectedView)

  return (
    <div className="px-2 py-1">
      <ColourEditEntry colour={veiw.ambientLightColour} intensity={veiw.ambientLightIntensity} />
    </div>
  )
}

const DirectionalLightSection = () => {
  const { getSelectedProject } = useStudio()
  const showcase = getSelectedProject().showcaseProperties

  const [view] = useListenableObject(showcase.selectedView)

  const [selectedLight] = useListenableObject(view.selectedLight)
  const [lights] = useListenableObject(view.lights)

  const addLight = useCallback(() => {
    view.addLight()
  }, [view])

  const [selectedName, setSelectedName] = useListenableObjectNullable(selectedLight?.name)
  const [shadow, setShadow] = useListenableObjectNullable(selectedLight?.shadow)

  const dialogBoxes = useDialogBoxes()
  const openDialog = useCallback(() => {
    dialogBoxes.setDialogBox(() => <ShowcaseLightSavedPresetsDialogBox view={view} />)
  }, [dialogBoxes, view])

  return (
    <div>
      {
        selectedName ?
          <div>
            <div className="px-2 pb-1 flex flex-row">
              <div>
                <p className="ml-1 dark:text-gray-400 text-black text-xs flex-grow uppercase mr-2">Enabled</p>
                <div className="pl-4"><Checkbox value={shadow} setValue={setShadow} /></div>
              </div>
              <div className="flex-grow">
                <p className="ml-1 dark:text-gray-400 text-black text-xs flex-grow uppercase">Name</p>
                <input className="h-6 w-full bg-gray-300 dark:bg-gray-700 text-black dark:text-white text-xs pl-1" disabled={selectedLight === null} value={selectedName === undefined ? '' : selectedName} onChange={e => setSelectedName(e.currentTarget.value)} />
              </div>
            </div>
            <div className="px-2 pb-1 ">
              <ColourEditEntry colour={selectedLight?.colour} intensity={selectedLight?.intensity} />
            </div>
          </div>
          :
          <div className="h-[78px] bg-gray-700 rounded-md m-2 text-center text-gray-500 pt-6">
            No Light Selected
          </div>
      }
      <div className="px-2">
        <p className="ml-1 dark:text-gray-400 text-black text-xs flex-grow uppercase">Lights</p>
        <ButtonWithTooltip tooltip="Presets" onClick={openDialog}>
          <div className="bg-blue-500 px-1 hover:bg-blue-600 h-6 flex-shrink-0 flex flex-row rounded m-1 cursor-pointer group">
            <SVGSave className="text-white group-hover:text-white h-4 w-4 mt-1" />
          </div>
        </ButtonWithTooltip>
        <ButtonWithTooltip tooltip="Add Light" onClick={addLight}>
          <div className="bg-green-500 px-1 hover:bg-green-600 h-6 flex-shrink-0 flex flex-row rounded m-1 cursor-pointer group">
            <SVGPlus className="text-white group-hover:text-white h-4 w-4 mt-1" />
          </div>
        </ButtonWithTooltip>
        <div className="overflow-x-hidden w-full">
          {lights.map(light => <DirectionalLightEntry key={light.identifier} showcase={showcase} light={light} />)}
        </div>
      </div>
    </div>
  )
}

const DirectionalLightEntry = ({ showcase, light }: { showcase: ShowcaseProperties, light: ShowcaseLight }) => {
  const [color] = useListenableObject(light.colour)
  const [veiw] = useListenableObject(showcase.selectedView)

  const [selected, setSelected] = useListenableObject(veiw.selectedLight)

  const className = selected === light ?
    "hover:bg-blue-300 dark:hover:bg-blue-300 dark:bg-blue-600 bg-blue-300" :
    "hover:bg-blue-400 dark:hover:bg-blue-400 dark:bg-gray-600 bg-gray-300"

  return (
    <div
      className={className + " my-1 cursor-pointer h-8 flex items-center w-full rounded-md"}
      onClick={() => setSelected(selected === light ? null : light)}
    >
      <div className="h-2/3 aspect-1 rounded-full ml-1.5 mt-0.5" style={{
        backgroundColor: color
      }} />
      <DblClickEditLO obj={light.name} className="flex-grow dark:text-white" inputClassName="h-8 bg-gray-500 text-black dark:text-white" textClassName="pl-2 w-full" />
      <button className="group bg-gray-700 rounded-md p-1 mr-0.5 hover:bg-red-500">
        <SVGTrash className="h-5 w-5 text-gray-400 group-hover:text-red-700" />
      </button>
    </div>
  )
}

const ColourEditEntry = ({ colour, intensity }: { colour?: LO<string>, intensity?: LO<number> }) => {
  const [colourVal, setColour] = useListenableObjectNullable(colour)
  const [intensityVal, setIntensity] = useListenableObjectNullable(intensity)

  return (
    <div className="flex flex-row gap-2">
      <div>
        <p className="ml-1 dark:text-gray-400 text-black text-xs flex-grow uppercase">Color</p>
        <input disabled={colour === undefined} type="color" value={colourVal ?? '#ffffff'} onChange={e => setColour(e.currentTarget.value)} />
      </div>
      <div>
        <p className="ml-1 dark:text-gray-400 text-black text-xs flex-grow uppercase">Intensity</p>
        <div className="h-6">
          <NumericInput value={intensityVal} onChange={setIntensity} min={0} />
        </div>
      </div>
    </div>
  )
}

export default ShowcaseLights