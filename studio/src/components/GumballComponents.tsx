import { Switch } from "@headlessui/react";
import { PropsWithChildren } from "react";
import { LO, useListenableObjectNullable } from "../studio/listenableobject/ListenableObject";

export const GumballToggle = ({ children, toggle }: PropsWithChildren<{ toggle?: LO<boolean> }>) => {
    const [gumballEnabled, enableGumball] = useListenableObjectNullable(toggle)

    return (
        <div className="flex flex-row">
            <p className={(gumballEnabled ? "bg-sky-500" : "dark:bg-gray-700 bg-gray-300") + " m-0.5 rounded pt-1 px-2 dark:text-white text-black text-xs h-6 transition-colors ease-in-out duration-200"}>Enable Gumball</p>
            <Switch checked={gumballEnabled ?? false} onChange={enableGumball}
                className={(gumballEnabled ? "bg-green-500" : "bg-red-900") + " relative inline-flex items-center h-6 mt-0.5 rounded w-11 transition-colors ease-in-out duration-200 mr-2"}>
                <span className="sr-only">Gumball</span>
                <span className={(gumballEnabled ? "translate-x-6 bg-green-400" : "translate-x-1 bg-red-700") + " inline-block w-4 h-4 transform rounded transition ease-in-out duration-200"} />
            </Switch>
            {gumballEnabled && children}
        </div>
    );
}

export const ButtonList = ({ children }: PropsWithChildren<{}>) => {
    return (
        <div className="flex flex-row p-0.5 mr-2">
            {children}
        </div>
    )
}

export const GumballButton = ({ title, selected, selectedClassName = "bg-sky-500", onClick }: { title: string, selected: boolean, selectedClassName?: string, onClick: () => void }) => {
    return (
        <button className={(selected ? `${selectedClassName} text-white` : "dark:bg-gray-700 bg-gray-400 text-black") + " rounded-none first:rounded-l last:rounded-r py-1 px-2 border-r dark:border-black border-white last:border-0 text-xs"} onClick={onClick}>
            {title}
        </button>
    )

}