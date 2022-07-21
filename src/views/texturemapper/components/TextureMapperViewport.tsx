import { useCallback, useRef } from "react"
import { SplitViewport } from "../../../components/SplitViewport"
import TransformCanvas, { CanvasMouseCallbackEvent, CanvasPoint, RedrawCallback, TransformCanvasRenderElement } from "../../../components/TransformCanvas"
import { useStudio } from "../../../contexts/StudioContext"
import { usePanelValue } from "../../../contexts/StudioPanelsContext"
import { DCMCube } from "../../../studio/formats/model/DcmModel"
import TextureManager from "../../../studio/formats/textures/TextureManager"
import { HistoryActionTypes } from "../../../studio/undoredo/UndoRedoHandler"
import { useListenableObject } from "../../../studio/util/ListenableObject"
import { fitAreaWithinBounds } from "../../../studio/util/Utils"

export const GridDisplayModes = ["hidden", "shown", "fade"] as const
export type GridDisplayMode = typeof GridDisplayModes[number]

const TextureMapperViewport = () => {

    const { getSelectedProject } = useStudio()
    const project = getSelectedProject()

    //We need to re-render when these change
    const [textureWidth] = useListenableObject(project.model.textureWidth)
    const [textureHeight] = useListenableObject(project.model.textureHeight)

    const [root] = useListenableObject(project.model.children)

    const cubeMoveRef = useRef<{
        cube: DCMCube,
        offsetX: number,
        offsetY: number,
        mouseMoved?: boolean
    } | null>(null)

    const [gridType] = usePanelValue("texture_grid_type")

    const computeOffset = useCallback((width: number, height: number): CanvasPoint => {
        const bounds = fitAreaWithinBounds(textureWidth, textureHeight, width, height)
        return {
            x: (width - bounds.width) / 2,
            y: (height - bounds.height) / 2
        }
    }, [textureWidth, textureHeight])

    const redraw = useCallback<RedrawCallback>((width, height, ctx) => {
        const bounds = fitAreaWithinBounds(textureWidth, textureHeight, width, height)
        //Draw the gray background
        ctx.fillStyle = "hsl(0, 0%, 20%)"
        ctx.fillRect(0, 0, bounds.width, bounds.height)

        //Draw the image
        const canvas = project.textureManager.canvas
        if (canvas.width > 0 && canvas.height > 0) {
            ctx.drawImage(canvas, 0, 0, bounds.width, bounds.height)
        }
        //Set the line width to be the inverse of the scale, so it stays the same size regardless of the zoom
        ctx.lineWidth = Math.min(1, 1 / ctx.getTransform().a)

        //Draw the grid
        if (gridType !== "hidden") {
            const opacityAt100 = 5
            const opacityAt0 = 20

            const value = bounds.ratio * ctx.getTransform().a
            const opacity = Math.min(Math.max((value - opacityAt100) / (opacityAt0 - opacityAt100), 0), 1)

            ctx.strokeStyle = `rgba(0, 0, 0, ${gridType === "fade" ? opacity : 1})`
            for (let rawX = 1; rawX < textureHeight; rawX++) {
                const x = rawX / textureWidth * bounds.width
                ctx.beginPath()
                ctx.moveTo(0, x)
                ctx.lineTo(bounds.width, x)
                ctx.stroke()
            }
            for (let rawY = 1; rawY < textureWidth; rawY++) {
                const y = rawY / textureHeight * bounds.height
                ctx.beginPath()
                ctx.moveTo(y, 0)
                ctx.lineTo(y, bounds.height)
                ctx.stroke()
            }
        }

        //Draw the outlines
        ctx.strokeStyle = "hsl(204, 86%, 53%)" //A blue colour
        ctx.beginPath();
        ctx.rect(0, 0, bounds.width, bounds.height);
        ctx.stroke();

    }, [project, textureWidth, textureHeight, gridType])


    const transformMousePosition = useCallback((point: CanvasPoint, width: number, height: number) => {
        const bounds = fitAreaWithinBounds(textureWidth, textureHeight, width, height)

        const mouseX = point.x * textureWidth / bounds.width
        const mouseY = point.y * textureHeight / bounds.height
        return { mouseX, mouseY }
    }, [textureWidth, textureHeight])


    const getCubeUnderMouse = useCallback((transformedMouse: CanvasPoint, width: number, height: number): {
        cubeUnderMouse: DCMCube | undefined;
        otherCubes: DCMCube[];
        mouseX: number;
        mouseY: number;
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

        return { cubeUnderMouse, otherCubes, mouseX, mouseY }
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
        if (cubeMoveRef.current !== null && cubeMoveRef.current.mouseMoved) {
            return
        }
        const result = project.selectedCubeManager.clickOnHovered(event.ctrlKey)
        if (!result) {
            project.selectedCubeManager.deselectAll()
        }

    }, [project])

    const onMouseDown = useCallback<CanvasMouseCallbackEvent>(({ transformedMouse, width, height, setHandled }) => {
        const { cubeUnderMouse, mouseX, mouseY } = getCubeUnderMouse(transformedMouse, width, height)
        if (cubeUnderMouse !== undefined) {
            project.model.textureCoordinates.undoRedoHandler.startBatchActions()
            cubeMoveRef.current = {
                cube: cubeUnderMouse,
                offsetX: mouseX - cubeUnderMouse.textureOffset.value[0],
                offsetY: mouseY - cubeUnderMouse.textureOffset.value[1],
            }
            setHandled()
        }
    }, [getCubeUnderMouse, project])

    const onMouseMoveGlobally = useCallback<CanvasMouseCallbackEvent<MouseEvent>>(({ transformedMouse, width, height, setHandled }) => {
        if (cubeMoveRef.current !== null) {
            const { cube, offsetX, offsetY } = cubeMoveRef.current
            const { mouseX, mouseY } = transformMousePosition(transformedMouse, width, height)
            const oldOffset = cube.textureOffset.value
            const newOffset = [Math.floor(mouseX - offsetX), Math.floor(mouseY - offsetY)] as const
            if (oldOffset[0] !== newOffset[0] || oldOffset[1] !== newOffset[1]) {
                cube.textureOffset.value = newOffset
            }
            cubeMoveRef.current.mouseMoved = true
            setHandled()
        }
    }, [transformMousePosition])

    const onMouseUpGlobally = useCallback<CanvasMouseCallbackEvent<MouseEvent>>(({ setHandled }) => {
        if (cubeMoveRef.current !== null) {
            project.model.textureCoordinates.undoRedoHandler.endBatchActions("Texture Offset Dragged", HistoryActionTypes.Transformation)
            cubeMoveRef.current = null
            setHandled()
        }
    }, [project])

    return (
        <SplitViewport otherName="Texture Mapper">
            <TransformCanvas
                redraw={redraw}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseDown={onMouseDown}
                onMouseMoveGlobally={onMouseMoveGlobally}
                onMouseUpGlobally={onMouseUpGlobally}
                computeOffset={computeOffset}
                backgroundStyle="hsl(0, 0%, 10%)"
                defaultScaleOut={1.1}
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