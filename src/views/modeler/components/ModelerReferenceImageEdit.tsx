import NumericInput from "react-numeric-input";
import Checkbox from "../../../components/Checkbox";
import CubeInput from "../../../components/CubeInput";
import CubeRotationInput from "../../../components/CubeRotationInput";
import { DCMModel } from "../../../studio/formats/model/DcmModel";
import { LO, useListenableObject, useListenableObjectNullable } from "../../../studio/util/ListenableObject";
import { ReferenceImage, useReferenceImageTransform } from "../../../studio/util/ReferenceImageHandler";

const ModelerReferenceImageEdit = ({ model, image }: { model: DCMModel, image: ReferenceImage }) => {

    useReferenceImageTransform(image)

    return (
        <>
            <div className="rounded-sm dark:bg-gray-800 bg-gray-200 flex flex-col overflow-hidden h-full">
                <div className="dark:bg-gray-900 bg-white dark:text-gray-400 text-black font-bold text-xs p-1 flex flex-row">
                    <p className="my-0.5 flex-grow">CUBE PROPERTIES</p>
                </div>
                <div className="overflow-y-scroll studio-scrollbar">
                    <div className="pl-3">
                        <p className="dark:text-gray-400 text-black text-xs mt-1">CUBE NAME</p>
                    </div>
                    <div className="w-full px-2 pt-1">
                        <WrappedCubeName obj={image.name} model={model} />
                        <WrappedCubeInput title={"POSITIONS"} obj={image.position} model={model} />
                        <WrappedCubeInputRotation title={"ROTATION"} obj={image.rotation} model={model} />

                        {/* Below need styling */}
                        FLIPPING
                        <div className="flex flex-row">
                            <WrappedCheckbox title="FLIP X" obj={image.flipX} />
                            <WrappedCheckbox title="FLIP Y" obj={image.flipY} />
                        </div>
                        <WrappedSlider title="OPACITY" obj={image.opacity} />

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
            className="border-none dark:text-white text-black dark:bg-gray-700 bg-white pt-1.5 mb-1 text-xs h-7 w-full mx-1 rounded focus:outline-none focus:ring-gray-800"
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

const WrappedCheckbox = ({ obj, title }: { obj: LO<boolean>, title: string }) => {
    const [value, setValue] = useListenableObject(obj)

    return (
        <Checkbox
            value={value}
            setValue={setValue}
            extraText={title}
        />
    )
}

const WrappedSlider = ({ obj, title }: { obj: LO<number>, title: string }) => {
    const [value, setValue] = useListenableObject(obj)
    return (
        <>
            <div className="mt-2">{title}</div>
            <div className="flex flex-row">
                <NumericInput
                    value={value}
                    onChange={value => setValue(value ?? 100)}
                    step={1}
                    min={0}
                    max={100}
                />
                <input
                    value={value}
                    onChange={e => setValue(e.target.valueAsNumber ?? 100)}
                    className="flex-grow"
                    type="range"
                    step={1}
                    min={0}
                    max={100}
                />
            </div>
        </>
    )
}

export default ModelerReferenceImageEdit;