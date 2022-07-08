import { ReactNode, useCallback } from "react"
import CollapsableSidebarPannel from "../../../components/CollapsableSidebarPannel"
import { DblClickEditLO } from "../../../components/DoubleClickToEdit"
import { SVGPlus } from "../../../components/Icons"
import NumericInput from "../../../components/NumericInput"
import { ButtonWithTooltip } from "../../../components/Tooltips"
import { useStudio } from "../../../contexts/StudioContext"
import { ShowcaseLight } from "../../../studio/showcase/DirectionLight"
import ShowcaseProperties from "../../../studio/showcase/ShowcaseProperties"
import { useListenableObject } from "../../../studio/util/ListenableObject"

const ShowcaseLights = () => {
  return (
    <CollapsableSidebarPannel title="LIGHTS" heightClassname="h-64" panelName="showcase_lights">
      <AmbientLightSection />
      <DirectionalLightSection />
    </CollapsableSidebarPannel>
  )
}

const AmbientLightSection = () => {
  const { getSelectedProject } = useStudio()
  const project = getSelectedProject()
  const [colour, setColour] = useListenableObject(project.showcaseProperties.ambientLightColour)
  const [intensity, setIntensity] = useListenableObject(project.showcaseProperties.ambientLightIntensity)

  return (
    <Section title="Ambient Light">
      <div className="flex flex-row">
        Color:
        <input type="color" value={colour} onChange={e => setColour(e.currentTarget.value)} />
      </div>
      <div className="flex flex-row">
        Intensity:
        <NumericInput value={intensity} onChange={setIntensity} min={0} />
      </div>
    </Section>
  )
}

const DirectionalLightSection = () => {
  const { getSelectedProject } = useStudio()
  const showcase = getSelectedProject().showcaseProperties

  const [lights] = useListenableObject(showcase.lights)

  const addLight = useCallback(() => {
    showcase.addLight()
  }, [showcase])


  return (
    <Section title="Directional Lights" buttons={
      <ButtonWithTooltip tooltip="Add Light" onClick={addLight}>
        <SVGPlus className="w-4 h-4" />
      </ButtonWithTooltip>
    }>
      {lights.map(light => <DirectionalLightEntry key={light.identifer} showcase={showcase} light={light} />)}
    </Section>
  )
}

const DirectionalLightEntry = ({ showcase, light }: { showcase: ShowcaseProperties, light: ShowcaseLight }) => {
  const [color] = useListenableObject(light.colour)

  const [selected, setSelected] = useListenableObject(showcase.selectedLight)

  const className = selected === light ?
    "hover:bg-blue-300 dark:hover:bg-blue-300 dark:bg-blue-600 bg-blue-300" :
    "hover:bg-blue-400 dark:hover:bg-blue-400 dark:bg-gray-600 bg-gray-300"

  return (
    <div
      className={className + " my-1 cursor-pointer h-8 mr-5 flex items-center"}
      onClick={() => setSelected(light)}
    >
      <DblClickEditLO className="flex-grow dark:text-white" obj={light.name} inputClassName="h-8 bg-gray-500 text-black dark:text-white" textClassName="pl-3 w-full" />
      <div className="h-2/3 aspect-1 rounded-full mr-2" style={{
        backgroundColor: color
      }} />
    </div>
  )
}

const Section = ({ title, children, buttons }: { title: string, children: ReactNode, buttons?: ReactNode }) => {
  return (
    <div className="flex flex-col dark:text-white ml-2">
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

export default ShowcaseLights