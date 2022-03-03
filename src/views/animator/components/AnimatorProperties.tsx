import { Bone3D, Chain3D, Structure3D, V3 } from "@aminere/fullik";
import { useEffect, useRef, useState } from "react";
import Slider from 'react-input-slider';
import NumericInput from 'react-numeric-input';
import { Euler, Mesh, Object3D, Quaternion, Vector3 } from "three";
import Checkbox from "../../../components/Checkbox";
import CollapsableSidebarPannel from "../../../components/CollapsableSidebarPannel";
import CubeInput from "../../../components/CubeInput";
import CubeRotationInput from "../../../components/CubeRotationInput";
import Dropup, { DropupItem } from "../../../components/Dropup";
import HistoryList from "../../../components/HistoryList";
import SelectedCubesButton, { SelectedCubesRef } from "../../../components/SelectedCubesButton";
import Toggle from "../../../components/Toggle";
import { useStudio } from "../../../contexts/StudioContext";
import { useTooltipRef } from "../../../contexts/TooltipContext";
import DcaAnimation, { DcaKeyframe } from "../../../studio/formats/animations/DcaAnimation";
import { DCMCube } from "../../../studio/formats/model/DcmModel";
import { LO, LOMap, useListenableMap, useListenableObject, useListenableObjectInMapNullable, useListenableObjectNullable } from "../../../studio/util/ListenableObject";
import { AnimatorGumballIK } from "../logic/AnimatorGumballIK";

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

const computeVec = new Vector3()
const computeQuat = new Quaternion()

//Quadratic progression points
//https://playcode.io/868357/
const progressionPoints = [
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


const tempVec = new Vector3()
const tempQuat = new Quaternion()
const worldQuat = new Quaternion()
const tempEuler = new Euler()
tempEuler.order = "ZYX"
const AnimatorAutoGravity = ({ animation, selectedCubes }: { animation: DcaAnimation | null, selectedCubes: readonly DCMCube[] }) => {
    const { onTopScene, scene } = useStudio()

    const gravityRef = useRef<SelectedCubesRef>(null)
    const forcedLeafRef = useRef<SelectedCubesRef>(null)

    const applyAutoGravity = () => {
        if (!animation || !gravityRef.current || !forcedLeafRef.current) {
            return
        }

        animation.project.model.resetVisuals()
        animation.animate(0)

        const computeCache: { cube: DCMCube, values: [number, number, number], time: number }[] = []

        const selectedRef = gravityRef.current.getSelectedCubes()
        const selected = selectedRef.length === 0 ? selectedCubes : selectedRef

        selected.forEach(cube => {
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

            //Cube is at y=y
            //-9.81t^2 + y = 0
            //-9.81t^2 = -y
            //t^2 = y / 9.81
            //t = sqrt(y / 9.81)

            const time = Math.sqrt(minimumY / 9.81)

            computeCache.push({
                cube,
                values: [computeVec.x, computeVec.y, computeVec.z],
                time
            })
        })

        //Reduce the array to a map of Map<time, cubes[]>,
        //Essentially grouping the cubes by distance from the ground,
        //As to limit the number of keyframes created.
        // const reducedTimeMap = computeCache.reduce((map, value) => {
        //     let closeTimeKey: number | undefined;
        //     map.forEach((_, key) => {
        //         //If the time it takes for this to hit the ground, and the other to hit the ground
        //         //Is difference by 0.2, then use the other one's keyframe
        //         if (Math.abs(key - value.time) < 0.2) {
        //             closeTimeKey = key
        //         }
        //     })
        //     if (closeTimeKey !== undefined) {
        //         const arr = map.get(closeTimeKey) ?? []
        //         arr.push(value)
        //         map.set(closeTimeKey, arr)
        //     } else {
        //         map.set(value.time, [value])
        //     }
        //     return map
        // }, new Map<number, typeof computeCache>())

        // //Start batch undo redo


        // const keyframes: DcaKeyframe[] = []
        // reducedTimeMap.forEach((values, time) => {
        //     const kf = animation.createKeyframe()
        //     kf.startTime.value = animation.time.value
        //     kf.duration.value = time
        //     kf.progressionPoints.value = progressionPoints
        //     values.forEach(v => kf.position.set(v.cube.name.value, v.values))
        //     keyframes.push(kf)
        // })

        // type PreChainData = Omit<typeof chainData[number], "start" | "end"> & {
        //     alreadyAdd?: {
        //         chain: number,
        //         bone: number
        //     }
        // }

        //02/03 - 
        //I need the chains from the leaf nodes to be reversed (double reversed as they're already reversed)
        //They need to go from the leaf -> the root, then have the root be the target
        //This is the opposite way around to the selected cubes, which should be the target.
        //I think that I need to create the chain in a better way
        //First, go from all the selected nodes, and go to the parent's root, like normal
        //This would be target-first parent-first
        //Do this for all selected nodes
        //Then, go through all selected nodes and go to all their children, linking up chains if needed.
        //This would be target-first children-first
        // - alternativly, we could *maybe* skip this step?
        //has to done in hirarchl order - parents first
        //
        //The target of this would be the selected cube. This is the opposite of what is currently done,
        //As currently the IK chain looks to the parent to start, meaning the current node is the target. 
        //Once done, go to all leaf nodes and move up to link it with the root/chain.
        //This would be target-last parent-first
        //
        //So essentially, I should come up with a way to navigate parent-first or children-first,
        //And a way to have the target be either the first or last.

        //03/03
        //Okay a new day, and a new way of thinking.
        //The best way to join everything up would be:
        //In hirarchal order (root cubes first), go through each cube and create a chain,
        // - Where the parent is first, and the target is the cube (*cube -> root)
        //Then, go through each leaf node, and create a chain,
        // - Where the parent is last, and the target is the leaf node (*root -> leaf)

        // const previousPositionVector = new Vector3()
        //reversed: false = *cube -> root
        //reversed: true = *root -> cube
        //In the cubes: parent -> self -> *child,
        //  - !reversed: parent, self, child* 
        //  -  reversed: child, self, parent*
        // const addToChain = (cube: DCMCube, chain: PreChainData, reversed: boolean) => {
        //     const position = cube.cubeGroup.getWorldPosition(previousPositionVector)
        //     const returnValue = [position.x, position.y, position.z] as const

        //     //If this cube is already in the chain, then we don't look it's parent
        //     const processed = chainData.flatMap(chain => chain.bones.map(bone => ({ chain, bone }))).find(data => data.bone.cube === cube)
        //     if (processed) {
        //         chain.alreadyAdd = {
        //             chain: processed.chain.chainIndex,
        //             bone: processed.bone.boneIndex
        //         }
        //         return returnValue
        //     }
        //     if (cube.parent instanceof DCMCube) {
        //         let end = new V3(returnValue[0], returnValue[1], returnValue[2])

        //         const [x, y, z] = addToChain(cube.parent, chain, reversed)

        //         let start = new V3(x, y, z)

        //         if (reversed) {
        //             let temp = start
        //             start = end
        //             end = temp
        //         }


        //         let bone = new Bone3D(start, end)

        //         const boneData = {
        //             cube: cube.parent,
        //             position: reversed ? [x, y, z] as const : returnValue,
        //             startingWorldRot: cube.parent.cubeGroup.getWorldQuaternion(new Quaternion()),
        //             offset: new Vector3(end.x - start.x, end.y - start.y, end.z - start.z).normalize(),
        //             bone,
        //             boneIndex: chain.bones.length
        //         }

        //         chain.bones.push(boneData)
        //     }
        //     return returnValue
        // // }


        // const [x, y, z] = addToChain(cube, data, reversed)

        // //For if it's a root node
        // if (data.bones.length === 0) {
        //     if (cube.cubeGroup.parent === null) {
        //         return
        //     }
        //     data.bones.push({
        //         cube: cube,
        //         position: [x, y, z],
        //         startingWorldRot: cube.cubeGroup.parent.getWorldQuaternion(new Quaternion()),
        //         bone: new Bone3D(new V3(x, y, z), new V3(x, y, z)),
        //         boneIndex: 0,
        //         offset: new Vector3()
        //     })
        // }

        // if (reversed) {
        //     data.bones.reverse()
        // }

        // console.log(data.bones)

        // const bone = data.bones[data.bones.length - 1]
        // target.fromArray(bone.position)
        // data.bones.forEach(bone => {
        //     bone.boneIndex = chain.bones.length;
        //     chain.addBone(bone.bone)
        // })

        // console.log(cube.name.value, target)

        // if (data.alreadyAdd) {
        //     solver.connectChain(chain, data.alreadyAdd.chain, data.alreadyAdd.bone, 'end', target, true, Math.random() * 0xFFFFFF)
        // } else {
        //     solver.add(chain, target, true)
        // }
        // cubeTargetMap.set(cube, target)
        // chainData.push({
        //     // start: data.bones[data.bones.length - 1].cube,
        //     // end: cube,
        //     ...data
        // })
        // return data


        // const chainData: {
        //     chain: Chain3D
        //     target: Vector3
        //     // start: DCMCube,
        //     // end: DCMCube,
        //     chainIndex: number,
        //     bones: {
        //         from: DCMCube,
        //         to: DCMCube,
        //         position: readonly [number, number, number],
        //         offset: Vector3,
        //         startingWorldRot: Quaternion,
        //         bone: Bone3D,
        //         boneIndex: number
        //     }[]
        // }[] = []



        // let chainIndex = 0
        // //reversed: false = *cube -> root
        // //reversed: true = *root -> cube
        // const createChainFrom = (cube: DCMCube, reversed: boolean) => {
        //     const target = new Vector3()
        //     const chain = new Chain3D(Math.random() * 0xFFFFFF)

        //     const array: {
        //         cube: DCMCube,
        //         position: Vector3
        //     }[] = []

        //     const getIfProcessed = (cube: DCMCube) => {
        //         const mapped = chainData
        //             .flatMap(chain => chain.bones.map(bone => ({ chain, bone })))


        //         if (!processed) {
        //             return null
        //         }
        //         return {
        //             bone: processed.bone.boneIndex,
        //             chain: processed.chain.chainIndex
        //         }
        //     }


        //     let headProcess = getIfProcessed(cube)

        //     for (let c: CubeParent = cube; c instanceof DCMCube; c = c.parent) {
        //         const processed = getIfProcessed(c)
        //         if (processed) {

        //             break
        //         }
        //         array.push({
        //             cube: c,
        //             position: c.cubeGroup.getWorldPosition(new Vector3())
        //         })
        //     }

        //     if (reversed) {
        //         array.reverse()
        //     }

        // }
        //Create chains from the moving cubes to their roots.
        // computeCache.forEach(cache => createChainFrom(cache.cube, false))

        // animation.project.model.identifierCubeMap.forEach(cube => {
        //     //Create a chain from all "leaf" nodes
        //     if (cube.children.value.length === 0) {
        //         // createChainFrom(cube, true)
        //     }
        // })

        // solver.update()



        //Idea 2
        // Essentially, we need to connect the entire thing up, so every cubes bones lead back to 
        // a control point.
        // Go from each selected node to the root like normal.
        //  - the bones should point towards the selected node
        //  - when we meet an already processed node (here the bone will point away from the processed node):
        //     - if to, connect to end
        //     - if from, connect to start
        // Then go from every leaf node, and go towards the roots, in reverse
        //  - the bones should point towards the root
        //  - when we meet an already processed node (here the bone will point towards the processed node)
        //     - if the processed node exists as a `from`, and the bone index is 0, we can just add the processed chain to the end of this.
        //     - otherwise
        //     - store the solver index, bone index (where to = processed node), chain index, position on the bone
        //     - the solver index should be + 1 of the processed nodes solver index
        //     - then when updating, after the solver is done, update the target to be the position of the bone
        //
        const object = new Object3D()
        onTopScene.add(object)

        const cubeTargets: {
            cache: typeof computeCache[number]
            target: Vector3
        }[] = []

        type SolverPass = {
            solverIndex: number,
            solver: Structure3D,
            chains: Chain[]
        }
        type Chain = {
            chainIndex: number,
            target: Vector3,
            chain: Chain3D,
            bones: Bone[],
            connect?: { //The bone to connect to at the start of the chain
                solverIndex: number,
                boneIndex: number,
                chainIndex: number,
                mode: "to" | "from"
            },
            matchTarget?: { //The bone to connect to at the end of the chain
                solverIndex: number,
                boneIndex: number,
                chainIndex: number
            }
        }
        type Bone = {
            from: DCMCube
            to: DCMCube,
            bone: Bone3D
            boneIndex: number,
            startingWorldRot: Quaternion,
            offset: Vector3,
        }

        //Create the solver passes + helper functions
        const solverPasses: SolverPass[] = []
        const newSolverPass = () => {
            const pass = {
                solverIndex: solverPasses.length,
                solver: new Structure3D(object),
                chains: []
            }
            solverPasses.push(pass)
            return pass
        }
        newSolverPass()

        const getIfProcessed = (cube: DCMCube, mode: "to" | "from") => {
            const processed = solverPasses
                .flatMap(pass => pass.chains)
                .flatMap(chain => chain.bones.map(bone => ({ chain, bone })))
                .find(data => data.bone[mode] === cube)

            if (!processed) {
                return null
            }
            return {
                bone: processed.bone.boneIndex,
                chain: processed.chain.chainIndex
            }
        }

        // Go from each selected node to the root like normal.
        //  - the bones should point towards the selected node
        //  - when we meet an already processed node (here the bone will point away from the processed node):
        //     - if to, connect to end
        //     - if from, connect to start

        const vector3 = new Vector3()
        computeCache.forEach(cache => {
            const selectedCube = cache.cube
            //From selected to root will always be in the solver pass of 0
            const newChain: Chain = {
                chainIndex: solverPasses[0].chains.length,
                chain: new Chain3D(Math.random() * 0xFFFFFF),
                bones: [],
                target: new Vector3()
            }

            cubeTargets.push({
                cache,
                target: newChain.target
            })

            //Go from the selected node, to the root, setting the selected node as the to, and the 
            //parent node as the from. We then insert the bone into position 0 of the bone array.
            const position = selectedCube.cubeGroup.getWorldPosition(vector3)
            for (let cube = selectedCube; cube.parent instanceof DCMCube; cube = cube.parent) {
                const to = new V3(position.x, position.y, position.z)
                cube.parent.cubeGroup.getWorldPosition(vector3)
                const from = new V3(position.x, position.y, position.z)
                const bone = new Bone3D(from, to)

                newChain.bones.unshift({
                    boneIndex: newChain.bones.length,
                    from: cube.parent,
                    to: cube,
                    bone,
                    startingWorldRot: cube.cubeGroup.getWorldQuaternion(new Quaternion()),
                    offset: new Vector3(to.x - from.x, to.y - from.y, to.z - from.z).normalize(),
                })

                //Get if the parent cube has already been processed, and therefore should be connected
                let processedData: Chain['connect'];
                const processedTo = getIfProcessed(cube.parent, "to")
                const processedFrom = getIfProcessed(cube.parent, "from")
                if (processedTo) {
                    processedData = {
                        solverIndex: 0,
                        chainIndex: processedTo.chain,
                        boneIndex: processedTo.bone,
                        mode: "to"
                    }
                } else if (processedFrom) {
                    processedData = {
                        solverIndex: 0,
                        chainIndex: processedFrom.chain,
                        boneIndex: processedFrom.bone,
                        mode: "from"
                    }
                }
                if (processedData) {
                    newChain.connect = processedData
                    break
                }
            }

            //If there are no cubes, we should add a "dummy" bone
            if (newChain.bones.length === 0) {
                newChain.bones.push({
                    bone: new Bone3D(
                        new V3(position.x, position.y, position.z),
                        new V3(position.x, position.y, position.z)
                    ),
                    boneIndex: 0,
                    from: selectedCube,
                    to: selectedCube,
                    startingWorldRot: selectedCube.cubeGroup.parent?.getWorldQuaternion(new Quaternion()) ?? new Quaternion(),
                    offset: new Vector3(),
                })
            }

            newChain.bones.forEach(bone => newChain.chain.addBone(bone.bone))

            const end = newChain.bones[newChain.bones.length - 1].bone.end
            newChain.target.set(end.x, end.y, end.z)

            if (newChain.connect) {
                solverPasses[0].solver.connectChain(
                    newChain, newChain.connect.chainIndex, newChain.connect.boneIndex,
                    newChain.connect.mode === "from" ? "start" : "end",
                    newChain.target,
                    true, //Debug to make it render
                )
            } else {
                solverPasses[0].solver.add(newChain.chain, newChain.target, true)
            }
            solverPasses[0].chains.push(newChain)
        })

        //The normal threejs stuff is too big, so just scale it down by 1/16 on the non important axis
        const forEvery = (object: Object3D) => {
            if (object instanceof Mesh) {
                object.scale.y = object.scale.x = 1 / 32
            }
            object.children.forEach(forEvery)
        }
        forEvery(object)

        const update = () => {
            solverPasses.forEach(s => s.solver.update())
        }
        update()


        const totalTime = computeCache.reduce((max, cube) => Math.max(max, cube.time), -Infinity)
        const resolution = 0.2
        let time = 0;
        const keyframes: DcaKeyframe[] = []
        for (; time < totalTime + resolution; time += resolution) {
            animation.project.model.resetVisuals()
            animation.animate(0)
            animation.project.model.updateMatrixWorld(true)

            //Update the targets
            cubeTargets.forEach(({ cache, target }) => {
                const percentage = time / cache.time

                if (percentage > 1) {
                    return
                }
                const [x, y, z] = cache.cube.position.value
                cache.cube.updatePositionVisuals([
                    x + cache.values[0] * percentage,
                    y + cache.values[1] * percentage,
                    z + cache.values[2] * percentage
                ])
                cache.cube.cubeGroup.getWorldPosition(target)
                cache.cube.updatePositionVisuals()
            })

            const kf = animation.createKeyframe()
            kf.startTime.value = animation.time.value + time
            kf.duration.value = resolution

            const resultMap = new Map<DCMCube, readonly [number, number, number]>()

            //Solve the ik chains
            update()

            const bones = solverPasses.flatMap(solver =>
                solver.chains.flatMap(chain =>
                    chain.bones.map(bone => ({ bone, chain, solver }))
                )
            ).sort((a, b) => a.bone.from.hierarchyLevel - b.bone.from.hierarchyLevel)


            bones.forEach(data => {
                const boneData = data.bone
                const solver = solverPasses[data.solver.solverIndex].solver
                const chain = solver.chains[data.chain.chainIndex]
                const bone = chain.bones[data.bone.boneIndex]
                const result = AnimatorGumballIK.applyBoneToCube(bone, {
                    cube: boneData.to,
                    ...boneData
                })
                if (result) {

                    resultMap.set(result.cube, [
                        result.rotations[0],
                        result.rotations[1],
                        result.rotations[2]
                    ])
                }
            })


            kf.wrapToSetValue(() =>
                resultMap.forEach((values, cube) => {
                    // if (cube.name.value === "hips")
                    kf.setRotationAbsoluteAnimated(cube, ...values)
                })
            )


            keyframes.push(kf)

            onTopScene.add(object.clone(true))

        }




    }
    return (
        <CollapsableSidebarPannel title="AUTO GRAVITY" heightClassname="h-96" panelName="animator_ag">
            <div className="flex flex-col h-full p-2">
                <SelectedCubesButton className="bg-blue-400" butonClassName="bg-blue-800" title="Gravity Cubes" ref={gravityRef} />
                <SelectedCubesButton className="bg-green-400" butonClassName="bg-green-800" title="IK Chain End Cubes" ref={forcedLeafRef} />
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