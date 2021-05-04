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
        <div className="flex flex-row mb-2 h-7 col-span-2">
            <div className={colors + " rounded-l px-2 text-white font-bold border-gray-900 pt-2 text-xs h-8"}>
                {axis.toUpperCase()}
            </div>
            <div className=" w-20 h-7">
                <NumericInput value={0} size={2} mobile={false} />
            </div>
            <div className="rounded-r bg-gray-700 flex-grow pr-4 pl-2 h-8">
                <Slider
                    xmin={-180}
                    xmax={180}
                    axis="x"
                    styles={{
                        track: { height: 6, backgroundColor: '#27272A', width: '100%' },
                        active: { backgroundColor: '#0EA5E9' },
                        thumb: { width: 15, height: 15 }
                    }}
                />
            </div>
        </div>
    )
}

export default CubeRotationInput;