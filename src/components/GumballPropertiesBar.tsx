import { useState } from "react";
import Dropup, { DropupItem } from "./Dropup";
import { Switch } from "@headlessui/react";

const GumballPropertiesBar = () => {
    return(
        <div className="rounded-sm bg-gray-800 h-full">
            <GumballToggle />
        </div>
    )
}

const GumballToggle = () => {

    const[gumballEnabled, enableGumball] = useState(true);

    return (
        <div className="flex flex-row">
            <p className={(gumballEnabled ? "bg-lightBlue-500" : "bg-gray-700") + " m-0.5 rounded pt-1 px-2 text-white text-xs h-6 transition-colors ease-in-out duration-200"}>Enable Gumball</p>
            <Switch checked={gumballEnabled} onChange={enableGumball}
                className={(gumballEnabled ? "bg-green-500" : "bg-red-900") + " relative inline-flex items-center h-6 mt-0.5 rounded w-11 transition-colors ease-in-out duration-200 mr-2"}>
                <span className="sr-only">Gumball</span>
                <span className={(gumballEnabled ? "translate-x-6 bg-green-400" : "translate-x-1 bg-red-700") + " inline-block w-4 h-4 transform rounded transition ease-in-out duration-200"} />
            </Switch>
            {!gumballEnabled || <TransformationTypeSelect />}
        </div>
      );
}

const TransformationTypeSelect = () => {
    {/* Select object or gumball transformations */}

    const [objectMode, setObjectMode] = useState(true);

    return(
        <div className="flex flex-row">
            <div className="flex flex-row p-0.5 mr-2">
                <button className={(objectMode ? "bg-green-500" : "bg-gray-700") + " text-white rounded-l py-1 px-2 border-r border-black text-xs"} onClick={() => setObjectMode(true)}>Object</button>
                <button className={(objectMode ? "bg-gray-700" : "bg-green-500") + " text-white rounded-r py-1 px-2 border-l border-black text-xs"} onClick={() => setObjectMode(false)}>Gumball</button>
            </div>
            {objectMode ? <ObjectTransformationModeSelect /> : <GumballTransformationModeSelect /> }
        </div>
    )
}

{/* Object Selected */}
const ObjectTransformationModeSelect = () => {
    {/* Object Selected -> Select move rotate or dimension */}

    const [transformMode, setTransformMode] = useState("move");

    return(
        <div className="flex flex-row transition ease-in-out duration-200">
            <div className="flex flex-row p-0.5 mr-2">
                <button className={(transformMode === "move" ? "bg-lightBlue-500" : "bg-gray-700") + " text-white rounded-l py-1 px-2 border-r border-black text-xs"} onClick={() => setTransformMode("move")}>Move</button>
                <button className={(transformMode === "rotate" ? "bg-lightBlue-500" : "bg-gray-700") + " text-white py-1 px-2 border-l border-r border-black text-xs"} onClick={() => setTransformMode("rotate")}>Rotate</button>
                <button className={(transformMode === "dimension" ? "bg-lightBlue-500" : "bg-gray-700") + " text-white rounded-r py-1 px-2 border-l border-black text-xs"} onClick={() => setTransformMode("dimension")}>Dimension</button>
            </div>
            {(transformMode === "move") ? <ObjectMoveOptions /> : (transformMode === "rotate") ? <ObjectRotateOptions /> : (transformMode === "dimension") || <p>You done messed up</p> }
        </div>
    )
}

const ObjectMoveOptions = () => {
    {/* Object Selected -> Move Selected -> (world/local) (position/offset/rotationPt) */}

    const [isMoveLocal, setScopeLocal] = useState(true);
    const [moveType, setTransformMode] = useState("position");

    return (
        <div className="flex flex-row">
            <div className="flex flex-row p-0.5 mr-2">
                <button className={(isMoveLocal ? "bg-lightBlue-500" : "bg-gray-700") + " text-white rounded-l py-1 px-2 border-r border-black text-xs"} onClick={() => setScopeLocal(true)}>Local</button>
                <button className={(isMoveLocal ? "bg-gray-700" : "bg-lightBlue-500") + " text-white rounded-r py-1 px-2 border-l border-black text-xs"} onClick={() => setScopeLocal(false)}>World</button>
                
            </div>
            <div className="flex flex-row p-0.5 mr-2">
                <button className={(moveType === "position" ? "bg-lightBlue-500" : "bg-gray-700") + " text-white rounded-l py-1 px-2 border-r border-black text-xs"} onClick={() => setTransformMode("position")}>Position</button>
                <button className={(moveType === "offset" ? "bg-lightBlue-500" : "bg-gray-700") + " text-white py-1 px-2 border-l border-r border-black text-xs"} onClick={() => setTransformMode("offset")}>Offset</button>
                <button className={(moveType === "rotationPt" ? "bg-lightBlue-500" : "bg-gray-700") + " text-white rounded-r py-1 px-2 border-l border-black text-xs"} onClick={() => setTransformMode("rotationPt")}>Rotation Point</button>

            </div>
        </div>
    )
}

const ObjectRotateOptions = () => {
    {/* Object Selected -> Rotate Selected -> (world/local) (rotate/rotateAroundPoint) */}

    const [isRotLocal, setScopeLocal] = useState(true);
    const [isAroundPoint, setAroundPoint] = useState(false);

    return (
        <div className="flex flex-row">
            <div className="flex flex-row p-0.5 mr-2">
                <button className={(isRotLocal ? "bg-lightBlue-500" : "bg-gray-700") + " text-white rounded-l py-1 px-2 border-r border-black text-xs"} onClick={() => setScopeLocal(true)}>Local</button>
                <button className={(isRotLocal ? "bg-gray-700" : "bg-lightBlue-500") + " text-white rounded-r py-1 px-2 border-l border-black text-xs"} onClick={() => setScopeLocal(false)}>World</button>
                
            </div>
            <div className="flex flex-row p-0.5 mr-2">
                <button className={(isAroundPoint ? "bg-lightBlue-500" : "bg-gray-700") + " text-white rounded-l py-1 px-2 border-r border-black text-xs"} onClick={() => setAroundPoint(false)}>Normal</button>
                <button className={(isAroundPoint ? "bg-gray-700" : "bg-lightBlue-500") + " text-white rounded-r py-1 px-2 border-l border-black text-xs"} onClick={() => setAroundPoint(true)}>Around Point</button>
            </div>
        </div>
    )
}

{/* Gumball Selected */}
const GumballTransformationModeSelect = () => {
    {/* [] Automatically Move to Rotation Points */}
    {/* Relocate Gumball Dropup */}
    {/* Move Rotate */}

    const [isGumballMove, setGumballMove] = useState(true);

    return(
        <div className="flex flex-row">
            <div className="flex flex-row p-0.5 mr-2">
                <button className={(isGumballMove ? "bg-lightBlue-500" : "bg-gray-700") + " text-white rounded-l py-1 px-2 border-r border-black text-xs"} onClick={() => setGumballMove(true)}>Position</button>
                <button className={(isGumballMove ? "bg-gray-700" : "bg-lightBlue-500") + " text-white rounded-r py-1 px-2 border-l border-black text-xs"} onClick={() => setGumballMove(false)}>Rotation</button>
            </div>
            <RelocateGumballDropup />
        </div>
    )
}

const RelocateGumballDropup = () => {
    {/* World Origin */}
    {/* Selected Cube RP Position */}
    {/* Selected Cube RP Rotation */}
    {/* Selected Cube RP Position and Rotation */}
    {/* Snap Point */}

    return (
        <div>
            <Dropup title="Relocate Gumball" header="RELOCATE MODE">
                <div className="p-0.5">
                    <DropupItem name="To World Origin" onSelect={() => console.log("set mode")}/>
                    <DropupItem name="Cube Rotation Point (Position)" onSelect={() => console.log("set mode")}/>
                    <DropupItem name="Cube Rotation Point (Rotation)" onSelect={() => console.log("set mode")}/>
                    <DropupItem name="Cube Rotation Point (Both)" onSelect={() => console.log("set mode")}/>
                    <DropupItem name="Custom (Snap Point)" onSelect={() => console.log("set mode")}/>
                </div>
            </Dropup>
        </div>
    );
}

export default GumballPropertiesBar;