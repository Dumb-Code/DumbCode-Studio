import { CommandShortcutIcon } from "../../../components/CommandShortcutIcons";
import { SvgBrush, SvgFillcube, SvgFillface, SvgPencil } from "../../../components/Icons";

const TexturerTools = () => {
    return (
        <div className="dark:bg-gray-800 bg-gray-200 h-full overflow-x-visible overflow-y-auto pl-0.5 pt-1">
            <CommandShortcutIcon icon={SvgBrush} command="paintBrush" description="Activates the paintbrush tool" />
            <CommandShortcutIcon icon={SvgPencil} command="pencil" description="Activates the pencil tool" />
            <CommandShortcutIcon icon={SvgFillface} command="fillFace" description="Activates the fill face tool" />
            <CommandShortcutIcon icon={SvgFillcube} command="fillCube" description="Activates the fill cube tool" />
        </div>
    )
}

export default TexturerTools;