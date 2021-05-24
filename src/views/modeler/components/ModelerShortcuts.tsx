import { CommandShortcutIcon, CommandShortcutIconWithSubCommands } from "../../../components/CommandShortcutIcons";

const ModelerShortcuts = () => {
    return(
        <div className="dark:bg-gray-800 bg-gray-200 h-full overflow-x-visible overflow-y-auto pl-0.5 pt-0.5">
            <CommandShortcutIconWithSubCommands command="snap" description="allows you to snap the selected object from one snap point to another" >
                <CommandShortcutIcon command="snap" description="allows you to snap the selected object from one snap point to another" />
                <CommandShortcutIcon command="snapRp" description="allows you to snap the selected object's rotation point to a snap point" />
            </CommandShortcutIconWithSubCommands>
            <CommandShortcutIcon command="copypaste" description="copies the selected objects and pastes a new one in the same place" />
            <CommandShortcutIcon command="refImages" description="opens up the reference image dialog" />
        </div>
    )
}

export default ModelerShortcuts;