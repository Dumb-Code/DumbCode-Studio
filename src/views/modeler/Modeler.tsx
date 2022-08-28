import { useEffect, useMemo } from "react"
import CommandInputBar from "../../components/CommandInputBar"
import InfoBar from "../../components/InfoBar"
import StudioCanvas from "../../components/StudioCanvas"
import { useKeyComboPressed } from "../../contexts/OptionsContext"
import { useStudio } from "../../contexts/StudioContext"
import StudioGrid from "../../studio/griddividers/components/StudioGrid"
import StudioGridArea from "../../studio/griddividers/components/StudioGridArea"
import DividerArea from "../../studio/griddividers/DividerArea"
import GridArea from "../../studio/griddividers/GridArea"
import GridSchema from "../../studio/griddividers/GridSchema"
import { useObjectUnderMouse } from "../../studio/selections/ObjectClickedHook"
import ModelerGumballPropertiesBar from "./components/ModelerGumballPropertiesBar"
import ModelerShortcuts from "./components/ModelerShortcuts"
import ModelerSidebar from "./components/ModelerSidebar"
import { usePointTracking } from "./logic/CubePointTrackerHook"
import { useModelerGumball } from "./logic/ModelerGumballHook"

const command = GridArea.area("command")
const sidebar = GridArea.area("sidebar")
const shortcuts = GridArea.area("shortcuts")
const canvas = GridArea.area("canvas")
const gumball = GridArea.area("gumball")
const info = GridArea.area("info")


const schema = GridSchema.createSchema(
    GridArea.join(
        [command, command, sidebar],
        [shortcuts, canvas, sidebar],
        [gumball, gumball, sidebar],
        [info, info, sidebar],
    ),
    DividerArea.from(
        [32, 'auto', DividerArea.moveable(200, 500, sidebar, "left")],
        [32, 'auto', 30, 28],
    )
)


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
        <StudioGrid schema={schema} key={project.identifier}>

            <StudioGridArea area={command}>
                <CommandInputBar command={project.commandRoot} />
            </StudioGridArea>

            <StudioGridArea area={sidebar}>
                <ModelerSidebar />
            </StudioGridArea>

            <StudioGridArea area={shortcuts}>
                <ModelerShortcuts />
            </StudioGridArea>

            <StudioGridArea area={canvas}>
                <StudioCanvas selectedCubeHandlerUndoRedo={project.model.undoRedoHandler} />
            </StudioGridArea>

            <StudioGridArea area={gumball}>
                <ModelerGumballPropertiesBar />
            </StudioGridArea>

            <StudioGridArea area={info}>
                <InfoBar undoRedo={project.model.undoRedoHandler} />
            </StudioGridArea>

        </StudioGrid>
    )
}

export default Modeler;
