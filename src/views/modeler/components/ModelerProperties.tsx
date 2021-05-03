import CubeInput from "../../../components/CubeInput"
import CubeRotationInput from "../../../components/CubeRotationInput"

const ModelerProperties = () => {
    return(
        <div className="rounded-sm bg-gray-800 h-full flex flex-col overflow-hidden">
            <div className="bg-gray-900 text-gray-400 font-bold text-xs p-1">
                <p className="flex-grow my-0.5">CUBE PROPERTIES</p>
            </div>
            <div className="border-r border-black h-full w-full grid grid-cols-2 px-2 pt-1">
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