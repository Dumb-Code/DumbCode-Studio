import { useEffect, useMemo, useState } from "react";
import Slider from 'react-input-slider';
import Checkbox from "../../../components/Checkbox";
import CollapsableSidebarPannel from "../../../components/CollapsableSidebarPannel";
import CubeInput from "../../../components/CubeInput";
import CubeRotationInput from "../../../components/CubeRotationInput";
import Dropup, { DropupItem } from "../../../components/Dropup";
import HistoryList from "../../../components/HistoryList";
import NumericInput from "../../../components/NumericInput";
import Toggle from "../../../components/Toggle";
import { useStudio } from "../../../contexts/StudioContext";
import { useTooltipRef } from "../../../contexts/TooltipContext";
import DcaAnimation, { DcaKeyframe } from "../../../studio/formats/animations/DcaAnimation";
import { DCMCube } from "../../../studio/formats/model/DcmModel";
import { LO, LOMap, useListenableMap, useListenableObject, useListenableObjectInMapNullable, useListenableObjectNullable } from "../../../studio/util/ListenableObject";
import { NumArray } from "../../../studio/util/NumArray";
import AnimatorAutoGravity from "./AnimatorAutoGravity";
import AnimatorSkeletalExport from "./AnimatorSkeletalExport";
import { ProgressionPointsCanvas } from "./ProgressionPointsCanvas";

const AnimatorProperties = () => {

    const { getSelectedProject } = useStudio()
    const project = getSelectedProject()

    const [selectedCubes] = useListenableObject(project.selectedCubeManager.selected)
    const cubeMap = useListenableMap(project.model.identifierCubeMap)
    const singleSelectedCube = selectedCubes.length === 1 ? cubeMap.get(selectedCubes[0]) : undefined
    const dcmSelectedCubes = selectedCubes.map(name => cubeMap.get(name)).filter((cube): cube is DCMCube => cube !== undefined)
    const [cubeName] = useListenableObjectNullable(singleSelectedCube?.name)

    const [animation] = useListenableObject(project.animationTabs.selectedAnimation)
    return (
        <div className="overflow-y-scroll h-full dark:bg-gray-800 bg-gray-200 studio-scrollbar pb-1">
            <AnimatorCubeProperties animation={animation} cubeName={cubeName} cube={singleSelectedCube} />
            <AnimatorKeyframeProperties animation={animation} />
            <AnimatorVisibilityProperties />
            <AnimatorLoopingProperties animation={animation} />
            <AnimatorIKProperties animation={animation} />
            <AnimatorProgressionProperties animation={animation} />
            <AnimatorAutoGravity animation={animation} selectedCubes={dcmSelectedCubes} />
            <AnimatorSkeletalExport animation={animation} cube={singleSelectedCube} />
            <HistoryList undoRedoHandler={animation?.undoRedoHandler} />
        </div>
    )
}

const AnimatorCubeProperties = ({ animation, cubeName, cube }: { animation: DcaAnimation | null, cubeName: string | undefined, cube: DCMCube | undefined }) => {
    const [rawKfs] = useListenableObjectNullable(animation?.selectedKeyframes)
    const [mode, setMode] = useListenableObjectNullable(animation?.propertiesMode)
    const [lockedCubes, setLockedCubes] = useListenableObjectNullable(animation?.lockedCubes)
    const keyframes = rawKfs ?? []
    const selectedKf = keyframes.length === 1 ? keyframes[0] : undefined

    const [startTime] = useListenableObjectNullable(selectedKf?.startTime)
    const [duration] = useListenableObjectNullable(selectedKf?.duration)
    //TODO: move out
    if (animation !== null) {
        if (startTime !== undefined && duration !== undefined) {
            animation.forceAnimationTime = startTime + duration
        } else {
            animation.forceAnimationTime = null
        }
    }


    const sharedProps = {
        cubeName, cube,
        keyframe: selectedKf,
        mode: mode ?? "global",
        animation
    }

    return (
        <CollapsableSidebarPannel title="CUBE PROPERTIES" heightClassname="h-76" panelName="animator_cube">
            <div
                className="dark:text-white px-2 mt-2"
                ref={useTooltipRef<HTMLDivElement>("Off (Local): Values shown are the changes the cube makes in that keyframe\nOn (Global) Values shown are the cubes actual values at the current time")}
            >
                <p className="ml-1 dark:text-gray-400 text-black text-xs flex-grow mb-2">GLOBAL MODE</p>
                <div className="flex flex-row">
                    <Toggle
                        checked={mode === "global"}
                        setChecked={c => setMode(c ? "global" : "local")}
                    />
                    <p className="text-xs pt-0.5 ml-2 dark:text-gray-400 text-black">{mode === "global" ? "Global" : "Local"}</p>
                </div>
            </div>
            <div
                className="dark:text-white px-2 mt-2"
                ref={useTooltipRef<HTMLDivElement>("When locked, a cube does not move with it's parent")}
            >
                <p className="ml-1 dark:text-gray-400 text-black text-xs flex-grow mb-2">Cube Locked</p>
                <div className="flex flex-row">
                    <Toggle
                        checked={lockedCubes !== undefined && cube !== undefined && lockedCubes.includes(cube.identifier)}
                        setChecked={c => {
                            if (lockedCubes === undefined || cube === undefined) {
                                return
                            }
                            if (c) {
                                setLockedCubes([...lockedCubes, cube.identifier])
                            } else {
                                setLockedCubes(lockedCubes.filter(id => id !== cube.identifier))
                            }
                        }}
                    />
                    <p className="text-xs pt-0.5 ml-2 dark:text-gray-400 text-black">{lockedCubes !== undefined && cube !== undefined ? (lockedCubes.includes(cube.identifier) ? "Locked" : "Unlocked") : ""}</p>
                </div>
            </div>
            <div className="w-full grid grid-cols-2 px-2 pt-1">
                <WrappedCubeInput
                    title="POSITIONS"
                    obj={selectedKf?.position}
                    keyframeSetFunction="setPositionAbsolute"
                    vector={() => cube?.cubeGroup?.position}
                    InputType={CubeInput}
                    {...sharedProps}
                />
                <WrappedCubeInput
                    title="CUBE GROW"
                    obj={selectedKf?.cubeGrow}
                    keyframeSetFunction="setCubeGrowAbsolute"
                    vector={() => cube?.cubeGrowGroup?.position?.clone()?.multiplyScalar(-1)}
                    InputType={CubeInput}
                    {...sharedProps}
                />
            </div>
            <div className="px-2">
                <WrappedCubeInput
                    title="ROTATION"
                    obj={selectedKf?.rotation}
                    keyframeSetFunction="setRotationAbsolute"
                    vector={() => {
                        const rot = cube?.cubeGroup?.rotation
                        if (rot === undefined) {
                            return rot
                        }
                        return {
                            x: rot.x * 180 / Math.PI,
                            y: rot.y * 180 / Math.PI,
                            z: rot.z * 180 / Math.PI,
                        }
                    }}
                    InputType={CubeRotationInput}
                    {...sharedProps}
                />
            </div>
        </CollapsableSidebarPannel>
    )
}

const AnimatorKeyframeProperties = ({ animation }: { animation: DcaAnimation | null }) => {
    const [selectedKeyframes] = useListenableObjectNullable(animation?.selectedKeyframes)
    const singleSelectedKeyframe = selectedKeyframes !== undefined && selectedKeyframes.length === 1 ? selectedKeyframes[0] : undefined
    return (
        <CollapsableSidebarPannel title="KEYFRAME PROPERTIES" heightClassname="h-16" panelName="animator_kf">
            <div className="w-full grid grid-cols-2 px-2 pt-1">
                <TitledField title="KEYFRAME START" lo={singleSelectedKeyframe?.startTime} />
                <TitledField title="KEYFRAME LENGTH" lo={singleSelectedKeyframe?.duration} />
            </div>
        </CollapsableSidebarPannel>
    )
}

const AnimatorLoopingProperties = ({ animation }: { animation: DcaAnimation | null }) => {
    return (
        <CollapsableSidebarPannel title="LOOPING PROPERTIES" heightClassname="h-16" panelName="animator_looping">
            <div className="w-full flex flex-row px-2 pt-1">
                <LoopCheck title="LOOP" />
                <TitledField title="START" />
                <TitledField title="END" />
                <TitledField title="TIME" />
            </div>
        </CollapsableSidebarPannel>
    )
}

const AnimatorVisibilityProperties = () => {

    const [mode, setMode] = useState(true);
    const [isStart, setStart] = useState(true);

    return (
        <CollapsableSidebarPannel title="VISIBILITY PROPERTIES" heightClassname="h-12" panelName="animator_visibility">
            <div className="flex flex-row mt-0.5 pl-2">
                <div>
                    <p className="ml-1 dark:text-gray-400 text-black text-xs flex-grow mb-2">VISIBLE</p>
                    <Toggle checked={mode} setChecked={c => setMode(!mode)} />
                </div>
                <div className="ml-2">
                    <p className="ml-1 dark:text-gray-400 text-black text-xs flex-grow mb-2">WHEN TO TOGGLE</p>
                    <div className="flex flex-row">
                        <Toggle checked={isStart} setChecked={c => setStart(!isStart)} />
                        <p className="text-xs dark:text-gray-300 ml-2">{isStart ? "end of keyframe" : "beginning of keyframe"}</p>
                    </div>
                </div>
            </div>
        </CollapsableSidebarPannel>
    );
}

const AnimatorIKProperties = ({ animation }: { animation: DcaAnimation | null }) => {
    return (
        <CollapsableSidebarPannel title="INVERSE KINEMATICS" heightClassname="h-10" panelName="animator_ik">
            <div className="w-full flex flex-row px-2 pt-1">
                <IKCheck title="ANCHOR" animation={animation} />
            </div>
        </CollapsableSidebarPannel>
    )
}


const AnimatorProgressionProperties = ({ animation }: { animation: DcaAnimation | null }) => {
    const [selectedKeyframes] = useListenableObjectNullable(animation?.selectedKeyframes)
    const singleSelected = useMemo(() => selectedKeyframes === undefined || selectedKeyframes.length !== 1 ? null : selectedKeyframes[0], [selectedKeyframes])

    const [selectedGraphType, setSelectedGraphType] = useListenableObjectNullable(singleSelected?.graphType)
    const [isIn, setIsIn] = useListenableObjectNullable(singleSelected?.isGraphIn)
    const [isOut, setIsOut] = useListenableObjectNullable(singleSelected?.isGraphOut)
    const [resolution, setResolution] = useListenableObjectNullable(singleSelected?.graphResolution)

    return (
        <CollapsableSidebarPannel title="PROGRESSION POINTS" heightClassname="h-96" panelName="animator_pp">
            <div className="flex flex-col h-full p-2">
                <div className="flex-grow rounded overflow-hidden w-full">
                    <ProgressionPointsCanvas keyframe={singleSelected} />
                </div>
                <div className="flex flex-row mt-2 w-full">
                    <Checkbox value={isIn} extraText="IN" setValue={setIsIn} />
                    <Checkbox value={isOut} extraText="OUT" setValue={setIsOut} />
                    <div className="flex-grow">
                        <Dropup title={selectedGraphType ?? ""} header="SELECT ONE" className="h-8 pt-2 w-full" headerClassName="w-full" >
                            <DropupItem name="Sin" onSelect={() => setSelectedGraphType("Sin")} />
                            <DropupItem name="Quadratic" onSelect={() => setSelectedGraphType("Quadratic")} />
                            <DropupItem name="Cubic" onSelect={() => setSelectedGraphType("Cubic")} />
                            <DropupItem name="Quartic" onSelect={() => setSelectedGraphType("Quartic")} />
                            <DropupItem name="Quintic" onSelect={() => setSelectedGraphType("Quintic")} />
                            <DropupItem name="Exponential" onSelect={() => setSelectedGraphType("Exponential")} />
                            <DropupItem name="Circular" onSelect={() => setSelectedGraphType("Circular")} />
                            <DropupItem name="Back" onSelect={() => setSelectedGraphType("Back")} />
                            <DropupItem name="Elastic" onSelect={() => setSelectedGraphType("Elastic")} />
                            <DropupItem name="Bounce" onSelect={() => setSelectedGraphType("Bounce")} />
                        </Dropup>
                    </div>
                </div>
                <div className="text-black dark:text-gray-500 font-bold text-xs p-1">
                    <p className="my-0.5">POINT RESOLUTION</p>
                </div>
                <div className="flex flex-row mb-2 h-7 col-span-2">
                    <div className=" w-20 h-7">
                        <NumericInput
                            value={singleSelected === null ? null : resolution}
                            onChange={e => setResolution(Math.min(Math.max(e, 5), 50))}
                            isPositiveInteger
                        />
                    </div>
                    <div className="rounded-r dark:bg-gray-700 bg-gray-300 flex-grow pr-4 pl-2 h-8">
                        <Slider
                            disabled={singleSelected === null}
                            x={resolution}
                            onChange={e => setResolution(e.x)}
                            xmin={5} xmax={50} axis="x"
                            styles={{
                                track: { height: 6, backgroundColor: '#27272A', width: '100%' },
                                active: { backgroundColor: '#0EA5E9' },
                                thumb: { width: 15, height: 15 }
                            }}
                        />
                    </div>
                </div>
            </div>
        </CollapsableSidebarPannel>
    )
}

const LoopCheck = ({ title }: { title: string }) => {
    return (
        <div>
            <p className="ml-1 text-black dark:text-gray-400 text-xs">{title}</p>
            <div className="flex flex-col p-1">
                <div className="mb-1 h-7 mt-1">
                    <Checkbox value={false} setValue={e => console.log("set value" + e)} />
                </div>
            </div>
        </div>
    )
}

const IKCheck = ({ title, animation }: { title: string, animation: DcaAnimation | null }) => {
    const [selected] = useListenableObjectNullable(animation?.project?.selectedCubeManager?.selected)
    const [anchors, setAnchors] = useListenableObjectNullable(animation?.ikAnchorCubes)
    const isAllSelected = selected !== undefined && anchors !== undefined && selected.every(s => anchors.includes(s))
    const toggleAllSelected = () => {
        if (selected === undefined || anchors === undefined) {
            return
        }
        if (isAllSelected) {
            const newArray: string[] = [...anchors]
            selected.forEach(f => {
                const idx = newArray.indexOf(f)
                if (idx !== -1) {
                    newArray.splice(idx, 1)
                }
            })
            setAnchors(newArray)
        } else {
            const newArray: string[] = [...anchors]
            selected.forEach(f => {
                const idx = newArray.indexOf(f)
                if (idx === -1) {
                    newArray.push(f)
                }
            })
            setAnchors(newArray)
        }
    }
    return (
        <div className="flex flex-row">
            <p className="ml-1 dark:text-gray-400 text-black text-xs mr-2 mt-2">{title}</p>
            <div className="flex flex-col p-1">
                <div className="mb-1 h-7">
                    <Checkbox value={isAllSelected} setValue={toggleAllSelected} />
                </div>
            </div>
        </div>
    )
}

const TitledField = ({ title, lo }: { title: string, lo?: LO<number> }) => {
    const [value, setValue] = useListenableObjectNullable(lo)
    return (
        <div>
            <p className="ml-1 dark:text-gray-400 text-black text-xs">{title}</p>
            <div className="flex flex-col p-1">
                <div className="mb-1 h-7">
                    <NumericInput
                        value={value}
                        onChange={val => (val < 0) ? setValue(0) : setValue(val)}
                    />
                </div>
            </div>
        </div>
    )
}

type InputPropTypes = {
    title: string;
    mode: "local" | "global"
    cubeName: string | undefined;
    cube: DCMCube | undefined;
    keyframe: DcaKeyframe | undefined,
    keyframeSetFunction: "setPositionAbsolute" | "setRotationAbsolute" | "setCubeGrowAbsolute";
    vector: () => {
        x: number;
        y: number;
        z: number;
    } | undefined;
    obj?: LOMap<string, NumArray> | undefined;
    animation: DcaAnimation | null,
    InputType: typeof CubeInput | typeof CubeRotationInput
}
const WrappedCubeInput = (props: InputPropTypes) => {
    return props.mode === "local" ? <WrappedInputLocal {...props} /> : <WrappedInputGlobal {...props} />
}

const WrappedInputLocal = ({ title, cubeName, obj, InputType, animation }: InputPropTypes) => {
    const [rawValue, setValue] = useListenableObjectInMapNullable(obj, cubeName)
    const value = obj !== undefined && cubeName !== undefined && rawValue === undefined ? [0, 0, 0] as const : rawValue
    return <InputType
        title={title}
        value={value}
        setValue={setValue}
        onFocus={() => animation !== null && animation.undoRedoHandler.startBatchActions()}
        onBlur={() => animation !== null && animation.undoRedoHandler.endBatchActions(`Animated Cube ${title} changed`)}
    />
}


const WrappedInputGlobal = ({ title, cube, keyframe, keyframeSetFunction, vector, InputType, animation }: InputPropTypes) => {
    const { onFrameListeners } = useStudio()
    const vec = vector()
    const [x, setX] = useState<number | undefined>(vec?.x)
    const [y, setY] = useState<number | undefined>(vec?.y)
    const [z, setZ] = useState<number | undefined>(vec?.z)
    useEffect(() => {
        const listner = () => {
            const vec = vector()
            setX(vec?.x)
            setY(vec?.y)
            setZ(vec?.z)
        }
        onFrameListeners.add(listner)
        return () => {
            onFrameListeners.delete(listner)
        }
    }, [onFrameListeners, vector])

    const setValue = (array: NumArray) => {
        if (keyframe === undefined) {
            return
        }
        keyframe[keyframeSetFunction](array[0], array[1], array[2], cube)
    }
    const value = cube === undefined || keyframe === undefined || x === undefined || y === undefined || z === undefined ? undefined : [x, y, z] as const
    return <InputType
        title={title}
        value={value}
        setValue={setValue}
        onFocus={() => animation !== null && animation.undoRedoHandler.startBatchActions()}
        onBlur={() => animation !== null && animation.undoRedoHandler.endBatchActions(`Animated Cube ${title} changed`)}
    />
}

export default AnimatorProperties;