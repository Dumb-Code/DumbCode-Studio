import ModelerCommandInput from "./components/ModelerCommandInput"
import InfoBar from "../../components/InfoBar"
import ModelerProperties from "./components/ModelerProperties"
import ModelerShortcuts from "./components/ModelerShortcuts"
import StudioCanvas from "../../components/StudioCanvas"
import GumballPropertiesBar from "../../components/GumballPropertiesBar"
import CubeList from "./components/ModelerCubeList"

const Modeler = () => {
    return(
        <div className="h-full grid grid-areas-modeling"
            style={{
                //These would be generated by moving the panels around.
                //For now, we just hardcode them
                gridTemplateColumns: '32px auto 320px',
                gridTemplateRows: '32px 320px auto 32px 28px'
            }}
        >
            {/* The boreders are to visulize where everything is. */}
            <div className="grid-in-command border border-black"><ModelerCommandInput /></div>
            <div className="grid-in-rtop border border-black"><CubeList /></div>
            <div className="grid-in-rbottom border border-black"><ModelerProperties /></div>
            <div className="grid-in-shortcuts border border-black"><ModelerShortcuts /></div>
            <div className="grid-in-canvas border border-black"><StudioCanvas /></div>
            <div className="grid-in-gumball border border-black"><GumballPropertiesBar /></div>
            <div className="grid-in-info border border-black"><InfoBar /></div>
        </div>
    )
}

export default Modeler;