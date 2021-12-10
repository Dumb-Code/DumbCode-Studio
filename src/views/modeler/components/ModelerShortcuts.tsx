import { CommandShortcutIcon, CommandShortcutIconWithSubCommands } from "../../../components/CommandShortcutIcons";
import { SvgCopypaste, SvgImage, SvgSnap } from "../../../components/Icons";

const ModelerShortcuts = () => {
    return (
        <div className="dark:bg-gray-800 bg-gray-200 h-full overflow-x-visible overflow-y-auto pl-0.5 pt-1.5">
            <CommandShortcutIconWithSubCommands icon={<SvgSnap className="h-3 w-3" />} command="snap" description="allows you to snap the selected object from one snap point to another" >
                <CommandShortcutIcon icon={<SvgSnap className="h-3 w-3" />} command="snap" description="allows you to snap the selected object from one snap point to another" />
                <CommandShortcutIcon icon={<SvgSnap className="h-3 w-3" />} command="snapRp" description="allows you to snap the selected object's rotation point to a snap point" />
            </CommandShortcutIconWithSubCommands>
            <CommandShortcutIcon icon={<SvgCopypaste className="h-3 w-3" />} command="copypaste" description="copies the selected objects and pastes a new one in the same place" />
            <CommandShortcutIcon icon={<SvgImage className="h-3 w-3" />} command="refImages" description="opens up the reference image dialog" />
        </div>
    )
}

export default ModelerShortcuts;