import { SVGCross } from "../../../components/Icons"

const AnimatorTabBar = () => {
    return(
        <div className="rounded-sm bg-gray-800 h-full flex flex-row">
            <AnimatorTab name="bite" selected={false} />
            <AnimatorTab name="poop" selected={true} />
            <AnimatorTab name="eat kash" selected={false} />
            <AnimatorTab name="run" selected={false} />
            <AnimatorTab name="hurt" selected={false} />
        </div>
    )
}

const AnimatorTab = ({name, selected}: {name: string, selected: boolean}) => {
    return(
        <div className={(selected ? "bg-lightBlue-500" : "bg-gray-900") + " w-32 truncate flex flex-row rounded m-1"}>
            <button className={(selected ? "text-white" : "text-gray-400") + " flex-grow -mt-1.5"}>{name}</button>
            <button className="h-4 w-4 bg-gray-800 hover:bg-red-600 rounded pl-0.5 mt-0.5 mr-1 hover:text-white text-gray-400 opacity-30 hover:opacity-100"><SVGCross className="h-3 w-3 mr-1" /></button>
        </div>
    )
}

export default AnimatorTabBar;