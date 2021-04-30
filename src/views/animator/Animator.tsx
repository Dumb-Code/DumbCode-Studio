import RGL, { WidthProvider } from "react-grid-layout"
import AnimatorTabBar from "./components/AnimatorTabBar"
import AnimatorShortcuts from "./components/AnimatorShortcuts"
import AnimatorProperties from "./components/AnimatorProperties"
import AnimatorTimeline from "./components/AnimatorTimeline"
import AnimatorScrubBar from "./components/AnimatorScrubBar"
import StudioCanvas from "../../components/StudioCanvas"
import GumballPropertiesBar from "../../components/GumballPropertiesBar"
import InfoBar from "../../components/InfoBar"

const GridLayout = WidthProvider(RGL);

const Animator = () => {
    return(
        <GridLayout className="layout text-white" cols={32} rowHeight={30} colWidth={2} width={1920}>
            <div key="atb" data-grid={{x: 0, y: 0, w: 26, h: 1, static: true}}><AnimatorTabBar /></div>
            <div key="ap" data-grid={{x: 27, y: 0, w: 6, h: 22, static: true}}><AnimatorProperties /></div>
            <div key="as" data-grid={{x: 0, y: 1, w: 1, h: 14, static: true}}><AnimatorShortcuts /></div>
            <div key="asc" data-grid={{x: 1, y: 1, w: 25, h: 14, static: true}}><StudioCanvas /></div>
            <div key="sb" data-grid={{x: 0, y: 15, w: 26, h: 1, static: true}}><AnimatorScrubBar /></div>
            <div key="at" data-grid={{x: 0, y: 16, w: 26, h: 4, static: true}}><AnimatorTimeline /></div>
            <div key="agpb" data-grid={{x: 0, y: 20, w: 26, h: 1, static: true}}><GumballPropertiesBar /></div>
            <div key="aib" data-grid={{x: 0, y: 21, w: 26, h: 1, static: true}}><InfoBar /></div>
        </GridLayout>
    )
}

export default Animator;