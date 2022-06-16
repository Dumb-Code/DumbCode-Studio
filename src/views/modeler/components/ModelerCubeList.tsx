import { Dispatch, MutableRefObject, PropsWithChildren, RefObject, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CollapsableSidebarPannel from '../../../components/CollapsableSidebarPannel';
import { DblClickEditLO } from '../../../components/DoubleClickToEdit';
import HorizontalDivider from '../../../components/HorizontalDivider';
import { SVGChevronDown, SVGCube, SVGEye, SVGEyeOff, SVGLocked, SVGPlus, SVGTrash, SVGUnlocked } from '../../../components/Icons';
import { useCreatePortal } from '../../../contexts/CreatePortalContext';
import { useKeyComboPressed } from '../../../contexts/OptionsContext';
import { useStudio } from '../../../contexts/StudioContext';
import { usePanelValue } from '../../../contexts/StudioPanelsContext';
import { useTooltipRef } from '../../../contexts/TooltipContext';
import { DCMCube, DCMModel } from '../../../studio/formats/model/DcmModel';
import { HistoryActionTypes } from '../../../studio/undoredo/UndoRedoHandler';
import { useListenableObject } from '../../../studio/util/ListenableObject';
import SelectedCubeManager from '../../../studio/util/SelectedCubeManager';

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
    const project = getSelectedProject()
    const model = project.model

    const getFirstSelectedCubeOrUndefined = () => {
        const selectedCubeIdentifier = project.selectedCubeManager.selected.value
        return selectedCubeIdentifier.length > 0 ? project.model.identifierCubeMap.get(selectedCubeIdentifier[0]) : undefined
    }

    //Creates a new cube with the same parent as the first selected cube
    const createSiblingCube = () => {
        model.undoRedoHandler.startBatchActions()
        let cube = createCube(model)
        const selectedCube = getFirstSelectedCubeOrUndefined()
        if (selectedCube !== undefined) {
            selectedCube.parent.addChild(cube)
        } else {
            model.addChild(cube)
        }
        model.undoRedoHandler.endBatchActions("Cube Created", HistoryActionTypes.Add)
    }

    //Creates a new cube with the first selected cube being the parent
    const createChildCube = () => {
        model.undoRedoHandler.startBatchActions()
        let cube = createCube(model)
        const selectedCube = getFirstSelectedCubeOrUndefined()
        if (selectedCube !== undefined) {
            selectedCube.addChild(cube)
        } else {
            model.addChild(cube)
        }
        model.undoRedoHandler.endBatchActions("Cube Created", HistoryActionTypes.Add)
    }

    //Deletes all the selected cubes, but keeps their children. Moves the children to be the siblings of this cube.
    const deleteCubesKeepChildren = useCallback(() => {
        alert("Not Added Yet.")
    }, [])

    //Deletes all the selected cubes, and all their children.
    const deleteCubesAndChildren = useCallback(() => {
        project.selectedCubeManager.selected.value.forEach(identifier => {
            const cube = project.model.identifierCubeMap.get(identifier)
            if (cube !== undefined) {
                cube.traverse(c => {
                    c.selected.value = false
                    c.mouseHover.value = false
                })
                cube.parent.deleteChild(cube)
                cube.fullyDelete()
            }
        })
    }, [project])

    useKeyComboPressed(useMemo(() => ({
        modeler_delete_and_children: deleteCubesAndChildren,
        modeler_delete: deleteCubesKeepChildren,
    }), [deleteCubesKeepChildren, deleteCubesAndChildren]))

    const [propertiesHeight, setPropertiesHeight] = usePanelValue("model_cube_size")

    const toggleRef = useRef<HTMLDivElement>(null)
    const [propertiesActive] = usePanelValue("cube_list")
    return (
        <div ref={toggleRef} style={{ height: propertiesActive ? propertiesHeight : 32 }}>
            <CollapsableSidebarPannel title="CUBE LIST" heightClassname="h-full" panelName="cube_list">
                <div className="rounded-sm dark:bg-gray-800 bg-gray-200 h-full flex flex-col">
                    <div className="flex flex-row px-1 dark:bg-gray-900 bg-gray-200 pb-1 pt-0.5">
                        <CubeListButton onClick={createSiblingCube} className="bg-sky-500 hover:bg-sky-400" hoverText="Create Sibling Cube">
                            <SVGPlus className="h-6 w-6" />
                            <SVGCube className="h-5 w-5 mt-0.5" />
                        </ CubeListButton>
                        <CubeListButton onClick={createChildCube} className="bg-sky-500 hover:bg-sky-400" hoverText="Create Child Cube">
                            <SVGPlus className="h-6 w-6" />
                            <SVGCube className="h-5 w-5 mt-0.5" />
                            <SVGCube className="h-4 w-4 mt-1.5" />
                        </ CubeListButton>
                        <CubeListButton onClick={deleteCubesKeepChildren} className="bg-red-500 hover:bg-red-600" hoverText="Delete Cube">
                            <SVGTrash className="h-5 w-5 mt-0.5" />
                        </ CubeListButton>
                        <CubeListButton onClick={deleteCubesAndChildren} className="bg-red-500 hover:bg-red-600" hoverText="Delete Cube And Children">
                            <SVGTrash className="h-5 w-5 mt-0.5" />
                            <SVGCube className="h-5 w-5 mt-0.5" />
                            <SVGCube className="h-4 w-4 mt-1.5" />
                        </ CubeListButton>
                    </div>
                    <div className="w-full flex-grow h-0 pr-2 pl-1 overflow-x-hidden overflow-y-scroll studio-scrollbar">
                        <CubeList model={model} selectedCubeManager={project.selectedCubeManager} />
                    </div>
                </div>
            </CollapsableSidebarPannel>
            <HorizontalDivider max={800} min={50} value={propertiesHeight} setValue={setPropertiesHeight} toggleDragging={val => {
                if (toggleRef.current) {
                    toggleRef.current.className = val ? "" : "transition-height ease-in-out duration-200"
                }
            }} />
        </div>
    )
}

const CubeListButton = ({ className, hoverText, children, onClick }: PropsWithChildren<{ className: string, hoverText: string, onClick: () => void }>) => {
    const tooltipRef = useTooltipRef<HTMLButtonElement>(() => hoverText)
    return (
        <button ref={tooltipRef} onClick={onClick} className={"flex-grow rounded text-white ml-0.5 flex flex-row " + className}>
            <b className="flex-grow" />
            {children}
            <b className="flex-grow" />
        </button>
    )
}

type DragState = "bottom" | "on" | "top" | null
const CubeListItem = ({
    cube, selectedCubeManager, dragData, setDragData, dragOverRef, dragEndRef, mousePositionRef,
    mouseDraggedElementRef, clearPreviousDragState, onDragFinish, parentAnimateChildRemove
}: {
    cube: DCMCube
    selectedCubeManager: SelectedCubeManager
    dragData: DragData | null
    setDragData: Dispatch<SetStateAction<DragData | null>>
    dragOverRef: MutableRefObject<boolean>
    dragEndRef: RefObject<HTMLDivElement>
    mousePositionRef: MutableRefObject<{ x: number, y: number }>
    mouseDraggedElementRef: RefObject<HTMLDivElement>
    clearPreviousDragState: MutableRefObject<(cube: DCMCube) => void>
    onDragFinish: () => void
    parentAnimateChildRemove?: () => void
}) => {
    const [children] = useListenableObject(cube.children)
    const [hideChildren] = useListenableObject(cube.hideChildren)


    const [dragState, setDragState] = useState<DragState>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [hasAnimationChildrenForce, setHasAnimationChildrenForce] = useState<boolean | null>(null)

    //How on earth does this get reset? who knows. I think maybe because the list size changes, 
    //so the children `key` is compleatly refreshed
    const [isAnimating, setIsAnimating] = useState(false)

    const draggableRef = useRef<HTMLDivElement>(null)
    const cubeItemRef = useRef<HTMLDivElement>(null)
    const remainGhostRef = useRef<HTMLDivElement>(null)
    const bottomGhostRef = useRef<HTMLDivElement>(null)
    const topGhostRef = useRef<HTMLDivElement>(null)

    const childAnimateRemove = () => {
        if (children.length === 1) {
            setHasAnimationChildrenForce(false)
        }
    }

    //TODO: is this needed?
    useEffect(() => {
        if (!hasAnimationChildrenForce && children.length === 0) {
            setHasAnimationChildrenForce(null)
        }
    }, [hasAnimationChildrenForce, children.length])

    //Called when a cube is dropped onto this element
    const onCubeDroppedOntoThis = () => {
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

        if (dragState === "on") {
            setHasAnimationChildrenForce(true)
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
            setHasAnimationChildrenForce(null)

            cube.model.undoRedoHandler.startBatchActions()
            cube.model.startPaste()
            cubeDragged.cubes.forEach(dragged => {
                dragged.parent.deleteChild(dragged)
                if (dragState === "on") {
                    cube.addChild(dragged)
                } else {
                    const parentCubes = [...cube.parent.children.value]

                    let index = parentCubes.indexOf(cube)
                    if (dragState === "bottom") {
                        index++
                    }

                    parentCubes.splice(index, 0, dragged)
                    cube.parent.children.value = parentCubes
                }
            })
            const pasted = cube.model.finishPaste()
            const num = cubeDragged.cubes.length
            cube.model.undoRedoHandler.endBatchActions(pasted ? `${num} Cube${num === 1 ? "" : "s"} Pasted` : `${num} Cube${num === 1 ? "" : "s"} Dragged`, pasted ? HistoryActionTypes.Command : HistoryActionTypes.Transformation)
        }, 300)
    }

    //Animate the ref
    const animateRef = useCallback((ref: RefObject<HTMLDivElement>, reverse: boolean, height: number | undefined) => {
        if (ref.current !== null && height !== undefined && draggableRef.current !== null) {
            const rect = draggableRef.current.getBoundingClientRect()
            const style = ref.current.style
            style.height = reverse ? "0" : (height + "px")
            style.width = rect.width + "px"
            style.transition = "height 0.3s"
            setTimeout(() => style.height = reverse ? (height + "px") : "0", 1) //Need to call next frame
        }
    }, [])

    //Clear the animation from the ref
    const cleanupRef = useCallback((ref: RefObject<HTMLDivElement>) => {
        if (ref.current !== null) {
            const style = ref.current.style
            style.transition = ""
            style.height = ""
            style.width = ""
        }
    }, [])

    const beginDrag = useCallback(() => {
        if (draggableRef.current === null || cubeItemRef.current === null) {
            return
        }

        if (parentAnimateChildRemove) {
            parentAnimateChildRemove()
        }

        const rect = draggableRef.current.getBoundingClientRect()

        //animate the remain ghost, as to make it not jump
        animateRef(remainGhostRef, false, rect.height)

        //Set the mouse dragged element to be at the current mouse
        if (mouseDraggedElementRef.current !== null) {
            const style = mouseDraggedElementRef.current.style
            style.left = rect.x + "px"
            style.top = rect.y + "px"
        }

        //Update the props
        if (cube.hasBeenPastedNeedsPlacement) {
            setDragData(drag => {
                if (drag !== null && drag.cubes.includes(cube)) {
                    return drag
                }
                return {
                    cubes: (drag?.cubes ?? []).concat(cube),
                    width: Math.max(rect.width, drag?.width ?? 0),
                    height: rect.height + (drag?.height ?? 0),
                }
            })
        } else {
            setDragData({
                cubes: [cube],
                width: rect.width,
                height: rect.height,
            })
        }


        setIsDragging(true)
    }, [setDragData, setIsDragging, parentAnimateChildRemove, animateRef])

    const updateDrag = useCallback((x: number, y: number) => {
        if (mouseDraggedElementRef.current !== null) {
            const style = mouseDraggedElementRef.current.style
            style.left = x + "px"
            style.top = y + "px"
        }
    }, [mouseDraggedElementRef])

    const finishDrag = useCallback(() => {
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
                    cube.model.undoRedoHandler.startBatchActions()
                    cube.model.startPaste()
                    dragData.cubes.forEach(cube => {
                        cube.parent.deleteChild(cube)
                        cube.model.addChild(cube)
                    })
                    const pasted = cube.model.finishPaste()
                    const num = dragData.cubes.length
                    cube.model.undoRedoHandler.endBatchActions(pasted ? `${num} Cube${num === 1 ? "" : "s"} Pasted` : `${num} Cube${num === 1 ? "" : "s"} Dragged`, pasted ? HistoryActionTypes.Command : HistoryActionTypes.Transformation)
                }
            }


            //Clear the drag data
            setDragData(null)

            //Cause a re-render
            onDragFinish()
        }, 300)
    }, [cleanupRef, setIsDragging, setIsAnimating, dragData, setDragData, onDragFinish])

    const onDragOver = useCallback((y: number) => {
        if (dragData?.cubes?.includes(cube) || cubeItemRef.current === null) {
            return
        }
        dragOverRef.current = true

        //Set the drag state based on the y position
        let rect = cubeItemRef.current.getBoundingClientRect()
        let yPerc = (y - rect.top) / rect.height

        if (yPerc <= 1 / 4) {
            setDragState("top")
        } else if (yPerc >= 3 / 4) {
            setDragState("bottom")
        } else {
            setDragState("on")
        }

        clearPreviousDragState.current(cube)
        clearPreviousDragState.current = (c => {
            if (c !== cube) {
                setDragState(null)
            }
        })
    }, [dragData, setDragState])

    useEffect(() => {
        if (cube.hasBeenPastedNeedsPlacement) {
            beginDrag()
            updateDrag(mousePositionRef.current.x, mousePositionRef.current.y)

            const mouseMove = (e: MouseEvent) => {
                if (cube.hasBeenPastedNeedsPlacement) {
                    updateDrag(e.clientX, e.clientY)
                }
            }
            const mousedown = (e: MouseEvent) => {
                if (cube.hasBeenPastedNeedsPlacement && cube === dragData?.cubes?.[0]) {
                    finishDrag()
                    e.preventDefault()
                    e.stopPropagation()
                }
            }
            document.addEventListener("mousemove", mouseMove)
            document.addEventListener("click", mousedown, true)
            return () => {
                document.removeEventListener("mousemove", mouseMove)
                document.removeEventListener("click", mousedown, true)
            }
        }
    }, [beginDrag, updateDrag, finishDrag])


    return (

        //We need to basically hide this when the first frame is placed down, however we also need to know it's width and height
        <div className={cube.hasBeenPastedNeedsPlacement && (dragData === null || !dragData.cubes.includes(cube)) ? 'absolute w-full -top-[100000px]' : ''}>
            {/* The top ghost element for when cubes are dragged above */}
            <div ref={topGhostRef} />
            <div
                // Per frame, when this cube is dragged, set the mouse dragged element to be the position
                onDrag={e => {
                    //Note that at the end of a drag, clientXY is 0, we don't want this
                    if (e.clientX !== 0 || e.clientY !== 0) {
                        updateDrag(e.clientX, e.clientY)
                    }
                    e.preventDefault()
                }}

                //Called when the cube is started to drag.
                onDragStart={e => {
                    //set the drag image to be empty
                    e.dataTransfer.setDragImage(emptySpan, 0, 0)

                    beginDrag()

                    e.stopPropagation()
                }}

                //Called when the element is stopped dragging
                onDragEnd={e => {
                    finishDrag()
                    e.preventDefault()
                    e.stopPropagation()
                }}

                //Called when a cube is dragged over this
                onDragOver={e => {
                    onDragOver(e.clientY)
                    e.preventDefault()
                    e.stopPropagation()
                }}
                onMouseMoveCapture={e => {
                    if (dragData !== null && dragData.cubes.some(cube => cube.hasBeenPastedNeedsPlacement)) {
                        onDragOver(e.clientY)
                    }
                }}

                //Called when a cube exits being dragged over this
                onDragLeave={e => {
                    dragOverRef.current = false
                    setDragState(null)
                    e.preventDefault()
                    e.stopPropagation()
                }}
                onMouseLeave={e => {
                    if (dragData !== null && dragData.cubes.some(cube => cube.hasBeenPastedNeedsPlacement)) {
                        dragOverRef.current = false
                        setDragState(null)
                        e.preventDefault()
                        e.stopPropagation()
                    }
                }}

                //Called when a cube is dropped on this
                onDrop={e => {
                    setDragState(null)
                    e.preventDefault()
                    e.stopPropagation()
                    onCubeDroppedOntoThis()
                }}
                onMouseDown={e => {
                    if (dragData !== null && dragData.cubes.some(cube => cube.hasBeenPastedNeedsPlacement)) {
                        setDragState(null)
                        e.preventDefault()
                        e.stopPropagation()
                        onCubeDroppedOntoThis()
                    }
                }}
                draggable
            >
                <div ref={draggableRef} className={(isDragging || isAnimating) ? "hidden" : ""}>
                    <div ref={cubeItemRef}><CubeItemEntry cube={cube} selectedCubeManager={selectedCubeManager} dragState={dragState} isDragging={isDragging} hasChildren={hasAnimationChildrenForce !== null ? hasAnimationChildrenForce : children.length !== 0} /></div>
                    {!hideChildren &&
                        <div className="ml-2">{children.map(c =>
                            <CubeListItem
                                key={c.identifier}
                                cube={c}
                                selectedCubeManager={selectedCubeManager}
                                dragData={dragData}
                                setDragData={setDragData}
                                dragOverRef={dragOverRef}
                                dragEndRef={dragEndRef}
                                mouseDraggedElementRef={mouseDraggedElementRef}
                                clearPreviousDragState={clearPreviousDragState}
                                onDragFinish={onDragFinish}
                                parentAnimateChildRemove={childAnimateRemove}
                                mousePositionRef={mousePositionRef}
                            />
                        )}</div>
                    }
                </div>
                <div ref={remainGhostRef}></div>
            </div>
            <div ref={bottomGhostRef} />
        </div>
    )
}

type DragData = {
    readonly cubes: readonly DCMCube[]
    readonly width: number
    readonly height: number
}
const CubeList = ({ model, selectedCubeManager }: { model: DCMModel, selectedCubeManager: SelectedCubeManager }) => {
    const createPortal = useCreatePortal()
    const [children] = useListenableObject(model.children)
    const [dragData, setDragData] = useState<DragData | null>(null)
    const dragOverRef = useRef(false)
    const dragEndRef = useRef<HTMLDivElement>(null)
    const mouseDraggedElementRef = useRef<HTMLDivElement>(null)
    const clearPreviousDragState = useRef(() => { })

    const mousePositionRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 })

    //The element for the dragged mouse cube element
    const MouseCubeEntry = ({ cube }: { cube: DCMCube }) => {
        const [children] = useListenableObject(cube.children)
        return (
            <>
                <div style={{ width: dragData?.width + "px" }}><CubeItemEntry cube={cube} selectedCubeManager={selectedCubeManager} dragState={null} isDragging={false} hasChildren={children.length !== 0} /></div>
                <div className="ml-2">{children.map(c =>
                    <MouseCubeEntry
                        key={c.identifier}
                        cube={c}
                    />
                )}</div>
            </>
        )
    }

    useEffect(() => {
        const mouseMove = (e: MouseEvent) => {
            mousePositionRef.current = { x: e.clientX, y: e.clientY }
        }

        document.addEventListener("mousemove", mouseMove)
        return () => {
            document.removeEventListener("mousemove", mouseMove)
        }

    }, [])


    //Key is used to make sure that no cubes can be stuck "animating"
    //Meaning they never show. TODO, in the future remote this
    const [key, setKey] = useState(0)
    const onDragFinish = useCallback(() => {
        setKey(key => key + 1)
    }, [])

    return (
        <div key={key} className="relative">
            {children.map(c =>
                <CubeListItem
                    key={c.identifier}
                    cube={c}
                    selectedCubeManager={selectedCubeManager}
                    dragData={dragData}
                    setDragData={setDragData}
                    dragOverRef={dragOverRef}
                    dragEndRef={dragEndRef}
                    onDragFinish={onDragFinish}
                    mouseDraggedElementRef={mouseDraggedElementRef}
                    clearPreviousDragState={clearPreviousDragState}
                    mousePositionRef={mousePositionRef}
                />
            )}
            <div ref={dragEndRef} />
            {createPortal(
                <div className="relative">
                    <div
                        ref={mouseDraggedElementRef}
                        className="absolute"
                    >
                        {dragData !== null && dragData.cubes.map(cube => <MouseCubeEntry key={cube.identifier} cube={cube} />)}
                    </div>
                </div>,
            )}
        </div>
    )
}

const CubeItemEntry = ({ cube, selectedCubeManager, dragState, isDragging, hasChildren }: { cube: DCMCube, selectedCubeManager: SelectedCubeManager, dragState: DragState, isDragging: boolean, hasChildren: boolean }) => {
    let itemBackgroundColor: string

    const [visible, setVisible] = useListenableObject(cube.visible);
    const [locked, setLocked] = useListenableObject(cube.locked);

    const [hovering, setHovering] = useListenableObject(cube.mouseHover)
    const [selected, setSelected] = useListenableObject(cube.selected)
    const [hideChildren, setHideChildren] = useListenableObject(cube.hideChildren)


    if (visible && !locked) {
        itemBackgroundColor = "text-white "
        if (selected) {
            itemBackgroundColor += "bg-sky-500 hover:bg-sky-400"
        } else if (hovering && !isDragging) {
            itemBackgroundColor += "bg-red-600"
        } else {
            itemBackgroundColor += "dark:bg-gray-700 bg-gray-400"
        }
    } else {
        itemBackgroundColor = locked ? "dark:bg-gray-500 bg-gray-100 bg-opacity-30 text-gray-400 rounded" : "bg-gray-700 bg-opacity-40 text-gray-500 rounded"
    }

    return (
        <div
            onPointerEnter={() => setHovering(true)}
            onPointerLeave={() => setHovering(false)}
            onClick={e => {
                //When selected:
                //  - if ctrl is pressed, we deselect, keeping the current cubes
                //  - if more than one cube is selected, we deselect all OTHER cubes
                //  - else, we deslect this cube
                //
                //When not selected:
                //  - if ctrl is pressed, select THIS cube, and keep the other cubes
                //  - else, we only select THIS cube
                if (selected) {
                    cube.model.undoRedoHandler.startBatchActions()
                    if (e.ctrlKey || selectedCubeManager.selected.value.length === 1) {
                        setSelected(false)
                        cube.model.undoRedoHandler.endBatchActions(`Cube Deselected`)
                    } else {
                        //If other cubes are selected too
                        //Using `setSelected` won't do anything, as it's already selected.
                        //We can call onCubeSelected to essentially deselect the other cubes
                        selectedCubeManager.onCubeSelected(cube)
                        cube.model.undoRedoHandler.endBatchActions(`Cubes Selected`)
                    }
                } else {
                    selectedCubeManager.keepCurrentCubes = e.ctrlKey
                    cube.model.undoRedoHandler.startBatchActions()
                    setSelected(true)
                    cube.model.undoRedoHandler.endBatchActions(`Cube Selected`)
                    selectedCubeManager.keepCurrentCubes = false
                }
                e.stopPropagation()
            }}
            className={`${itemBackgroundColor} ml-2 my-0.5`}
            style={{
                borderTop: `2px solid ${dragState === "top" ? "#4287f5" : "transparent"}`,
                borderBottom: `2px solid ${dragState === "bottom" ? "#4287f5" : "transparent"}`,
                backgroundColor: dragState === "on" ? "#93C5FD" : undefined
            }}
        >
            <div className="flex flex-row py-0.5">
                <button onClick={e => { e.stopPropagation(); setHideChildren(!hideChildren) }} className={(hideChildren ? "transform -rotate-90" : "") + (hasChildren ? " px-1" : " w-0") + " ml-0.5 py-1 transition-all transition-300 dark:bg-gray-800 bg-gray-600 dark:hover:bg-black hover:bg-gray-700 rounded text-white overflow-hidden"}>
                    <SVGChevronDown className="w-4 h-4" />
                </button>
                <DblClickEditLO
                    onStartEditing={() => cube.model.undoRedoHandler.startBatchActions()}
                    onFinishEditing={() => cube.model.undoRedoHandler.endBatchActions("Cube Name Changed")}
                    obj={cube.name}
                    className="truncate text-white text-s pl-1 flex-grow cursor-pointer"
                    inputClassName="p-0 w-full h-full bg-gray-500 text-black"
                />
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
