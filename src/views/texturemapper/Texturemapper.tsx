import { useEffect } from "react"
import InfoBar from "../../components/InfoBar"
import { useStudio } from "../../contexts/StudioContext"
import { useObjectUnderMouse } from "../../studio/util/ObjectClickedHook"
import TextureMapperSidebar from "./components/TextureMapperSidebar"
import TextureMapperTools from "./components/TextureMapperTools"
import TextureMapperViewport from "./components/TextureMapperViewport"


const TextureMapper = () => {
    const { getSelectedProject, onFrameListeners } = useStudio()
    const project = getSelectedProject()


    useObjectUnderMouse()

    useEffect(() => {
        const onFrame = () => {
            project.model.resetVisuals()
        }
        onFrameListeners.add(onFrame)
        return () => {
            onFrameListeners.delete(onFrame)
        }
    })

    return (
        <div className="grid grid-areas-mapper h-full"
            key={project.identifier}
            style={{
                //These would be generated by moving the panels around.
                //For now, we just hardcode them
                gridTemplateColumns: '32px auto 300px',
                gridTemplateRows: 'auto 28px'
            }}
        >
            <div className="grid-in-layers border dark:border-black border-white h-full"><TextureMapperSidebar /></div>
            <div className="grid-in-tools border dark:border-black border-white"><TextureMapperTools /></div>
            <div className="grid-in-canvas border dark:border-black border-white  dark:bg-gray-700 bg-gray-200 min-h-0"><TextureMapperViewport /></div>
            <div className="grid-in-info border dark:border-black border-white"><InfoBar /></div>
        </div>
    )
}

export default TextureMapper;