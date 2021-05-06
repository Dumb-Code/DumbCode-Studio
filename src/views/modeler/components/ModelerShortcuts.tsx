import { SVGCube } from "../../../components/Icons"
import PropTypes from 'prop-types';
import { useState } from "react";

const ModelerShortcuts = () => {
    return(
        <div className="rounded-sm bg-gray-800 h-full overflow-x-visible overflow-y-auto pl-0.5 pt-0.5">
            <CommandShortcutIconWithSubCommands command="snap" description="allows you to snap the selected object from one snap point to another" >
                <CommandShortcutIcon command="snap" description="allows you to snap the selected object from one snap point to another" />
                <CommandShortcutIcon command="snapRp" description="allows you to snap the selected object's rotation point to a snap point" />
            </CommandShortcutIconWithSubCommands>
            <CommandShortcutIcon command="copypaste" description="copies the selected objects and pastes a new one in the same place" />
            <CommandShortcutIcon command="refImages" description="opens up the reference image dialog" />
        </div>
    )
}

const CommandShortcutIcon = ({command, description}: {command: string, description: string}) => {
    
    return(
        <div className="has-tooltip">
            <button className="bg-gray-700 rounded p-0.5 text-gray-300" onClick={() => console.log("run command " + command)}>
                <SVGCube className="h-5 w-5" />
            </button>
            <div className="tooltip ml-9 bg-gray-700 -mt-6 rounded p-1 text-gray-300 w-48 border border-black">
                <p className="mb-1">{command}</p>
                <p className="text-xs">{description}</p>
            </div>
        </div>
    )
}

const CommandShortcutIconWithSubCommands = ({command, description, children}) => {

    const[subCommandsVisible, setSubVisible] = useState(false);
    
    return(
        <div className={(subCommandsVisible || "has-tooltip") + " -mb-0.5"} onContextMenu={() => setSubVisible(!subCommandsVisible)} onClick={() => setSubVisible(false)} style={{marginBottom: '0.5px'}}>
            <button className="bg-gray-700 rounded p-0.5 text-gray-300" onClick={() => console.log("run command " + command)}>
                <SVGCube className="h-5 w-5" />
                <div className="absolute ml-5 -mt-0.5 bg-white rounded-br h-1 w-1"></div>
            </button>
            <div className={subCommandsVisible ? "invisible h-0 " : "tooltip ml-9 bg-gray-700 -mt-8 rounded p-1 text-gray-300 w-48 border border-black"}>
                <p className="mb-1">{command}</p>
                <p className="text-xs">{description}</p>
            </div>
            <div onMouseLeave={() => setSubVisible(false)}>
                {!subCommandsVisible || 
                <div className="absolute left-8 ml-0.5 -mt-8 pt-1 px-0.5 rounded bg-gray-800 z-50" onClick={() => setSubVisible(false)}>
                    {children}
                </div>}
            </div>
        </div>
    )
}

CommandShortcutIconWithSubCommands.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.element),
        PropTypes.element.isRequired
    ]),
    command: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired
}

export default ModelerShortcuts;