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
                gridTemplateRows: '32px auto 32px 150px 30px 28px'
            }}
        >
            <div className="grid-in-tabs border border-black"><AnimatorTabBar /></div>
            <div className="grid-in-properties border border-black h-full"><AnimatorProperties /></div>
            <div className="grid-in-tools border border-black"><AnimatorShortcuts /></div>
            <div className="grid-in-canvas border border-black"><StudioCanvas /></div>
            <div className="grid-in-scrub border border-black"><AnimatorScrubBar /></div>
            <div className="grid-in-timeline border border-black"><AnimatorTimeline /></div>
            <div className="grid-in-gumball border border-black"><GumballPropertiesBar /></div>
            <div className="grid-in-info border border-black"><InfoBar /></div>
        </div>
    )
}

export default Animator;