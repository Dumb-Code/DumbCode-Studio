import { useCallback, useMemo } from "react";
import Checkbox from "../../../components/Checkbox";
import CollapsableSidebarPannel from '../../../components/CollapsableSidebarPannel';
import HistoryList from '../../../components/HistoryList';
import NumericInput from "../../../components/NumericInput";
import { useStudio } from "../../../contexts/StudioContext";
import { useListenableObject, useListenableObjectNullable } from "../../../studio/util/ListenableObject";
import ModelerCubeList from "../../modeler/components/ModelerCubeList";

const TextureMapperSidebar = () => {
    return (
        <div className="dark:bg-gray-800 bg-gray-200 flex flex-col overflow-x-hidden overflow-y-scroll studio-scrollbar h-full">
            <TextureProperties />
            <TextureMapElementProperties />
            <ModelerCubeList canEdit={false} />
            <HistoryList />
        </div>
    )
}

const TextureProperties = () => {

    const { getSelectedProject } = useStudio()
    const project = getSelectedProject()

    const [width, setWidth] = useListenableObject(project.model.textureCoordinates.textureWidth)
    const [height, setHeight] = useListenableObject(project.model.textureCoordinates.textureHeight)

    return (
        <CollapsableSidebarPannel title="TEXTURE PROPERTIES" heightClassname="h-auto" panelName="texture_properties">
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
        <CollapsableSidebarPannel title="CUBE UV PROPERTIES" heightClassname="h-auto" panelName="texture_element_properties">
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