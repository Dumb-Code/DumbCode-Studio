import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import ClickableInput from "../../../components/ClickableInput"
import { DblClickEditLO } from "../../../components/DoubleClickToEdit"
import { SVGCross, SVGDownload, SVGPlus, SVGUpload } from "../../../components/Icons"
import { ButtonWithTooltip } from "../../../components/Tooltips"
import { useOptions } from "../../../contexts/OptionsContext"
import { useStudio } from "../../../contexts/StudioContext"
import DcProject from "../../../studio/formats/project/DcProject"
import { Texture, TextureGroup, useTextureDomRef } from "../../../studio/formats/textures/TextureManager"
import { ReadableFile, readFileDataUrl, SaveIcon } from "../../../studio/util/FileTypes"
import { useFileUpload } from "../../../studio/util/FileUploadBox"
import { useListenableObject } from "../../../studio/util/ListenableObject"

const imageExtensions = [".png", ".jpeg", ".gif"]

const readFileToImg = async (file: ReadableFile) => {
    const url = await readFileDataUrl(file)
    const img = document.createElement('img')
    return new Promise<HTMLImageElement>(resolve => {
        img.onload = () => resolve(img)
        img.src = url
    })
}

const ProjectTextures = () => {
    const { getSelectedProject, hasProject } = useStudio()

    const addGroup = () => {
        getSelectedProject().textureManager.addGroup(new TextureGroup("New Group", false))
    }

    const addTexture = (name?: string, img?: HTMLImageElement) => {
        getSelectedProject().textureManager.addTexture(name, img)
    }

    const uploadTexture = (file: ReadableFile) =>
        readFileToImg(file)
            .then(img => addTexture(file.name, img))
    const [ref, isDragging] = useFileUpload<HTMLDivElement>(imageExtensions, uploadTexture)

    return (
        <div className="flex flex-col h-full">
            <div ref={ref} className={`rounded-sm ${isDragging ? 'bg-red-800' : 'dark:bg-gray-800 bg-gray-100'} flex flex-col overflow-hidden flex-grow h-0`}>
                <div className="dark:bg-gray-900 bg-white dark:text-gray-400 text-black font-bold text-xs p-1 flex flex-row">
                    <p className="flex-grow mt-1 ml-1">TEXTURE GROUPS</p>
                    <p className="flex flex-row">
                        <ButtonWithTooltip className="icon-button" onClick={addGroup} tooltip="New Texture Group"><SVGPlus className="h-4 w-4 mr-1" /></ButtonWithTooltip>
                    </p>
                </div>
                <div className="flex flex-col overflow-y-scroll overflow-x-hidden h-3/6 w-full pr-6 studio-scrollbar">
                    {hasProject && <GroupList project={getSelectedProject()} />}
                </div>
                <div className="dark:bg-gray-900 bg-white dark:text-gray-400 text-black font-bold text-xs p-1 flex flex-row">
                    <p className="flex-grow mt-1 ml-1">TEXTURES</p>
                    <p className="flex flex-row">
                        <ButtonWithTooltip onClick={() => addTexture()} className="icon-button" tooltip="New Texture"><SVGPlus className="h-4 w-4 mr-1" /></ButtonWithTooltip>
                        <ClickableInput
                            onFile={uploadTexture}
                            accept={imageExtensions}
                            multiple
                            description="Texture Files"
                            className="icon-button"
                            tooltip="Upload Texture Files"
                        >
                            <SVGUpload className="h-4 w-4 mr-1" />
                        </ClickableInput>
                    </p>
                </div>
                <div className="flex flex-row overflow-hidden h-full w-full">
                    {hasProject && <TextureLists project={getSelectedProject()} />}
                </div>

            </div>
        </div>
    )
}

const GroupList = ({ project }: { project: DcProject }) => {
    const [selectedGroup, setSelectedGroup] = useListenableObject(project.textureManager.selectedGroup)
    const [groups, setGroups] = useListenableObject(project.textureManager.groups)

    const removeGroup = (group: TextureGroup) => setGroups(groups.filter(g => g !== group))

    return (
        <>
            {groups.map(g =>
                <GroupEntry
                    key={g.identifier}
                    onClick={() => setSelectedGroup(g)}
                    group={g}
                    selected={g === selectedGroup}
                    removeGroup={() => removeGroup(g)}
                />
            )}
        </>
    )
}

const GroupEntry = ({ group, selected, onClick, removeGroup }: { group: TextureGroup, selected: boolean, onClick: () => void, removeGroup: () => void }) => {
    return (
        <div onClick={onClick} className={(selected ? "bg-green-500" : "dark:bg-gray-700 bg-gray-200 dark:text-white text-black") + " my-1 ml-2 rounded-sm h-8 text-left pl-2 w-full flex flex-row"}>
            <DblClickEditLO obj={group.name} disabled={group.isDefault} className="flex-grow m-auto mr-5 truncate text-left " inputClassName="p-0 w-full h-full bg-gray-500 text-black" />
            <p className="mr-2 flex flex-row text-white">
                <ButtonWithTooltip className={(selected ? "bg-green-600 hover:bg-green-700" : "dark:bg-gray-800 bg-gray-300 dark:hover:bg-gray-900 hover:bg-gray-400 dark:text-white text-black") + " rounded pr-2 pl-2 py-0.5 my-0.5 " + (group.isDefault ? '' : 'mr-1')} tooltip="Download Group"><SVGDownload className="h-4 w-4" /></ButtonWithTooltip>
                {!group.isDefault && <ButtonWithTooltip onClick={e => { removeGroup(); e.stopPropagation() }} className={(selected ? "bg-green-600 hover:bg-green-700" : "dark:bg-gray-800 bg-gray-300 dark:hover:bg-gray-900 hover:bg-gray-400 dark:text-white text-black") + " rounded pr-2 pl-2 py-0.5 my-0.5 group"} tooltip="Remove Group"><SVGCross className="h-4 w-4 group-hover:text-red-500" /></ButtonWithTooltip>}
            </p>
        </div>
    )
}

type DraggableContextType = {
    startDragging: (texture: Texture) => void
    currentlyDragging: Texture | null,
    droppedOntoLocation?: { x: number, y: number, width?: number }
    setDroppedOntoLocation: ({ x, y, width }?: { x: number, y: number, width?: number }) => void
    dropTextureAt: (texture: Texture | undefined, isSelected: boolean) => void
}
const DraggableContext = createContext<DraggableContextType | null>(null)

const emptySpan = document.createElement("span")
const overlayDiv = document.getElementById("overlay")

const TextureLists = ({ project }: { project: DcProject }) => {
    const [selectedGroup] = useListenableObject(project.textureManager.selectedGroup)

    const [draggingTexture, setDraggingTexture] = useState<Texture | null>(null)

    const droppedOntoLocationRef = useRef<{ x: number, y: number, width?: number }>()
    // const [droppedOntoLocation, setDroppedOntoLocation] = useState<{ x: number, y: number }>()

    //I need to refresh the entire thing at the moment when 
    //A texture is placed, so the animation looks nice.
    //Currently, when a texture is placed, it performs the actual change then
    //animates the movement.
    //A better way would be to perform the movement, then apply the actual change.
    const [numTimesRefresh, setNumTimesRefreshed] = useState(0)

    if (selectedGroup.isDefault) {
        return (
            <div className="flex-grow flex-col dark:border-l border-black overflow-y-scroll overflow-x-hidden pr-4 studio-scrollbar" style={{ flexBasis: '0' }}> {/* Flex basis is to make the columns equal. TODO: tailwind. */}
                <SelectableTextureList project={project} isSelected />
            </div>
        )
    }

    const dropTextureAt = (texture: Texture | undefined, isSelected: boolean) => {
        if (draggingTexture === null) {
            return
        }
        const isDraggingSelected = selectedGroup.textures.value.includes(draggingTexture.identifier)

        const from = isDraggingSelected ? selectedGroup.textures : selectedGroup.unselectedTextures
        const to = isSelected ? selectedGroup.textures : selectedGroup.unselectedTextures


        from.value = from.value.filter(f => f !== draggingTexture.identifier)
        const newVal = [...to.value]
        newVal.splice(texture === undefined ? to.value.length : to.value.indexOf(texture.identifier), 0, draggingTexture.identifier)
        to.value = newVal

        setNumTimesRefreshed(numTimesRefresh + 1)
    }


    return (
        <>
            <DraggableContext.Provider
                key={numTimesRefresh}
                value={{
                    startDragging: setDraggingTexture,
                    currentlyDragging: draggingTexture,
                    dropTextureAt,
                    droppedOntoLocation: droppedOntoLocationRef.current,
                    setDroppedOntoLocation: val => droppedOntoLocationRef.current = val,
                }}
            >
                <div className="flex-grow flex flex-col border-r border-black w-1/2">
                    <div className="dark:bg-gray-800 bg-gray-300 dark:text-gray-400 text-black font-bold text-xs px-2 flex flex-row dark:border-b border-black">
                        <p className="flex-grow">SELECTED</p>
                    </div>
                    <div className="overflow-y-scroll overflow-x-hidden studio-scrollbar h-full w-full">
                        <SelectableTextureList project={project} isSelected={true} />
                    </div>
                </div>
                <div className="flex-grow flex flex-col w-1/2">
                    <div className="dark:bg-gray-800 bg-gray-300 dark:text-gray-400 text-black font-bold text-xs px-2 flex flex-row dark:border-b border-black">
                        <p className="flex-grow">AVAILABLE</p>
                    </div>
                    <div className="overflow-y-scroll overflow-x-hidden studio-scrollbar h-full w-full">
                        <SelectableTextureList project={project} isSelected={false} />
                    </div>
                </div>
            </DraggableContext.Provider>
        </>
    )
}

const SelectableTextureList = ({ project, isSelected }: { project: DcProject, isSelected: boolean }) => {
    const context = useContext(DraggableContext)
    const [selectedGroup] = useListenableObject(project.textureManager.selectedGroup)
    const [texturesToUse] = useListenableObject(isSelected ? selectedGroup.textures : selectedGroup.unselectedTextures)

    const [textures] = useListenableObject(project.textureManager.textures)

    const selectedTextures = useMemo(() =>
        texturesToUse
            .map(id => textures.find(t => t.identifier === id))
            .filter((texture): texture is Texture => texture !== undefined),
        [texturesToUse])

    const onDragOnto = (texture?: Texture) => {
        if (!context) {
            return
        }
        context.dropTextureAt(texture, isSelected)
    }

    return (
        <div className="h-full"
            onDragOver={e => {
                //A texture is dragged over this
                if (!context || !context.currentlyDragging) {
                    return
                }
                // setIsDraggedOver(true)
                e.stopPropagation()
                e.preventDefault()
            }}
            onDragLeave={e => {
                //We don't want to listen to events from children
                if (e.currentTarget.contains(e.nativeEvent.relatedTarget as any)) {
                    return
                }
                // setIsDraggedOver(false)
                e.preventDefault()
                e.stopPropagation()
            }}

            onDropCapture={() => {
                if (!context) {
                    return
                }
                // setIsDraggedOver(false)
                onDragOnto()
            }}
        >
            {selectedTextures
                .map((t, i) =>
                    <GroupTextureSwitchEntryContainer key={t.identifier} texture={t} selected={isSelected} droppedOnto={() => onDragOnto(t)} />
                )}
        </div>
    )

}

const heightClass = "h-[50px]"
const maxWHeightClass = "max-w-[50px]"

const GroupTextureSwitchEntryContainer = ({ texture, selected, droppedOnto }: { texture: Texture, selected: boolean, droppedOnto: () => void }) => {
    const context = useContext(DraggableContext)

    const [isBeingDragged, setIsDragging] = useState(false)
    const [isDraggedOver, setIsDraggedOver] = useState(false)

    const draggingRef = useRef<HTMLDivElement>(null)
    const draggingOffsetRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 })
    const dragStartWidth = useRef<number>()


    const [isAnimatingToPlace, setIsAnimatingToPlace] = useState(context && context.currentlyDragging !== null && context.droppedOntoLocation !== null && context.currentlyDragging === texture)
    const animationTarget = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isAnimatingToPlace) {
            const current = draggingRef.current
            if (current && animationTarget.current && context && context.droppedOntoLocation) {
                const location = context.droppedOntoLocation

                current.style.left = location.x + "px"
                current.style.top = location.y + "px"
                current.style.transition = "all 300ms"

                const rect = animationTarget.current.getBoundingClientRect()
                current.style.left = rect.left + "px"
                current.style.top = rect.top + "px"
            }

            setTimeout(() => {
                if (current) {
                    current.style.animation = ""
                }
                setIsAnimatingToPlace(false)
            }, 300)
        }
    }, [isAnimatingToPlace, context])

    const { darkMode } = useOptions()

    return (
        <div
            className={"transition-all duration-300 pr-2 " + (isBeingDragged ? "h-0" : isDraggedOver ? "pt-20" : "pt-2")}
            onDragOver={e => {
                //A texture is dragged over this
                if (!context || !context.currentlyDragging) {
                    return
                }
                setIsDraggedOver(true)
                e.stopPropagation()
                e.preventDefault()
            }}
            onDragLeave={e => {
                //We don't want to listen to events from children
                if (e.currentTarget.contains(e.nativeEvent.relatedTarget as any)) {
                    return
                }
                setIsDraggedOver(false)
                e.preventDefault()
                e.stopPropagation()
            }}

            onDropCapture={() => {
                if (!context) {
                    return
                }
                setIsDraggedOver(false)
                droppedOnto()
            }}

        >
            <div
                className="cursor-pointer"
                onDragStart={e => {
                    if (!context) {
                        return
                    }
                    dragStartWidth.current = animationTarget.current?.clientWidth
                    draggingOffsetRef.current.x = e.nativeEvent.offsetX
                    draggingOffsetRef.current.y = e.nativeEvent.offsetY
                    e.dataTransfer.setDragImage(emptySpan, 0, 0)

                    //Bug in chrome with modifying the mod on drag start: https://stackoverflow.com/a/36617714
                    setTimeout(() => {
                        setIsDragging(true)
                        context.startDragging(texture)
                    }, 1)
                    e.stopPropagation()
                }}
                onDrag={e => {
                    if (!context) {
                        return
                    }
                    if (draggingRef.current && (e.clientX !== 0 || e.clientY !== 0)) {
                        const x = (e.clientX - draggingOffsetRef.current.x)
                        const y = (e.clientY - draggingOffsetRef.current.y)
                        const width = draggingRef.current?.clientWidth

                        context.setDroppedOntoLocation({ x, y, width })

                        draggingRef.current.style.left = x + "px"
                        draggingRef.current.style.top = y + "px"
                    }
                    e.preventDefault()
                }}
                onDragEnd={e => {
                    if (!context) {
                        return
                    }
                    setIsDragging(false)
                    e.preventDefault()
                    e.stopPropagation()
                }}

                draggable
            >
                <div ref={animationTarget} className={(isAnimatingToPlace ? heightClass : "") + (isBeingDragged ? " hidden" : "")}>
                    {!isAnimatingToPlace && <GroupTextureSwitchEntry texture={texture} selected={selected} />}
                </div>
            </div>
            {overlayDiv !== null && (isBeingDragged || isAnimatingToPlace) && createPortal(
                <div ref={draggingRef} className={"absolute " + (darkMode ? "dark" : "")} style={{
                    width: isAnimatingToPlace ? context?.droppedOntoLocation?.width : dragStartWidth.current
                }}>
                    <GroupTextureSwitchEntry texture={texture} selected={selected} />
                </div>, overlayDiv)}
        </div>
    )
}

const GroupTextureSwitchEntry = ({ texture, selected }: { texture: Texture, selected: boolean }) => {
    const ref = useTextureDomRef<HTMLDivElement>(texture, undefined, img => img.draggable = false)
    return (
        <div className={(selected ? "bg-green-500" : "dark:bg-gray-700 bg-gray-200 dark:text-white text-black") + " ml-2 rounded-sm text-left pl-2 w-full h-[50px] flex flex-row pr-0.5"}
        >
            <div className={"table p-1 " + heightClass + " " + maxWHeightClass}>
                <div ref={ref} className="table-cell align-middle pl-0">
                </div>
            </div>
            <DblClickEditLO obj={texture.name} className="flex-grow m-auto mr-5 truncate text-left " inputClassName="p-0 w-full h-full bg-gray-500 text-black" />
            <p className="flex flex-col text-white items-center justify-center">
                <ButtonWithTooltip className={(selected ? "bg-green-600 hover:bg-green-700" : "dark:bg-gray-800 bg-gray-300 dark:hover:bg-gray-900 hover:bg-gray-400 dark:text-white text-black") + " rounded h-5 w-5 p-0.5 mb-1"} tooltip="Download Texture"><SaveIcon className="h-4 w-4" /></ButtonWithTooltip>
                <ButtonWithTooltip onClick={e => { ; e.stopPropagation() }} className={(selected ? "bg-green-600 hover:bg-green-700" : "dark:bg-gray-800 bg-gray-300 dark:hover:bg-gray-900 hover:bg-gray-400 dark:text-white text-black") + " rounded group h-5 w-5 p-0.5"} tooltip="Delete Texture"><SVGCross className="h-4 w-4 group-hover:text-red-500" /></ButtonWithTooltip>
            </p>
        </div>
    )
}

export default ProjectTextures