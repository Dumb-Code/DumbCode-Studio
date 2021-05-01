import AnimatorTabBar from "./components/AnimatorTabBar"
import AnimatorShortcuts from "./components/AnimatorShortcuts"
import AnimatorProperties from "./components/AnimatorProperties"
import AnimatorTimeline from "./components/AnimatorTimeline"
import AnimatorScrubBar from "./components/AnimatorScrubBar"
import StudioCanvas from "../../components/StudioCanvas"
import GumballPropertiesBar from "../../components/GumballPropertiesBar"
import InfoBar from "../../components/InfoBar"

const Animator = () => {
    return (
        <div className="h-full grid grid-areas-animator"
            style={{
                //These would be generated by moving the panels around.
                //For now, we just hardcode them
                gridTemplateColumns: '32px auto 300px',
                gridTemplateRows: '32px auto 32px 150px 32px 28px'
            }}
        >
            <div className="grid-in-tabs border"><AnimatorTabBar /></div>
            <div className="grid-in-properties border"><AnimatorProperties /></div>
            <div className="grid-in-tools border"><AnimatorShortcuts /></div>
            <div className="grid-in-canvas border"><StudioCanvas /></div>
            <div className="grid-in-scrub border"><AnimatorScrubBar /></div>
            <div className="grid-in-timeline border"><AnimatorTimeline /></div>
            <div className="grid-in-gumball border"><GumballPropertiesBar /></div>
            <div className="grid-in-info border"><InfoBar /></div>
        </div>
    )
}

export default Animator;