import { CommandShortcutIcon } from "../../../components/CommandShortcutIcons";
import { SvgArrange } from "../../../components/Icons";

const TexturerTools = () => {
    return (
        <div className="dark:bg-gray-800 bg-gray-200 h-full overflow-x-visible overflow-y-auto pl-0.5 pt-1">
            <CommandShortcutIcon icon={SvgArrange} command="optimizeMap" description="Finds an optimal way to organize a texturemap." />
        </div>
    )
}

export default TexturerTools;