import { useState } from "react"
import StudioCanvas from "../../../components/StudioCanvas"
import { useStudio } from "../../../contexts/StudioContext"
import { useDomParent } from "../../../studio/util/DomParentRef"

export const TexturerViewport = () => {

    const [showModel, setShowModel] = useState(true)
    const [showCanvas, setShowCanvas] = useState(true)

    const { getSelectedProject } = useStudio()

    const ref = useDomParent<HTMLDivElement>(() => getSelectedProject().textureManager.canvas, true)

    return (
        <div className="w-full h-full">
            <div className="flex flex-row h-full w-full">
                {showModel && (
                    <div className="w-full border-r dark:border-black border-white border-b">
                        <button className="dark:bg-gray-900 bg-gray-300 absolute z-10 w-20 rounded-br dark:text-gray-400 text-black pr-1" onDoubleClick={() => setShowCanvas(!showCanvas)}>Model</button>
                        <StudioCanvas />
                    </div>
                )}
                {showCanvas && (
                    <div className=" dark:bg-gray-700 bg-gray-200 w-full border-l dark:border-black border-white">
                        <button className="dark:bg-gray-900 bg-gray-300 absolute z-10 w-20 rounded-br dark:text-gray-400 text-black pr-1" onDoubleClick={() => setShowModel(!showModel)}>Texture</button>
                        <br /><br /><br />
                        <div ref={ref} className="ml-16">{ }</div>
                    </div>
                )}
            </div>
        </div>
    )
}

