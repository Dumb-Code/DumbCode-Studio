import { DblClickEditLO } from "../../../components/DoubleClickToEdit"
import { SVGCross, SVGDownload, SVGPlus } from "../../../components/Icons"
import { useStudio } from "../../../contexts/StudioContext"
import { Texture, TextureGroup } from "../../../studio/formats/textures/TextureManager"
import { useListenableObject } from "../../../studio/util/ListenableObject"

const ProjectTextures = () => {
    const { selectedProject } = useStudio()

    const [selectedGroup] = useListenableObject(selectedProject.textureManager.selectedGroup)
    const [selectedGroupTextures] = useListenableObject(selectedGroup.textures)

    const [groups, setGroup] = useListenableObject(selectedProject.textureManager.groups)
    const [textures] = useListenableObject(selectedProject.textureManager.textures)

    const addGroup = () => setGroup(groups.concat([new TextureGroup("New Group", false)]))

    const defaultProject = selectedProject.isDefaultProject

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
                                <GroupEntry key={g.identifier} group={g} selected={g === selectedGroup} />
                            )
                    }
                </div>
                <div className="bg-gray-900 text-gray-400 font-bold text-xs p-1 flex flex-row">
                    <p className="flex-grow mt-1 ml-1">TEXTURES</p>
                    <p className="flex flex-row">
                        <button disabled={defaultProject} className="bg-gray-800 hover:bg-black rounded pr-1 pl-2 py-1 my-0.5 mr-1"><SVGPlus className="h-4 w-4 mr-1" /></button>
                    </p>
                </div>
                <div className="flex flex-row overflow-hidden h-full w-full">
                    {
                        defaultProject ? <div>No Model</div> : <>
                            <div className="flex-grow border-l border-black overflow-y-scroll overflow-x-hidden pr-4" style={{ flexBasis: '0' }}> {/* Flex basis is to make the columns equal. TODO: tailwind. */}
                                <div className="bg-gray-800 text-gray-400 font-bold text-xs px-2 flex flex-row border-b border-black mb-2">
                                    <p className="flex-grow">SELECTED</p>
                                </div>
                                {selectedGroupTextures
                                    .map(g => textures.find(t => t.identifier === g))
                                    .map(t => {
                                        if (t === undefined) {
                                            throw new Error("Invalid Texture Identifier")
                                        }
                                        return <GroupTextureSwitchEntry texture={t} selected={true} />
                                    })
                                }
                            </div>
                            <div className="flex-grow border-r border-black overflow-y-scroll overflow-x-hidden pr-4" style={{ flexBasis: '0' }}>
                                <div className="bg-gray-800 text-gray-400 font-bold text-xs px-2 flex flex-row border-b border-black mb-2">
                                    <p className="flex-grow">AVALIBLE</p>
                                </div>
                                {textures.filter(t => !selectedGroupTextures.includes(t.identifier)).map((t) => {
                                    return(<GroupTextureSwitchEntry texture={t} selected={false} />)
                                })
                                }
                            </div>
                        </>
                    }
                </div>
            </div>
        </div>
    )
}

const GroupEntry = ({ group, selected }: { group: TextureGroup, selected: boolean }) => {
    return (
        <div className={(selected ? "bg-green-500" : "bg-gray-700 text-white") + " my-1 ml-2 rounded-sm h-8 text-left pl-2 w-full flex flex-row"}>
            <DblClickEditLO obj={group.name} className="flex-grow m-auto mr-5 truncate text-left " inputClassName="p-0 w-full h-full bg-gray-500 text-black" />
            <p className="mr-2 flex flex-row text-white">
                <button className={(selected ? "bg-green-600 hover:bg-green-700" : "bg-gray-800 hover:bg-gray-900") + " rounded pr-2 pl-2 py-0.5 my-0.5 mr-1"}><SVGDownload className="h-4 w-4" /></button>
                <button className={(selected ? "bg-green-600 hover:bg-green-700" : "bg-gray-800 hover:bg-gray-900") + " rounded pr-2 pl-2 py-0.5 my-0.5 group"}><SVGCross className="h-4 w-4 group-hover:text-red-500" /></button>
            </p>
        </div>
    )
}

const GroupTextureSwitchEntry = ({ texture, selected }: { texture: Texture, selected: boolean }) => {

    const [name] = useListenableObject(texture.name)

    return (
        <div className={(selected ? "bg-green-500" : "bg-gray-700 text-white") + " my-2 ml-2 rounded-sm h-8 text-left pl-2 w-full flex flex-row pr-6"}>
            <button className="truncate flex-grow text-left">{name}</button>
            <p className="flex flex-row text-white w-12">
                <button className={(selected ? "bg-green-600 hover:bg-green-700" : "bg-gray-800 hover:bg-gray-900") + " rounded pr-2 pl-2 py-0.5 my-0.5 mr-1"}><SVGDownload className="h-4 w-4" /></button>
                <button className={(selected ? "bg-green-600 hover:bg-green-700" : "bg-gray-800 hover:bg-gray-900") + " rounded pr-2 pl-2 py-0.5 my-0.5 group"}><SVGCross className="h-4 w-4 group-hover:text-red-500" /></button>
            </p>
        </div>
    )
}

export default ProjectTextures;