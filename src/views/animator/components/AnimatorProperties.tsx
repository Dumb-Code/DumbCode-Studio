import CubeInput from "../../../components/CubeInput"
import CubeRotationInput from "../../../components/CubeRotationInput"
import Slider from 'react-input-slider'
import NumericInput from 'react-numeric-input';
import Checkbox from "../../../components/Checkbox";
import Dropup, { DropupItem } from "../../../components/Dropup";
import { useState } from "react";
import { MinimizeButton } from "../../../components/MinimizeButton";

const AnimatorProperties = () => {
    return (
        <div className="overflow-y-scroll h-full dark:bg-gray-800 bg-gray-200">
            <AnimatorCubeProperties />
            <AnimatorLoopingProperties />
            <AnimatorIKProperties />
            <AnimatorProgressionProperties />
        </div>
    )
}

const AnimatorCubeProperties = () => {

    const [propertiesActive, setPropertiesActive] = useState(true);

    return (
        <div className="rounded-sm dark:bg-gray-800 bg-gray-200 flex flex-col overflow-hidden pb-1">
            <div className="dark:bg-gray-900 bg-white dark:text-gray-400 text-black font-bold text-xs p-1 flex flex-row">
                <p className="my-0.5 flex-grow">CUBE PROPERTIES</p>
                <MinimizeButton active={propertiesActive} toggle={() => setPropertiesActive(!propertiesActive)} />
            </div>
            <div className={(propertiesActive ? "h-64" : "h-0") + " transition-height ease-in-out duration-200"}>
                <div className="w-full grid grid-cols-2 px-2 pt-1">
                    <CubeInput title="POSITIONS" />
                    <CubeInput title="CUBE GROW" />
                </div>
                <div className="px-2">
                    <CubeRotationInput title="ROTATION" />
                </div>
            </div>
        </div>
    )
}

const AnimatorLoopingProperties = () => {

    const [loopingActive, setLoopingActive] = useState(true);

    return (
        <div className="rounded-sm dark:bg-gray-800 bg-gray-200 flex flex-col overflow-hidden pb-1">
            <div className="dark:bg-gray-900 bg-white dark:text-gray-400 text-black font-bold text-xs p-1 flex flex-row">
                <p className="my-0.5 flex-grow">LOOPING PROPERTIES</p>
                <MinimizeButton active={loopingActive} toggle={() => setLoopingActive(!loopingActive)} />
            </div>
            <div className={(loopingActive ? "h-32" : "h-0") + " transition-height ease-in-out duration-200"}>
                <div className="w-full flex flex-row px-2 pt-1">
                    <LoopCheck title="LOOP" />
                    <TitledField title="START" />
                    <TitledField title="END" />
                    <TitledField title="TIME" />
                </div>
                <div className="w-full grid grid-cols-2 px-2 pt-1">
                    <TitledField title="FRAME START" />
                    <TitledField title="FRAME LENGTH" />
                </div>
            </div>
        </div>
    )
}

const AnimatorIKProperties = () => {

    const [ikActive, setIKActive] = useState(false);

    return (
        <div className="rounded-sm dark:bg-gray-800 bg-gray-200 flex flex-col overflow-hidden pb-1">
            <div className="dark:bg-gray-900 bg-white dark:text-gray-400 text-black font-bold text-xs p-1 flex flex-row">
                <p className="my-0.5 flex-grow">INVERSE KINEMATICS</p>
                <MinimizeButton active={ikActive} toggle={() => setIKActive(!ikActive)} />
            </div>
            <div className={(ikActive ? "h-10" : "h-0") + " transition-height ease-in-out duration-200"}>
                <div className="w-full flex flex-row px-2 pt-1">
                    <IKCheck title="ANCHOR" />
                </div>
            </div>
        </div>
    )
}

const AnimatorProgressionProperties = () => {

    const [progressionActive, setProgressionActive] = useState(false);

    return (
        <div className="rounded-sm dark:bg-gray-800 bg-gray-200 flex flex-col pb-1">
            <div className="dark:bg-gray-900 bg-white dark:text-gray-400 text-black font-bold text-xs p-1 flex flex-row">
                <p className="my-0.5 flex-grow">PROGRESSION POINTS</p>
                <MinimizeButton active={progressionActive} toggle={() => setProgressionActive(!progressionActive)} />
            </div>
            <div className={(progressionActive ? "h-96" : "h-0 overflow-hidden") + " transition-height ease-in-out duration-200"}>
                <div className="flex flex-col h-full p-2">
                    <div className="flex-grow dark:bg-gray-900 bg-gray-300 rounded w-full dark:text-gray-400 text-gray-800 pl-4">
                        graph goes here
                    </div>
                    <div className="flex flex-row mt-2">
                        <Checkbox value={true} extraText="START" />
                        <Checkbox value={true} extraText="END" />
                        <Dropup title="Default Graph" header="SELECT ONE" right={true} className="h-8 pt-2" >
                            <DropupItem name="Sin" onSelect={() => console.log("swap graph")} />
                            <DropupItem name="Quadratic" onSelect={() => console.log("swap graph")} />
                            <DropupItem name="Cubic" onSelect={() => console.log("swap graph")} />
                            <DropupItem name="Quartic" onSelect={() => console.log("swap graph")} />
                            <DropupItem name="Quintic" onSelect={() => console.log("swap graph")} />
                            <DropupItem name="Exponential" onSelect={() => console.log("swap graph")} />
                            <DropupItem name="Circular" onSelect={() => console.log("swap graph")} />
                            <DropupItem name="Back" onSelect={() => console.log("swap graph")} />
                            <DropupItem name="Elastic" onSelect={() => console.log("swap graph")} />
                            <DropupItem name="Bounce" onSelect={() => console.log("swap graph")} />
                        </Dropup>
                    </div>
                    <div className="text-gray-500 font-bold text-xs p-1">
                        <p className="my-0.5">POINT RESOLUTION</p>
                    </div>
                    <div className="flex flex-row mb-2 h-7 col-span-2">
                        <div className=" w-20 h-7">
                            <NumericInput value={0} size={2} mobile={false} className="focus:outline-none focus:ring-gray-800 border-none" />
                        </div>
                        <div className="rounded-r dark:bg-gray-700 bg-gray-300 flex-grow pr-4 pl-2 h-8">
                            <Slider
                                xmin={1} xmax={100} axis="x"
                                styles={{
                                    track: { height: 6, backgroundColor: '#27272A', width: '100%' },
                                    active: { backgroundColor: '#0EA5E9' },
                                    thumb: { width: 15, height: 15 }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const LoopCheck = ({ title }: { title: string }) => {
    return (
        <div>
            <p className="ml-1 text-gray-400 text-xs">{title}</p>
            <div className="flex flex-col p-1">
                <div className="mb-1 h-7 mt-1">
                    <Checkbox value={false} />
                </div>
            </div>
        </div>
    )
}

const IKCheck = ({ title }: { title: string }) => {
    return (
        <div className="flex flex-row">
            <p className="ml-1 dark:text-gray-400 text-black text-xs mr-2 mt-2">{title}</p>
            <div className="flex flex-col p-1">
                <div className="mb-1 h-7">
                    <Checkbox value={false} />
                </div>
            </div>
        </div>
    )
}

const TitledField = ({ title }: { title: string }) => {
    return (
        <div>
            <p className="ml-1 text-gray-400 text-xs">{title}</p>
            <div className="flex flex-col p-1">
                <div className="mb-1 h-7">
                    <NumericInput value={0} size={6} mobile={false} className="focus:outline-none focus:ring-gray-800 border-none" />
                </div>
            </div>
        </div>
    )
}

export default AnimatorProperties;