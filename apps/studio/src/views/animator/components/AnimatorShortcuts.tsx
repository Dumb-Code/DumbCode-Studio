import { SVGCube, SVGGrid, SVGLocked, SvgLoopback } from "@dumbcode/shared/icons";
import { CommandContextProvider, CommandShortcutIcon } from "../../../components/CommandShortcutIcons";
import { useStudio } from "../../../contexts/StudioContext";

const AnimatorShortcuts = () => {
    const { getSelectedProject } = useStudio()
    const commandRoot = getSelectedProject().animatorCommandRoot
    return (
        <CommandContextProvider root={commandRoot}>
            <div className="dark:bg-gray-800 bg-gray-200 h-full overflow-x-visible overflow-y-auto pl-0.5 pt-1">
                <CommandShortcutIcon icon={SvgLoopback} command="loopBack" description="allows you apply transformations needed to the currently selected keyframe to move cubes back to the positions defined by the end of the next selected keyframe" />
                <CommandShortcutIcon icon={SVGLocked} command="lockedcubekf" description="Create keyframes parallel to the selected keyframes, locking the selected cubes in place" />
                <CommandShortcutIcon icon={SVGCube} command="tempparentkf" description="Create keyframes parallel to the selected keyframes, applying the temp parenting" />
                <CommandShortcutIcon icon={SVGGrid} command="floorplane" description="Create keyframes parallel to the selected keyframes, forcing the selected cubes above the floor plane" />
            </div>
        </CommandContextProvider>
    )
}

export default AnimatorShortcuts;