import { SVGCross, SVGDownload, SVGPushGithub, SVGUpload } from "../../../components/Icons"

const ProjectModels = () => {
    return(
        <div className="rounded-sm bg-gray-800 h-full flex flex-col overflow-hidden">
            <div className="bg-gray-900 text-gray-400 font-bold text-xs p-2 flex flex-row">
                <p className="flex-grow">MODELS</p>
                <p className="text-md flex flex-row">
                    <SVGCross className="h-5 w-5 transform rotate-45 mr-1" />
                    <SVGUpload className="h-5 w-5 mr-1" />
                    <SVGDownload className="h-5 w-5" />
                </p>
            </div>
            <div className="border-r border-black flex flex-col overflow-y-scroll h-full w-full pr-6">
                <ModelEntry name="T-rex" selected={true} isRemote={true} changeModel={ () => console.log("set model") } />
                <ModelEntry name="Velociraptor" selected={false} isRemote={true} changeModel={ () => console.log("set model") } />
                <ModelEntry name="Velociraptor" selected={false} isRemote={false} changeModel={ () => console.log("set model") } />
            </div>
        </div>
    )
}

const ModelEntry = ({name, selected, isRemote, changeModel}: {name: string, selected: boolean, isRemote: boolean, changeModel: () => void}) => {

    return(
        <button
            className={(selected ? "bg-lightBlue-500" : "bg-gray-700 text-white") + " my-1 rounded-sm h-8 text-left pl-2 w-full flex flex-row ml-2"}
            onClick={changeModel}
        >
            <p className="flex-grow pt-1 truncate">{name}</p>
            
            <p className="pt-0 mr-2 text-white flex flex-row">
                {isRemote ? <button className={(selected ? "bg-lightBlue-600 hover:bg-lightBlue-700" : "bg-gray-800 hover:bg-gray-900") + " rounded pr-1 pl-2 py-0.5 my-0.5 mr-1"}><SVGPushGithub className="h-4 w-4 mr-1" /></button> : ""}
                <button className={(selected ? "bg-lightBlue-600 hover:bg-lightBlue-700" : "bg-gray-800 hover:bg-gray-900") + " rounded pr-1 pl-2 py-0.5 my-0.5 mr-1"}><SVGDownload className="h-4 w-4 mr-1" /></button>
                <button className={(selected ? "bg-lightBlue-600 hover:bg-lightBlue-700" : "bg-gray-800 hover:bg-gray-900") + " rounded pr-2 pl-2 py-0.5 my-0.5 group"}><SVGCross className="h-4 w-4 group-hover:text-red-500" /></button>
            </p>
        </button>
    )
}

export default ProjectModels;