const ProjectModels = () => {
    return(
        <div className="rounded-sm bg-gray-800 h-full flex flex-col overflow-hidden">
            <div className="bg-gray-900 text-gray-400 font-bold text-xs p-2 flex flex-row">
                <p className="flex-grow">MODELS</p>
                <p className="text-md">add new icon</p>
            </div>
            <div className="border-r border-black flex flex-col overflow-y-scroll h-full w-full pr-6">
                <ModelEntry name="T-rex" selected={true} setRemote={ () => console.log("set remote") } />
                <ModelEntry name="Velociraptor" selected={false} setRemote={ () => console.log("set remote") } />
            </div>
        </div>
    )
}

const ModelEntry = ({name, selected, setRemote}: {name: string, selected: boolean, setRemote: () => void}) => {

    return(
        <button
            className={(selected ? "bg-lightBlue-500" : "bg-gray-700") + " my-1 rounded-sm h-8 text-left pl-2 w-full flex flex-row ml-2"}
            onClick={setRemote}
        >
            <p className="flex-grow pt-1">{name}</p>
            
            <p className="pt-1 mr-2">icons</p>
        </button>
    )
}

export default ProjectModels;