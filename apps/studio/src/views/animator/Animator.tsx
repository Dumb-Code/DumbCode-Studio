import { useEffect, useMemo } from "react"
import InfoBar from "../../components/InfoBar"
import StudioCanvas from "../../components/StudioCanvas"
import { useKeyComboPressed } from "../../contexts/OptionsContext"
import { useStudio } from "../../contexts/StudioContext"
import DcaAnimation from "../../studio/formats/animations/DcaAnimation"
import StudioGridRaw from "../../studio/griddividers/components/StudioGrid"
import StudioGridArea from "../../studio/griddividers/components/StudioGridArea"
import DividerArea from "../../studio/griddividers/DividerArea"
import GridArea from "../../studio/griddividers/GridArea"
import GridSchema from "../../studio/griddividers/GridSchema"
import { useListenableObject, useListenableObjectNullable } from "../../studio/listenableobject/ListenableObject"
import { useObjectUnderMouse } from "../../studio/selections/ObjectClickedHook"
import AnimatorGumballPropertiesBar from "./components/AnimatorGumballPropertiesBar"
import AnimatorProperties from "./components/AnimatorProperties"
import AnimatorScrubBar from "./components/AnimatorScrubBar"
import AnimatorShortcuts from "./components/AnimatorShortcuts"
import AnimatorSkeletonProperties from "./components/AnimatorSkeletonProperties"
import AnimatorTabBar from "./components/AnimatorTabBar"
import AnimatorTimeline from "./components/AnimatorTimeline"


const tabs = GridArea.area("tabs")
const properties = GridArea.area("properties")
const tools = GridArea.area("tools")
const canvas = GridArea.area("canvas")
const scrub = GridArea.area("scrub")
const timeline = GridArea.area("timeline")
const gumball = GridArea.area("gumball")
const info = GridArea.area("info")

const skeletonSchema = GridSchema.createSchema(
    GridArea.join(
        [tabs, properties],
        [canvas, properties],
        [scrub, properties],
    ),
    DividerArea.from(
        ['auto', DividerArea.moveable(200, 600, properties, "left", 300)],
        [32, 'auto', 32]
    )
)

const normalSchema = GridSchema.createSchema(
    GridArea.join(
        [tabs, tabs, properties],
        [tools, canvas, properties],
        [scrub, scrub, properties],
        [timeline, timeline, properties],
        [gumball, gumball, properties],
        [info, info, properties],
    ),
    DividerArea.from(
        [32, 'auto', DividerArea.moveable(200, 600, properties, "left", 300)],
        [32, 'auto', 32, DividerArea.moveable(50, 500, scrub, "top", 150), 30, 28]
    )
)



const Animator = () => {

    const { getSelectedProject, onPostFrameListeners } = useStudio()
    const project = getSelectedProject()

    const [animation] = useListenableObject(project.animationTabs.selectedAnimation)
    const [skeletonMode] = useListenableObjectNullable(animation?.isSkeleton)

    useKeyComboPressed(useMemo(() => ({
        common: {
            copy: () => animation !== null && animation.copyKeyframes(),
            paste: () => animation !== null && animation.pasteKeyframes(false),
        },

        animator: {
            delete: () => animation !== null && animation.deleteSelectedKeyframes(),
            delete_layer: () => animation !== null && animation.deleteKeyframesLayers(),
            paste_keyframes_defined: () => animation !== null && animation.pasteKeyframes(true),
        }
    }), [animation]), { blurActiveElement: false })

    useObjectUnderMouse()

    useEffect(() => {
        const onFrame = (deltaTime: number) => {
            project.model.resetVisuals()
            const selected = project.animationTabs.selectedAnimation.value
            if (selected !== null) {
                selected.animate(deltaTime)
            }
        }
        onPostFrameListeners.add(onFrame)
        return () => {
            onPostFrameListeners.delete(onFrame)
        }
    }, [project, onPostFrameListeners])

    useAffectedKeyframeHighlight(animation);

    const selectedCubeHandlerUndoRedo = animation?.undoRedoHandler

    if (skeletonMode) {
        return (
            <StudioGridRaw
                key={project.identifier}
                schema={skeletonSchema}
            >

                <StudioGridArea area={tabs}>
                    <WrappedAnimatorTabBar />
                </StudioGridArea>

                <StudioGridArea area={properties}>
                    <AnimatorSkeletonProperties />
                </StudioGridArea>

                <StudioGridArea area={canvas}>
                    <StudioCanvas selectedCubeHandlerUndoRedo={selectedCubeHandlerUndoRedo} />
                </StudioGridArea>

                <StudioGridArea area={scrub}>
                    <AnimatorScrubBar animation={animation} />
                </StudioGridArea>

            </StudioGridRaw>
        )
    }

    return (
        <StudioGridRaw
            key={project.identifier}
            schema={normalSchema}
        >
            <StudioGridArea area={tabs}>
                <WrappedAnimatorTabBar />
            </StudioGridArea>

            <StudioGridArea area={properties}>
                <AnimatorProperties />
            </StudioGridArea>

            <StudioGridArea area={tools}>
                <AnimatorShortcuts />
            </StudioGridArea>

            <StudioGridArea area={canvas}>
                <StudioCanvas selectedCubeHandlerUndoRedo={selectedCubeHandlerUndoRedo} />
            </StudioGridArea>

            <StudioGridArea area={scrub}>
                <AnimatorScrubBar animation={animation} />
            </StudioGridArea>

            <StudioGridArea area={timeline}>
                <AnimatorTimeline />
            </StudioGridArea>

            <StudioGridArea area={gumball}>
                <AnimatorGumballPropertiesBar consumer={animation} />
            </StudioGridArea>

            <StudioGridArea area={info}>
                <InfoBar undoRedo={animation?.undoRedoHandler} />
            </StudioGridArea>

        </StudioGridRaw>
    )
}

const WrappedAnimatorTabBar = () => {
    const { getSelectedProject } = useStudio()
    const selectedProject = getSelectedProject()

    const [animations] = useListenableObject(selectedProject.animationTabs.animations)
    const [tabs] = useListenableObject(selectedProject.animationTabs.tabs)


    const createNewAnimation = () => {
        selectedProject.animationTabs.addAnimation(DcaAnimation.createNew(selectedProject))
    }

    return <AnimatorTabBar
        all={animations.filter(t => tabs.includes(t.identifier))}
        selected={selectedProject.animationTabs.selectedAnimation}
        createNew={createNewAnimation}
    />
}

const useAffectedKeyframeHighlight = (animation: DcaAnimation | null) => {
    const [selectedKeyframes] = useListenableObjectNullable(animation?.selectedKeyframes)

    useEffect(() => {
        if (selectedKeyframes === undefined || animation === null) {
            return
        }
        const listener = (entries: { key: string }[]) => {
            entries.forEach(name => {
                const cubes = animation.project.model.cubeMap.get(name.key)
                if (cubes !== undefined) {
                    cubes.forEach(c => c.affected.value = true)
                }
            })
        };

        selectedKeyframes.forEach(keyframe => {
            keyframe.position.addAndRunGlobalListener(listener)
            keyframe.rotation.addAndRunGlobalListener(listener)
            keyframe.cubeGrow.addAndRunGlobalListener(listener)
        })

        return () => {
            selectedKeyframes.forEach(keyframe => {
                keyframe.position.removeGlobalListener(listener)
                keyframe.rotation.removeGlobalListener(listener)
                keyframe.cubeGrow.removeGlobalListener(listener)
            });
            animation.project.model.gatherAllCubes().forEach(cube => cube.affected.value = false)
        }

    }, [selectedKeyframes, animation])
}

export default Animator;