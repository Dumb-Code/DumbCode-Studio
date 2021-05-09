import { SVGEye, SVGLocked, SVGPlus, SVGSettings } from "../../../components/Icons";

const AnimatorTimeline = () => {
    return(
        <div className="rounded-sm bg-gray-800 h-full flex flex-col pt-2">
            <AnimationLayer index={0} numStacked={1} />
            <AnimationLayer index={1} numStacked={3} />
            <AnimationLayer index={2} numStacked={4} />
            <AnimationLayer index={3} numStacked={1} />
        </div>
    )
}

const AnimationLayer = ({index, numStacked}: {index: number, numStacked: number}) => {

    const divHeight = numStacked <= 2 ? 1.5 : 1.5 + ((numStacked - 2) * .75)

    const colors = ["bg-lightBlue-500", "bg-green-500", "bg-yellow-500", "bg-red-500"]

    const color = colors[index % colors.length]

    return(
        <div className="flex flex-row m-0.5 mt-0" style={{height: divHeight + 'rem'}}>
            <div className="flex flex-row">
                <input type="text" className="w-36 border-none bg-gray-900 rounded mr-0.5 pt-0.5 h-6" placeholder="some layer name" />
                <button className="bg-gray-900 hover:bg-gray-800 rounded pr-0.5 pl-1 py-1 mr-0.5 text-white h-6"><SVGPlus className="h-4 w-4 mr-1" /></button>
                <button className="bg-gray-900 hover:bg-gray-800 rounded pr-0.5 pl-1 py-1 mr-0.5 text-white h-6"><SVGEye className="h-4 w-4 mr-1" /></button>
                <button className="bg-gray-900 hover:bg-gray-800 rounded pr-0.5 pl-1 py-1 mr-0.5 text-white h-6"><SVGLocked className="h-4 w-4 mr-1" /></button>
                <button className="bg-gray-900 hover:bg-gray-800 rounded pr-0.5 pl-1 py-1 mr-0.5 text-white h-6"><SVGSettings className="h-4 w-4 mr-1" /></button>
            </div>
            <div className="flex flex-col w-full">
                <TimelineLayer numStacked={numStacked} color={color} />
            </div>
        </div>
    )
}

const TimelineLayer = ({numStacked, color}: {numStacked: number, color: string}) => {

    const width = 24

    var elements = new Array(numStacked)

    for (let i = 0; i < numStacked; i++) {
        elements[i] = <KeyFrame key={i} layerColor={color} start={Math.random() * 400} length={Math.random() * 200 + 50} />;
    }

    return(
        <div className="bg-gray-900 h-6" style={{height: (1.5 * numStacked) + 'rem', background: `repeating-linear-gradient(90deg, #363636  0px, #363636  ${width - 1}px, #4A4A4A  ${width - 1}px, #4A4A4A  ${width}px)`}}>
            {elements}
        </div>
    )
}

const KeyFrame = ({layerColor, start, length}: {layerColor: string, start: number, length: number}) => {
    return(
        <div 
            className={layerColor + " h-1 mt-1 mb-1.5"}
            style={{marginLeft: start + 'px', width: length + 'px'}}
        >
        </div>
    )
}

export default AnimatorTimeline;