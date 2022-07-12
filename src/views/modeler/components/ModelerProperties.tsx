import CollapsableSidebarPannel from "../../../components/CollapsableSidebarPannel";
import CubeInput from "../../../components/CubeInput";
import CubeRotationInput from "../../../components/CubeRotationInput";
import { useStudio } from "../../../contexts/StudioContext";
import { DCMModel } from "../../../studio/formats/model/DcmModel";
import { LO, useListenableMap, useListenableObject, useListenableObjectNullable } from "../../../studio/util/ListenableObject";
import { NumArray } from "../../../studio/util/NumArray";

const ModelerProperties = () => {
    const { getSelectedProject } = useStudio()
    const { model, selectedCubeManager } = getSelectedProject()

    const [selected] = useListenableObject(selectedCubeManager.selected)
    const cubeMap = useListenableMap(model.identifierCubeMap)
    const oneSelected = selected.length === 1

    const firstSelected = oneSelected ? cubeMap.get(selected[0]) : undefined

    return (
        <CollapsableSidebarPannel title="CUBE PROPERTIES" heightClassname="h-auto" panelName="model_properties">
            <div
                className="transition-height ease-in-out duration-200 studio-scrollbar"
            >
                <div className="pl-3">
                    <p className="dark:text-gray-400 text-black text-xs mt-1">CUBE NAME</p>
                </div>
                <div className="w-full grid grid-cols-2 px-2 pt-1">
                    <WrappedCubeName obj={firstSelected?.name} model={model} />
                    <WrappedCubeInputDimensions title="Dimensions" obj={firstSelected?.dimension} model={model} />
                    <WrappedCubeInput title="Positions" obj={firstSelected?.position} model={model} />
                    <WrappedCubeInput title="Offset" obj={firstSelected?.offset} model={model} />
                    <WrappedCubeInput title="Cube Grow" obj={firstSelected?.cubeGrow} model={model} />
                </div>
                <div className="px-2">
                    <WrappedCubeInputRotation title="Rotation" obj={firstSelected?.rotation} model={model} />
                </div>
            </div>
        </CollapsableSidebarPannel>
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
            onBlur={() => model.undoRedoHandler.endBatchActions("Cube Name Changed")}
            onChange={e => setValue(e.currentTarget.value)}
        />
    )
}

const WrappedCubeInput = ({ title, obj, model }: { title: string, obj?: LO<NumArray>, model: DCMModel }) => {
    const [value, setValue] = useListenableObjectNullable(obj)
    return <CubeInput
        title={title}
        value={value}
        setValue={setValue}
        onFocus={() => {
            model.undoRedoHandler.startBatchActions()
        }}
        onBlur={() => {
            model.undoRedoHandler.endBatchActions(`Cube ${title.toLowerCase()} edit`)
        }}
    />
}

const WrappedCubeInputDimensions = ({ title, obj, model }: { title: string, obj?: LO<NumArray>, model: DCMModel }) => {
    const [value, setValue] = useListenableObjectNullable(obj)
    return <CubeInput
        title={title.toUpperCase()}
        value={value}
        setValue={setValue}
        positiveInteger={true}
        onFocus={() => model.undoRedoHandler.startBatchActions()}
        onBlur={() => model.undoRedoHandler.endBatchActions(`Cube ${title} changed`)}
    />
}

const WrappedCubeInputRotation = ({ title, obj, model }: { title: string, obj?: LO<NumArray>, model: DCMModel }) => {
    const [value, setValue] = useListenableObjectNullable(obj)
    return <CubeRotationInput
        title={title.toUpperCase()}
        value={value}
        setValue={setValue}
        onFocus={() => model.undoRedoHandler.startBatchActions()}
        onBlur={() => model.undoRedoHandler.endBatchActions(`Cube ${title} changed`)}
    />
}

export default ModelerProperties;