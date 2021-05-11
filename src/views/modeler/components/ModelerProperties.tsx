import { useState } from "react";
import CubeInput from "../../../components/CubeInput"
import CubeRotationInput from "../../../components/CubeRotationInput"
import { MinimizeButton } from "../../../components/MinimizeButton";
import { useStudio } from "../../../contexts/StudioContext";
import { LO, useListenableObject } from "../../../studio/util/ListenableObject";

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
                    <input className="border-none text-white bg-gray-700 pt-1.5 mb-1 text-xs h-7 col-span-2 mx-1 rounded focus:outline-none focus:ring-gray-800" type="text" />
                    <WrapObject element={props => <CubeInput title={"DIMENSIONS"} {...props} />} object={firstSelected?.dimension} />
                    <WrapObject element={props => <CubeInput title={"POSITIONS"} {...props} />} object={firstSelected?.position} />
                    <WrapObject element={props => <CubeInput title={"OFFSET"} {...props} />} object={firstSelected?.offset} />
                    <WrapObject element={props => <CubeInput title={"CUBE GROW"} {...props} />} object={firstSelected?.offset} />
                </div>
                <div className="px-2">
                    <WrapObject element={props => <CubeRotationInput title={"ROTATION"} {...props} />} object={firstSelected?.rotation} />
                </div>
            </div>
        </div>
    )
}

const WrapObject = ({ object, element: Element }: {
    object: LO<readonly [number, number, number]> | undefined,
    element: (props: {
        value?: readonly [number, number, number],
        setValue?: (val: readonly [number, number, number]) => void
    }) => JSX.Element,
}) => {
    const Defined = ({ object }: { object: LO<readonly [number, number, number]> }) => {
        const [value, setValue] = useListenableObject(object)
        return Element({ value, setValue })
    }
    return object !== undefined ?
        <Defined object={object} /> :
        Element({})
}


export default ModelerProperties;