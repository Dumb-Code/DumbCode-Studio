import Slider from 'react-input-slider'
import NumericInput from 'react-numeric-input';

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
            <div className=" w-20">
                <NumericInput size={20} mobile={false} />
            </div>
            <div className="rounded-r bg-gray-900 flex-grow pr-4">
                <Slider
                    xmin={-180}
                    xmax={180}
                    axis="x"
                    styles={{
                        track: { height: 6, backgroundColor: '#BFDBFE', width: '100%' },
                        active: { backgroundColor: '#60A5FA' },
                        thumb: { width: 15, height: 15 }
                    }}
                />
            </div>
        </div>
    )
}

export default CubeRotationInput;