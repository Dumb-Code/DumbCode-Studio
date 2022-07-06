import { SplitViewport } from "../../../components/SplitViewport"
import { useStudio } from "../../../contexts/StudioContext"
import { useDomParent } from "../../../studio/util/DomParentRef"

const TextureMapperViewport = () => {

    const { getSelectedProject } = useStudio()

    const ref = useDomParent<HTMLDivElement>(() => getSelectedProject().textureManager.canvas, true)

    return (
        <SplitViewport otherName="Texture Mapper">
            <div ref={ref} className="ml-16">{ }</div>
        </SplitViewport>
    )
}

export default TextureMapperViewport