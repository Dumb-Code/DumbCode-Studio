import TexturerViewBar from "./components/TexturerViewBar"
import InfoBar from "../../components/InfoBar"
import TexturerLayers from "./components/TexturerLayers"
import TexturerTools from "./components/TexturerTools"
import StudioCanvas from "../../components/StudioCanvas"
import TexturerProperties from "./components/TexturerProperties"


const Texturer = () => {
    return (
        <div className="h-full grid grid-areas-texture"
            style={{
                //These would be generated by moving the panels around.
                //For now, we just hardcode them
                gridTemplateColumns: '32px auto 100px',
                gridTemplateRows: '32px auto 150px 28px'
            }}
        >
            <div className="grid-in-views border border-black"><TexturerViewBar /></div>
            <div className="grid-in-layers border border-black"><TexturerLayers /></div>
            <div className="grid-in-tools border border-black"><TexturerTools /></div>
            <div className="grid-in-canvas border border-black"><StudioCanvas /></div>
            <div className="grid-in-properties border border-black"><TexturerProperties /></div>
            <div className="grid-in-info border border-black"><InfoBar /></div>
        </div>
    )
}

export default Texturer;