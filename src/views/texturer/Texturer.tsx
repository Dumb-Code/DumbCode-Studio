import RGL, { WidthProvider } from "react-grid-layout"
import TexturerViewBar from "./components/TexturerViewBar"
import InfoBar from "../../components/InfoBar"
import TexturerLayers from "./components/TexturerLayers"
import TexturerTools from "./components/TexturerTools"
import StudioCanvas from "../../components/StudioCanvas"
import TexturerProperties from "./components/TexturerProperties"

const GridLayout = WidthProvider(RGL);

const Texturer = () => {
    return(
        <GridLayout className="layout text-white" cols={32} rowHeight={30} colWidth={2} width={1920}>
            <div key="atb" data-grid={{x: 0, y: 0, w: 32, h: 1, static: true}}><TexturerViewBar /></div>
            <div key="ap" data-grid={{x: 26, y: 16, w: 6, h: 6, static: true}}><TexturerLayers /></div>
            <div key="as" data-grid={{x: 0, y: 1, w: 1, h: 15, static: true}}><TexturerTools /></div>
            <div key="asc" data-grid={{x: 1, y: 1, w: 31, h: 15, static: true}}><StudioCanvas /></div>
            <div key="at" data-grid={{x: 0, y: 16, w: 26, h: 5, static: true}}><TexturerProperties /></div>
            <div key="aib" data-grid={{x: 0, y: 21, w: 26, h: 1, static: true}}><InfoBar /></div>
        </GridLayout>
    )
}

export default Texturer;