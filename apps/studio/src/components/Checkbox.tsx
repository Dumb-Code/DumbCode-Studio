import { SVGCheck, SVGCross } from "@dumbcode/shared/icons";
import { HTMLAttributes } from 'react';

const Checkbox = ({ value, setValue, extraText, enabledColor, props }: { value: boolean, setValue: (val: boolean) => void, extraText: string, enabledColor?: string, props: HTMLAttributes<HTMLButtonElement> }) => {

    const bgColor = enabledColor ?? "bg-blue-500"

    return (
        <button className={(value ? `${bgColor} text-white` : "dark:bg-gray-700 bg-gray-300 text-black dark:text-white") + " ronuded flex flex-row text-xs rounded mr-1 h-6" + (extraText || " w-6")} onClick={() => setValue(!value)} {...props}>
            {value ? <SVGCheck className="h-5 w-5 ml-0.5 mt-0.5" /> : <SVGCross className="h-5 w-5 ml-0.5 mt-0.5" />}
            <p className={extraText !== "" ? "pt-0.5 mx-1 text-md" : ""}>{extraText}</p>
        </button>
    )
}

Checkbox.defaultProps = { value: false, extraText: "", props: null }

export default Checkbox;