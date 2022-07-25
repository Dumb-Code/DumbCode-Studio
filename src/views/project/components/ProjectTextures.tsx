import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import ClickableInput from "../../../components/ClickableInput"
import { DblClickEditLO } from "../../../components/DoubleClickToEdit"
import { SVGCross, SVGDownload, SVGPlus, SVGUpload } from "../../../components/Icons"
import { ButtonWithTooltip } from "../../../components/Tooltips"
import { useCreatePortal } from "../../../contexts/CreatePortalContext"
import { useStudio } from "../../../contexts/StudioContext"
import { useToast } from "../../../contexts/ToastContext"
import { FileSystemsAccessApi, ReadableFile, SaveIcon } from "../../../studio/files/FileTypes"
import DcProject, { removeFileExtension } from "../../../studio/formats/project/DcProject"
import { Texture, TextureGroup, useTextureDomRef } from "../../../studio/formats/textures/TextureManager"
import { useListenableObject } from "../../../studio/listenableobject/ListenableObject"
import { writeImgToBlob } from "../../../studio/util/Utils"
import { ProjectFileAreaBase, ProjectFileAreaHeader } from "./ProjectFileArea"

const imageExtensions = [".png", ".jpeg", ".gif"]


const ProjectTextures = () => {
    const { getSelectedProject, hasProject } = useStudio()

    const addGroup = () => {
        const manager = getSelectedProject().textureManager
        manager.addGroup(new TextureGroup(manager, "New Group", false))
    }

    const addTexture = (name?: string, img?: HTMLImageElement) => {
        getSelectedProject().textureManager.addTexture(name, img)
    }

    const uploadTexture = async (readable: ReadableFile) => {
        getSelectedProject().textureManager.addFile(readable)
    }

    return (
        <ProjectFileAreaBase extensions={imageExtensions} onChange={uploadTexture}>
            <ProjectFileAreaHeader title="Texture Groups">
                <ButtonWithTooltip className="icon-button" onClick={addGroup} tooltip="New Texture Group">
                    <SVGPlus className="h-4 w-4 mr-1" />
                </ButtonWithTooltip>
            </ProjectFileAreaHeader>
            <div className="flex flex-col overflow-y-scroll overflow-x-hidden h-3/6 w-full pr-6 studio-scrollbar">
                {hasProject && <GroupList project={getSelectedProject()} />}
            </div>

            <ProjectFileAreaHeader title="Textures">
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
            </ProjectFileAreaHeader>
            <div className="flex flex-row overflow-hidden h-full w-full">
                {hasProject && <TextureLists project={getSelectedProject()} />}
            </div>
        </ProjectFileAreaBase>
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
    setDroppedOntoLocation: ({ x, y, width }: { x: number, y: number, width?: number }) => void
    dropTextureAt: (texture: Texture | undefined, isSelected: boolean) => void
}
const DraggableContext = createContext<DraggableContextType | null>(null)

const emptySpan = (typeof window !== "undefined" && document.createElement("span")) as HTMLSpanElement

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


    const dropTextureAt = (texture: Texture | undefined, isSelected: boolean) => {
        if (draggingTexture === null) {
            return
        }
        selectedGroup.toggleTexture(draggingTexture, isSelected, texture?.identifier)
        setNumTimesRefreshed(numTimesRefresh + 1)
    }

    const contextType: DraggableContextType = {
        startDragging: setDraggingTexture,
        currentlyDragging: draggingTexture,
        dropTextureAt,
        droppedOntoLocation: droppedOntoLocationRef.current,
        setDroppedOntoLocation: val => droppedOntoLocationRef.current = val,
    }

    if (selectedGroup.isDefault) {
        return (
            <DraggableContext.Provider
                key={numTimesRefresh}
                value={contextType}
            >
                <div className="flex-grow flex-col dark:border-l border-black overflow-y-scroll overflow-x-hidden pr-4 studio-scrollbar" style={{ flexBasis: '0' }}> {/* Flex basis is to make the columns equal. TODO: tailwind. */}
                    <SelectableTextureList project={project} isSelected />
                </div>
            </DraggableContext.Provider >
        )
    }



    return (
        <DraggableContext.Provider
            key={numTimesRefresh}
            value={contextType}
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
        [texturesToUse, textures])

    const onDragOnto = () => {
        if (!context) {
            return
        }
        context.dropTextureAt(context.currentlyDragging ?? undefined, isSelected)
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
                    <GroupTextureSwitchEntryContainer key={t.identifier} texture={t} selected={isSelected} />
                )}
        </div>
    )

}

const heightClass = "h-[50px]"
const maxWHeightClass = "max-w-[50px]"

const GroupTextureSwitchEntryContainer = ({ texture, selected }: { texture: Texture, selected: boolean }) => {
    const context = useContext(DraggableContext)
    const createPortal = useCreatePortal()

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
            onDragEnter={e => {
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
                // This is handled in the parent onDropCapture
                // droppedOnto()
                // e.stopPropagation()
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
            {(isBeingDragged || isAnimatingToPlace) && createPortal(
                <div ref={draggingRef} className="absolute" style={{
                    width: isAnimatingToPlace ? context?.droppedOntoLocation?.width : dragStartWidth.current
                }}>
                    <GroupTextureSwitchEntry texture={texture} selected={selected} />
                </div>
            )}
        </div>
    )
}

const GroupTextureSwitchEntry = ({ texture, selected }: { texture: Texture, selected: boolean }) => {
    const ref = useTextureDomRef<HTMLDivElement>(texture, undefined, useCallback((img: HTMLImageElement) => img.draggable = false, []))

    const [isTextureDirty, setIsTextureDirty] = useListenableObject(texture.needsSaving)
    const [saveableFile, setSaveableFile] = useListenableObject(texture.saveableFile)

    const { addToast } = useToast()

    const saveTexture = async () => {
        const name = await texture.textureWritableFile.write(texture.name.value + ".png", writeImgToBlob(texture.element.value))
        texture.name.value = removeFileExtension(name)
        setIsTextureDirty(false)
        setSaveableFile(true)
        addToast(`Saved texture as ${name}`, "success")
    }

    const unlinkTexture = () => {
        if (!saveable) {
            return
        }
        texture.textureWritableFile.unlink?.()
        setSaveableFile(false)
        addToast(`Unlinked texture`, "success")
    }

    const deleteTexture = async () => {
        texture.delete()
        addToast("Deleted texture", "success")
    }


    const iconClassName = (
        selected ?
            "bg-green-600 hover:bg-green-700" :
            "dark:bg-gray-800 bg-gray-300 dark:hover:bg-gray-900 hover:bg-gray-400 dark:text-white text-black"
    )
        + " rounded group h-5 w-5 p-0.5"

    const saveable = saveableFile && FileSystemsAccessApi

    return (
        <div className={(selected ? "bg-green-500" : "dark:bg-gray-700 bg-gray-200 dark:text-white text-black") + " ml-2 rounded-sm text-left pl-2 w-full h-[50px] flex flex-row pr-0.5"}
        >
            <div className={"table p-1 " + heightClass + " " + maxWHeightClass}>
                <div ref={ref} className="table-cell align-middle pl-0 ">
                </div>
            </div>
            <DblClickEditLO obj={texture.name} className="flex-grow m-auto mr-5 truncate text-left " inputClassName="p-0 w-full h-full bg-gray-500 text-black" />
            <p className="flex flex-col text-white items-center justify-center">
                <ButtonWithTooltip
                    onClick={e => { saveTexture(); e.stopPropagation() }}
                    onContextMenu={e => { unlinkTexture(); e.stopPropagation(); e.preventDefault() }}
                    className={iconClassName + " mb-1 "} tooltip={saveable ? "Save Texture\nRight Click to unlink" : "Download Texture"}>
                    <SaveIcon className={"h-4 w-4 " + (isTextureDirty ? "text-red-500" : "")} />
                </ButtonWithTooltip>
                <ButtonWithTooltip
                    onClick={e => { deleteTexture(); e.stopPropagation() }}
                    className={iconClassName}
                    tooltip="Delete Texture"
                >
                    <SVGCross className="h-4 w-4 group-hover:text-red-500" />
                </ButtonWithTooltip>
            </p>
        </div>
    )
}

export default ProjectTextures