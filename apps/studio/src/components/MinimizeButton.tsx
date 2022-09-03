import { SVGMinus, SVGPlus } from "@dumbcode/shared/icons";

export const MinimizeButton = ({ active, toggle }: { active: boolean, toggle: (val: boolean) => void }) => {
    return (
        active ?
            <button className="dark:bg-gray-800 bg-gray-300 dark:hover:bg-black hover:bg-gray-400 rounded pr-1 pl-2 my-0.5 mr-1"
                onClick={() => toggle(true)}><SVGMinus className="h-4 w-4 mr-1" /></button> :
            <button className="dark:bg-gray-800 bg-gray-300 dark:hover:bg-black hover:bg-gray-400 rounded pr-1 pl-2 my-0.5 mr-1"
                onClick={() => toggle(false)}><SVGPlus className="h-4 w-4 mr-1" /></button>
    )
}