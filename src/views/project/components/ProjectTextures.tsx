import { Group } from "three"
import { SVGCross, SVGDownload, SVGPlus } from "../../../components/Icons"
import { useStudio } from "../../../contexts/StudioContext"
import { useListenableObject } from "../../../studio/util/ListenableObject"

const ProjectTextures = () => {
    const { selectedProject } = useStudio()
    const groups = useListenableObject(selectedProject.textureManager.groups)
    const selectedGroup = useListenableObject(selectedProject.textureManager.selectedGroup)
    const textures = useListenableObject(selectedProject.textureManager.textures)

    return (
        <div className="flex flex-col h-full">
            <div className="rounded-sm bg-gray-800 flex flex-col overflow-hidden flex-grow">
                <div className="bg-gray-900 text-gray-400 font-bold text-xs p-1 flex flex-row">
                    <p className="flex-grow mt-1 ml-1">TEXTURE GROUPS</p>
                    <p className="flex flex-row">
                        <button className="bg-gray-800 hover:bg-black rounded pr-1 pl-2 py-1 my-0.5 mr-1"><SVGPlus className="h-4 w-4 mr-1" /></button>
                    </p>
                </div>
                <div className="flex flex-col overflow-y-scroll h-3/6 w-full pr-6">
                    {groups.map(g =>
                        <GroupEntry key={g.identifier} name={g.name} selected={g === selectedGroup} />
                    )}
                </div>
                <div className="bg-gray-900 text-gray-400 font-bold text-xs p-1 flex flex-row">
                    <p className="flex-grow mt-1 ml-1">TEXTURES</p>
                    <p className="flex flex-row">
                        <button className="bg-gray-800 hover:bg-black rounded pr-1 pl-2 py-1 my-0.5 mr-1"><SVGPlus className="h-4 w-4 mr-1" /></button>
                    </p>
                </div>
                <div className="flex flex-row overflow-hidden h-full w-full">
                    <div className="flex-grow border-l border-black overflow-y-scroll overflow-x-hidden pr-4" style={{flexBasis: '0'}}> {/* Flex basis is to make the columns equal. TODO: tailwind. */}
                        <div className="bg-gray-800 text-gray-400 font-bold text-xs px-2 flex flex-row border-b border-black mb-2">
                            <p className="flex-grow">SELECTED</p>
                        </div>
                        {selectedGroup.textures
                            .map(g => textures.find(t => t.identifier === g))
                            .map(t => {
                                if(t === undefined) {
                                    throw new Error("Invalid Texture Identifier")
                                }
                                return <GroupTextureSwitchEntry name={t.name} selected={true} />  
                            })
                        }
                    </div>
                    <div className="flex-grow border-r border-black overflow-y-scroll overflow-x-hidden pr-4" style={{flexBasis: '0'}}>
                        <div className="bg-gray-800 text-gray-400 font-bold text-xs px-2 flex flex-row border-b border-black mb-2">
                            <p className="flex-grow">AVALIBLE</p>
                        </div>
                        { textures.filter(t => !selectedGroup.textures.includes(t.identifier)).map(t => {
                            <GroupTextureSwitchEntry name={t.name} selected={false} />
                        })
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

const GroupEntry = ({ name, selected }: { name: string, selected: boolean }) => {

    return (
        <div className={(selected ? "bg-green-500" : "bg-gray-700 text-white") + " my-1 ml-2 rounded-sm h-8 text-left pl-2 w-full flex flex-row"}>
            <button className="flex-grow truncate text-left">{name}</button>
            <p className="mr-2 flex flex-row text-white">
                <button className={(selected ? "bg-green-600 hover:bg-green-700" : "bg-gray-800 hover:bg-gray-900") + " rounded pr-2 pl-2 py-0.5 my-0.5 mr-1"}><SVGDownload className="h-4 w-4" /></button>
                <button className={(selected ? "bg-green-600 hover:bg-green-700" : "bg-gray-800 hover:bg-gray-900") + " rounded pr-2 pl-2 py-0.5 my-0.5 group"}><SVGCross className="h-4 w-4 group-hover:text-red-500" /></button>
            </p>
        </div>
    )
}

const GroupTextureSwitchEntry = ({ name, selected }: { name: string, selected: boolean }) => {

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