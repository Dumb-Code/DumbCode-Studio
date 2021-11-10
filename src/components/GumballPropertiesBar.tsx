import { Switch } from "@headlessui/react";
import { FC, useState } from "react";
import Dropup, { DropupItem } from "./Dropup";

const GumballPropertiesBar = () => {
    return (
        <div onClick={() => alert("Not Yet Implemented")} className="rounded-sm dark:bg-gray-800 bg-gray-200 h-full">
            <GumballToggle />
        </div>
    )
}

const GumballToggle = () => {

    const [gumballEnabled, enableGumball] = useState(true);

    return (
        <div className="flex flex-row">
            <p className={(gumballEnabled ? "bg-sky-500" : "dark:bg-gray-700 bg-gray-300") + " m-0.5 rounded pt-1 px-2 dark:text-white text-black text-xs h-6 transition-colors ease-in-out duration-200"}>Enable Gumball</p>
            <Switch checked={gumballEnabled} onChange={enableGumball}
                className={(gumballEnabled ? "bg-green-500" : "bg-red-900") + " relative inline-flex items-center h-6 mt-0.5 rounded w-11 transition-colors ease-in-out duration-200 mr-2"}>
                <span className="sr-only">Gumball</span>
                <span className={(gumballEnabled ? "translate-x-6 bg-green-400" : "translate-x-1 bg-red-700") + " inline-block w-4 h-4 transform rounded transition ease-in-out duration-200"} />
            </Switch>
            {!gumballEnabled || <TransformationTypeSelect />}
        </div>
    );
}

const TransformationTypeSelect = () => {
    const [objectMode, setObjectMode] = useState(true)

    return (
        <>
            <ButtonList>
                <GumballButton title="Object" selected={objectMode} selectedClassName="bg-green-500" onClick={() => setObjectMode(true)} />
                <GumballButton title="Gumball" selected={!objectMode} selectedClassName="bg-green-500" onClick={() => setObjectMode(false)} />
            </ButtonList>
            {objectMode ? <ObjectTransformationModeSelect /> : <GumballTransformationModeSelect />}
        </>
    )
}

const ObjectTransformationModeSelect = () => {

    const [transformMode, setTransformMode] = useState<"move" | "rotate" | "dimension">("move")

    return (
        <div className="flex flex-row transition ease-in-out duration-200">
            <ButtonList>
                <GumballButton title="Move" selected={transformMode === "move"} onClick={() => setTransformMode("move")} />
                <GumballButton title="Rotate" selected={transformMode === "rotate"} onClick={() => setTransformMode("rotate")} />
                <GumballButton title="Dimension" selected={transformMode === "dimension"} onClick={() => setTransformMode("dimension")} />
            </ButtonList>
            {(() => {
                switch (transformMode) {
                    case 'move': return <ObjectMoveOptions />
                    case 'rotate': return <ObjectRotateOptions />
                    case 'dimension': return null
                }
            })()}
        </div>
    )
}


const ObjectMoveOptions = () => {

    const [isMoveLocal, setScopeLocal] = useState(true);
    const [moveType, setMoveType] = useState<"position" | "offset" | "rotationPoint">("position");

    return (
        <>
            <ButtonList>
                <GumballButton title="Local" selected={isMoveLocal} onClick={() => setScopeLocal(true)} />
                <GumballButton title="World" selected={!isMoveLocal} onClick={() => setScopeLocal(false)} />
            </ButtonList>
            <ButtonList>
                <GumballButton title="Position" selected={moveType === "position"} onClick={() => setMoveType("position")} />
                <GumballButton title="Offset" selected={moveType === "offset"} onClick={() => setMoveType("offset")} />
                <GumballButton title="Rotation Point" selected={moveType === "rotationPoint"} onClick={() => setMoveType("rotationPoint")} />
            </ButtonList>
        </>
    )
}

const ObjectRotateOptions = () => {

    const [isRotLocal, setScopeLocal] = useState(true);
    const [isAroundPoint, setAroundPoint] = useState(false);

    return (
        <>
            <ButtonList>
                <GumballButton title="Local" selected={isRotLocal} onClick={() => setScopeLocal(true)} />
                <GumballButton title="World" selected={!isRotLocal} onClick={() => setScopeLocal(false)} />
            </ButtonList>
            <ButtonList>
                <GumballButton title="Normal" selected={isAroundPoint} onClick={() => setAroundPoint(true)} />
                <GumballButton title="Around Point" selected={!isAroundPoint} onClick={() => setAroundPoint(false)} />
            </ButtonList>
        </>
    )
}

const GumballTransformationModeSelect = () => {

    const [isGumballMove, setGumballMove] = useState(true);

    return (
        <>
            <ButtonList>
                <GumballButton title="Position" selected={isGumballMove} onClick={() => setGumballMove(true)} />
                <GumballButton title="Rotation" selected={!isGumballMove} onClick={() => setGumballMove(false)} />
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
        <div className="flex flex-row p-0.5 mr-2 w-[55px]">
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

export default GumballPropertiesBar;