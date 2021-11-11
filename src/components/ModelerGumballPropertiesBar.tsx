import { Switch } from "@headlessui/react";
import { FC } from "react";
import { useStudio } from "../contexts/StudioContext";
import { useListenableObject } from "../studio/util/ListenableObject";
import { ModelerGumball, useModelerGumball } from "../views/modeler/logic/ModelerGumball";
import Dropup, { DropupItem } from "./Dropup";

const ModelerGumballPropertiesBar = () => {
    useModelerGumball()
    return (
        <div className="rounded-sm dark:bg-gray-800 bg-gray-200 h-full">
            <GumballToggle />
        </div>
    )
}

const GumballToggle = () => {

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
            {!gumballEnabled || <TransformationTypeSelect gumball={gumball} />}
        </div>
    );
}

const TransformationTypeSelect = ({ gumball }: { gumball: ModelerGumball }) => {
    const [objectMode, setObjectMode] = useListenableObject(gumball.mode)

    return (
        <>
            <ButtonList>
                <GumballButton title="Object" selected={objectMode === "object"} selectedClassName="bg-green-500" onClick={() => setObjectMode("object")} />
                <GumballButton title="Gumball" selected={objectMode === "gumball"} selectedClassName="bg-green-500" onClick={() => setObjectMode("gumball")} />
            </ButtonList>
            {objectMode === "object" ? <ObjectTransformationModeSelect gumball={gumball} /> : <GumballTransformationModeSelect gumball={gumball} />}
        </>
    )
}

const ObjectTransformationModeSelect = ({ gumball }: { gumball: ModelerGumball }) => {

    const [selectedList] = useListenableObject(gumball.selectedCubeManager.selected)
    const [transformMode, setTransformMode] = useListenableObject(gumball.object_transformMode)

    const hasNoCubesSelected = selectedList.length === 0

    return (
        <div className="flex flex-row transition ease-in-out duration-200">
            {hasNoCubesSelected ?
                <span>No Cubes Selected</span>
                :
                <>
                    <ButtonList>
                        <GumballButton title="Move" selected={transformMode === "translate"} onClick={() => setTransformMode("translate")} />
                        <GumballButton title="Rotate" selected={transformMode === "rotate"} onClick={() => setTransformMode("rotate")} />
                        <GumballButton title="Dimension" selected={transformMode === "dimension"} onClick={() => setTransformMode("dimension")} />
                    </ButtonList>
                    {(() => {
                        switch (transformMode) {
                            case 'translate': return <ObjectMoveOptions gumball={gumball} />
                            case 'rotate': return <ObjectRotateOptions gumball={gumball} />
                            case 'dimension': return null
                        }
                    })()}
                </>
            }
        </div>
    )
}


const ObjectMoveOptions = ({ gumball }: { gumball: ModelerGumball }) => {

    const [space, setObjectSpace] = useListenableObject(gumball.object_position_space);
    const [moveType, setMoveType] = useListenableObject(gumball.object_position_type);

    return (
        <>
            <ButtonList>
                <GumballButton title="Local" selected={space === "local"} onClick={() => setObjectSpace("local")} />
                <GumballButton title="World" selected={space === "world"} onClick={() => setObjectSpace("world")} />
            </ButtonList>
            <ButtonList>
                <GumballButton title="Position" selected={moveType === "position"} onClick={() => setMoveType("position")} />
                <GumballButton title="Offset" selected={moveType === "offset"} onClick={() => setMoveType("offset")} />
                <GumballButton title="Rotation Point" selected={moveType === "rotation_point"} onClick={() => setMoveType("rotation_point")} />
            </ButtonList>
        </>
    )
}

const ObjectRotateOptions = ({ gumball }: { gumball: ModelerGumball }) => {

    const [space, setObjectSpace] = useListenableObject(gumball.object_rotation_space);
    const [moveType, setMoveType] = useListenableObject(gumball.object_rotation_type);


    return (
        <>
            <ButtonList>
                <GumballButton title="Local" selected={space === "local"} onClick={() => setObjectSpace("local")} />
                <GumballButton title="World" selected={space === "world"} onClick={() => setObjectSpace("world")} />
            </ButtonList>
            <ButtonList>
                <GumballButton title="Normal" selected={moveType === "rotation"} onClick={() => setMoveType("rotation")} />
                <GumballButton title="Around Point" selected={moveType === "rotation_around_point"} onClick={() => setMoveType("rotation")} />
            </ButtonList>
        </>
    )
}

const GumballTransformationModeSelect = ({ gumball }: { gumball: ModelerGumball }) => {

    const [moveMode, setMoveMode] = useListenableObject(gumball.gumball_move_mode);

    return (
        <>
            <ButtonList>
                <GumballButton title="Position" selected={moveMode === "translate"} onClick={() => setMoveMode("translate")} />
                <GumballButton title="Rotation" selected={moveMode === "rotate"} onClick={() => setMoveMode("rotate")} />
            </ButtonList>
            <RelocateGumballDropup />
        </>
    )
}

const RelocateGumballDropup = () => {
    return (
        <Dropup title="Relocate Gumball" header="RELOCATE MODE">
            <div className="p-0.5">
                <DropupItem name="To World Origin" onSelect={() => console.log("set mode")} />
                <DropupItem name="Cube Rotation Point (Position)" onSelect={() => console.log("set mode")} />
                <DropupItem name="Cube Rotation Point (Rotation)" onSelect={() => console.log("set mode")} />
                <DropupItem name="Cube Rotation Point (Both)" onSelect={() => console.log("set mode")} />
                <DropupItem name="Custom (Snap Point)" onSelect={() => console.log("set mode")} />
            </div>
        </Dropup>
    );
}

const ButtonList: FC = ({ children }) => {
    return (
        <div className="flex flex-row p-0.5 mr-2">
            {children}
        </div>
    )
}

const GumballButton = ({ title, selected, selectedClassName = "bg-sky-500", onClick }: { title: string, selected: boolean, selectedClassName?: string, onClick: () => void }) => {
    return (
        <button className={(selected ? `${selectedClassName} text-white` : "dark:bg-gray-700 bg-gray-400 text-black") + " rounded-none first:rounded-l last:rounded-r py-1 px-2 border-r dark:border-black border-white text-xs"} onClick={onClick}>
            {title}
        </button>
    )

}

export default ModelerGumballPropertiesBar;