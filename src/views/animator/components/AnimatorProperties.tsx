import CubeInput from "../../../components/CubeInput"
import CubeRotationInput from "../../../components/CubeRotationInput"
import Slider from 'react-input-slider'
import NumericInput from 'react-numeric-input';
import Checkbox from "../../../components/Checkbox";
import Dropup, { DropupItem } from "../../../components/Dropup";

const AnimatorProperties = () => {
    return(
        <div className="flex flex-col h-full">

            <div className="rounded-sm bg-gray-800 flex flex-col overflow-hidden pb-1">
                <div className="bg-gray-900 text-gray-400 font-bold text-xs p-1">
                    <p className="my-0.5">CUBE PROPERTIES</p>
                </div>
                <div className="w-full grid grid-cols-2 px-2 pt-1">
                    <CubeInput title="POSITIONS" />
                    <CubeInput title="CUBE GROW" />
                </div>
                <div className="px-2">
                    <CubeRotationInput title="ROTATION" />
                </div>
            </div>

            <div className="rounded-sm bg-gray-800 flex flex-col overflow-hidden pb-1">
                <div className="bg-gray-900 text-gray-400 font-bold text-xs p-1">
                    <p className="my-0.5">LOOPING PROPERTIES</p>
                </div>
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

            <div className="rounded-sm bg-gray-800 flex flex-col overflow-hidden pb-1">
                <div className="bg-gray-900 text-gray-400 font-bold text-xs p-1">
                    <p className="my-0.5">INVERSE KINEMATICS</p>
                </div>
                <div className="w-full flex flex-row px-2 pt-1">
                    <IKCheck title="ANCHOR" />
                </div>
            </div>

            <div className="rounded-sm bg-gray-800 flex flex-col pb-1 flex-grow">
                <div className="bg-gray-900 text-gray-400 font-bold text-xs p-1">
                    <p className="my-0.5">PROGRESSION POINTS</p>
                </div>
                <div className="w-full flex flex-row px-2 pt-1 flex-grow">
                    <ProgressionPoints />
                </div>
            </div>
        </div>
    )
}

const LoopCheck = ({title}: {title: string}) => {
    return(
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

const IKCheck = ({title}: {title: string}) => {
    return(
        <div className="flex flex-row">
            <p className="ml-1 text-gray-400 text-xs mr-2 mt-2">{title}</p>
            <div className="flex flex-col p-1">
                <div className="mb-1 h-7">
                    <Checkbox value={false} />
                </div>
            </div>
        </div>
    )
}

const TitledField = ({title}: {title: string}) => {
    return(
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

const ProgressionPoints = () => {
    return(
        <div className="flex flex-col w-full">
            <div className="flex-grow bg-gray-900 rounded w-full text-gray-400 pl-4">
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
                <div className="rounded-r bg-gray-700 flex-grow pr-4 pl-2 h-8">
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
    )
}

export default AnimatorProperties;