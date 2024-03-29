import Slider from 'react-input-slider';
import CubeInput from "../../../components/CubeInput";
import CubeRotationInput from "../../../components/CubeRotationInput";
import NumericInput from '../../../components/NumericInput';
import Toggle from "../../../components/Toggle";
import { DCMModel } from "../../../studio/formats/model/DcmModel";
import { LO, useListenableObject, useListenableObjectNullable } from "../../../studio/listenableobject/ListenableObject";
import { ReferenceImage } from "../../../studio/referenceimages/ReferenceImageHandler";
import { useReferenceImageTransform } from "../../../studio/referenceimages/ReferenceImageHandlerHook";
import { NumArray } from '../../../studio/util/NumArray';

const ModelerReferenceImageEdit = ({ model, image }: { model: DCMModel, image: ReferenceImage }) => {

    useReferenceImageTransform(image)

    return (
        <>
            <div className="rounded-sm dark:bg-gray-800 bg-gray-200 flex flex-col overflow-hidden h-full">
                <div className="dark:bg-gray-900 bg-white dark:text-gray-400 text-black font-bold text-xs p-1 flex flex-row">
                    <p className="my-0.5 flex-grow">REFERENCE IMAGE PROPERTIES</p>
                </div>
                <div className="overflow-y-scroll studio-scrollbar">
                    <div className="pl-3">
                        <p className="dark:text-gray-400 text-black text-xs mt-1">IMAGE NAME</p>
                    </div>
                    <div className="w-full px-2 pt-1">
                        <WrappedCubeName obj={image.name} model={model} />
                        <WrappedCubeInput title="Positions" obj={image.position} model={model} />
                        <WrappedCubeInputRotation title="Rotation" obj={image.rotation} model={model} />
                        <WrappedImageScale obj={image.scale} model={model} />

                        <div className="flex flex-row">
                            <WrappedCheckbox title="FLIP X" obj={image.flipX} />
                            <WrappedCheckbox title="FLIP Y" obj={image.flipY} />
                        </div>
                        <WrappedSlider title="Opacity" obj={image.opacity} model={model} />

                    </div>
                </div>
            </div>
        </>
    )
}

const WrappedImageScale = ({ obj, model }: { obj?: LO<number>, model: DCMModel }) => {

    const [value, setValue] = useListenableObjectNullable(obj)
    return (
        <>
            <p className="dark:text-gray-400 text-black text-xs m-1">SCALE</p>
            <div className="flex flex-row">
                <div className="bg-gray-500 rounded-l px-1 text-white font-bold border-gray-900 pt-2 text-xs h-8 ml-1"></div>
                <div className="h-7">
                    <NumericInput
                        value={value}
                        onChange={value => setValue(Math.max(0.1, Math.min(value, 10)))}
                        defaultValue={1}
                        startBatchActions={() => model.undoRedoHandler.startBatchActions()}
                        endBatchActions={() => model.undoRedoHandler.endBatchActions(`Reference Image Scale Changed`)}
                    />
                </div>
            </div>
        </>
    );
}

const WrappedCubeName = ({ obj, model }: { obj?: LO<string>, model: DCMModel }) => {
    const [value, setValue] = useListenableObjectNullable(obj)
    return (
        <input
            className="border-none dark:text-white text-black dark:bg-gray-700 bg-white pt-1.5 mb-1 text-xs h-7 w-full mx-1 rounded focus:outline-none focus:ring-gray-800"
            type="text"
            value={value ?? ""}
            onFocus={() => model.undoRedoHandler.startBatchActions()}
            onBlur={() => model.undoRedoHandler.endBatchActions(`Reference Image Name Changed`)}
            onChange={e => setValue(e.currentTarget.value)}
        />
    )
}

const WrappedCubeInput = ({ title, obj, model }: { title: string, obj?: LO<NumArray>, model: DCMModel }) => {
    const [value, setValue] = useListenableObjectNullable(obj)
    return <CubeInput
        title={title.toUpperCase()}
        value={value}
        setValue={setValue}
        onFocus={() => model.undoRedoHandler.startBatchActions()}
        onBlur={() => model.undoRedoHandler.endBatchActions(`Reference Image ${title} Changed`)}
    />
}

const WrappedCubeInputRotation = ({ title, obj, model }: { title: string, obj?: LO<NumArray>, model: DCMModel }) => {
    const [value, setValue] = useListenableObjectNullable(obj)
    return <CubeRotationInput
        title={title.toUpperCase()}
        value={value}
        setValue={setValue}
        onFocus={() => model.undoRedoHandler.startBatchActions()}
        onBlur={() => model.undoRedoHandler.endBatchActions(`Reference Image ${title} Changed`)}
    />
}

const WrappedCheckbox = ({ obj, title }: { obj: LO<boolean>, title: string }) => {
    const [value, setValue] = useListenableObject(obj)

    return (
        <div className="mr-4 mt-2">
            <p className="ml-1 dark:text-gray-400 text-black text-xs mb-2">{title.toUpperCase()}</p>
            <div className="flex flex-row">
                <Toggle
                    checked={value}
                    setChecked={setValue}
                />
                <p className="text-xs pt-0.5 ml-2 dark:text-gray-400 text-black">{value ? "Yes" : "No"}</p>
            </div>
        </div>
    )
}

const WrappedSlider = ({ obj, title, model }:
    {
        obj: LO<number>,
        title: string,
        model: DCMModel
    }) => {
    const onFocus = () => model.undoRedoHandler.startBatchActions()
    const onBlur = () => model.undoRedoHandler.endBatchActions(`Reference Image ${title} Changed`)

    const [value, setValue] = useListenableObject(obj)
    return (
        <>
            <p className="ml-1 dark:text-gray-400 text-black text-xs mb-2 mt-4">{title.toUpperCase()}</p>
            <div className="flex flex-row">
                <div className="bg-gray-500 rounded-l px-1 text-white font-bold border-gray-900 pt-2 text-xs h-8 ml-1"></div>
                <div className="flex flex-row w-full">
                    <div className="w-24 h-7">
                        <NumericInput
                            value={value}
                            onChange={value => setValue(Math.max(0, Math.min(value, 100)))}
                            startBatchActions={onFocus}
                            endBatchActions={onBlur}
                        />
                    </div>
                    <div className="rounded-r dark:bg-gray-700 bg-gray-300 flex-grow pr-4 pl-2 h-8">
                        <Slider
                            xmin={0}
                            xmax={100}
                            disabled={value === null}
                            axis="x"
                            styles={{
                                track: { height: 6, backgroundColor: '#27272A', width: '100%' },
                                active: { backgroundColor: '#0EA5E9' },
                                thumb: { width: 15, height: 15 }
                            }}
                            x={value ?? 0}
                            onChange={({ x }) => setValue(x)}

                            onDragStart={onFocus}
                            onDragEnd={onBlur}
                        />
                    </div>
                </div>
            </div>
        </>
    )
}

export default ModelerReferenceImageEdit;