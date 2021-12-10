import { CommandShortcutIcon } from "../../../components/CommandShortcutIcons";
import { SvgLoopback } from "../../../components/Icons";

const AnimatorShortcuts = () => {
    return (
        <div className="dark:bg-gray-800 bg-gray-200 h-full overflow-x-visible overflow-y-auto pl-0.5 pt-1">
            <CommandShortcutIcon icon={ <SvgLoopback className="h-3 w-3" /> } command="loopBack" description="allows you apply transformations needed to the currently selected keyframe to move cubes back to the positions defined by the end of the next selected keyframe" />
        </div>
    )
}

export default AnimatorShortcuts;