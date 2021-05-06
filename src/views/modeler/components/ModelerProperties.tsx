import { useState } from "react";
import CubeInput from "../../../components/CubeInput"
import CubeRotationInput from "../../../components/CubeRotationInput"
import { SVGMinus, SVGPlus } from "../../../components/Icons";

const ModelerProperties = () => {

    const[propertiesActive, setPropertiesActive] = useState(true);

    return(
        <div className="rounded-sm bg-gray-800 flex flex-col overflow-hidden">
            <div className="bg-gray-900 text-gray-400 font-bold text-xs p-1 flex flex-row">
                <p className="my-0.5 flex-grow">CUBE PROPERTIES</p>
                <MinimizeButton active={propertiesActive} toggle={() => setPropertiesActive(!propertiesActive)}/>
            </div>
            <div className={(propertiesActive ? "h-104" : "h-0") + " transition-height ease-in-out duration-200"}>
                <div className="pl-3">
                    <p className="text-gray-400 text-xs mt-1">CUBE NAME</p>
                </div>
                <div className="w-full grid grid-cols-2 px-2 pt-1">
                    <input className="border-none text-white bg-gray-700 pt-1.5 mb-1 text-xs h-7 col-span-2 mx-1 rounded focus:outline-none focus:ring-gray-800" type="text" />
                    <CubeInput title="DIMENSIONS" />
                    <CubeInput title="POSITIONS" />
                    <CubeInput title="OFFSET" />
                    <CubeInput title="CUBE GROW" />
                </div>
                <div className="px-2">
                    <CubeRotationInput title="ROTATION" />
                </div>
            </div>
        </div>
    )
}

const MinimizeButton = ({active, toggle}: {active: boolean, toggle: (boolean) => void}) => {
    return(
        active ? 
        <button className="bg-gray-800 hover:bg-black rounded pr-1 pl-2 my-0.5 mr-1" 
        onClick={() => toggle(true)}><SVGMinus className="h-4 w-4 mr-1" /></button> : 
        <button className="bg-gray-800 hover:bg-black rounded pr-1 pl-2 my-0.5 mr-1" 
        onClick={() => toggle(false)}><SVGPlus className="h-4 w-4 mr-1" /></button>
    )
}

export default ModelerProperties;