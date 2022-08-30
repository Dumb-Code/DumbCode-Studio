import { useEffect } from "react"
import InfoBar from "../../components/InfoBar"
import { useStudio } from "../../contexts/StudioContext"
import StudioGridRaw from "../../studio/griddividers/components/StudioGrid"
import StudioGridArea from "../../studio/griddividers/components/StudioGridArea"
import DividerArea from "../../studio/griddividers/DividerArea"
import GridArea from "../../studio/griddividers/GridArea"
import GridSchema from "../../studio/griddividers/GridSchema"
import { useObjectUnderMouse } from "../../studio/selections/ObjectClickedHook"
import TextureMapperSidebar from "./components/TextureMapperSidebar"
import TextureMapperTools from "./components/TextureMapperTools"
import TextureMapperViewport from "./components/TextureMapperViewport"

// 'mapper': [
//     'tools canvas layers',
//     'info info layers'
//   ],

const tools = GridArea.area("tools")
const canvas = GridArea.area("canvas")
const layers = GridArea.area("layers")
const info = GridArea.area("info")

const schema = GridSchema.createSchema(
    GridArea.join(
        [tools, canvas, layers],
        [info, info, layers]
    ),
    DividerArea.from(
        [32, 'auto', DividerArea.moveable(200, 500, layers, "left", 300)],
        ['auto', 28]
    )
)

const TextureMapper = () => {
    const { getSelectedProject, onPostFrameListeners } = useStudio()
    const project = getSelectedProject()


    useObjectUnderMouse()

    useEffect(() => {
        const onFrame = () => {
            project.model.resetVisuals()
        }
        onPostFrameListeners.add(onFrame)
        return () => {
            onPostFrameListeners.delete(onFrame)
        }
    })

    return (
        <StudioGridRaw
            key={project.identifier}
            schema={schema}
        >

            <StudioGridArea area={layers}>
                <TextureMapperSidebar />
            </StudioGridArea>

            <StudioGridArea area={tools}>
                <TextureMapperTools />
            </StudioGridArea>

            <StudioGridArea area={canvas} className="dark:bg-gray-700 bg-gray-200 min-h-0">
                <TextureMapperViewport />
            </StudioGridArea>

            <StudioGridArea area={info}>
                <InfoBar undoRedo={project.model.textureCoordinates.undoRedoHandler} />
            </StudioGridArea>

        </StudioGridRaw>
    )
}

export default TextureMapper;