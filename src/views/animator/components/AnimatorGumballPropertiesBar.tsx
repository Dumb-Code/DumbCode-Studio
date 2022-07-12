import { Switch } from "@headlessui/react";
import Dropup, { DropupItem } from "../../../components/Dropup";
import { ButtonList, GumballButton, GumballToggle } from "../../../components/GumballComponents";
import { useTooltipRef } from "../../../contexts/TooltipContext";
import AnimatorGumballConsumer from "../../../studio/formats/animations/AnimatorGumballConsumer";
import { useListenableObject, useListenableObjectNullable } from "../../../studio/util/ListenableObject";
import { AnimatorGumball, useAnimatorGumball } from "../logic/AnimatorGumball";

const AnimatorGumballPropertiesBar = ({ consumer }: { consumer: AnimatorGumballConsumer | null | undefined }) => {
    //We want to force a refresh on useAnimatorGumball as little as possible
    useAnimatorGumball(consumer ?? null)

    const [singleSelected] = useListenableObjectNullable(consumer?.getSingleSelectedPart())

    return <AnimationGumballPropertiesBarContained gumball={(singleSelected === null || singleSelected === undefined) ? undefined : consumer?.getAnimatorGumball()} />
}

const AnimationGumballPropertiesBarContained = ({ gumball }: { gumball: AnimatorGumball | undefined }) => {


    return (
        <div className="rounded-sm dark:bg-gray-800 bg-gray-200 h-full">
            <GumballToggle toggle={gumball?.enabled}>
                <AnimatorTransformationTypeSelect gumball={gumball} />
            </GumballToggle>
        </div>
    )
}

const AnimatorTransformationTypeSelect = ({ gumball }: { gumball: AnimatorGumball | undefined }) => {
    //todo: dont shwo gumball whenb light selecteds
    const [objectMode, setObjectMode] = useListenableObjectNullable(gumball?.mode)

    return (
        <>
            <ButtonList>
                <GumballButton title="Object" selected={objectMode === "object"} selectedClassName="bg-green-500" onClick={() => setObjectMode("object")} />
                <GumballButton title="Gumball" selected={objectMode === "gumball"} selectedClassName="bg-green-500" onClick={() => setObjectMode("gumball")} />
            </ButtonList>
            {gumball !== undefined && objectMode === "object" && <AnimatorObjectTransformationModeSelect gumball={gumball} />}
            {gumball !== undefined && objectMode === "gumball" && <AnimatorGumballTransformationModeSelect gumball={gumball} />}
        </>
    )
}

const AnimatorObjectTransformationModeSelect = ({ gumball }: { gumball: AnimatorGumball }) => {
    const [selectedList] = useListenableObject(gumball.selectedCubeManager.selected)
    const [transformMode, setTransformMode] = useListenableObject(gumball.object_transformMode)
    const [space, setObjectSpace] = useListenableObject(gumball.space)

    const hasNoCubesSelected = selectedList.length === 0

    return (
        <div className="flex flex-row transition ease-in-out duration-200">
            {hasNoCubesSelected ?
                <span>No Cubes Selected</span>
                :
                <>
                    <ButtonList>
                        <GumballButton title="Move" selected={transformMode === "translate"} onClick={() => setTransformMode("translate")} />
                        <GumballButton title="MoveIK" selected={transformMode === "translateIK"} onClick={() => setTransformMode("translateIK")} />
                        <GumballButton title="Rotate" selected={transformMode === "rotate"} onClick={() => setTransformMode("rotate")} />
                    </ButtonList>
                    <ButtonList>
                        <GumballButton title="Local" selected={space === "local"} onClick={() => setObjectSpace("local")} />
                        <GumballButton title="World" selected={space === "world"} onClick={() => setObjectSpace("world")} />
                    </ButtonList>
                </>
            }
        </div>
    )
}


const AnimatorGumballTransformationModeSelect = ({ gumball }: { gumball: AnimatorGumball }) => {

    const [space, setObjectSpace] = useListenableObject(gumball.space);
    const [autoMove, setAutoMove] = useListenableObject(gumball.gumball_autoRotate);

    return (
        <>
            <ButtonList>
                <span className="dark:text-gray-200 pr-2" ref={useTooltipRef("Lock the gumball\nto the selected cube(s)")}>Lock to Selected</span>
                <Switch checked={autoMove} onChange={setAutoMove}
                    className={(autoMove ? "bg-green-500" : "bg-red-900") + " relative inline-flex items-center h-6 mt-0.5 rounded w-11 transition-colors ease-in-out duration-200 mr-2"}>
                    <span className="sr-only">Lock to Selected</span>
                    <span className={(autoMove ? "translate-x-6 bg-green-400" : "translate-x-1 bg-red-700") + " inline-block w-4 h-4 transform rounded transition ease-in-out duration-200"} />
                </Switch>
            </ButtonList>
            {/* <ButtonList>
                <GumballButton title="Position" selected={moveMode === "translate"} onClick={() => setMoveMode("translate")} />
                <GumballButton title="Rotation" selected={moveMode === "rotate"} onClick={() => setMoveMode("rotate")} />
            </ButtonList> */}
            <ButtonList>
                <GumballButton title="Local" selected={space === "local"} onClick={() => setObjectSpace("local")} />
                <GumballButton title="World" selected={space === "world"} onClick={() => setObjectSpace("world")} />
            </ButtonList>
            <Dropup title="Relocate Gumballaba" header="RELOCATE MODE">
                <div className="p-0.5">
                    <DropupItem name="Reset Rotation" onSelect={() => gumball.transformAnchor.rotation.set(0, 0, 0)} />
                    <DropupItem name="Cube Rotation" onSelect={() => gumball.moveToSelected()} />
                </div>
            </Dropup>
        </>
    )
}

export default AnimatorGumballPropertiesBar;