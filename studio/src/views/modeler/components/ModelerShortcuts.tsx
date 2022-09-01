import { CommandContextProvider, CommandShortcutIcon, CommandShortcutIconWithSubCommands } from "../../../components/CommandShortcutIcons";
import { SvgCopypaste, SvgImage, SvgSnap } from "../../../components/Icons";
import { useStudio } from "../../../contexts/StudioContext";

const ModelerShortcuts = () => {
    const { getSelectedProject } = useStudio()
    const commandRoot = getSelectedProject().commandRoot
    return (
        <CommandContextProvider root={commandRoot}>
            <div className="dark:bg-gray-800 bg-gray-200 h-full overflow-x-visible overflow-y-auto pl-0.5 pt-1.5">
                <CommandShortcutIconWithSubCommands icon={SvgSnap} command="snap" description="allows you to snap the selected object from one snap point to another" >
                    <CommandShortcutIcon icon={SvgSnap} command="snap" description="allows you to snap the selected object from one snap point to another" />
                    <CommandShortcutIcon icon={SvgSnap} command="snap -rp" description="allows you to snap the selected object's rotation point to a snap point" />
                </CommandShortcutIconWithSubCommands>
                <CommandShortcutIcon icon={SvgCopypaste} command="copypaste" description="copies the selected objects and pastes a new one in the same place" />
                <CommandShortcutIcon icon={SvgImage} command="refimg" description="opens up the reference image dialog" />
            </div>
        </CommandContextProvider>
    )
}

export default ModelerShortcuts;