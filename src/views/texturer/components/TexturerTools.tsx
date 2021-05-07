import { CommandShortcutIcon, CommandShortcutIconWithSubCommands } from "../../../components/CommandShortcutIcons";

const TexturerTools = () => {
    return(
        <div className="bg-gray-800 h-full overflow-x-visible overflow-y-auto pl-0.5 pt-0.5">
            <CommandShortcutIcon command="paintBrush" description="Activates the paintbrush tool" />
            <CommandShortcutIcon command="pencil" description="Activates the pencil tool" />
            <CommandShortcutIconWithSubCommands command="fillFace" description="Activates the fill face tool" >
                <CommandShortcutIcon command="fillFace" description="Activates the fill face tool" />
                <CommandShortcutIcon command="fillCube" description="Activates the fill cube tool" />
            </CommandShortcutIconWithSubCommands>
        </div>
    )
}

export default TexturerTools;