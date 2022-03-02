import { useEffect, useState } from "react";
import Slider from 'react-input-slider';
import NumericInput from 'react-numeric-input';
import { Quaternion, Vector3 } from "three";
import Checkbox from "../../../components/Checkbox";
import CollapsableSidebarPannel from "../../../components/CollapsableSidebarPannel";
import CubeInput from "../../../components/CubeInput";
import CubeRotationInput from "../../../components/CubeRotationInput";
import Dropup, { DropupItem } from "../../../components/Dropup";
import HistoryList from "../../../components/HistoryList";
import Toggle from "../../../components/Toggle";
import { useStudio } from "../../../contexts/StudioContext";
import { useTooltipRef } from "../../../contexts/TooltipContext";
import DcaAnimation, { DcaKeyframe } from "../../../studio/formats/animations/DcaAnimation";
import { DCMCube } from "../../../studio/formats/model/DcmModel";
import { LO, LOMap, useListenableMap, useListenableObject, useListenableObjectInMapNullable, useListenableObjectNullable } from "../../../studio/util/ListenableObject";

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
            <HistoryList />
        </div>
    )
}

const AnimatorCubeProperties = ({ animation, cubeName, cube }: { animation: DcaAnimation | null, cubeName: string | undefined, cube: DCMCube | undefined }) => {
    const [rawKfs] = useListenableObjectNullable(animation?.selectedKeyframes)
    const [mode, setMode] = useListenableObjectNullable(animation?.propertiesMode)
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
        mode: mode ?? "global"
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
                    vector={() => cube?.cubeGroup?.rotation?.toVector3()?.multiplyScalar(180 / Math.PI)}
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
    return (
        <CollapsableSidebarPannel title="PROGRESSION POINTS" heightClassname="h-96" panelName="animator_pp">
            <div className="flex flex-col h-full p-2">
                <div className="flex-grow dark:bg-gray-900 bg-gray-300 rounded w-full dark:text-gray-400 text-gray-800 pl-4">
                    graph goes here
                </div>
                <div className="flex flex-row mt-2">
                    <Checkbox value={true} extraText="START" setValue={e => console.log("set value" + e)} />
                    <Checkbox value={true} extraText="END" setValue={e => console.log("set value" + e)} />
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
                <div className="text-black dark:text-gray-500 font-bold text-xs p-1">
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
        </CollapsableSidebarPannel>
    )
}

const AnimatorAutoGravity = ({ animation, selectedCubes }: { animation: DcaAnimation | null, selectedCubes: readonly DCMCube[] }) => {
    const applyAutoGravity = () => {
        if (!animation) {
            return
        }
        const keyframes = animation.selectedKeyframes.value
        if (keyframes.length !== 1) {
            return
        }
        const keyframe = keyframes[0]
        animation.project.model.resetVisuals()
        animation.animate(0)

        const computeVec = new Vector3()
        const computeQuat = new Quaternion()

        selectedCubes.forEach(cube => {
            let minimumY = Infinity
            for (let x = 0; x <= 1; x++) {
                for (let y = 0; y <= 1; y++) {
                    for (let z = 0; z <= 1; z++) {
                        minimumY = Math.min(minimumY, cube.getWorldPosition(x, y, z, computeVec).y)
                    }
                }
            }

            computeVec.set(0, -minimumY * 16, 0)

            cube.cubeGroup.parent?.getWorldQuaternion(computeQuat)
            computeQuat.invert()
            computeVec.applyQuaternion(computeQuat)

            //Start batch undo redo

            //https://playcode.io/868357/
            keyframe.progressionPoints.value = [
                { required: true, x: 0.00, y: 1.00 },
                { x: 0.07, y: 0.99 }, { x: 0.14, y: 0.98 },
                { x: 0.21, y: 0.95 }, { x: 0.29, y: 0.92 },
                { x: 0.36, y: 0.87 }, { x: 0.43, y: 0.82 },
                { x: 0.50, y: 0.75 }, { x: 0.57, y: 0.67 },
                { x: 0.64, y: 0.59 }, { x: 0.71, y: 0.49 },
                { x: 0.79, y: 0.38 }, { x: 0.86, y: 0.27 },
                { x: 0.93, y: 0.14 },
                { required: true, x: 1.00, y: 0.00 }
            ]
            keyframe.position.set(cube.name.value, [computeVec.x, computeVec.y, computeVec.z])
        })


    }
    return (
        <CollapsableSidebarPannel title="AUTO GRAVITY" heightClassname="h-96" panelName="animator_ag">
            <div className="flex flex-col h-full p-2">
                <button onClick={applyAutoGravity} className="bg-blue-500 rounded">Apply to selected</button>
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
                        format={val => val === null ? "" : parseFloat(String(val)).toFixed(2)}
                        onChange={(val: number | null) => {
                            if (val !== null) {
                                (val < 0) ? setValue(0) : setValue(val)
                            }
                        }}
                        mobile={false}
                        className="focus:outline-none focus:ring-gray-800 border-none"
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
    obj?: LOMap<string, readonly [number, number, number]> | undefined;
    InputType: typeof CubeInput | typeof CubeRotationInput
}
const WrappedCubeInput = (props: InputPropTypes) => {
    return props.mode === "local" ? <WrappedInputLocal {...props} /> : <WrappedInputGlobal {...props} />
}

const WrappedInputLocal = ({ title, cubeName, obj, InputType }: InputPropTypes) => {
    const [rawValue, setValue] = useListenableObjectInMapNullable(obj, cubeName)
    const value = obj !== undefined && cubeName !== undefined && rawValue === undefined ? [0, 0, 0] as const : rawValue
    return <InputType title={title} value={value} setValue={setValue} />
}


const WrappedInputGlobal = ({ title, cube, keyframe, obj, keyframeSetFunction, vector, InputType }: InputPropTypes) => {
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

    const setValue = (array: readonly [number, number, number]) => {
        if (keyframe === undefined) {
            return
        }
        keyframe[keyframeSetFunction](array[0], array[1], array[2], cube)
    }
    const value = cube === undefined || keyframe === undefined || x === undefined || y === undefined || z === undefined ? undefined : [x, y, z] as const
    return <InputType title={title} value={value} setValue={setValue} />
}

export default AnimatorProperties;