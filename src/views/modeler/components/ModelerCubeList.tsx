import { SVGChevronDown, SVGCube, SVGEye, SVGEyeOff, SVGLocked, SVGPlus, SVGTrash, SVGUnlocked } from '../../../components/Icons';
import { DCMCube, DCMModel } from '../../../studio/formats/model/DcmModel';
import { MutableRefObject, RefObject, useRef, useState } from 'react';
import { useStudio } from '../../../contexts/StudioContext';
import { useListenableObject } from '../../../studio/util/ListenableObject';
import { DblClickEditLO } from '../../../components/DoubleClickToEdit';
import { createPortal } from 'react-dom';
import { useOptions } from '../../../contexts/OptionsContext';

const overlayDiv = document.getElementById("overlay")

const emptySpan = document.createElement("span")

const createCube = (model: DCMModel) => {
    let map = model.cubeMap
    let name = "newcube"
    if (map.has(name)) {
        let num = 0
        let newName = name
        while (map.has(newName)) {
            newName = name + num++
        }
        name = newName
    }
    return new DCMCube(name, [1, 1, 1], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0], false, [0, 0, 0], [], model)
}
const ModelerCubeList = () => {

    const { getSelectedProject } = useStudio()
    const model = getSelectedProject().model

    const createSiblingCube = () => {
        let cube = createCube(model)
        //If a cube is selected, add it as a sibling to that cube, otherwise add it as a root cube
        // if (studio.raytracer.anySelected()) {
        // studio.raytracer.firstSelected().tabulaCube.parent.addChild(cube)
        // } else {
        model.addChild(cube)
        // }
    }


    return (
        <div className="rounded-sm dark:bg-gray-800 bg-gray-200 flex flex-col h-full">
            <div className="dark:bg-gray-900 bg-white dark:text-gray-400 twxt-black font-bold text-xs p-1">
                <p className="flex-grow my-0.5">CUBE LIST</p>
            </div>
            <div className="flex flex-row px-1 dark:bg-gray-900 bg-gray-200 pb-1 pt-0.5">
                <button onClick={createSiblingCube} className="flex-grow bg-lightBlue-500 hover:bg-lightBlue-400 rounded text-white mr-0.5 flex flex-row">
                    <b className="flex-grow" />
                    <SVGPlus className="h-6 w-6" />
                    <SVGCube className="h-5 w-5 mt-0.5" />
                    <b className="flex-grow" />
                </button>
                <button className="flex-grow bg-lightBlue-500 hover:bg-lightBlue-400 rounded text-white mx-0.5 flex flex-row">
                    <b className="flex-grow" />
                    <SVGPlus className="h-6 w-6" />
                    <SVGCube className="h-5 w-5 mt-0.5" />
                    <SVGCube className="h-4 w-4 mt-1.5" />
                    <b className="flex-grow" />
                </button>
                <button className="flex-grow bg-red-500 hover:bg-red-600 rounded text-white mx-0.5 flex flex-row">
                    <b className="flex-grow" />
                    <SVGTrash className="h-5 w-5 mt-0.5" />
                    <b className="flex-grow" />
                </button>
                <button className="flex-grow bg-red-500 hover:bg-red-600 rounded text-white ml-0.5 flex flex-row">
                    <b className="flex-grow" />
                    <SVGTrash className="h-5 w-5 mt-0.5" />
                    <SVGCube className="h-5 w-5 mt-0.5" />
                    <SVGCube className="h-4 w-4 mt-1.5" />
                    <b className="flex-grow" />
                </button>
            </div>
            <div className="border-r border-black flex flex-col w-full pr-2 pl-1 overflow-x-hidden overflow-y-scroll flex-grow">
                <CubeList model={model} />
            </div>
        </div>
    )
}

type DragState = "bottom" | "on" | "top" | null
const CubeListItem = ({ cube, dragData, setDragData, dragOverRef, dragEndRef, mouseDraggedElementRef }: {
    cube: DCMCube
    dragData: DragData | null
    setDragData: (val: DragData | null) => void
    dragOverRef: MutableRefObject<boolean>
    dragEndRef: RefObject<HTMLDivElement>
    mouseDraggedElementRef: RefObject<HTMLDivElement>
}) => {
    const [children] = useListenableObject(cube.children)
    const [dragState, setDragState] = useState<DragState>(null)
    const [isDragging, setIsDragging] = useState(false)

    //This gets reset when `children` of parent change, due to the key being different (children size changes)
    const [isAnimating, setIsAnimating] = useState(false)

    const draggableRef = useRef<HTMLDivElement>(null)
    const cubeItemRef = useRef<HTMLDivElement>(null)
    const remainGhostRef = useRef<HTMLDivElement>(null)
    const bottomGhostRef = useRef<HTMLDivElement>(null)
    const topGhostRef = useRef<HTMLDivElement>(null)

    //Called when a cube is dropped onto this element
    const onCubeDroppedOntoThis = (_: React.DragEvent<HTMLDivElement>) => {
        const cubeDragged = dragData
        if (cubeDragged === null) {
            return
        }

        if (dragState === "top") {
            animateRef(topGhostRef, true, dragData?.height)
        } else {
            animateRef(bottomGhostRef, true, dragData?.height)
        }

        const ref = dragState === "top" ? topGhostRef : bottomGhostRef
        if (ref.current !== null && mouseDraggedElementRef.current !== null) {
            const rect = ref.current.getBoundingClientRect()
            const style = mouseDraggedElementRef.current.style
            style.transition = "all 0.3s"
            style.left = rect.x + "px"
            style.top = rect.y + "px"
        }

        //After the 300ms (.3 seconds), clear the animations and perform the actual cube change
        setTimeout(() => {
            if (mouseDraggedElementRef.current !== null) {
                mouseDraggedElementRef.current.style.transition = ""
            }
            if (dragState === "top") {
                cleanupRef(topGhostRef)
            } else {
                cleanupRef(bottomGhostRef)
            }

            cubeDragged.cube.parent.deleteChild(cubeDragged.cube)
            if (dragState === "on") {
                cube.addChild(cubeDragged.cube)
            } else {
                const parentCubes = [...cube.parent.children.value]

                let index = parentCubes.indexOf(cube)
                if (dragState === "bottom") {
                    index++
                }

                parentCubes.splice(index, 0, cubeDragged.cube)
                cube.parent.children.value = parentCubes
            }
        }, 300)
    }

    //Animate the ref
    const animateRef = (ref: RefObject<HTMLDivElement>, reverse: boolean, height: number | undefined) => {
        if (ref.current !== null && height !== undefined && draggableRef.current !== null) {
            const rect = draggableRef.current.getBoundingClientRect()
            const style = ref.current.style
            style.height = reverse ? "0" : (height + "px")
            style.width = rect.width + "px"
            style.transition = "height 0.3s"
            setTimeout(() => style.height = reverse ? (height + "px") : "0", 1) //Need to call next frame
        }
    }

    //Clear the animation from the ref
    const cleanupRef = (ref: RefObject<HTMLDivElement>) => {
        if (ref.current !== null) {
            const style = ref.current.style
            style.transition = ""
            style.height = ""
            style.width = ""
        }
    }

    return (
        <div>
            {/* The top ghost element for when cubes are dragged above */}
            <div ref={topGhostRef} />
            <div
                // Per frame, when this cube is dragged, set the mouse dragged element to be the position
                onDrag={e => {
                    //Note that at the end of a drag, clientXY is 0, we don't want this
                    if (mouseDraggedElementRef.current !== null && (e.clientX !== 0 || e.clientY !== 0)) {
                        const style = mouseDraggedElementRef.current.style
                        style.left = e.clientX + "px"
                        style.top = e.clientY + "px"
                    }
                    e.preventDefault()
                }}

                //Called when the cube is started to drag.
                onDragStart={e => {
                    if (draggableRef.current === null || cubeItemRef.current === null) {
                        return
                    }

                    const rect = draggableRef.current.getBoundingClientRect()

                    //set the drag image to be empty
                    e.dataTransfer.setDragImage(emptySpan, 0, 0)

                    //animate the remain ghost, as to make it not jump
                    animateRef(remainGhostRef, false, rect.height)

                    //Set the mouse dragged element to be at the current mouse
                    if (mouseDraggedElementRef.current !== null) {
                        const style = mouseDraggedElementRef.current.style
                        style.left = rect.x + "px"
                        style.top = rect.y + "px"
                    }

                    //Update the props

                    setDragData({
                        cube,
                        width: rect.width,
                        height: rect.height,
                    })

                    setIsDragging(true)
                    e.stopPropagation()
                }}

                //Called when the element is stopped dragging
                onDragEnd={e => {
                    //Un-animate the remain ref
                    cleanupRef(remainGhostRef)
                    setIsDragging(false)
                    setIsAnimating(true)

                    //If dragOverRef.current is null, then the cube has been dropped on empty space.
                    if (!dragOverRef.current && mouseDraggedElementRef.current !== null && dragEndRef.current !== null) {
                        const style = mouseDraggedElementRef.current.style
                        const rect = dragEndRef.current.getBoundingClientRect()
                        style.transition = "all 0.3s"
                        style.left = rect.x + "px"
                        style.top = rect.y + "px"
                    }

                    //After .3 seconds, do the actual cube movements
                    setTimeout(() => {
                        if (!dragOverRef.current) {
                            if (mouseDraggedElementRef.current !== null) {
                                mouseDraggedElementRef.current.style.transition = ""
                            }
                            if (dragData !== null) {
                                const cube = dragData.cube
                                cube.parent.deleteChild(cube)
                                cube.model.addChild(cube)
                            }
                        }

                        //Clear the drag data
                        setDragData(null)
                    }, 300)
                    e.preventDefault()
                    e.stopPropagation()
                }}

                //Called when a cube is dragged over this
                onDragOver={e => {
                    if (dragData?.cube === cube || cubeItemRef.current === null) {
                        return
                    }
                    dragOverRef.current = true

                    //Set the drag state based on the y position
                    let rect = cubeItemRef.current.getBoundingClientRect()
                    let yPerc = (e.clientY - rect.top) / rect.height

                    if (yPerc <= 1 / 4) {
                        setDragState("top")
                    } else if (yPerc >= 3 / 4) {
                        setDragState("bottom")
                    } else {
                        setDragState("on")
                    }

                    e.preventDefault()
                    e.stopPropagation()
                }}
                //Called when a cube exits being dragged over this
                onDragLeave={e => {
                    dragOverRef.current = false
                    setDragState(null)
                    e.preventDefault()
                    e.stopPropagation()
                }}

                //Called when a cube is dropped on this
                onDrop={e => {
                    setDragState(null)
                    e.preventDefault()
                    e.stopPropagation()
                    onCubeDroppedOntoThis(e)
                }}
                draggable
            >
                <div ref={draggableRef} className={(isDragging || isAnimating) ? "hidden" : ""}>
                    <div ref={cubeItemRef}><CubeItemEntry cube={cube} dragState={dragState} isDragging={isDragging} /></div>
                    <div className="ml-2">{children.map(c =>
                        <CubeListItem
                            key={children.length + "#" + c.identifier}
                            cube={c}
                            dragData={dragData}
                            setDragData={setDragData}
                            dragOverRef={dragOverRef}
                            dragEndRef={dragEndRef}
                            mouseDraggedElementRef={mouseDraggedElementRef}
                        />
                    )}</div>
                </div>
                <div ref={remainGhostRef}></div>
            </div>
            <div ref={bottomGhostRef} />
        </div>
    )
}

type DragData = {
    cube: DCMCube
    width: number
    height: number
}
const CubeList = ({ model }: { model: DCMModel }) => {
    const { darkMode } = useOptions()
    const [children] = useListenableObject(model.children)
    const [dragData, setDragData] = useState<DragData | null>(null)
    const dragOverRef = useRef(false)
    const dragEndRef = useRef<HTMLDivElement>(null)
    const mouseDraggedElementRef = useRef<HTMLDivElement>(null)

    //The element for the dragged mouse cube element
    const MouseCubeEntry = ({ cube }: { cube: DCMCube }) => {
        const [children] = useListenableObject(cube.children)
        return (
            <>
                <div style={{ width: dragData?.width + "px" }}><CubeItemEntry cube={cube} dragState={null} isDragging={false} /></div>
                <div className="ml-2">{children.map(c =>
                    <MouseCubeEntry
                        key={c.identifier}
                        cube={c}
                    />
                )}</div>
            </>
        )
    }

    return (
        <div>
            {children.map(c =>
                <CubeListItem
                    key={children.length + "#" + c.identifier}
                    cube={c}
                    dragData={dragData}
                    setDragData={setDragData}
                    dragOverRef={dragOverRef}
                    dragEndRef={dragEndRef}
                    mouseDraggedElementRef={mouseDraggedElementRef}
                />
            )}
            <div ref={dragEndRef} />
            { overlayDiv !== null &&
                createPortal(
                    <div className={"relative " + darkMode ? "dark" : ""}>
                        <div
                            ref={mouseDraggedElementRef}
                            className="absolute"
                        >
                            {dragData !== null && <MouseCubeEntry cube={dragData.cube} />}
                        </div>
                    </div>,
                    overlayDiv
                )
            }
        </div>
    )
}

const CubeItemEntry = ({ cube, dragState, isDragging }: { cube: DCMCube, dragState: DragState, isDragging: boolean }) => {
    let itemBackgroundColor: string

    const [visible, setVisible] = useState(true);
    const [locked, setLocked] = useState(false);

    const [mouseState, setMouseState] = useListenableObject(cube.mouseState)

    const collapsed = false

    if (visible && !locked) {
        itemBackgroundColor = "text-white "
        if (mouseState === "selected") {
            itemBackgroundColor += "bg-lightBlue-500 hover:bg-lightBlue-400"
        } else if (mouseState === "hover" && !isDragging) {
            itemBackgroundColor += "bg-red-600"
        } else {
            itemBackgroundColor += "dark:bg-gray-700 bg-gray-400"
        }
    } else {
        itemBackgroundColor = locked ? "dark:bg-gray-100 bg-gray-500 bg-opacity-30 text-gray-400 rounded" : "bg-gray-700 bg-opacity-40 text-gray-500 rounded"
    }

    const setIfNotSelected = (state: "none" | "hover") => {
        if (mouseState !== "selected") {
            setMouseState(state)
        }
    }

    return (
        <div
            onPointerEnter={() => setIfNotSelected("hover")}
            onPointerLeave={() => setIfNotSelected("none")}
            onClick={e => { setMouseState("selected"); e.stopPropagation() }}
            className={`${itemBackgroundColor} ml-2 my-0.5`}
            style={{
                borderTop: `2px solid ${dragState === "top" ? "#4287f5" : "transparent"}`,
                borderBottom: `2px solid ${dragState === "bottom" ? "#4287f5" : "transparent"}`,
                backgroundColor: dragState === "on" ? "#93C5FD" : undefined
            }}
        >
            <div className="flex flex-row py-0.5">
                {
                    cube.getChildren().length !== 0 &&
                    <button className={(collapsed ? "transform -rotate-90" : "") + " dark:bg-gray-800 bg-gray-600 dark:hover:bg-black hover:bg-gray-700 rounded px-1 py-1 text-white ml-0.5"}><SVGChevronDown className="h-4 w-4" /></button>
                }
                <DblClickEditLO obj={cube.name} className="truncate text-white text-s pl-1 flex-grow cursor-pointer" inputClassName="p-0 w-full h-full bg-gray-500 text-black" />
                <div className="flex flex-row text-white m-0 p-0">
                    {
                        locked ?
                            <button className="bg-red-800 hover:bg-red-600 rounded px-1 py-1 mr-1" onClick={() => setLocked(false)}><SVGLocked className="h-4 w-4" /></button>
                            :
                            <button className="dark:bg-gray-800 bg-gray-500 dark:hover:bg-black hover:bg-gray-600 rounded px-1 py-1 mr-1" onClick={() => setLocked(true)}><SVGUnlocked className="h-4 w-4" /></button>
                    }
                    {
                        visible ?
                            <button className="dark:bg-gray-800 bg-gray-500 dark:hover:bg-black hover:bg-gray-600 rounded px-1 py-1 mr-1" onClick={() => setVisible(false)}><SVGEye className="h-4 w-4" /></button>
                            :
                            <button className="bg-red-800 hover:bg-red-600 rounded px-1 py-1 mr-1" onClick={() => setVisible(true)}><SVGEyeOff className="h-4 w-4" /></button>
                    }
                </div>
            </div>
        </div>
    )
}

export default ModelerCubeList;
