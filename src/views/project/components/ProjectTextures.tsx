const ProjectTextures = () => {
    return(
        <div className="flex flex-col h-full">
            <div className="rounded-sm bg-gray-800 flex flex-col overflow-hidden flex-grow">
                <div className="bg-gray-900 text-gray-400 font-bold text-xs p-2 flex flex-row">
                    <p className="flex-grow">TEXTURE GROUPS</p>
                    <p className="text-md">add new icon</p>
                </div>
                <div className="border-r border-black flex flex-col overflow-y-scroll h-3/6 w-full pr-6">
                    <GroupEntry name="default" selected={false} />
                    <GroupEntry name="fiery_red" selected={false} />
                    <GroupEntry name="jp_female" selected={true} />
                    <GroupEntry name="jp_male" selected={false} />
                </div>
                <div className="bg-gray-900 text-gray-400 font-bold text-xs p-2 flex flex-row">
                    <p className="flex-grow">SELECTED TEXTURES</p>
                </div>
                <div className="border-r border-black flex flex-row overflow-hidden h-full w-full">
                    <div className="flex-grow border-r border-black overflow-y-scroll">
                        <div className="bg-gray-800 text-gray-400 font-bold text-xs px-2 flex flex-row border-b border-black mb-2">
                            <p className="flex-grow">AVALIBLE</p>
                        </div>
                        <GroupTextureSwitchEntry name="eyes" selected={false} />
                        <GroupTextureSwitchEntry name="teeth" selected={false} />
                        <GroupTextureSwitchEntry name="male_stripes" selected={false} />
                    </div>
                    <div className="flex-grow border-l border-black overflow-y-scroll">
                        <div className="bg-gray-800 text-gray-400 font-bold text-xs px-2 flex flex-row border-b border-black mb-2">
                            <p className="flex-grow">SELECTED</p>
                        </div>
                        <GroupTextureSwitchEntry name="base" selected={true} />
                        <GroupTextureSwitchEntry name="details" selected={true} />
                        <GroupTextureSwitchEntry name="female_stripes" selected={true} />
                    </div>
                </div>
            </div>
        </div>
    )
}

const GroupEntry = ({name, selected}: {name: string, selected: boolean}) => {

    return(
        <button className={(selected ? "bg-lightBlue-500" : "bg-gray-700 text-white") + " my-1 ml-2 rounded-sm h-8 text-left pl-2 w-full flex flex-row"}>
            <p className="flex-grow mt-1">{name}</p>
        </button>
    )
}

const GroupTextureSwitchEntry = ({name, selected}: {name: string, selected: boolean}) => {

    return(
        <button className={(selected ? "bg-lightBlue-500" : "bg-gray-700 text-white") + " my-1 ml-2 rounded-sm h-6 text-left pl-2 w-11/12 flex flex-row"}>
            <p className="flex-grow">{name}</p>
        </button>
    )
}

export default ProjectTextures;