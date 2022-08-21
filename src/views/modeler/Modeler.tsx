import { useEffect, useMemo } from "react"
import CommandInputBar from "../../components/CommandInputBar"
import InfoBar from "../../components/InfoBar"
import StudioCanvas from "../../components/StudioCanvas"
import { useKeyComboPressed } from "../../contexts/OptionsContext"
import { useStudio } from "../../contexts/StudioContext"
import { useObjectUnderMouse } from "../../studio/selections/ObjectClickedHook"
import ModelerGumballPropertiesBar from "./components/ModelerGumballPropertiesBar"
import ModelerShortcuts from "./components/ModelerShortcuts"
import ModelerSidebar from "./components/ModelerSidebar"
import { usePointTracking } from "./logic/CubePointTrackerHook"
import { useModelerGumball } from "./logic/ModelerGumballHook"

const Modeler = () => {
    const { getSelectedProject, onPostFrameListeners } = useStudio()
    const project = getSelectedProject()

    useKeyComboPressed(useMemo(() => ({
        common: {
            copy: () => project.model.copyCubes(true),
            paste: () => project.model.pasteCubes(false),
        },

        modeler: {
            copy_only_selected: () => project.model.copyCubes(false),
            paste_world_position: () => project.model.pasteCubes(true),
        }
    }), [project]))

    useObjectUnderMouse()
    useModelerGumball()
    usePointTracking()

    useEffect(() => {
        const onFrame = () => {
            project.model.resetVisuals()
        }
        onPostFrameListeners.add(onFrame)
        return () => {
            onPostFrameListeners.delete(onFrame)
        }
    }, [project, onPostFrameListeners])

    return (
        <div className="h-full grid grid-areas-modeling"
            key={project.identifier}
            style={{
                //These would be generated by moving the panels around.
                //For now, we just hardcode them
                gridTemplateColumns: '32px auto 320px',
                gridTemplateRows: '32px auto 30px 28px'
            }}
        >
            {/* The boreders are to visulize where everything is. */}
            <div className="grid-in-command border dark:border-black border-white"><CommandInputBar command={project.commandRoot} /></div>
            <div className="grid-in-sidebar min-h-0 border dark:border-black border-white"><ModelerSidebar /></div>
            <div className="grid-in-shortcuts border dark:border-black border-white"><ModelerShortcuts /></div>
            <div className="grid-in-canvas border dark:border-black border-white"><StudioCanvas selectedCubeHandlerUndoRedo={project.model.undoRedoHandler} /></div>
            <div className="grid-in-gumball border dark:border-black border-white"><ModelerGumballPropertiesBar /></div>
            <div className="grid-in-info border dark:border-black border-white"><InfoBar undoRedo={project.model.undoRedoHandler} /></div>
        </div>
    )
}

export default Modeler;
