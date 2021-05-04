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
        <div className={(selected ? "bg-gray-700 text-white hover:bg-gray-600 transform translate-y-1 z-50 -mt-1 rounded-b border-lightBlue-500 border-b-2" : "bg-gray-900 text-gray-500 hover:bg-black" ) + " w-32 truncate flex flex-row"}>
            <button className={selected ? "flex-grow mb-2 transform -translate-y-0.5" : "flex-grow mb-2"}>{name}</button>
            <button className="bg-gray-800 hover:bg-red-600 rounded pr-0.5 pl-1.5 py-1 my-1.5 w-6 mr-1 hover:text-white text-gray-400 opacity-30 hover:opacity-100"><SVGCross className="h-3 w-3 mr-1" /></button>
        </div>
    )
}

export default AnimatorTabBar;