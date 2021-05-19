import { useState } from "react";
import CubeInput from "../../../components/CubeInput"
import CubeRotationInput from "../../../components/CubeRotationInput"
import { MinimizeButton } from "../../../components/MinimizeButton";
import { useStudio } from "../../../contexts/StudioContext";
import { LO, useListenableObject, useListenableObjectNullable } from "../../../studio/util/ListenableObject";

const ModelerProperties = () => {
    const { getSelectedProject } = useStudio()
    const { model, selectedCubeManager } = getSelectedProject()

    const [selected] = useListenableObject<readonly string[]>(selectedCubeManager.selected)
    const oneSelected = selected.length === 1

    const firstSelected = oneSelected ? model.identifierCubeMap.get(selected[0]) : undefined

    const [propertiesActive, setPropertiesActive] = useState(true);

    return (
        <div className="rounded-sm bg-gray-800 flex flex-col overflow-hidden">
            <div className="bg-gray-900 text-gray-400 font-bold text-xs p-1 flex flex-row">
                <p className="my-0.5 flex-grow">CUBE PROPERTIES</p>
                <MinimizeButton active={propertiesActive} toggle={() => setPropertiesActive(!propertiesActive)} />
            </div>
            <div className={(propertiesActive ? "h-104" : "h-0") + " transition-height ease-in-out duration-200"}>
                <div className="pl-3">
                    <p className="text-gray-400 text-xs mt-1">CUBE NAME</p>
                </div>
                <div className="w-full grid grid-cols-2 px-2 pt-1">
                    <WrappedCubeName obj={firstSelected?.name} />
                    <WrappedCubeInput title={"DIMENSIONS"} obj={firstSelected?.dimension} />
                    <WrappedCubeInput title={"POSITIONS"} obj={firstSelected?.position} />
                    <WrappedCubeInput title={"OFFSET"} obj={firstSelected?.offset} />
                    <WrappedCubeInput title={"CUBE GROW"} obj={firstSelected?.cubeGrow} />
                </div>
                <div className="px-2">
                    <WrappedCubeInputRotation title={"ROTATION"} obj={firstSelected?.rotation} />
                </div>
            </div>
        </div>
    )
}

const WrappedCubeName = ({ obj }: { obj?: LO<string> }) => {
    const [value, setValue] = useListenableObjectNullable(obj)
    return (
        <input
            className="border-none text-white bg-gray-700 pt-1.5 mb-1 text-xs h-7 col-span-2 mx-1 rounded focus:outline-none focus:ring-gray-800"
            type="text"
            value={value}
            onChange={e => setValue(e.currentTarget.value)}
        />
    )
}

const WrappedCubeInput = ({ title, obj }: { title: string, obj?: LO<readonly [number, number, number]> }) => {
    const [value, setValue] = useListenableObjectNullable(obj)
    return <CubeInput title={title} value={value} setValue={setValue} />
}

const WrappedCubeInputRotation = ({ title, obj }: { title: string, obj?: LO<readonly [number, number, number]> }) => {
    const [value, setValue] = useListenableObjectNullable(obj)
    return <CubeRotationInput title={title} value={value} setValue={setValue} />
}

export default ModelerProperties;