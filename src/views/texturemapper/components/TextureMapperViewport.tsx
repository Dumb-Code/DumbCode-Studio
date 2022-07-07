import { useCallback, useRef } from "react"
import { SplitViewport } from "../../../components/SplitViewport"
import TransformCanvas, { CanvasMouseCallbackEvent, CanvasPoint, RedrawCallback, TransformCanvasRenderElement } from "../../../components/TransformCanvas"
import { useStudio } from "../../../contexts/StudioContext"
import { DCMCube } from "../../../studio/formats/model/DcmModel"
import TextureManager from "../../../studio/formats/textures/TextureManager"
import { useListenableObject } from "../../../studio/util/ListenableObject"
import { fitAreaWithinBounds } from "../../../studio/util/Utils"

const TextureMapperViewport = () => {

    const { getSelectedProject } = useStudio()
    const project = getSelectedProject()

    //We need to re-render when these change
    const [textureWidth] = useListenableObject(project.model.textureWidth)
    const [textureHeight] = useListenableObject(project.model.textureHeight)

    const [root] = useListenableObject(project.model.children)

    // const ref = useDomParent<HTMLDivElement>(() => getSelectedProject().textureManager.canvas, true)

    const redraw = useCallback<RedrawCallback>((width, height, ctx) => {
        const res = fitAreaWithinBounds(textureWidth, textureHeight, width, height)
        ctx.drawImage(project.textureManager.canvas, 0, 0, res.width, res.height)
    }, [project, textureWidth, textureHeight])


    const transformMousePosition = useCallback((point: CanvasPoint, width: number, height: number) => {
        const bounds = fitAreaWithinBounds(textureWidth, textureHeight, width, height)

        const mouseX = point.x * textureWidth / bounds.width
        const mouseY = point.y * textureHeight / bounds.height
        return { mouseX, mouseY }
    }, [textureWidth, textureHeight])


    const getCubeUnderMouse = useCallback((transformedMouse: CanvasPoint, width: number, height: number): {
        cubeUnderMouse: DCMCube | undefined;
        otherCubes: DCMCube[];
    } => {
        const { mouseX, mouseY } = transformMousePosition(transformedMouse, width, height)
        const notUnderMouse: DCMCube[] = []
        const underMouse: DCMCube[] = []
        project.model.traverseAll(cube => {
            if (getCubeFaceUnderMouse(cube, mouseX, mouseY) !== -1) {
                underMouse.push(cube)
            } else {
                notUnderMouse.push(cube)
            }
        })
        //The last cube in `underMouse` will appear on top
        const cubeUnderMouse = underMouse.splice(underMouse.length - 1, 1)[0]
        const otherCubes = notUnderMouse.concat(underMouse)

        return { cubeUnderMouse, otherCubes }
    }, [project, transformMousePosition])


    const onMouseMove = useCallback<CanvasMouseCallbackEvent>(({ transformedMouse, width, height }) => {
        const { cubeUnderMouse, otherCubes } = getCubeUnderMouse(transformedMouse, width, height)

        if (cubeUnderMouse !== undefined) {
            cubeUnderMouse.mouseHover.value = true
        }
        //For every other cube, don't have it hover
        otherCubes.forEach(cube => cube.mouseHover.value = false)

    }, [getCubeUnderMouse])

    const onMouseUp = useCallback<CanvasMouseCallbackEvent>(({ setHandled, event }) => {
        const result = project.selectedCubeManager.clickOnHovered(event.ctrlKey)
        if (result) {
            setHandled()
        } else {
            project.selectedCubeManager.deselectAll()
        }

    }, [project])

    return (
        <SplitViewport otherName="Texture Mapper">
            <TransformCanvas
                redraw={redraw}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                backgroundStyle="hsl(0, 0%, 10%)"
            >
                {root.map(cube => <TextureMapperVisualCube key={cube.identifier} cube={cube} textureWidth={textureWidth} textureHeight={textureHeight} />)}
            </TransformCanvas>
        </SplitViewport>
    )
}

const TextureMapperVisualCube = ({ cube, textureWidth, textureHeight }: { cube: DCMCube, textureWidth: number, textureHeight: number }) => {
    const [children] = useListenableObject(cube.children, [cube])
    const [textureOffset] = useListenableObject(cube.textureOffset, [cube])
    const [dimension] = useListenableObject(cube.dimension, [cube])
    const [hovered] = useListenableObject(cube.mouseHover, [cube])
    const [selected] = useListenableObject(cube.selected, [cube])

    const redraw = useCallback<RedrawCallback>((width, height, ctx) => {
        TextureManager.drawCubeToCanvas(cube, width, height, ctx, true, textureWidth, textureHeight, textureOffset, dimension, hovered, selected)
    }, [cube, textureWidth, textureHeight, textureOffset, dimension, hovered, selected])


    return (
        <>
            <TransformCanvasRenderElement redraw={redraw} />
            {children.map((child, index) =>
                <TextureMapperVisualCube key={index} cube={child} textureWidth={textureWidth} textureHeight={textureHeight} />
            )}
        </>
    )
}

const getCubeFaceUnderMouse = (cube: DCMCube, mouseX: number, mouseY: number) => {

    let u = cube.textureOffset.value[0]
    let v = cube.textureOffset.value[1]

    let w = cube.dimension.value[0]
    let h = cube.dimension.value[1]
    let d = cube.dimension.value[2]

    let uw = w
    let ud = d
    let vh = h
    let vd = d


    //The different face areas
    let faceAreas = [
        [u + ud + uw, v + vd, ud, vh], //0
        [u, v + vd, ud, vh], //1
        [u + ud + uw, v, uw, vd], //2
        [u + ud, v, uw, vd],  //3
        [u + ud + uw + ud, v + vd, uw, vh], //4
        [u + ud, v + vd, uw, vh]  //5
    ]
    //Get the index the face is over.
    return faceAreas.findIndex(arr => mouseX >= arr[0] && mouseX < arr[0] + arr[2] && mouseY >= arr[1] && mouseY < arr[1] + arr[3])
}

export default TextureMapperViewport