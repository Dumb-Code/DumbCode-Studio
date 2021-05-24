import { SVGCheck, SVGCross } from "./Icons";
import { useState } from 'react';

const Checkbox = ({value, extraText, props}: {value: boolean, extraText: string, props: any}) => {
    
    const[enabled, setEnabled] = useState(value);
    
    return(
        <button className={(enabled ? "bg-lightBlue-500 text-white" : "dark:bg-gray-700 bg-gray-400 text-black dark:text-white") + " ronuded p-0.5 flex flex-row text-xs rounded mr-1 pt-1.5"} onClick={() => setEnabled(!enabled)} {...props}>
            <p className={extraText !== "" ? "mx-1 mt-1" : ""}>{extraText}</p>
            {enabled ? <SVGCheck className="h-5 w-5" /> : <SVGCross className="h-5 w-5" />}
        </button>
    )
}

Checkbox.defaultProps = { value: false, extraText: "", props: null }

export default Checkbox;