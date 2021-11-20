import { HTMLAttributes } from 'react';
import { SVGCheck, SVGCross } from "./Icons";

const Checkbox = ({ value, setValue, extraText, props }: { value: boolean, setValue: (val: boolean) => void, extraText: string, props: HTMLAttributes<HTMLButtonElement> }) => {
    return (
        <button className={(value ? "bg-sky-500 text-white" : "dark:bg-gray-700 bg-gray-400 text-black dark:text-white") + " ronuded p-0.5 flex flex-row text-xs rounded mr-1 pt-1.5"} onClick={() => setValue(!value)} {...props}>
            <p className={extraText !== "" ? "mx-1 mt-1" : ""}>{extraText}</p>
            {value ? <SVGCheck className="h-5 w-5" /> : <SVGCross className="h-5 w-5" />}
        </button>
    )
}

Checkbox.defaultProps = { value: false, extraText: "", props: null }

export default Checkbox;