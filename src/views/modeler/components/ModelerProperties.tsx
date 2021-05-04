import CubeInput from "../../../components/CubeInput"
import CubeRotationInput from "../../../components/CubeRotationInput"

const ModelerProperties = () => {
    return(
        <div className="rounded-sm bg-gray-800 h-full flex flex-col overflow-hidden">
            <div className="bg-gray-900 text-gray-400 font-bold text-xs p-1">
                <p className="flex-grow my-0.5">CUBE PROPERTIES</p>
            </div>
            <div className="pl-3">
                <p className="text-gray-400 text-xs mt-1">CUBE NAME</p>
            </div>
            <div className="h-full w-full grid grid-cols-2 px-2 pt-1">
                <input className="border-none text-white bg-gray-700 pt-1.5 mb-1 text-xs h-7 col-span-2 mx-1 rounded focus:outline-none focus:ring-gray-800" type="text" />
                <CubeInput title="DIMENSIONS" />
                <CubeInput title="POSITIONS" />
                <CubeInput title="OFFSET" />
                <CubeInput title="CUBE GROW" />
            </div>
            <div className="px-2">
                <CubeRotationInput title="ROTATION" />
            </div>
        </div>
    )
}

export default ModelerProperties;