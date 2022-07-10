import HistoryList from "../../../components/HistoryList"
import { useStudio } from "../../../contexts/StudioContext"
import { useListenableObject } from "../../../studio/util/ListenableObject"
import { AnimatorIKProperties } from "../../animator/components/AnimatorProperties"
import ShowcaseLights from "./ShowcaseLights"
import ShowcaseScreenshot from "./ShowcaseScreenshot"
import ShowcaseViews from "./ShowcaseViews"

const ShowcaseSidebar = () => {
  const { getSelectedProject } = useStudio()
  const project = getSelectedProject()
  const [view] = useListenableObject(project.showcaseProperties.selectedView)
  return (
    <div className="dark:bg-gray-800 bg-gray-200 flex flex-col overflow-hidden h-full">
      <ShowcaseViews />
      <AnimatorIKProperties animation={view} />
      <ShowcaseScreenshot />
      <ShowcaseLights />
      <HistoryList />
    </div>
  )
}

export default ShowcaseSidebar