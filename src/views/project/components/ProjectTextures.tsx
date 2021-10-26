import { ReactSortable, ItemInterface } from "react-sortablejs"
import ClickableInput from "../../../components/ClickableInput"
import { DblClickEditLO } from "../../../components/DoubleClickToEdit"
import { SVGCross, SVGDownload, SVGPlus, SVGUpload } from "../../../components/Icons"
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
        const groups = getSelectedProject().textureManager.groups
        groups.value = groups.value.concat([new TextureGroup("New Group", false)])
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
            <div ref={ref} className={`rounded-sm ${isDragging ? 'bg-red-800' : 'dark:bg-gray-800 bg-gray-100'} flex flex-col overflow-hidden flex-grow`}>
                <div className="dark:bg-gray-900 bg-white dark:text-gray-400 text-black font-bold text-xs p-1 flex flex-row">
                    <p className="flex-grow mt-1 ml-1">TEXTURE GROUPS</p>
                    <p className="flex flex-row">
                        <button className="icon-button" onClick={addGroup}><SVGPlus className="h-4 w-4 mr-1" /></button>
                    </p>
                </div>
                <div className="flex flex-col overflow-y-scroll h-3/6 w-full pr-6">
                    {hasProject && <GroupList project={getSelectedProject()} />}
                </div>
                <div className="dark:bg-gray-900 bg-white dark:text-gray-400 text-black font-bold text-xs p-1 flex flex-row">
                    <p className="flex-grow mt-1 ml-1">TEXTURES</p>
                    <p className="flex flex-row">
                        <button onClick={() => addTexture()} className="icon-button"><SVGPlus className="h-4 w-4 mr-1" /></button>
                        <ClickableInput
                            onFile={uploadTexture}
                            accept={imageExtensions}
                            multiple
                            description="Texture Files"
                            className="icon-button"
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

class WrappedTexture implements ItemInterface {
    id: string;
    texture: Texture

    constructor(tex: Texture) {
        this.id = tex.identifier
        this.texture = tex
    }
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
                <button className={(selected ? "bg-green-600 hover:bg-green-700" : "dark:bg-gray-800 bg-gray-300 dark:hover:bg-gray-900 hover:bg-gray-400 dark:text-white text-black") + " rounded pr-2 pl-2 py-0.5 my-0.5 " + (group.isDefault ? '' : 'mr-1')}><SVGDownload className="h-4 w-4" /></button>
                {!group.isDefault && <button onClick={e => { removeGroup(); e.stopPropagation() }} className={(selected ? "bg-green-600 hover:bg-green-700" : "dark:bg-gray-800 bg-gray-300 dark:hover:bg-gray-900 hover:bg-gray-400 dark:text-white text-black") + " rounded pr-2 pl-2 py-0.5 my-0.5 group"}><SVGCross className="h-4 w-4 group-hover:text-red-500" /></button>}
            </p>
        </div>
    )
}

const TextureLists = ({ project }: { project: DcProject }) => {
    const [selectedGroup] = useListenableObject(project.textureManager.selectedGroup)
    if (selectedGroup.isDefault) {
        return (
            <div className="flex-grow flex-col border-l border-black overflow-y-scroll overflow-x-hidden pr-4" style={{ flexBasis: '0' }}> {/* Flex basis is to make the columns equal. TODO: tailwind. */}
                <SelectedTexturesList project={project} />
            </div>
        )
    }
    return (
        <>
            <div className="flex-grow flex flex-col overflow-y-scroll overflow-x-hidden" style={{ flexBasis: '0' }}> {/* Flex basis is to make the columns equal. TODO: tailwind. */}
                <div className="dark:bg-gray-800 bg-gray-300 dark:text-gray-400 text-black font-bold text-xs px-2 flex flex-row dark:border-b border-black mb-2">
                    <p className="flex-grow">SELECTED</p>
                </div>
                <SelectedTexturesList project={project} />
            </div>
            <div className="flex-grow flex flex-col overflow-y-scroll overflow-x-hidden" style={{ flexBasis: '0' }}> {/* Flex basis is to make the columns equal. TODO: tailwind. */}
                <div className="dark:bg-gray-800 bg-gray-300 dark:text-gray-400 text-black font-bold text-xs px-2 flex flex-row dark:border-b border-black mb-2">
                    <p className="flex-grow">AVAILABLE</p>
                </div>
                <NonSelectedTextures project={project} />
            </div>
        </>
    )
}

const SelectedTexturesList = ({ project }: { project: DcProject }) => {

    const [selectedGroup] = useListenableObject(project.textureManager.selectedGroup)
    const [selectedGroupTextures, setSelectedGroupTextures] = useListenableObject(selectedGroup.textures)

    const [textures] = useListenableObject(project.textureManager.textures)

    const selectedTextures = selectedGroupTextures
        .map(g => textures.find(t => t.identifier === g))
        .filter((g): g is Texture => g !== undefined)
        .map(g => new WrappedTexture(g))

    return (
        <ReactSortable
            // Again, sortable.js is kinda wack, and we need to cause a complete remount of the list to have the changed props in effect
            key={`group.sortable.1.${selectedGroup.isDefault}`}
            list={selectedTextures}
            setList={list => {
                const list1 = list.map(l => l.id)
                const list2 = selectedGroupTextures
                if (list1.length !== list2.length || list1.some((l, i) => l !== list2[i])) {
                    //Fuck sortable js and it's DOM changing shit
                    //Might be fixed by moving to onMove
                    setTimeout(() => setSelectedGroupTextures(list1), 1)
                }
            }}
            animation={150}
            fallbackOnBody
            className="flex-grow pr-4 h-0"
            group={{ name: 'textures-on-group', pull: true, put: true }}
        >
            {selectedTextures
                .map(t =>
                    <GroupTextureSwitchEntry key={t.id} texture={t.texture} selected={true} />
                )
            }
        </ReactSortable>

    )
}

const NonSelectedTextures = ({ project }: { project: DcProject }) => {
    const [selectedGroup] = useListenableObject(project.textureManager.selectedGroup)
    const [selectedGroupTextures] = useListenableObject(selectedGroup.textures)

    const [textures] = useListenableObject(project.textureManager.textures)

    const notSelectedTextures = textures
        .filter(t => !selectedGroupTextures.includes(t.identifier))
        .map(t => new WrappedTexture(t))

    return (
        <ReactSortable
            key={`group.sortable.2.${selectedGroup.isDefault}`}
            list={notSelectedTextures}
            setList={() => { }}
            animation={150}
            fallbackOnBody
            className="flex-grow pr-4 h-0"
            group={{ name: 'textures-on-group', pull: true, put: true }}
        >
            {notSelectedTextures.map((t) =>
                <GroupTextureSwitchEntry key={t.id} texture={t.texture} selected={false} />
            )}
        </ReactSortable>
    )
}

const GroupTextureSwitchEntry = ({ texture, selected }: { texture: Texture, selected: boolean }) => {

    const ref = useTextureDomRef<HTMLDivElement>(texture)

    const height = 50
    return (
        <div className={(selected ? "bg-green-500" : "dark:bg-gray-700 bg-gray-200 dark:text-white text-black") + " my-2 ml-2 rounded-sm text-left pl-2 w-full flex flex-row pr-0.5"}>
            <div className="table" style={{ height: `${height}px`, maxWidth: `${height}px` }}>
                <div ref={ref} className="table-cell align-middle p-1 pl-0">
                </div>
            </div>
            <DblClickEditLO obj={texture.name} className="flex-grow m-auto mr-5 truncate text-left " inputClassName="p-0 w-full h-full bg-gray-500 text-black" />
            <p className="flex flex-col text-white items-center justify-center">
                <button className={(selected ? "bg-green-600 hover:bg-green-700" : "dark:bg-gray-800 bg-gray-300 dark:hover:bg-gray-900 hover:bg-gray-400 dark:text-white text-black") + " rounded h-5 w-5 p-0.5 mb-1"}><SaveIcon className="h-4 w-4" /></button>
                <button onClick={e => { ; e.stopPropagation() }} className={(selected ? "bg-green-600 hover:bg-green-700" : "dark:bg-gray-800 bg-gray-300 dark:hover:bg-gray-900 hover:bg-gray-400 dark:text-white text-black") + " rounded group h-5 w-5 p-0.5"}><SVGCross className="h-4 w-4 group-hover:text-red-500" /></button>
            </p>
        </div>
    )
}

export default ProjectTextures