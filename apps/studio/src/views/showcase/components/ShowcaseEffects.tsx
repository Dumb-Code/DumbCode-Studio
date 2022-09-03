import { useStudio } from "../../../contexts/StudioContext"
import { useListenableObject } from "../../../studio/listenableobject/ListenableObject"
import ShowcaseLights from "./ShowcaseLights"
import ShowcaseViewSettings from "./ShowcaseViewSettings"

const ShowcaseEffects = () => {
  const { getSelectedProject } = useStudio()
  const project = getSelectedProject()
  const [view] = useListenableObject(project.showcaseProperties.selectedView)
  return (
    <div className="dark:bg-gray-800 bg-gray-200 flex flex-col overflow-hidden h-full">
      <ShowcaseViewSettings />
      <ShowcaseLights />
    </div>
  )
}

export default ShowcaseEffects