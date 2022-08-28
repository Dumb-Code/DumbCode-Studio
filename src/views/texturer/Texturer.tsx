import { useEffect } from "react"
import InfoBar from "../../components/InfoBar"
import { useStudio } from "../../contexts/StudioContext"
import StudioGridRaw from "../../studio/griddividers/components/StudioGrid"
import StudioGridArea from "../../studio/griddividers/components/StudioGridArea"
import DividerArea from "../../studio/griddividers/DividerArea"
import GridArea from "../../studio/griddividers/GridArea"
import GridSchema from "../../studio/griddividers/GridSchema"
import { useObjectUnderMouse } from "../../studio/selections/ObjectClickedHook"
import TexturerProperties from "./components/TexturerProperties"
import TexturerSidebar from "./components/TexturerSidebar"
import TexturerTools from "./components/TexturerTools"
import { TexturerViewport } from "./components/TexturerViewport"

// 'texture': [
//     'tools canvas layers',
//     'properties properties layers',
//     'info info layers',
//   ],

const tools = GridArea.area("tools")
const canvas = GridArea.area("canvas")
const layers = GridArea.area("layers")
const properties = GridArea.area("properties")
const info = GridArea.area("info")

const schema = GridSchema.createSchema(
    GridArea.join(
        [tools, canvas, layers],
        [properties, properties, layers],
        [info, info, layers]
    ),
    DividerArea.from(
        [32, 'auto', DividerArea.moveable(200, 500, layers, "left", 300)],
        ['auto', 150, 28]
    )
)

const Texturer = () => {
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
                <TexturerSidebar />
            </StudioGridArea>

            <StudioGridArea area={tools}>
                <TexturerTools />
            </StudioGridArea>

            <StudioGridArea area={canvas}>
                <TexturerViewport />
            </StudioGridArea>

            <StudioGridArea area={properties}>
                <TexturerProperties />
            </StudioGridArea>

            <StudioGridArea area={info}>
                <InfoBar />
            </StudioGridArea>

        </StudioGridRaw>
    )
}



export default Texturer;