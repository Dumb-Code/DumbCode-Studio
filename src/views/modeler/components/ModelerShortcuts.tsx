import { SVGCube } from "../../../components/Icons"

const ModelerShortcuts = () => {
    return(
        <div className="rounded-sm bg-gray-800 h-full overflow-x-visible overflow-y-auto">
            <CommandShortcutIcon command="snap" description="allows you to snap the selected object from one snap point to another" />
            <CommandShortcutIcon command="copypaste" description="copies the selected objects and pastes a new one in the same place" />
            <CommandShortcutIcon command="refImages" description="opens up the reference image dialog" />
        </div>
    )
}

const CommandShortcutIcon = ({command, description}: {command: string, description: string}) => {
    
    return(
        <div className="has-tooltip">
            <div className="bg-gray-700 m-0.5 rounded p-0.5 text-gray-300">
                <SVGCube className="h-5 w-5" />
            </div>
            <div className="tooltip ml-9 bg-gray-700 -mt-6 rounded p-1 text-gray-300 w-48">
                <p className="mb-1">{command}</p>
                <p className="text-xs">{description}</p>
            </div>
        </div>
    )
}

export default ModelerShortcuts;