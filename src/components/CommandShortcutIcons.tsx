import { SVGCube } from "./Icons"
import PropTypes from 'prop-types';
import { useState } from "react";

export const CommandShortcutIcon = ({ command, description }: { command: string, description: string }) => {

    return (
        <div className="has-tooltip">
            <button className="dark:bg-gray-700 bg-gray-300 rounded p-0.5 dark:text-gray-300 text-black" onClick={() => console.log("run command " + command)}>
                <SVGCube className="h-5 w-5" />
            </button>
            <div className="tooltip ml-9 dark:bg-gray-700 bg-gray-200 -mt-6 rounded p-1 dark:text-gray-300 text-black w-48 border border-black">
                <p className="mb-1">{command}</p>
                <p className="text-xs">{description}</p>
            </div>
        </div>
    )
}

export const CommandShortcutIconWithSubCommands = ({ command, description, children }) => {

    const [subCommandsVisible, setSubVisible] = useState(false);

    return (
        <div className={(subCommandsVisible || "has-tooltip") + " -mb-0.5"} onContextMenu={() => setSubVisible(!subCommandsVisible)} onClick={() => setSubVisible(false)} style={{ marginBottom: '0.5px' }}>
            <button className="dark:bg-gray-700 bg-gray-300 rounded p-0.5 dark:text-gray-300 text-black" onClick={() => console.log("run command " + command)}>
                <SVGCube className="h-5 w-5" />
                <div className="absolute ml-5 -mt-0.5 dark:bg-gray-300 bg-black rounded-br h-1 w-1"></div>
            </button>
            <div className={subCommandsVisible ? "invisible h-0 " : "tooltip ml-9 dark:bg-gray-700 bg-gray-200 -mt-8 rounded p-1 dark:text-gray-300 text-black w-48 border border-black"}>
                <p className="mb-1">{command}</p>
                <p className="text-xs">{description}</p>
            </div>
            <div onPointerLeave={() => setSubVisible(false)}>
                {!subCommandsVisible ||
                    <div className="absolute left-8 ml-0.5 -mt-8 pt-1 px-0.5 rounded dark:bg-gray-800 bg-gray-300 z-50" onClick={() => setSubVisible(false)}>
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