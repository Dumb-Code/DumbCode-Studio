import { SVGMinus, SVGPlus } from "./Icons";

export const MinimizeButton = ({active, toggle}: {active: boolean, toggle: (boolean) => void}) => {
    return(
        active ? 
        <button className="bg-gray-800 hover:bg-black rounded pr-1 pl-2 my-0.5 mr-1" 
        onClick={() => toggle(true)}><SVGMinus className="h-4 w-4 mr-1" /></button> : 
        <button className="bg-gray-800 hover:bg-black rounded pr-1 pl-2 my-0.5 mr-1" 
        onClick={() => toggle(false)}><SVGPlus className="h-4 w-4 mr-1" /></button>
    )
}