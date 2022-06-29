import { createContext, PropsWithChildren, SVGProps, useCallback, useContext, useState } from "react";
import { CommandRoot } from "../studio/command/CommandRoot";

const CommandContext = createContext<CommandRoot | null>(null)

const useCommandRoot = () => {
    const context = useContext(CommandContext)
    if (context === null) {
        // throw new Error(`useCommandRoot must be used within a CommandContextProvider`)
    }
    return context
}

export const CommandContextProvider = ({ root, children }: PropsWithChildren<{
    root: CommandRoot
}>) => {
    return (
        <CommandContext.Provider value={root}>
            {children}
        </CommandContext.Provider>
    )
}

export const CommandShortcutIcon = ({ command, description, icon: Icon }: { command: string, description: string, icon: (props: SVGProps<SVGSVGElement>) => JSX.Element }) => {
    const root = useCommandRoot()
    const onClick = useCallback(() => {
        if (root !== null) {
            root.runCommand(command)
        }
    }, [root, command])
    return (
        <div className="has-tooltip">
            <button className="dark:bg-gray-700 dark:hover:bg-gray-600 bg-gray-300 hover:bg-gray-400 rounded p-1.5 mb-0.5 dark:text-gray-300 text-black" onClick={onClick}>
                <Icon className="w-3 h-3" />
            </button>
            <div className="tooltip ml-9 dark:bg-gray-700 bg-gray-200 -mt-6 rounded p-1 dark:text-gray-300 text-black w-48 border border-black">
                <p className="mb-1">{command}</p>
                <p className="text-xs">{description}</p>
            </div>
        </div>
    )
}

export const CommandShortcutIconWithSubCommands = ({ command, description, icon: Icon, children }: PropsWithChildren<{ command: string, description: string, icon: (props: SVGProps<SVGSVGElement>) => JSX.Element }>) => {
    const root = useCommandRoot()
    const onClick = useCallback(() => {
        if (root !== null) {
            root.runCommand(command)
        }
    }, [root, command])

    const [subCommandsVisible, setSubVisible] = useState(false);

    return (
        <div className={(subCommandsVisible || "has-tooltip") + " -mb-0.5"} onContextMenu={e => {
            setSubVisible(!subCommandsVisible)
            e.preventDefault()
        }} onClick={() => setSubVisible(false)} style={{ marginBottom: '0.5px' }}>
            <button className="dark:bg-gray-700 dark:hover:bg-gray-600 bg-gray-300 hover:bg-gray-400 rounded p-1.5 dark:text-gray-300 text-black mb-0.5" onClick={onClick}>
                <Icon className="w-3 h-3" />
                <div className="absolute transform translate-x-3.5 translate-y-0.5 dark:bg-gray-300 bg-black rounded-br h-1 w-1"></div>
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
