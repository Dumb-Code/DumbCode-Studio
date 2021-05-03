const CubeRotationInput = ({title}: {title: string}) => {
    return(
        <div>
            <p className="ml-1 text-gray-600 text-xs">{title}</p>
            <div className="flex flex-col p-1">
                <InputField axis="x" percentage={45} />
                <InputField axis="y" percentage={90} />
                <InputField axis="z" percentage={15} />
            </div>
        </div>
    )
}

const InputField = ({axis, percentage}: {axis: string, percentage: number}) => {
    
    let colors = ""
    switch(axis) {
        case "x": colors = "bg-red-500"; break;
        case "y": colors = "bg-green-500"; break;
        case "z": colors = "bg-lightBlue-500"; break;
        default: colors = "bg-gray-700"
    }
    
    return(
        <div className="flex flex-row mb-1 h-7 col-span-2">
            <div className={colors + " rounded-l px-2 text-white font-bold border-gray-900 pt-1.5 text-xs"}>
                {axis.toUpperCase()}
            </div>
            <input type="number" className="border-none text-xs bg-gray-900 w-20 text-white" />
            <div className="rounded-r bg-gray-900 flex-grow pr-4 pt-1">
                <div className="overflow-hidden h-1 mb-4 text-xs flex rounded bg-gray-400 mt-2">
                    <div style={{ width: percentage+"%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-lightBlue-300"></div>
                </div>
            </div>
        </div>
    )
}

export default CubeRotationInput;