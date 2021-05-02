import { SVGCross, SVGDownload, SVGPlus, SVGUpload } from "../../../components/Icons"

const ProjectAnimations = () => {
    return(
        <div className="rounded-sm bg-gray-800 h-full flex flex-col overflow-hidden">
            <div className="bg-gray-900 text-gray-400 font-bold text-xs p-1 flex flex-row">
                <p className="flex-grow mt-1 ml-1">ANIMATIONS</p>
                <p className="flex flex-row">
                    <button className="bg-gray-800 hover:bg-black rounded pr-1 pl-2 py-1 my-0.5 mr-1"><SVGPlus className="h-4 w-4 mr-1" /></button>
                    <button className="bg-gray-800 hover:bg-black rounded pr-1 pl-2 py-1 my-0.5 mr-1"><SVGUpload className="h-4 w-4 mr-1" /></button>
                    <button className="bg-gray-800 hover:bg-black rounded pr-1 pl-2 py-1 my-0.5 mr-1"><SVGDownload className="h-4 w-4 mr-1" /></button>
                </p>
            </div>
            <div className="border-r border-black flex flex-col overflow-y-scroll h-full w-full pr-6">
                <AnimationEntry name="roar" selected={true} setRemote={ () => console.log("set remote") } />
                <AnimationEntry name="walk" selected={true} setRemote={ () => console.log("set remote") } />
                <AnimationEntry name="bite" selected={false} setRemote={ () => console.log("set remote") } />
                <AnimationEntry name="poop" selected={true} setRemote={ () => console.log("set remote") } />
                <AnimationEntry name="eat kash's mom" selected={false} setRemote={ () => console.log("set remote") } />
                <AnimationEntry name="sniff air" selected={false} setRemote={ () => console.log("set remote") } />
            </div>
        </div>
    )
}

const AnimationEntry = ({name, selected, setRemote}: {name: string, selected: boolean, setRemote: () => void}) => {

    return(
        <button
            className={(selected ? "bg-lightBlue-500" : "bg-gray-700 text-white") + " my-1 rounded-sm h-8 text-left pl-2 w-full flex flex-row ml-2"}
            onClick={setRemote}
        >
            <p className="flex-grow mt-1 truncate">{name}</p>
            
            <p className="mr-2 flex flex-row text-white">
                <button className={(selected ? "bg-lightBlue-600 hover:bg-lightBlue-700" : "bg-gray-800 hover:bg-gray-900") + " rounded pr-2 pl-2 py-0.5 my-0.5 mr-1"}><SVGDownload className="h-4 w-4" /></button>
                <button className={(selected ? "bg-lightBlue-600 hover:bg-lightBlue-700" : "bg-gray-800 hover:bg-gray-900") + " rounded pr-2 pl-2 py-0.5 my-0.5 group"}><SVGCross className="h-4 w-4 group-hover:text-red-500" /></button>
            </p>
        </button>
    )
}

export default ProjectAnimations;