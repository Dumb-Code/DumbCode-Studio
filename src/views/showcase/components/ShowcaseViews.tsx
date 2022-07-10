import CollapsableSidebarPannel from "../../../components/CollapsableSidebarPannel"
import { DblClickEditLO } from "../../../components/DoubleClickToEdit"
import { useStudio } from "../../../contexts/StudioContext"
import ShowcaseView from "../../../studio/showcase/ShowcaseView"
import { useListenableObject } from "../../../studio/util/ListenableObject"

const ShowcaseViews = () => {
  const { getSelectedProject } = useStudio()
  const properties = getSelectedProject().showcaseProperties
  const [views, setViews] = useListenableObject(properties.views)
  const newView = () => {
    const view = new ShowcaseView(properties)
    setViews([...views, view])
  }
  return (
    <CollapsableSidebarPannel title="VIEWS" heightClassname="h-48" panelName="showcase_views">
      <div className="h-full flex flex-col">
        <button className="bg-blue-200 p-1 rounded" onClick={newView}>Add View</button>
        <div className="flex-grow min-h-0 flex flex-col overflow-x-hidden overflow-y-auto studio-scrollbar">
          {views.map(view => <ShowcaseViewEntry key={view.identifier} view={view} />)}
        </div>
      </div>
    </CollapsableSidebarPannel>
  )
}

const ShowcaseViewEntry = ({ view }: { view: ShowcaseView }) => {
  const [name] = useListenableObject(view.name)
  const [selectedView, setSelected] = useListenableObject(view.properties.selectedView)
  const className = selectedView === view ?
    "bg-purple-300 dark:bg-purple-500 hover:bg-purple-200 dark:hover:bg-purple-300" :
    "bg-blue-300 dark:bg-blue-500 hover:bg-blue-200 dark:hover:bg-blue-300"

  return (
    <button onClick={() => setSelected(view)} className={"flex flex-col justify-center mt-2 first:mt-0 h-8 " + className}>
      <DblClickEditLO obj={view.name} className="flex-grow h-full flex items-center dark:text-white" inputClassName="h-8 bg-gray-500 text-black dark:text-white" textClassName="pl-3 w-full" />
    </button>
  )
}

export default ShowcaseViews