import { Bone3D, Chain3D, Structure3D, V3 } from "@aminere/fullik";
import { Euler, Quaternion, Vector3 } from "three";
import CollapsableSidebarPannel from "../../../components/CollapsableSidebarPannel";
import DcaAnimation, { DcaKeyframe, ProgressionPoint } from "../../../studio/formats/animations/DcaAnimation";
import { DCMCube } from "../../../studio/formats/model/DcmModel";
import { NumArray } from "../../../studio/util/NumArray";
import { AnimatorGumballIK } from "../logic/AnimatorGumballIK";

const computeVec = new Vector3();
const computeQuat = new Quaternion();

const getTimeAndDistanceToGround = (cube: DCMCube) => {
    let minimumY = Infinity;
    for (let x = 0; x <= 1; x++) {
        for (let y = 0; y <= 1; y++) {
            for (let z = 0; z <= 1; z++) {
                minimumY = Math.min(minimumY, cube.getWorldPosition(x, y, z, computeVec).y);
            }
        }
    }

    computeVec.set(0, -minimumY * 16, 0);

    cube.cubeGroup.parent?.getWorldQuaternion(computeQuat);
    computeQuat.invert();
    computeVec.applyQuaternion(computeQuat);

    //Cube is at y=y
    //-9.81t^2 + y = 0
    //-9.81t^2 = -y
    //t^2 = y / 9.81
    //t = sqrt(y / 9.81)
    const time = Math.sqrt(minimumY / 9.81);
    return {
        time,
        direction: [computeVec.x, computeVec.y, computeVec.z] as const
    };
};
const tempEuler = new Euler();
tempEuler.order = "ZYX";
const AnimatorAutoGravity = ({ animation, selectedCubes }: { animation: DcaAnimation | null; selectedCubes: readonly DCMCube[]; }) => {
    // const { onTopScene, scene } = useStudio()
    //
    // const gravityRef = useRef<SelectedCubesRef>(null)
    // const forcedLeafRef = useRef<SelectedCubesRef>(null)
    const applyAutoGravity = () => {
        if (!animation) {
            return;
        }

        animation.project.model.resetVisuals();
        animation.animate(0);

        const computeCache: { cube: DCMCube; values: NumArray; time: number; }[] = [];
        const rootGroundSpeed = new Map<DCMCube, { distance: number; time: number; }>();

        // const selectedRef = gravityRef.current.getSelectedCubes()
        // const selected = selectedRef.length === 0 ? selectedCubes : selectedRef
        const selected = selectedCubes;

        selected.forEach(cube => {
            const gravData = getTimeAndDistanceToGround(cube);
            computeCache.push({
                cube,
                values: gravData.direction,
                time: gravData.time
            });

            let root = cube;
            while (root.parent instanceof DCMCube) {
                root = root.parent;
            }

            if (!rootGroundSpeed.has(root)) {
                const { time, direction } = getTimeAndDistanceToGround(root);
                rootGroundSpeed.set(root, { time, distance: -direction[1] });
            }
        });

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
        // const object = new Object3D()
        // onTopScene.add(object)
        const cubeTargets: {
            cache: typeof computeCache[number];
            target: Vector3;
        }[] = [];

        type SolverPass = {
            solverIndex: number;
            solver: Structure3D;
            chains: Chain[];
        };
        type Chain = {
            chainIndex: number;
            target: Vector3;
            chain: Chain3D;
            bones: Bone[];
            connect?: {
                solverIndex: number;
                boneIndex: number;
                chainIndex: number;
                mode: "to" | "from";
            };
            matchTarget?: {
                solverIndex: number;
                boneIndex: number;
                chainIndex: number;
            };
        };
        type Bone = {
            from: DCMCube;
            to: DCMCube;
            bone: Bone3D;
            boneIndex: number;
            startingWorldRot: Quaternion;
            offset: Vector3;
        };

        //Create the solver passes + helper functions
        const solverPasses: SolverPass[] = [];
        const newSolverPass = () => {
            const pass = {
                solverIndex: solverPasses.length,
                solver: new Structure3D(),
                chains: []
            };
            solverPasses.push(pass);
            return pass;
        };
        newSolverPass();

        const getIfProcessed = (cube: DCMCube, mode: "to" | "from") => {
            const processed = solverPasses
                .flatMap(pass => pass.chains)
                .flatMap(chain => chain.bones.map(bone => ({ chain, bone })))
                .find(data => data.bone[mode] === cube);

            if (!processed) {
                return null;
            }
            return {
                bone: processed.bone.boneIndex,
                chain: processed.chain.chainIndex
            };
        };

        // Go from each selected node to the root like normal.
        //  - the bones should point towards the selected node
        //  - when we meet an already processed node (here the bone will point away from the processed node):
        //     - if to, connect to end
        //     - if from, connect to start
        const vector3 = new Vector3();
        Array.from(computeCache.values()).sort((a, b) => a.cube.hierarchyLevel - b.cube.hierarchyLevel).forEach(cache => {
            const selectedCube = cache.cube;
            //From selected to root will always be in the solver pass of 0
            const newChain: Chain = {
                chainIndex: solverPasses[0].chains.length,
                chain: new Chain3D(Math.random() * 0xFFFFFF),
                bones: [],
                target: new Vector3()
            };

            cubeTargets.push({
                cache,
                target: newChain.target
            });

            //Go from the selected node, to the root, setting the selected node as the to, and the 
            //parent node as the from. We then insert the bone into position 0 of the bone array.
            const position = selectedCube.cubeGroup.getWorldPosition(vector3);
            for (let cube = selectedCube; cube.parent instanceof DCMCube && cube.parent.hierarchyLevel !== 0; cube = cube.parent) {
                const to = new V3(position.x, position.y, position.z);
                cube.parent.cubeGroup.getWorldPosition(vector3);
                const from = new V3(position.x, position.y, position.z);
                const bone = new Bone3D(from, to);

                newChain.bones.unshift({
                    boneIndex: newChain.bones.length,
                    from: cube.parent,
                    to: cube,
                    bone,
                    startingWorldRot: cube.cubeGroup.getWorldQuaternion(new Quaternion()),
                    offset: new Vector3(to.x - from.x, to.y - from.y, to.z - from.z).normalize(),
                });

                //Get if the parent cube has already been processed, and therefore should be connected
                let processedData: Chain['connect'];
                const processedTo = getIfProcessed(cube.parent, "to");
                const processedFrom = getIfProcessed(cube.parent, "from");
                if (processedTo) {
                    processedData = {
                        solverIndex: 0,
                        chainIndex: processedTo.chain,
                        boneIndex: processedTo.bone,
                        mode: "to"
                    };
                } else if (processedFrom) {
                    processedData = {
                        solverIndex: 0,
                        chainIndex: processedFrom.chain,
                        boneIndex: processedFrom.bone,
                        mode: "from"
                    };
                }
                if (processedData) {
                    newChain.connect = processedData;
                    break;
                }
            }

            newChain.bones.forEach(b => b.boneIndex = newChain.bones.length - b.boneIndex - 1);

            //If there are no cubes, we should add a "dummy" bone
            if (newChain.bones.length === 0) {
                //We've selected a root, which we can basically ignore here
                if (!(selectedCube.parent instanceof DCMCube)) {
                    return;
                }

                const from = new V3(position.x, position.y, position.z);
                selectedCube.getWorldPosition(0.5, 0.5, 0.5, position);
                const to = new V3(position.x, position.y, position.z);
                const bone = new Bone3D(from, to);

                newChain.bones.unshift({
                    boneIndex: newChain.bones.length,
                    from: selectedCube,
                    to: selectedCube,
                    bone,
                    startingWorldRot: selectedCube.cubeGroup.getWorldQuaternion(new Quaternion()),
                    offset: new Vector3(to.x - from.x, to.y - from.y, to.z - from.z).normalize(),
                });

            }

            newChain.bones.forEach(bone => newChain.chain.addBone(bone.bone));

            const end = newChain.bones[newChain.bones.length - 1].bone.end;
            newChain.target.set(end.x, end.y, end.z);


            if (newChain.connect) {
                solverPasses[0].solver.connectChain(
                    newChain.chain, newChain.connect.chainIndex, newChain.connect.boneIndex,
                    newChain.connect.mode === "from" ? "start" : "end",
                    newChain.target
                );
            } else {
                solverPasses[0].solver.add(newChain.chain, newChain.target);
            }
            solverPasses[0].chains.push(newChain);
        });

        //The normal threejs stuff is too big, so just scale it down by 1/16 on the non important axis
        // const forEvery = (object: Object3D) => {
        //     if (object instanceof Mesh) {
        //         object.scale.y = object.scale.x = 1 / 32
        //     }
        //     object.children.forEach(forEvery)
        // }
        // forEvery(object)
        const update = () => {
            solverPasses.forEach(s => s.solver.update());
        };
        update();


        const totalTime = Math.max(
            computeCache.reduce((max, cube) => Math.max(max, cube.time), -Infinity),
            Array.from(rootGroundSpeed.values()).reduce((max, data) => Math.max(max, data.time), -Infinity)
        );
        const resolution = 0.2;
        let linTime = 0;
        const keyframes: DcaKeyframe[] = [];
        for (; linTime < totalTime + resolution; linTime += resolution) {
            const timeDone = (linTime / (totalTime + resolution));
            const time = timeDone * timeDone;
            animation.project.model.resetVisuals();
            animation.animate(0);
            animation.project.model.updateMatrixWorld(true);

            //Update the targets
            cubeTargets.forEach(({ cache, target }) => {
                let percentage = (time + resolution) / cache.time;

                if (percentage > 1) {
                    percentage = 1;
                }
                const [x, y, z] = cache.cube.position.value;
                cache.cube.updatePositionVisuals([
                    x + cache.values[0] * percentage,
                    y + cache.values[1] * percentage,
                    z + cache.values[2] * percentage
                ]);
                cache.cube.cubeGroup.getWorldPosition(target);


                //TODO: get rootCube, and if it's in the set of moved roots, make sure it's been moved
                //Don't clip through the floor :)
                let root = cache.cube;
                while (root.parent instanceof DCMCube) {
                    root = root.parent;
                }

                const rootSpeed = rootGroundSpeed.get(root);
                if (rootSpeed !== undefined) {
                    let rootPercentge = (time + resolution) / rootSpeed.time;
                    if (rootPercentge > 1) {
                        rootPercentge = 1;
                    }
                    const rootDistance = rootPercentge * rootSpeed.distance / 16;
                    target.y += rootDistance;
                }

                if (target.y < 0) {
                    target.y = 0;
                }

                cache.cube.updatePositionVisuals();
            });

            const kf = animation.createKeyframe();
            kf.startTime.value = animation.time.value + linTime;
            kf.duration.value = resolution;

            const progressionPointSplit = 10;
            const progressionPoints: ProgressionPoint[] = [
                { required: true, x: 0.00, y: 1.00 },
                { required: true, x: 1.00, y: 0.00 }
            ];

            for (let i = 1; i < progressionPointSplit; i++) {
                const ppDone = i / progressionPointSplit;
                const pptd = timeDone + ppDone * ppDone * resolution;
                progressionPoints.push({
                    x: ppDone,
                    y: pptd
                });
            }

            const resultMap = new Map<DCMCube, NumArray>();

            //Solve the ik chains
            update();

            const bones = solverPasses.flatMap(solver => solver.chains.flatMap(chain => chain.bones.map(bone => ({ bone, chain, solver }))
            )
            ).sort((a, b) => a.bone.from.hierarchyLevel - b.bone.from.hierarchyLevel);


            bones.forEach(data => {
                const boneData = data.bone;
                const solver = solverPasses[data.solver.solverIndex].solver;
                const chain = solver.chains[data.chain.chainIndex];
                const bone = chain.bones[data.bone.boneIndex];
                const result = AnimatorGumballIK.applyBoneToCube(bone, {
                    cube: boneData.from,
                    ...boneData
                });
                if (result) {
                    resultMap.set(result.cube, [
                        result.rotations[0],
                        result.rotations[1],
                        result.rotations[2]
                    ]);
                }
            });


            kf.wrapToSetValue(() => resultMap.forEach((values, cube) => {
                kf.setRotationAbsoluteAnimated(cube, ...values);
            })
            );

            solverPasses.forEach(pass => pass.chains.forEach(chain => {
                const root = chain.bones[0].from.parent;
                if (root instanceof DCMCube) {
                    const speed = rootGroundSpeed.get(root);
                    if (speed !== undefined) {
                        let percentage = (time + resolution) / speed.time;

                        if (percentage > 1) {
                            percentage = 1;
                        }
                        kf.setPositionAbsolute(root.position.value[0], root.position.value[1] - percentage * speed.distance, root.position.value[2], root);
                    }
                }
            }));


            keyframes.push(kf);

            // onTopScene.add(object.clone(true))
        }




    };
    return (
        <CollapsableSidebarPannel title="AUTO GRAVITY" heightClassname="h-96" panelName="animator_ag">
            <div className="flex flex-col h-full p-2">
                {/* <SelectedCubesButton className="bg-blue-400" butonClassName="bg-blue-800" title="Gravity Cubes" ref={gravityRef} /> */}
                {/* <SelectedCubesButton className="bg-green-400" butonClassName="bg-green-800" title="IK Chain End Cubes" ref={forcedLeafRef} /> */}
                <button onClick={applyAutoGravity} className="bg-blue-500 rounded">Apply to selected</button>
            </div>
        </CollapsableSidebarPannel>
    );
};

export default AnimatorAutoGravity