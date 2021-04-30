import RGL, { WidthProvider } from "react-grid-layout"
import ModelerCommandInput from "./components/ModelerCommandInput"
import InfoBar from "../../components/InfoBar"
import ModelerProperties from "./components/ModelerProperties"
import ModelerShortcuts from "./components/ModelerShortcuts"
import StudioCanvas from "../../components/StudioCanvas"
import GumballPropertiesBar from "../../components/GumballPropertiesBar"

const GridLayout = WidthProvider(RGL);

const Modeler = () => {
    return(
        <GridLayout className="layout text-white" cols={32} rowHeight={30} colWidth={2} width={1920}>
            <div key="mci" data-grid={{x: 0, y: 0, w: 26, h: 1, static: true}}><ModelerCommandInput /></div>
            <div key="mp" data-grid={{x: 26, y: 0, w: 6, h: 22, static: true}}><ModelerProperties /></div>
            <div key="mcs" data-grid={{x: 0, y: 1, w: 1, h: 19, static: true}}><ModelerShortcuts /></div>
            <div key="smc" data-grid={{x: 1, y: 1, w: 25, h: 19, static: true}}><StudioCanvas /></div>
            <div key="mgpb" data-grid={{x: 0, y: 20, w: 26, h: 1, static: true}}><GumballPropertiesBar /></div>
            <div key="mib" data-grid={{x: 0, y: 21, w: 26, h: 1, static: true}}><InfoBar /></div>
        </GridLayout>
    )
}

export default Modeler;