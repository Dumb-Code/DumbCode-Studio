import { SVGCrossCircle, SVGDownloadCircle, SVGRecord } from "../../../components/Icons"

const ProjectAnimations = () => {
    return(
        <div className="rounded-sm bg-gray-800 h-full flex flex-col overflow-hidden">
            <div className="bg-gray-900 text-gray-400 font-bold text-xs p-2 flex flex-row">
                <p className="flex-grow">ANIMATIONS</p>
                <p className="flex flex-row">
                    <SVGCrossCircle className="h-5 w-5 transform rotate-45 mr-1" />
                    <SVGDownloadCircle className="h-5 w-5 mr-1 transform rotate-180" />
                    <SVGDownloadCircle className="h-5 w-5" />
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
            <p className="flex-grow mt-1">{name}</p>
            
            <p className="mt-2 mr-2 flex flex-row text-white">
                <SVGRecord className="h-5 w-5 mr-1" />
                <SVGDownloadCircle className="h-5 w-5 mr-1" />
                <SVGCrossCircle className="h-5 w-5 hover:text-red-500" />
            </p>
        </button>
    )
}

export default ProjectAnimations;