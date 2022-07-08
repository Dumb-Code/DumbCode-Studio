import { useEffect, useMemo } from "react"
import InfoBar from "../../components/InfoBar"
import StudioCanvas from "../../components/StudioCanvas"
import { useKeyComboPressed } from "../../contexts/OptionsContext"
import { useStudio } from "../../contexts/StudioContext"
import { useListenableObject, useListenableObjectNullable } from "../../studio/util/ListenableObject"
import { useObjectUnderMouse } from "../../studio/util/ObjectClickedHook"
import AnimatorGumballPropertiesBar from "./components/AnimatorGumballPropertiesBar"
import AnimatorProperties from "./components/AnimatorProperties"
import AnimatorScrubBar from "./components/AnimatorScrubBar"
import AnimatorShortcuts from "./components/AnimatorShortcuts"
import AnimatorSkeletonProperties from "./components/AnimatorSkeletonProperties"
import AnimatorTabBar from "./components/AnimatorTabBar"
import AnimatorTimeline from "./components/AnimatorTimeline"

const Animator = () => {

    const { getSelectedProject, onFrameListeners } = useStudio()
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
    }), [animation]))

    useObjectUnderMouse()

    useEffect(() => {
        const onFrame = (deltaTime: number) => {
            project.model.resetVisuals()
            const selected = project.animationTabs.selectedAnimation.value
            if (selected !== null) {
                selected.animate(deltaTime)
            }
        }
        onFrameListeners.add(onFrame)
        return () => {
            onFrameListeners.delete(onFrame)
        }
    }, [project, onFrameListeners])

    if (skeletonMode) {
        return (
            <div
                key={project.identifier}
                className="grid grid-areas-animator-skeleton h-full overflow-hidden"
                style={{
                    gridTemplateColumns: "auto 300px",
                    gridTemplateRows: "32px auto 32px"
                }}
            >
                <div className="grid-in-tabs border dark:border-black border-white overflow-hidden"><AnimatorTabBar /></div>
                <div className="grid-in-properties border dark:border-black h-full border-white"><AnimatorSkeletonProperties /></div>
                <div className="grid-in-canvas border dark:border-black border-white"><StudioCanvas /></div>
                <div className="grid-in-scrub border dark:border-black border-white"><AnimatorScrubBar animation={animation} /></div>
            </div>
        )
    }

    return (
        <div className="grid grid-areas-animator h-full"
            key={project.identifier}
            style={{
                //These would be generated by moving the panels around.
                //For now, we just hardcode them
                gridTemplateColumns: '32px auto 300px',
                gridTemplateRows: '32px minmax(0px, 1fr) 32px 150px 30px 28px'
            }}
        >
            <div className="grid-in-tabs border dark:border-black border-white overflow-hidden"><AnimatorTabBar /></div>
            <div className="grid-in-properties border dark:border-black h-full border-white"><AnimatorProperties /></div>
            <div className="grid-in-tools border dark:border-black border-white"><AnimatorShortcuts /></div>
            <div className="grid-in-canvas border dark:border-black border-white"><StudioCanvas /></div>
            <div className="grid-in-scrub border dark:border-black border-white"><AnimatorScrubBar animation={animation} /></div>
            <div className="grid-in-timeline border dark:border-black border-white"><AnimatorTimeline /></div>
            <div className="grid-in-gumball border dark:border-black border-white"><AnimatorGumballPropertiesBar /></div>
            <div className="grid-in-info border dark:border-black border-white"><InfoBar undoRedo={animation?.undoRedoHandler} /></div>
        </div>
    )
}

export default Animator;