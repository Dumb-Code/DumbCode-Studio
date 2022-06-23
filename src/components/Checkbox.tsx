import { HTMLAttributes } from 'react';
import { SVGCheck, SVGCross } from "./Icons";

const Checkbox = ({ value, setValue, extraText, enabledColor, props }: { value: boolean, setValue: (val: boolean) => void, extraText: string, enabledColor?: string, props: HTMLAttributes<HTMLButtonElement> }) => {
    
    const bgColor = enabledColor ?? "bg-blue-500"
    
    return (
        <button className={(value ? `${bgColor} text-white` : "dark:bg-gray-700 bg-gray-400 text-black dark:text-white") + " ronuded p-0.5 flex flex-row text-xs rounded mr-1 pt-1.5"} onClick={() => setValue(!value)} {...props}>
            {value ? <SVGCheck className="h-5 w-5" /> : <SVGCross className="h-5 w-5" />}
            <p className={extraText !== "" ? "mx-1 text-md" : ""}>{extraText}</p>
        </button>
    )
}

Checkbox.defaultProps = { value: false, extraText: "", props: null }

export default Checkbox;