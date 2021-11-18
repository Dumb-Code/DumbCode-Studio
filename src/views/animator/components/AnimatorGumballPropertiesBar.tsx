import { Switch } from "@headlessui/react";
import { ButtonList, GumballButton, GumballToggle, RelocateGumballDropup } from "../../../components/GumballComponents";
import { useStudio } from "../../../contexts/StudioContext";
import { useTooltipRef } from "../../../contexts/TooltipContext";
import { useListenableObject } from "../../../studio/util/ListenableObject";
//TODO replace with animator gumball variant
import { ModelerGumball } from "../../modeler/logic/ModelerGumball";

const AnimatorGumballPropertiesBar = () => {

    const { getSelectedProject } = useStudio()
    const gumball = getSelectedProject().modelerGumball

    return (
        <div className="rounded-sm dark:bg-gray-800 bg-gray-200 h-full">
            <GumballToggle>
                <AnimatorTransformationTypeSelect gumball={gumball} />
            </GumballToggle>
        </div>
    )
}

const AnimatorTransformationTypeSelect = ({ gumball }: { gumball: ModelerGumball }) => {
    const [objectMode, setObjectMode] = useListenableObject(gumball.mode)

    return (
        <>
            <ButtonList>
                <GumballButton title="Object" selected={objectMode === "object"} selectedClassName="bg-green-500" onClick={() => setObjectMode("object")} />
                <GumballButton title="Gumball" selected={objectMode === "gumball"} selectedClassName="bg-green-500" onClick={() => setObjectMode("gumball")} />
            </ButtonList>
            {objectMode === "object" ? <AnimatorObjectTransformationModeSelect gumball={gumball} /> : <AnimatorGumballTransformationModeSelect gumball={gumball} />}
        </>
    )
}

const AnimatorObjectTransformationModeSelect = ({ gumball }: { gumball: ModelerGumball }) => {

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
                    </ButtonList>
                    {(() => {
                        switch (transformMode) {
                            case 'translate': return <AnimatorObjectMoveOptions gumball={gumball} />
                            case 'rotate': return <AnimatorObjectRotateOptions gumball={gumball} />
                            case 'dimensions': return null
                        }
                    })()}
                </>
            }
        </div>
    )
}


const AnimatorObjectMoveOptions = ({ gumball }: { gumball: ModelerGumball }) => {

    const [space, setObjectSpace] = useListenableObject(gumball.space);
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
            </ButtonList>
        </>
    )
}

const AnimatorObjectRotateOptions = ({ gumball }: { gumball: ModelerGumball }) => {

    const [space, setObjectSpace] = useListenableObject(gumball.space);
    const [moveType, setMoveType] = useListenableObject(gumball.object_rotation_type);


    return (
        <>
            <ButtonList>
                <GumballButton title="Local" selected={space === "local"} onClick={() => setObjectSpace("local")} />
                <GumballButton title="World" selected={space === "world"} onClick={() => setObjectSpace("world")} />
            </ButtonList>
            <ButtonList>
                <GumballButton title="Normal" selected={moveType === "rotation"} onClick={() => setMoveType("rotation")} />
                <GumballButton title="Around Point" selected={moveType === "rotation_around_point"} onClick={() => setMoveType("rotation_around_point")} />
            </ButtonList>
        </>
    )
}

const AnimatorGumballTransformationModeSelect = ({ gumball }: { gumball: ModelerGumball }) => {

    const [space, setObjectSpace] = useListenableObject(gumball.space);
    const [moveMode, setMoveMode] = useListenableObject(gumball.gumball_move_mode);
    const [autoMove, setAutoMove] = useListenableObject(gumball.gumball_auto_move);

    return (
        <>
            <ButtonList>
                <span className="dark:text-gray-200 pr-2" ref={useTooltipRef("Automatically move the gumball\nto the selected cube(s)")}>Auto Move</span>
                <Switch checked={autoMove} onChange={setAutoMove}
                    className={(autoMove ? "bg-green-500" : "bg-red-900") + " relative inline-flex items-center h-6 mt-0.5 rounded w-11 transition-colors ease-in-out duration-200 mr-2"}>
                    <span className="sr-only">Auto Move</span>
                    <span className={(autoMove ? "translate-x-6 bg-green-400" : "translate-x-1 bg-red-700") + " inline-block w-4 h-4 transform rounded transition ease-in-out duration-200"} />
                </Switch>
            </ButtonList>
            <ButtonList>
                <GumballButton title="Position" selected={moveMode === "translate"} onClick={() => setMoveMode("translate")} />
                <GumballButton title="Rotation" selected={moveMode === "rotate"} onClick={() => setMoveMode("rotate")} />
            </ButtonList>
            <ButtonList>
                <GumballButton title="Local" selected={space === "local"} onClick={() => setObjectSpace("local")} />
                <GumballButton title="World" selected={space === "world"} onClick={() => setObjectSpace("world")} />
            </ButtonList>
            <RelocateGumballDropup gumball={gumball} />
        </>
    )
}

export default AnimatorGumballPropertiesBar;