import { MeshBasicMaterial, MeshLambertMaterial } from 'three';
import { useStudio } from '../contexts/StudioContext';
import { DCMCube } from '../studio/formats/model/DcmModel';
import { TextureGroup } from '../studio/formats/textures/TextureManager';
import UndoRedoHandler from '../studio/undoredo/UndoRedoHandler';
import { useListenableMap, useListenableObject, useListenableObjectNullable } from '../studio/util/ListenableObject';
import { useTextureGroupSelect } from '../studio/util/StudioHooks';
import Dropup, { DropupItem } from './Dropup';
import { SVGCube, SVGEye, SVGGrid, SVGLocked, SVGRedo, SVGUndo } from './Icons';
import { ButtonWithTooltip } from './Tooltips';

const InfoBar = ({ undoRedo }: { undoRedo?: UndoRedoHandler<any> }) => {

    const { getSelectedProject, toggleGrid, toggleBox } = useStudio()
    const project = getSelectedProject()
    const [selectedCubeIdentifs] = useListenableObject(project.selectedCubeManager.selected)

    const totalCubes = useListenableMap(project.model.identifierCubeMap)
    const selectedCube = selectedCubeIdentifs.map(c => totalCubes.get(c)).filter(cube => cube !== undefined) as DCMCube[]

    const childrenOfSelectedCubes = selectedCube.flatMap(cube => cube.getAllChildrenCubes([]))

    const selectAllCubes = () => {
        project.selectedCubeManager.keepCurrentCubes = true
        project.model.undoRedoHandler.startBatchActions()
        project
        project.model.undoRedoHandler.endBatchActions(`Cubes Selected`)
        project.selectedCubeManager.keepCurrentCubes = false
    }

    const toggleSelectedCubesVisability = () => {
        //Reduce all the cubes, if any of them are visible, allVisible will be visible
        let allVisible = false
        selectedCube.forEach(cube => allVisible = allVisible || !cube.visible.value)
        selectedCube.forEach(cube => cube.visible.value = allVisible)
    }

    const toggleSelectedCubesLock = () => {
        //Reduce all the cubes, if any of them are locked, allLocked will be visible
        let allLock = false
        selectedCube.forEach(cube => allLock = allLock || cube.locked.value)
        selectedCube.forEach(cube => cube.locked.value = !allLock)
    }

    const selectAllChildrenCubes = () => {
        project.selectedCubeManager.keepCurrentCubes = true
        project.model.undoRedoHandler.startBatchActions()
        childrenOfSelectedCubes.forEach(cube => cube.selected.value = true)
        project.model.undoRedoHandler.endBatchActions(`Cubes Selected`)
        project.selectedCubeManager.keepCurrentCubes = false
    }


    const [canUndo] = useListenableObjectNullable(undoRedo?.canUndo)
    const [canRedo] = useListenableObjectNullable(undoRedo?.canRedo)


    return (
        <div className="rounded-sm dark:bg-black bg-white h-full flex flex-row">
            <DisplayModeDropup />
            <RenderModeDropup />
            <TextureGroupDropup />
            <button onClick={toggleGrid} className="dark:bg-gray-900 bg-gray-400 dark:hover:bg-gray-800 hover:bg-gray-500 rounded pr-1 pl-2 py-1 my-0.5 mr-1 dark:text-white text-black ml-0.5"><SVGGrid className="h-4 w-4 mr-1" /></button>
            <button onClick={toggleBox} className="dark:bg-gray-900 bg-gray-400 dark:hover:bg-gray-800 hover:bg-gray-500 rounded pr-1 pl-2 py-1 my-0.5 mr-1 dark:text-white text-black"><SVGCube className="h-4 w-4 mr-1" /></button>
            <button onClick={selectAllCubes} className="dark:bg-gray-900 bg-gray-400 dark:hover:bg-gray-800 hover:bg-gray-500 rounded pr-1 pl-2 py-1 my-0.5 mr-1 dark:text-white text-black text-xs">{totalCubes.size} Total Cube{totalCubes.size === 1 ? "" : "s"}</button>

            {selectedCube.length !== 0 &&
                <>
                    <button className="dark:bg-gray-900 bg-gray-400 dark:hover:bg-gray-800 hover:bg-gray-500 rounded px-2 my-0.5 mr-1 dark:text-white text-black text-xs">{selectedCube.length} Cube{selectedCube.length === 1 ? "" : "s"} Selected</button>
                    <button onClick={toggleSelectedCubesVisability} className="dark:bg-gray-900 bg-gray-400 dark:hover:bg-gray-800 hover:bg-gray-500 rounded pr-1 pl-2 py-1 my-0.5 mr-1 dark:text-white text-black"><SVGEye className="h-4 w-4 mr-1" /></button>
                    <button onClick={toggleSelectedCubesLock} className="dark:bg-gray-900 bg-gray-400 dark:hover:bg-gray-800 hover:bg-gray-500 rounded pr-1 pl-2 py-1 my-0.5 mr-1 dark:text-white text-black"><SVGLocked className="h-4 w-4 mr-1" /></button>
                    <button onClick={selectAllChildrenCubes} className="dark:bg-gray-900 bg-gray-400 dark:hover:bg-gray-800 hover:bg-gray-500 rounded px-2 my-0.5 mr-1 dark:text-white text-black text-xs">{childrenOfSelectedCubes.length} Child Cube{childrenOfSelectedCubes.length === 1 ? "" : "s"}</button>
                </>
            }
            <div className="flex-grow"></div>

            <ButtonWithTooltip onClick={() => UndoRedoHandler.undo(undoRedo, project.undoRedoHandler)} className={"dark:bg-gray-900 bg-gray-400 dark:hover:bg-gray-800 hover:bg-gray-500 rounded pr-1 pl-2 py-1 my-0.5 mr-1 " + (canUndo ? "dark:text-white text-black" : "text-gray-500")} tooltip="Undo the last operation">
                <SVGUndo className="h-3 w-3 mr-1" />
            </ButtonWithTooltip>

            <ButtonWithTooltip onClick={() => UndoRedoHandler.redo(undoRedo, project.undoRedoHandler)} className={"dark:bg-gray-900 bg-gray-400 dark:hover:bg-gray-800 hover:bg-gray-500 rounded pr-1 pl-2 py-1 my-0.5 mr-1 " + (canRedo ? "dark:text-white text-black" : "text-gray-500")} tooltip="Redo the last undo">
                <SVGRedo className="h-3 w-3 mr-1" />
            </ButtonWithTooltip>
        </div>
    )
}

const DisplayModeDropup = () => {
    const { getSelectedProject } = useStudio()
    const project = getSelectedProject()
    type Func = (mat: MeshBasicMaterial | MeshLambertMaterial) => void
    const setTextured: Func = (mat) => {
        mat.userData._mode = 0
        mat.map = project.previousThreeTexture
        mat.wireframe = false
    }
    const setunTextured: Func = (mat) => {
        mat.userData._mode = 1
        mat.map = null
        mat.wireframe = false
    }
    const setOutline: Func = (mat) => {
        mat.userData._mode = 2
        mat.map = null
        mat.wireframe = true
    }
    return (
        <div className="mx-0.5">
            <Dropup title="Display Mode" header="DISPLAY MODE">
                <div className="px-0.5 py-1">
                    <DropupItem name="Textured" onSelect={() => project.updateTexture(setTextured)} />
                    <DropupItem name="White" onSelect={() => project.updateTexture(setunTextured)} />
                    <DropupItem name="Outline" onSelect={() => project.updateTexture(setOutline)} />
                </div>
            </Dropup>
        </div>
    );
}

const RenderModeDropup = () => {
    const { setCameraType } = useStudio()
    return (
        <div className="mx-0.5">
            <Dropup title="Set View" header="SET PERSPECTIVE">
                <div className="px-0.5 py-1">
                    <DropupItem name="Perspective" onSelect={() => setCameraType(true)} />
                    <DropupItem name="Orthographic" onSelect={() => setCameraType(false)} />
                </div>
            </Dropup>
        </div>
    );
}

const TextureGroupDropup = () => {
    const groups = useTextureGroupSelect()
    return (
        <div className="mx-0.5">
            <Dropup title="Texture Group" header="SET GROUP">
                <div className="px-0.5 py-1">
                    {groups.map(g => <GroupDropupItem key={g.group.identifier} {...g} />)}
                </div>
            </Dropup>
        </div>
    );
}

const GroupDropupItem = ({ group, selected, setSelected }: {
    group: TextureGroup;
    selected: boolean;
    setSelected: () => void;
}) => {
    const [name] = useListenableObject(group.name)
    return <DropupItem name={name} selected={selected} onSelect={setSelected} />
}

export default InfoBar;