import { useState } from "react";
import { SVGPause, SVGPlay, SVGRestart, SVGStop } from "../../../components/Icons";

const AnimatorScrubBar = () => {
    
    const[isHovering, setIsHovering] = useState(false);
    const[barWidth, setBarWidth] = useState(0);
    const[position, setPosition] = useState(100);

    const[isPlaying, setPlaying] = useState(false);

    return(
        <div className="h-full bg-gray-800 pt-2">
            <div className="absolute flex flex-row w-4/5 transform -translate-y-3.5 ml-14">
                <div className="flex-grow"></div>
                <button className="bg-gray-900 px-1 rounded-tl-md pt-1 text-gray-400 hover:text-red-500 border-l-2 border-t-2 border-black">
                    <SVGStop className="h-6 w-6" />
                </button>
                <button className="bg-gray-900 px-2 text-white hover:text-lightBlue-500 border-t-2 border-black" onClick={() => setPlaying(!isPlaying)}>
                    {isPlaying 
                        ?<SVGPause className="h-8 w-8" />
                        :<SVGPlay className="h-8 w-8" />
                    }
                </button>
                <button className="bg-gray-900 px-1 rounded-tr-md pt-1 text-gray-400 hover:text-yellow-400 border-r-2 border-t-2 border-black">
                    <SVGRestart className="h-6 w-6" />
                </button>
                <div className="flex-grow"></div>
            </div>
            <div className="rounded-sm bg-gray-800 h-full"
                onPointerMove={(mouse) => setBarWidth(mouse.pageX - 8)} 
                onPointerEnter={() => setIsHovering(true)}
                onPointerLeave={() => setIsHovering(false)}
                onClick={() => setPosition(barWidth)}>
                <div className={"transform -translate-y-2 bg-gray-500 w-full h-2 relative top-7 transition-transform ease-in-out cursor-pointer"}></div>
                <div className={"transform -translate-y-3 bg-white h-2 relative top-7 -mt-1 transition-transform ease-in-out cursor-pointer"} style={{width: (isHovering ? (barWidth < position ? position : barWidth + 8) : 0)}}></div>
                <div className={"transform -translate-y-4 bg-lightBlue-500 h-2 relative top-7 -mt-1 transition-transform ease-in-out cursor-pointer"} style={{width: (position < barWidth ? position : (isHovering ? barWidth + 8 : position) )}}></div>
            </div>
            <div className={(isHovering ? "h-4 w-4 opacity-100" : "opacity-0 h-0 w-0") + "  cursor-pointer rounded-full bg-lightBlue-400 relative transform -translate-y-1.5 transition-opacity ease-in-out duration-100"} 
            style={{left: (isHovering ? barWidth : position)}}
            onClick={() => setPosition(barWidth)}
            onPointerMove={(mouse) => setBarWidth(mouse.pageX - 8)}
            onPointerEnter={() => setIsHovering(true)}
            onPointerLeave={() => setIsHovering(false)} >
            </div>
        </div>
    )
}

export default AnimatorScrubBar;