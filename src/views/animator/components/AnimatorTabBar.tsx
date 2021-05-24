import { DblClickEditLO } from "../../../components/DoubleClickToEdit"
import { SVGCross } from "../../../components/Icons"
import { useStudio } from "../../../contexts/StudioContext"
import DcaAnimation from "../../../studio/formats/animations/DcaAnimation"
import { useListenableObject } from "../../../studio/util/ListenableObject"

const AnimatorTabBar = () => {
    const { getSelectedProject } = useStudio()
    const selectedProject = getSelectedProject()

    const [animations] = useListenableObject(selectedProject.animationTabs.animations)
    const [tabs] = useListenableObject(selectedProject.animationTabs.tabs)
    const [selectedTab] = useListenableObject(selectedProject.animationTabs.selectedAnimation)

    return (
        <div className="rounded-sm dark:bg-gray-800 bg-gray-200 h-full flex flex-row">
            {
                animations.filter(a => tabs.includes(a.identifier))
                    .map(a => <AnimatorTab key={a.identifier} animation={a} selected={a === selectedTab}  />)
            }
        </div>
    )
}

const AnimatorTab = ({animation, selected}: {animation: DcaAnimation, selected: boolean}) => {
    return(
        <div className={(selected ? "bg-lightBlue-500" : "dark:bg-gray-900 bg-gray-300 hover:bg-gray-400 dark:hover:bg-black") + " min-w-32 truncate flex flex-row rounded m-1"}>
            <DblClickEditLO obj={animation.name} className={(selected ? "text-white" : "dark:text-gray-400 text-black") + " flex-grow px-2"} inputClassName="p-0 w-full h-full bg-gray-500 text-black" />
            <button className="h-4 w-4 bg-gray-800 hover:bg-red-600 rounded pl-0.5 mt-1 mr-1 hover:text-white text-gray-400 opacity-30 hover:opacity-100"><SVGCross className="h-3 w-3 mr-1" /></button>
        </div>
    )
}

export default AnimatorTabBar;