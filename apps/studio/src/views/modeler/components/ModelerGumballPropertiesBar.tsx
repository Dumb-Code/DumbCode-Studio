import { Switch } from "@headlessui/react";
import Dropup, { DropupItem } from "../../../components/Dropup";
import { ButtonList, GumballButton, GumballToggle } from "../../../components/GumballComponents";
import { useStudio } from "../../../contexts/StudioContext";
import { useTooltipRef } from "../../../contexts/TooltipContext";
import { useListenableObject } from "../../../studio/listenableobject/ListenableObject";
import ReferenceImageHandler from "../../../studio/referenceimages/ReferenceImageHandler";
import { ModelerGumball } from "../logic/ModelerGumball";

const ModelerGumballPropertiesBar = () => {

    const { getSelectedProject } = useStudio()
    const { modelerGumball, referenceImageHandler } = getSelectedProject()

    const [selectedImage] = useListenableObject(referenceImageHandler.selectedImage)

    return (
        <div className="rounded-sm dark:bg-gray-800 bg-gray-200 h-full">
            {selectedImage === null ?
                <GumballToggle toggle={modelerGumball.enabled}>
                    <ModelerTransformationTypeSelect gumball={modelerGumball} />
                </GumballToggle>
                :
                <ReferenceImageGumball referenceImageHandler={referenceImageHandler} />
            }
        </div>
    )
}

const ModelerTransformationTypeSelect = ({ gumball }: { gumball: ModelerGumball }) => {
    const [objectMode, setObjectMode] = useListenableObject(gumball.mode)

    return (
        <>
            <ButtonList>
                <GumballButton title="Object" selected={objectMode === "object"} selectedClassName="bg-green-500" onClick={() => setObjectMode("object")} />
                <GumballButton title="Gumball" selected={objectMode === "gumball"} selectedClassName="bg-green-500" onClick={() => setObjectMode("gumball")} />
            </ButtonList>
            {objectMode === "object" ? <ModelerObjectTransformationModeSelect gumball={gumball} /> : <ModelerGumballTransformationModeSelect gumball={gumball} />}
        </>
    )
}

const ModelerObjectTransformationModeSelect = ({ gumball }: { gumball: ModelerGumball }) => {

    const [selectedList] = useListenableObject(gumball.selectedCubeManager.selected)
    const [transformMode, setTransformMode] = useListenableObject(gumball.object_transformMode)

    const hasNoCubesSelected = selectedList.length === 0

    return (
        <div className="flex flex-row transition ease-in-out duration-200">
            {hasNoCubesSelected ?
                <span className="dark:text-gray-400">No Cubes Selected</span>
                :
                <>
                    <ButtonList>
                        <GumballButton title="Move" selected={transformMode === "translate"} onClick={() => setTransformMode("translate")} />
                        <GumballButton title="Rotate" selected={transformMode === "rotate"} onClick={() => setTransformMode("rotate")} />
                        <GumballButton title="Dimension" selected={transformMode === "dimensions"} onClick={() => setTransformMode("dimensions")} />
                    </ButtonList>
                    {(() => {
                        switch (transformMode) {
                            case 'translate': return <ModelerObjectMoveOptions gumball={gumball} />
                            case 'rotate': return <ModelerObjectRotateOptions gumball={gumball} />
                            case 'dimensions': return null
                        }
                    })()}
                </>
            }
        </div>
    )
}


const ModelerObjectMoveOptions = ({ gumball }: { gumball: ModelerGumball }) => {

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
                <GumballButton title="Rotation Point" selected={moveType === "rotation_point"} onClick={() => setMoveType("rotation_point")} />
            </ButtonList>
        </>
    )
}

const ModelerObjectRotateOptions = ({ gumball }: { gumball: ModelerGumball }) => {

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

const ModelerGumballTransformationModeSelect = ({ gumball }: { gumball: ModelerGumball }) => {

    const [space, setObjectSpace] = useListenableObject(gumball.space);
    const [moveMode, setMoveMode] = useListenableObject(gumball.gumball_move_mode);
    const [autoMove, setAutoMove] = useListenableObject(gumball.gumball_auto_move);

    return (
        <>
            <ButtonList>
                <span className="dark:text-gray-200 pr-2" ref={useTooltipRef("Automatically move the gumball\nto the selected cube(s)")}>Auto Move</span>
                <Switch checked={autoMove} onChange={setAutoMove}
                    className={(autoMove ? "bg-green-500" : "bg-red-900") + " relative inline-flex items-center h-6 mt-0.5 rounded w-11 transition-colors ease-in-out duration-200 mr-2"}>
                    <span className="sr-only">Lock Gumball</span>
                    <span className={(autoMove ? "translate-x-6 bg-green-400" : "translate-x-1 bg-red-700") + " inline-block w-4 h-4 transform rounded transition ease-in-out duration-200"} />
                </Switch>
            </ButtonList>

            {!autoMove &&
                <>
                    <ButtonList>
                        <GumballButton title="Position" selected={moveMode === "translate"} onClick={() => setMoveMode("translate")} />
                        <GumballButton title="Rotation" selected={moveMode === "rotate"} onClick={() => setMoveMode("rotate")} />
                    </ButtonList>
                    <ButtonList>
                        <GumballButton title="Local" selected={space === "local"} onClick={() => setObjectSpace("local")} />
                        <GumballButton title="World" selected={space === "world"} onClick={() => setObjectSpace("world")} />
                    </ButtonList>
                    <Dropup title="Relocate Gumball" header="RELOCATE MODE">
                        <div className="p-0.5">
                            <DropupItem name="Reset Position" onSelect={() => gumball.transformAnchor.position.set(0, 0, 0)} />
                            <DropupItem name="Reset Rotation" onSelect={() => gumball.transformAnchor.rotation.set(0, 0, 0)} />
                            <DropupItem name="Cube Rotation Point (Position)" onSelect={() => gumball.moveGumballToSelected({ position: true })} />
                            <DropupItem name="Cube Rotation Point (Rotation)" onSelect={() => gumball.moveGumballToSelected({ rotation: true })} />
                            <DropupItem name="Custom (Snap Point)" onSelect={() => gumball.moveToCustomPoint()} />
                        </div>
                    </Dropup>
                </>
            }
        </>
    )
}

const ReferenceImageGumball = ({ referenceImageHandler }: { referenceImageHandler: ReferenceImageHandler }) => {
    const [space, setObjectSpace] = useListenableObject(referenceImageHandler.space);
    const [moveMode, setMoveMode] = useListenableObject(referenceImageHandler.mode);
    return (
        <div className="flex flex-row">
            <ButtonList>
                <GumballButton title="Position" selected={moveMode === "translate"} onClick={() => setMoveMode("translate")} />
                <GumballButton title="Rotation" selected={moveMode === "rotate"} onClick={() => setMoveMode("rotate")} />
                <GumballButton title="Scale" selected={moveMode === "scale"} onClick={() => setMoveMode("scale")} />
            </ButtonList>
            <ButtonList>
                <GumballButton title="Local" selected={space === "local"} onClick={() => setObjectSpace("local")} />
                <GumballButton title="World" selected={space === "world"} onClick={() => setObjectSpace("world")} />
            </ButtonList>
        </div>
    )
}

export default ModelerGumballPropertiesBar;