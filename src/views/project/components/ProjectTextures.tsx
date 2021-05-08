import { ReactSortable, ItemInterface } from "react-sortablejs"
import { utils } from "sortablejs"
import ClickableInput from "../../../components/ClickableInput"
import { DblClickEditLO } from "../../../components/DoubleClickToEdit"
import { SVGCross, SVGDownload, SVGPlus, SVGUpload } from "../../../components/Icons"
import { useStudio } from "../../../contexts/StudioContext"
import DcProject from "../../../studio/formats/DcProject"
import { Texture, TextureGroup, useTextureDomRef } from "../../../studio/formats/textures/TextureManager"
import { ReadableFile, readFileDataUrl } from "../../../studio/util/FileTypes"
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

//The wrapper helps with the complete refreshing of all states when the project is changed.
//This is done by setting the key of the element ot the project identifier. When that changes,
//It's unmounted and remounted.
const ProjectTexturesWrapper = () => {
    const { selectedProject } = useStudio()
    return <ProjectTextures key={selectedProject.identifier} project={selectedProject} />
}

const ProjectTextures = ({ project }: { project: DcProject }) => {
    const [selectedGroup, setSelectedGroup] = useListenableObject(project.textureManager.selectedGroup)
    const [selectedGroupTextures, setSelectedGroupTextures] = useListenableObject(selectedGroup.textures)

    const [groups, setGroup] = useListenableObject(project.textureManager.groups)
    const [textures] = useListenableObject(project.textureManager.textures)

    const mappedTextures = textures.map(t => new WrappedTexture(t))
    const selectedTextures = selectedGroupTextures
        .map(g => {
            const found = mappedTextures.find(t => t.id === g)
            if (found === undefined) {
                throw new Error("Unable to find texture with identifier " + g)
            }
            return found
        })
    const notSelectedTextures = mappedTextures.filter(t => !selectedGroupTextures.includes(t.id))

    const addGroup = () => setGroup(groups.concat([new TextureGroup("New Group", false)]))

    const defaultProject = project.isDefaultProject

    return (
        <div className="flex flex-col h-full">
            <div className="rounded-sm bg-gray-800 flex flex-col overflow-hidden flex-grow">
                <div className="bg-gray-900 text-gray-400 font-bold text-xs p-1 flex flex-row">
                    <p className="flex-grow mt-1 ml-1">TEXTURE GROUPS</p>
                    <p className="flex flex-row">
                        <button disabled={defaultProject} className="bg-gray-800 hover:bg-black rounded pr-1 pl-2 py-1 my-0.5 mr-1" onClick={addGroup}><SVGPlus className="h-4 w-4 mr-1" /></button>
                    </p>
                </div>
                <div className="flex flex-col overflow-y-scroll h-3/6 w-full pr-6">
                    {
                        defaultProject ?
                            <div>No Model</div> :
                            groups.map(g =>
                                <GroupEntry key={g.identifier} onClick={() => setSelectedGroup(g)} group={g} selected={g === selectedGroup} />
                            )
                    }
                </div>
                <div className="bg-gray-900 text-gray-400 font-bold text-xs p-1 flex flex-row">
                    <p className="flex-grow mt-1 ml-1">TEXTURES</p>
                    <p className="flex flex-row">
                        <button disabled={defaultProject} onClick={() => project.textureManager.addTexture()} className="bg-gray-800 hover:bg-black rounded pr-1 pl-2 py-1 my-0.5 mr-1"><SVGPlus className="h-4 w-4 mr-1" /></button>
                        <ClickableInput
                            onFile={file => readFileToImg(file).then(img => project.textureManager.addTexture(file.name, img))}
                            accept={imageExtensions}
                            disabled={defaultProject}
                            multiple
                            description="Texture Files"
                            className="bg-gray-800 hover:bg-black rounded pr-1 pl-2 py-1 my-0.5 mr-1"
                        >
                            <SVGUpload className="h-4 w-4 mr-1" />
                        </ClickableInput>
                    </p>
                </div>
                {defaultProject ?
                    <div className="h-full w-full"> No Model</div>
                    :
                    <div className="flex flex-row overflow-hidden h-full w-full">
                        <div className="flex-grow flex flex-col border-l border-black overflow-y-scroll overflow-x-hidden pr-4" style={{ flexBasis: '0' }}> {/* Flex basis is to make the columns equal. TODO: tailwind. */}
                            <div className="bg-gray-800 text-gray-400 font-bold text-xs px-2 flex flex-row border-b border-black mb-2">
                                <p className="flex-grow">SELECTED</p>
                            </div>
                            <ReactSortable
                                // Again, sortable.js is kinda wack, and we need to cause a complete remount of the list to have the changed props in effect
                                key={`group.sortable.1.${selectedGroup.isDefault}`}
                                list={selectedTextures}
                                setList={(list, _, d) => {
                                    if (d.dragging !== null) {
                                        const list1 = list.map(l => l.id)
                                        const list2 = selectedGroupTextures
                                        if (list1.length !== list2.length || list1.some((l, i) => l !== list2[i])) {
                                            //Fuck sortable js and it's DOM changing shit
                                            //Might be fixed by moving to onMove
                                            setTimeout(() => setSelectedGroupTextures(list1), 1)
                                        }
                                    }
                                }}
                                animation={150}
                                fallbackOnBody
                                className="flex-grow"
                                disabled={selectedGroup.isDefault}
                                group={{ name: 'textures-on-group', pull: true, put: true }}
                            >
                                {selectedTextures
                                    .map(t =>
                                        <GroupTextureSwitchEntry key={t.id} texture={t.texture} selected={true} />
                                    )
                                }
                            </ReactSortable>
                        </div>
                        <div className="flex-grow flex flex-col border-r border-black overflow-y-scroll overflow-x-hidden pr-4" style={{ flexBasis: '0' }}>
                            <div className="bg-gray-800 text-gray-400 font-bold text-xs px-2 flex flex-row border-b border-black mb-2">
                                <p className="flex-grow">AVALIBLE</p>
                            </div>
                            <ReactSortable
                                key={`group.sortable.2.${selectedGroup.isDefault}`}
                                list={notSelectedTextures}
                                setList={() => { }}
                                animation={150}
                                fallbackOnBody
                                className="flex-grow"
                                disabled={selectedGroup.isDefault}
                                group={{ name: 'textures-on-group', pull: true, put: true }}
                            >
                                {notSelectedTextures.map((t) =>
                                    <GroupTextureSwitchEntry key={t.id} texture={t.texture} selected={false} />
                                )}
                            </ReactSortable>
                        </div>
                    </div>
                }
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

const GroupEntry = ({ group, selected, onClick }: { group: TextureGroup, selected: boolean, onClick: () => void }) => {
    return (
        <div onClick={onClick} className={(selected ? "bg-green-500" : "bg-gray-700 text-white") + " my-1 ml-2 rounded-sm h-8 text-left pl-2 w-full flex flex-row"}>
            <DblClickEditLO obj={group.name} className="flex-grow m-auto mr-5 truncate text-left " inputClassName="p-0 w-full h-full bg-gray-500 text-black" />
            <p className="mr-2 flex flex-row text-white">
                <button className={(selected ? "bg-green-600 hover:bg-green-700" : "bg-gray-800 hover:bg-gray-900") + " rounded pr-2 pl-2 py-0.5 my-0.5 mr-1"}><SVGDownload className="h-4 w-4" /></button>
                <button className={(selected ? "bg-green-600 hover:bg-green-700" : "bg-gray-800 hover:bg-gray-900") + " rounded pr-2 pl-2 py-0.5 my-0.5 group"}><SVGCross className="h-4 w-4 group-hover:text-red-500" /></button>
            </p>
        </div>
    )
}

const GroupTextureSwitchEntry = ({ texture, selected }: { texture: Texture, selected: boolean }) => {

    const ref = useTextureDomRef<HTMLDivElement>(texture)

    const height = 50
    return (
        <div className={(selected ? "bg-green-500" : "bg-gray-700 text-white") + " my-2 ml-2 rounded-sm text-left pl-2 w-full flex flex-row pr-6"}>
            <div className="table" style={{height: `${height}px`, maxWidth: `${height}px`}}>
                <div ref={ref} className="table-cell align-middle">
                </div>
            </div>
            <DblClickEditLO obj={texture.name} className="flex-grow m-auto mr-5 truncate text-left " inputClassName="p-0 w-full h-full bg-gray-500 text-black" />
            <p className="flex flex-row text-white w-12">
                <button className={(selected ? "bg-green-600 hover:bg-green-700" : "bg-gray-800 hover:bg-gray-900") + " rounded pr-2 pl-2 py-0.5 my-0.5 mr-1"}><SVGDownload className="h-4 w-4" /></button>
                <button className={(selected ? "bg-green-600 hover:bg-green-700" : "bg-gray-800 hover:bg-gray-900") + " rounded pr-2 pl-2 py-0.5 my-0.5 group"}><SVGCross className="h-4 w-4 group-hover:text-red-500" /></button>
            </p>
        </div>
    )
}

export default ProjectTexturesWrapper