import { ReactNode, useCallback } from "react"
import Checkbox from "../../../components/Checkbox"
import CollapsableSidebarPannel from "../../../components/CollapsableSidebarPannel"
import { DblClickEditLO } from "../../../components/DoubleClickToEdit"
import { SVGPlus, SVGSave } from "../../../components/Icons"
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
    <CollapsableSidebarPannel title="LIGHTS" heightClassname="h-[32rem]" panelName="showcase_lights">
      <AmbientLightSection />
      <DirectionalLightSection />
      <ShadowSection />
    </CollapsableSidebarPannel>
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
    <Section title="Shadow">
      <div className="flex flex-row">
        Preview Shadow Quality: <input type="range" value={current} min={0} max={maxMapSizePow2} onInput={e => setShadowMapSize(Math.pow(2, e.currentTarget.valueAsNumber))} />
      </div>
      <div className="flex flex-row">
        Floor Shadow Opacity: <input type="range" step={0.01} value={floorOpacity} min={0} max={1} onInput={e => setFloorOpacity(e.currentTarget.valueAsNumber)} />
      </div>


    </Section>
  )
}

const AmbientLightSection = () => {
  const { getSelectedProject } = useStudio()
  const showcase = getSelectedProject().showcaseProperties

  const [veiw] = useListenableObject(showcase.selectedView)

  return (
    <Section title="Ambient Light">
      <ColourEditEntry colour={veiw.ambientLightColour} intensity={veiw.ambientLightIntensity} />
    </Section>
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
    <Section title="Directional Lights" buttons={
      <>
        <ButtonWithTooltip tooltip="Presets" onClick={openDialog}>
          <SVGSave className="w-4 h-4" />
        </ButtonWithTooltip>
        <ButtonWithTooltip tooltip="Add Light" onClick={addLight}>
          <SVGPlus className="w-4 h-4" />
        </ButtonWithTooltip>
      </>

    }>
      <div className="flex flex-row">
        <ColourEditEntry colour={selectedLight?.colour} intensity={selectedLight?.intensity} />
      </div>
      <div className="flex flex-row">
        Name: <input className="h-8 bg-gray-500 text-black dark:text-white" disabled={selectedLight === null} value={selectedName === undefined ? '' : selectedName} onChange={e => setSelectedName(e.currentTarget.value)} />
      </div>
      <div>
        <Checkbox value={shadow} setValue={setShadow} extraText="Enabled" />

      </div>
      <div className="h-32 overflow-x-hidden overflow-y-scroll studio-scrollbar">
        {lights.map(light => <DirectionalLightEntry key={light.identifier} showcase={showcase} light={light} />)}
      </div>
    </Section>
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
      className={className + " my-1 cursor-pointer h-8 mr-5 flex items-center"}
      onClick={() => setSelected(selected === light ? null : light)}
    >
      <DblClickEditLO obj={light.name} className="flex-grow dark:text-white" inputClassName="h-8 bg-gray-500 text-black dark:text-white" textClassName="pl-3 w-full" />
      <div className="h-2/3 aspect-1 rounded-full mr-2" style={{
        backgroundColor: color
      }} />
    </div>
  )
}

const Section = ({ title, children, buttons }: { title: string, children: ReactNode, buttons?: ReactNode }) => {
  return (
    <div className="flex flex-col dark:text-white ml-2 mt-5 first:mt-0">
      <div className="flex flex-row">
        <div className="font-semibold">{title}</div>
        {buttons}
      </div>
      <div className="flex flex-col">
        {children}
      </div>
    </div>
  )
}

const ColourEditEntry = ({ colour, intensity }: { colour?: LO<string>, intensity?: LO<number> }) => {
  const [colourVal, setColour] = useListenableObjectNullable(colour)
  const [intensityVal, setIntensity] = useListenableObjectNullable(intensity)

  return (
    <>
      <div className="flex flex-row">
        Color:
        <input disabled={colour === undefined} type="color" value={colourVal ?? '#ffffff'} onChange={e => setColour(e.currentTarget.value)} />
      </div>
      <div className="flex flex-row">
        Intensity:
        <NumericInput value={intensityVal} onChange={setIntensity} min={0} />
      </div>
    </>
  )
}

export default ShowcaseLights