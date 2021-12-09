import { useEffect, useRef } from "react"
import { DblClickEditLO } from "../../../components/DoubleClickToEdit"
import { SVGCross, SVGPlus } from "../../../components/Icons"
import { useStudio } from "../../../contexts/StudioContext"
import DcaAnimation from "../../../studio/formats/animations/DcaAnimation"
import { useListenableObject } from "../../../studio/util/ListenableObject"

const AnimatorTabBar = () => {
    const { getSelectedProject } = useStudio()
    const selectedProject = getSelectedProject()

    const [animations] = useListenableObject(selectedProject.animationTabs.animations)
    const [tabs] = useListenableObject(selectedProject.animationTabs.tabs)
    const [selectedTab, setSelectedTab] = useListenableObject(selectedProject.animationTabs.selectedAnimation)

    const ref = useRef<HTMLDivElement>(null)

    //We need to listen to `wheel` NOT passively, so we are unable to do `onScroll`
    useEffect(() => {
        const current = ref.current
        if (current) {
            const listener = (event: WheelEvent) => {
                event.preventDefault()
                event.stopPropagation()

                if (current !== null) {
                    current.scrollBy({ left: event.deltaY / 2.5 })
                }

            }
            current.addEventListener('wheel', listener, { passive: false })

            return () => current.removeEventListener('wheel', listener)
        }
    })

    const createNewAnimation = () => {
        selectedProject.animationTabs.addAnimation(DcaAnimation.createNew(selectedProject))
    }

    return (
        <div className="rounded-sm dark:bg-gray-800 bg-gray-200 h-full flex">
            <div ref={ref} className="flex flex-row overflow-auto w-full">
                {animations.filter(a => tabs.includes(a.identifier))
                    .map(a => <AnimatorTab key={a.identifier} animation={a} selected={a === selectedTab} onSelect={() => setSelectedTab(a)} />)
                }
                <div onClick={e => { e.stopPropagation(); createNewAnimation() }} className="bg-green-500 px-1 hover:bg-green-600 flex-shrink-0 flex flex-row rounded m-1 cursor-pointer group">
                    <SVGPlus className="text-white group-hover:text-white h-4 w-4 mt-1" />
                </div>
            </div>
        </div>
    )
}

const AnimatorTab = ({ animation, selected, onSelect }: { animation: DcaAnimation, selected: boolean, onSelect: () => void }) => {
    return (
        <div onClick={e => { e.stopPropagation(); onSelect() }} className={(selected ? "bg-sky-500" : "dark:bg-gray-900 bg-gray-300 hover:bg-gray-400 dark:hover:bg-black truncate") + " flex-shrink-1 flex flex-row rounded m-1 cursor-pointer"}>
            <DblClickEditLO obj={animation.name} className={(selected ? "text-white" : "dark:text-gray-400 text-black") + " flex-grow pl-1 pr-0.5 truncate"} inputClassName="p-0 w-full h-full bg-gray-500 text-black" />
            <button className="h-4 w-4 bg-gray-800 hover:bg-red-600 rounded pl-0.5 mt-1 mr-1 hover:text-white text-gray-400 opacity-30 hover:opacity-100"><SVGCross className="h-3 w-3 mr-0.5" /></button>
        </div>
    )
}

export default AnimatorTabBar;