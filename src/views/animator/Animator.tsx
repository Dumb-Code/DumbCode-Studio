import AnimatorTabBar from "./components/AnimatorTabBar"
import AnimatorShortcuts from "./components/AnimatorShortcuts"
import AnimatorProperties from "./components/AnimatorProperties"
import AnimatorTimeline from "./components/AnimatorTimeline"
import AnimatorScrubBar from "./components/AnimatorScrubBar"
import StudioCanvas from "../../components/StudioCanvas"
import GumballPropertiesBar from "../../components/GumballPropertiesBar"
import InfoBar from "../../components/InfoBar"
import { useStudio } from "../../contexts/StudioContext"
import { useEffect } from "react"

const Animator = () => {

    const { getSelectedProject, onFrameListeners } = useStudio()
    const project = getSelectedProject()

    useEffect(() => {
        const onFrame = (deltaTime: number) => {
            project.model.resetVisuals()
            const selected = project.animationTabs.selectedAnimation
            if(selected.value !== null) {
                selected.value.animate(deltaTime)
            }
        }
        onFrameListeners.add(onFrame)
        return () => {
            onFrameListeners.delete(onFrame)
        }
    })
    
    return (
        <div className="grid grid-areas-animator h-full"
            style={{
                //These would be generated by moving the panels around.
                //For now, we just hardcode them
                gridTemplateColumns: '32px auto 300px',
                gridTemplateRows: '32px minmax(0px, 1fr) 32px 150px 30px 28px'
            }}
        >
            <div className="grid-in-tabs border dark:border-black border-white"><AnimatorTabBar /></div>
            <div className="grid-in-properties border dark:border-black h-full border-white"><AnimatorProperties /></div>
            <div className="grid-in-tools border dark:border-black border-white"><AnimatorShortcuts /></div>
            <div className="grid-in-canvas border dark:border-black border-white"><StudioCanvas /></div>
            <div className="grid-in-scrub border dark:border-black border-white"><AnimatorScrubBar /></div>
            <div className="grid-in-timeline border dark:border-black border-white"><AnimatorTimeline /></div>
            <div className="grid-in-gumball border dark:border-black border-white"><GumballPropertiesBar /></div>
            <div className="grid-in-info border dark:border-black border-white"><InfoBar /></div>
        </div>
    )
}

export default Animator;