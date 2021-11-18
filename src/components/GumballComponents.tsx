import { Switch } from "@headlessui/react";
import { FC } from "react";
import { useStudio } from "../contexts/StudioContext";
import { useListenableObject } from "../studio/util/ListenableObject";
import { ModelerGumball } from "../views/modeler/logic/ModelerGumball";
import Dropup, { DropupItem } from "./Dropup";

//TODO make this not use a modeler type and instead use a generic type and accept either modeler or animator gumball
export const GumballToggle: FC = ({children}) => {

    const { getSelectedProject } = useStudio()
    const gumball = getSelectedProject().modelerGumball
    const [gumballEnabled, enableGumball] = useListenableObject(gumball.enabled)

    return (
        <div className="flex flex-row">
            <p className={(gumballEnabled ? "bg-sky-500" : "dark:bg-gray-700 bg-gray-300") + " m-0.5 rounded pt-1 px-2 dark:text-white text-black text-xs h-6 transition-colors ease-in-out duration-200"}>Enable Gumball</p>
            <Switch checked={gumballEnabled} onChange={enableGumball}
                className={(gumballEnabled ? "bg-green-500" : "bg-red-900") + " relative inline-flex items-center h-6 mt-0.5 rounded w-11 transition-colors ease-in-out duration-200 mr-2"}>
                <span className="sr-only">Gumball</span>
                <span className={(gumballEnabled ? "translate-x-6 bg-green-400" : "translate-x-1 bg-red-700") + " inline-block w-4 h-4 transform rounded transition ease-in-out duration-200"} />
            </Switch>
            {!gumballEnabled || children}
        </div>
    );
}

//TODO make this not use a modeler type and instead use a generic type and accept either modeler or animator gumball
export const RelocateGumballDropup = ({ gumball }: { gumball: ModelerGumball }) => {
    return (
        <Dropup title="Relocate Gumball" header="RELOCATE MODE">
            <div className="p-0.5">
                <DropupItem name="Reset Position" onSelect={() => gumball.transformAnchor.position.set(0, 0, 0)} />
                <DropupItem name="Reset Rotation" onSelect={() => gumball.transformAnchor.rotation.set(0, 0, 0)} />
                <DropupItem name="Cube Rotation Point (Position)" onSelect={() => gumball.moveGumballToSelected({ position: true })} />
                <DropupItem name="Cube Rotation Point (Rotation)" onSelect={() => gumball.moveGumballToSelected({ rotation: true })} />
                <DropupItem name="Custom (Snap Point)" onSelect={() => gumball.moveToCustomPoint()} />
            </div>
        </Dropup>
    );
}

export const ButtonList: FC = ({ children }) => {
    return (
        <div className="flex flex-row p-0.5 mr-2">
            {children}
        </div>
    )
}

export const GumballButton = ({ title, selected, selectedClassName = "bg-sky-500", onClick }: { title: string, selected: boolean, selectedClassName?: string, onClick: () => void }) => {
    return (
        <button className={(selected ? `${selectedClassName} text-white` : "dark:bg-gray-700 bg-gray-400 text-black") + " rounded-none first:rounded-l last:rounded-r py-1 px-2 border-r dark:border-black border-white text-xs"} onClick={onClick}>
            {title}
        </button>
    )

}