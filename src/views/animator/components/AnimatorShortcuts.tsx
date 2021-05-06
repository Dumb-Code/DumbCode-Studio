import { CommandShortcutIcon } from "../../../components/CommandShortcutIcons";

const AnimatorShortcuts = () => {
    return(
        <div className="rounded-sm bg-gray-800 h-full overflow-x-visible overflow-y-auto pl-0.5 pt-0.5">
            <CommandShortcutIcon command="loopBack" description="allows you apply transformations needed to the currently selected keyframe to move cubes back to the positions defined by the end of the next selected keyframe" />
        </div>
    )
}

export default AnimatorShortcuts;