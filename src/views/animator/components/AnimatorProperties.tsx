import CubeInput from "../../../components/CubeInput"
import CubeRotationInput from "../../../components/CubeRotationInput"
import Slider from 'react-input-slider'
import NumericInput from 'react-numeric-input';
import Checkbox from "../../../components/Checkbox";
import Dropup, { DropupItem } from "../../../components/Dropup";
import { MinimizeButton } from "../../../components/MinimizeButton";
import { StudioPanelsContext, usePanelToggle } from "../../../contexts/StudioPanelsContext";
import { useStudio } from "../../../contexts/StudioContext";
import { LO, LOMap, useListenableMap, useListenableObject, useListenableObjectInMapNullable, useListenableObjectNullable } from "../../../studio/util/ListenableObject";
import DcaAnimation from "../../../studio/formats/animations/DcaAnimation";
import { FC } from "react";
import { SignatureKind } from "typescript";

const AnimatorProperties = () => {

    const { getSelectedProject } = useStudio()
    const project = getSelectedProject()

    const [selectedCubes] = useListenableObject(project.selectedCubeManager.selected)
    const cubeMap = useListenableMap(project.model.identifierCubeMap)
    const singleSelectedCube = selectedCubes.length === 1 ? cubeMap.get(selectedCubes[0]) : undefined
    const [cubeName] = useListenableObjectNullable(singleSelectedCube?.name)

    const [animation] = useListenableObject(project.animationTabs.selectedAnimation)
    return (
        <div className="overflow-y-scroll h-full dark:bg-gray-800 bg-gray-200">
            <AnimatorCubeProperties animation={animation} cubeName={cubeName} />
            <AnimatorKeyframeProperties animation={animation} />
            <AnimatorLoopingProperties animation={animation} />
            <AnimatorIKProperties animation={animation} />
            <AnimatorProgressionProperties animation={animation} />
        </div>
    )
}

const AnimationPanel: FC<{ panelName: keyof StudioPanelsContext, heightClassname: string, title: string }> = ({ panelName, heightClassname, children, title }) => {
    const [open, setOpen] = usePanelToggle(panelName)

    return (
        <div className="rounded-sm dark:bg-gray-800 bg-gray-200 flex flex-col overflow-hidden pb-1">
            <div className="dark:bg-gray-900 bg-white dark:text-gray-400 text-black font-bold text-xs p-1 flex flex-row">
                <p className="my-0.5 flex-grow">{title}</p>
                <MinimizeButton active={open} toggle={() => setOpen(!open)} />
            </div>
            <div className={(open ? heightClassname : "h-0") + " transition-height ease-in-out duration-200"}>
                {children}
            </div>
        </div>
    )

}

const AnimatorCubeProperties = ({ animation, cubeName }: { animation: DcaAnimation | null, cubeName: string | undefined }) => {
    const [rawKfs] = useListenableObjectNullable(animation?.selectedKeyframes)
    const keyframes = rawKfs ?? []
    const selectedKf = keyframes.length === 1 ? keyframes[0] : null

    const [startTime] = useListenableObjectNullable(selectedKf?.startTime)
    const [duration] = useListenableObjectNullable(selectedKf?.duration)
    if (animation !== null) {
        if (startTime !== undefined && duration !== undefined) {
            animation.forceAnimationTime = startTime + duration
        } else {
            animation.forceAnimationTime = null
        }
    }
    return (
        <AnimationPanel title="CUBE PROPERTIES" heightClassname="h-64" panelName="animator_cube">
            <div className="w-full grid grid-cols-2 px-2 pt-1">
                <WrappedCubeInput title="POSITIONS" cubeName={cubeName} obj={selectedKf?.position} />
                <WrappedCubeInput title="CUBE GROW" cubeName={cubeName} obj={selectedKf?.cubeGrow} />
            </div>
            <div className="px-2">
                <WrappedCubeRotationInput title="ROTATION" cubeName={cubeName} obj={selectedKf?.rotation} />
            </div>
        </AnimationPanel>
    )
}

const AnimatorKeyframeProperties = ({ animation }: { animation: DcaAnimation | null }) => {
    const [selectedKeyframes] = useListenableObjectNullable(animation?.selectedKeyframes)
    const singleSelectedKeyframe = selectedKeyframes !== undefined && selectedKeyframes.length === 1 ? selectedKeyframes[0] : undefined
    console.log(singleSelectedKeyframe)
    return (
        <AnimationPanel title="KEYFRAME PROPERTIES" heightClassname="h-16" panelName="animator_kf">
            <div className="w-full grid grid-cols-2 px-2 pt-1">
                <TitledField title="KEYFRAME START" lo={singleSelectedKeyframe?.startTime} />
                <TitledField title="KEYFRAME LENGTH" lo={singleSelectedKeyframe?.duration} />
            </div>
        </AnimationPanel>
    )
}

const AnimatorLoopingProperties = ({ animation }: { animation: DcaAnimation | null }) => {
    return (
        <AnimationPanel title="LOOPING PROPERTIES" heightClassname="h-16" panelName="animator_looping">
            <div className="w-full flex flex-row px-2 pt-1">
                <LoopCheck title="LOOP" />
                <TitledField title="START" />
                <TitledField title="END" />
                <TitledField title="TIME" />
            </div>
        </AnimationPanel>
    )
}

const AnimatorIKProperties = ({ animation }: { animation: DcaAnimation | null }) => {
    return (
        <AnimationPanel title="INVERSE KINEMATICS" heightClassname="h-10" panelName="animator_ik">
            <div className="w-full flex flex-row px-2 pt-1">
                <IKCheck title="ANCHOR" />
            </div>
        </AnimationPanel>
    )
}

const AnimatorProgressionProperties = ({ animation }: { animation: DcaAnimation | null }) => {

    const [progressionActive, setProgressionActive] = usePanelToggle("animator_pp");

    return (
        <AnimationPanel title="PROGRESSION POINTS" heightClassname="h-96" panelName="animator_pp">
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
        </AnimationPanel>
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

const TitledField = ({ title, lo }: { title: string, lo?: LO<number> }) => {
    const [value, setValue] = useListenableObjectNullable(lo)
    return (
        <div>
            <p className="ml-1 text-gray-400 text-xs">{title}</p>
            <div className="flex flex-col p-1">
                <div className="mb-1 h-7">
                    <NumericInput
                        value={value}
                        format={val => val === undefined ? "" : parseFloat(val).toFixed(2)}
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

const WrappedCubeInput = ({ title, cubeName, obj }: { title: string, cubeName: string | undefined, obj?: LOMap<string, readonly [number, number, number]> }) => {
    const [rawValue, setValue] = useListenableObjectInMapNullable(obj, cubeName)
    const value = obj !== undefined && cubeName !== undefined && rawValue === undefined ? [0, 0, 0] as const : rawValue
    return <CubeInput title={title} value={value} setValue={setValue} />
}

const WrappedCubeRotationInput = ({ title, cubeName, obj }: { title: string, cubeName: string | undefined, obj?: LOMap<string, readonly [number, number, number]> }) => {
    const [rawValue, setValue] = useListenableObjectInMapNullable(obj, cubeName)
    const value = obj !== undefined && cubeName !== undefined && rawValue === undefined ? [0, 0, 0] as const : rawValue
    return <CubeRotationInput title={title} value={value} setValue={setValue} />
}

export default AnimatorProperties;