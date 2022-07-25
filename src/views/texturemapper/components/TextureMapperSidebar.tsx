import { useCallback, useMemo } from "react";
import Checkbox from "../../../components/Checkbox";
import CollapsableSidebarPannel from '../../../components/CollapsableSidebarPannel';
import HistoryList from '../../../components/HistoryList';
import NumericInput from "../../../components/NumericInput";
import { OptionSet } from "../../../components/OptionPick";
import { useStudio } from "../../../contexts/StudioContext";
import { usePanelValue } from "../../../contexts/StudioPanelsContext";
import { useToast } from "../../../contexts/ToastContext";
import TextureManager from "../../../studio/formats/textures/TextureManager";
import { useListenableObject, useListenableObjectNullable } from "../../../studio/listenableobject/ListenableObject";
import { imgSourceToElement } from "../../../studio/util/Utils";
import ModelerCubeList from "../../modeler/components/ModelerCubeList";
import { GridDisplayModes } from "./TextureMapperViewport";

const TextureMapperSidebar = () => {
    const { getSelectedProject } = useStudio()
    const project = getSelectedProject()
    return (
        <div className="dark:bg-gray-800 bg-gray-200 flex flex-col overflow-x-hidden overflow-y-scroll studio-scrollbar h-full">
            <TextureProperties />
            <TextureMapElementProperties />
            <TextureSettings />
            <ModelerCubeList canEdit={false} />
            <HistoryList undoRedoHandler={project.model.textureCoordinates.undoRedoHandler} />
        </div>
    )
}

const TextureProperties = () => {

    const { getSelectedProject } = useStudio()
    const project = getSelectedProject()

    const [width, setWidth] = useListenableObject(project.model.textureCoordinates.textureWidth)
    const [height, setHeight] = useListenableObject(project.model.textureCoordinates.textureHeight)

    return (
        <CollapsableSidebarPannel title="TEXTURE PROPERTIES" heightClassname="h-auto" panelName="texture_mapper_properties">
            <div className="flex flex-row py-1">
                <div className="mx-1">
                    <p className="dark:text-gray-400 text-black text-xs">WIDTH</p>
                    <NumericInput value={width} onChange={setWidth} isPositiveInteger />
                </div>
                <div className="mx-1">
                    <p className="dark:text-gray-400 text-black  text-xs">HEIGHT</p>
                    <NumericInput value={height} onChange={setHeight} isPositiveInteger />
                </div>
            </div>
        </CollapsableSidebarPannel>
    )
}


const TextureSettings = () => {
    const [gridType, setGridType] = usePanelValue("texture_grid_type")

    const { getSelectedProject } = useStudio()
    const project = getSelectedProject()

    const { addToast } = useToast()

    const generateTexturemapToTexture = async () => {
        const canvas = document.createElement("canvas")
        canvas.width = project.model.textureWidth.value
        canvas.height = project.model.textureHeight.value

        const ctx = canvas.getContext("2d")
        if (ctx === null) {
            addToast("Failed to create canvas context", "error")
            return
        }
        ctx.imageSmoothingEnabled = false

        project.model.identifierCubeMap.forEach(cube => {
            TextureManager.drawCubeToCanvas(cube, canvas.width, canvas.height, ctx, false)
        })

        const img = await imgSourceToElement(canvas.toDataURL("image/png"))
        project.textureManager.addTexture("TextureMap", img)
        addToast("Generated texture map", "success")
    }

    return (
        <CollapsableSidebarPannel title="TEXTURE MAPPER SETTINGS" heightClassname="h-auto" panelName="texture_mapper_settings">
            <div className="flex flex-col py-1">
                <OptionSet title="Grid Mode" options={GridDisplayModes} selected={gridType} setSelected={setGridType} />
                <button onClick={generateTexturemapToTexture} className="dark:text-white text-black font-semibold p-2 ml-2 mt-2 rounded dark:bg-cyan-700 bg-cyan-500">Generate texturemap to texture</button>
            </div>
        </CollapsableSidebarPannel>
    )
}


const TextureMapElementProperties = () => {
    const { getSelectedProject } = useStudio()
    const project = getSelectedProject()
    const [selected] = useListenableObject(project.selectedCubeManager.selected)
    const singleSelected = useMemo(() => selected.length === 1 ? project.model.identifierCubeMap.get(selected[0]) : null, [selected, project])

    const [mirrored, setMirrored] = useListenableObjectNullable(singleSelected?.textureMirrored)
    const [offset, setOffset] = useListenableObjectNullable(singleSelected?.textureOffset)

    const onChange = useCallback((index: number) => {
        return (value: number) => {
            if (offset !== undefined) {
                const newOffset = [
                    index === 0 ? value : offset[0],
                    index === 1 ? value : offset[1],
                ] as const
                setOffset(newOffset)
            }
        }
    }, [offset, setOffset])

    return (
        <CollapsableSidebarPannel title="CUBE UV PROPERTIES" heightClassname="h-auto" panelName="texture_mapper_element_properties">
            <div className="flex flex-row py-1">
                <div className="mx-1">
                    <p className="dark:text-gray-400 text-black  text-xs">MIRROR</p>
                    <div className="px-2">
                        <Checkbox value={mirrored} setValue={setMirrored} />
                    </div>
                </div>
                <div className="mx-1">
                    <p className="dark:text-gray-400 text-black  text-xs">X OFFSET</p>
                    <NumericInput value={offset === undefined ? null : offset[0]} onChange={onChange(0)} isPositiveInteger />
                </div>
                <div className="mx-1">
                    <p className="dark:text-gray-400 text-black  text-xs">Y OFFSET</p>
                    <NumericInput value={offset === undefined ? null : offset[1]} onChange={onChange(1)} isPositiveInteger />
                </div>
            </div>
        </CollapsableSidebarPannel>
    )
}


export default TextureMapperSidebar;