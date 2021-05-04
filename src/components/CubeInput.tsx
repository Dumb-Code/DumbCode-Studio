import NumericInput from 'react-numeric-input';

const CubeInput = ({title}: {title: string}) => {
    return(
        <div>
            <p className="ml-1 text-gray-400 text-xs">{title}</p>
            <div className="flex flex-col p-1">
                <InputField axis="x" />
                <InputField axis="y" />
                <InputField axis="z" />
            </div>
        </div>
    )
}

const InputField = ({axis}: {axis: string}) => {
    
    let colors = ""
    switch(axis) {
        case "x": colors = "bg-red-500"; break;
        case "y": colors = "bg-green-500"; break;
        case "z": colors = "bg-lightBlue-500"; break;
        default: colors = "bg-gray-700"
    }
    
    return(
        <div className="flex flex-row mb-1 h-7">
            <div className={colors + " rounded-l px-2 text-white font-bold border-gray-900 pt-1.5 text-xs"}>
                {axis.toUpperCase()}
            </div>
            
            <NumericInput value={0} size={6} mobile={false} className="focus:outline-none focus:ring-gray-800 border-none" />
        </div>
    )
}

export default CubeInput;