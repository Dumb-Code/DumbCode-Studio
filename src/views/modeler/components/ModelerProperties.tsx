import { useRef } from "react";
import CubeInput from "../../../components/CubeInput";
import CubeRotationInput from "../../../components/CubeRotationInput";
import HorizontalDivider from "../../../components/HorizontalDivider";
import { MinimizeButton } from "../../../components/MinimizeButton";
import { useStudio } from "../../../contexts/StudioContext";
import { usePanelValue } from "../../../contexts/StudioPanelsContext";
import { DCMModel } from "../../../studio/formats/model/DcmModel";
import { LO, useListenableMap, useListenableObject, useListenableObjectNullable } from "../../../studio/util/ListenableObject";

const ModelerProperties = () => {
    const { getSelectedProject } = useStudio()
    const { model, selectedCubeManager } = getSelectedProject()

    const [selected] = useListenableObject(selectedCubeManager.selected)
    const cubeMap = useListenableMap(model.identifierCubeMap)
    const oneSelected = selected.length === 1

    const firstSelected = oneSelected ? cubeMap.get(selected[0]) : undefined

    const [propertiesActive, setPropertiesActive] = usePanelValue("model_cube")
    const [propertiesHeight, setPropertiesHeight] = usePanelValue("model_cube_size")

    const toggleRef = useRef<HTMLDivElement>(null)

    return (
        <>
            <HorizontalDivider max={430} min={50} value={propertiesHeight} setValue={setPropertiesHeight} toggleDragging={val => {
                if (toggleRef.current) {
                    toggleRef.current.className = val ? "" : "transition-height ease-in-out duration-200"
                }
            }} />
            <div className="rounded-sm dark:bg-gray-800 bg-gray-200 flex flex-col overflow-hidden">
                <div className="dark:bg-gray-900 bg-white dark:text-gray-400 text-black font-bold text-xs p-1 flex flex-row">
                    <p className="my-0.5 flex-grow">CUBE PROPERTIES</p>
                    <MinimizeButton active={propertiesActive} toggle={() => setPropertiesActive(!propertiesActive)} />
                </div>
                <div
                    className="transition-height ease-in-out duration-200"
                    ref={toggleRef}
                    style={{ height: propertiesActive ? propertiesHeight : 0 }}
                >
                    <div className="pl-3">
                        <p className="dark:text-gray-400 text-black text-xs mt-1">CUBE NAME</p>
                    </div>
                    <div className="w-full grid grid-cols-2 px-2 pt-1">
                        <WrappedCubeName obj={firstSelected?.name} model={model} />
                        <WrappedCubeInputDimensions title={"DIMENSIONS"} obj={firstSelected?.dimension} model={model} />
                        <WrappedCubeInput title={"POSITIONS"} obj={firstSelected?.position} model={model} />
                        <WrappedCubeInput title={"OFFSET"} obj={firstSelected?.offset} model={model} />
                        <WrappedCubeInput title={"CUBE GROW"} obj={firstSelected?.cubeGrow} model={model} />
                    </div>
                    <div className="px-2">
                        <WrappedCubeInputRotation title={"ROTATION"} obj={firstSelected?.rotation} model={model} />
                    </div>
                </div>
            </div>
        </>
    )
}

const WrappedCubeName = ({ obj, model }: { obj?: LO<string>, model: DCMModel }) => {
    const [value, setValue] = useListenableObjectNullable(obj)
    return (
        <input
            className="border-none dark:text-white text-black dark:bg-gray-700 bg-white pt-1.5 mb-1 text-xs h-7 col-span-2 mx-1 rounded focus:outline-none focus:ring-gray-800"
            type="text"
            value={value ?? ""}
            onFocus={() => model.undoRedoHandler.startBatchActions()}
            onBlur={() => model.undoRedoHandler.endBatchActions()}
            onChange={e => setValue(e.currentTarget.value)}
        />
    )
}

const WrappedCubeInput = ({ title, obj, model }: { title: string, obj?: LO<readonly [number, number, number]>, model: DCMModel }) => {
    const [value, setValue] = useListenableObjectNullable(obj)
    return <CubeInput
        title={title}
        value={value}
        setValue={setValue}
        onFocus={() => model.undoRedoHandler.startBatchActions()}
        onBlur={() => model.undoRedoHandler.endBatchActions()}
    />
}

const WrappedCubeInputDimensions = ({ title, obj, model }: { title: string, obj?: LO<readonly [number, number, number]>, model: DCMModel }) => {
    const [value, setValue] = useListenableObjectNullable(obj)
    return <CubeInput
        title={title}
        value={value}
        setValue={setValue}
        lockPositive={true}
        onFocus={() => model.undoRedoHandler.startBatchActions()}
        onBlur={() => model.undoRedoHandler.endBatchActions()}
    />
}

const WrappedCubeInputRotation = ({ title, obj, model }: { title: string, obj?: LO<readonly [number, number, number]>, model: DCMModel }) => {
    const [value, setValue] = useListenableObjectNullable(obj)
    return <CubeRotationInput
        title={title}
        value={value}
        setValue={setValue}
        onFocus={() => model.undoRedoHandler.startBatchActions()}
        onBlur={() => model.undoRedoHandler.endBatchActions()}
    />
}

export default ModelerProperties;