import { SVGChevronDown, SVGCube, SVGEye, SVGEyeOff, SVGLocked, SVGPlus, SVGTrash, SVGUnlocked } from "@dumbcode/shared/icons";
import { createContext, Dispatch, DragEvent, MouseEvent as ReactMouseEvent, MutableRefObject, PropsWithChildren, RefObject, SetStateAction, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import CollapsableSidebarPannel from '../../../components/CollapsableSidebarPannel';
import { DblClickEditLO } from '../../../components/DoubleClickToEdit';
import HorizontalDivider from '../../../components/HorizontalDivider';
import { useCreatePortal } from '../../../contexts/CreatePortalContext';
import { useKeyComboPressed, useKeyComboUnknownEventMatcher } from '../../../contexts/OptionsContext';
import { useStudio } from '../../../contexts/StudioContext';
import { usePanelValue } from '../../../contexts/StudioPanelsContext';
import { useTooltipRef } from '../../../contexts/TooltipContext';
import { DCMCube, DCMModel } from '../../../studio/formats/model/DcmModel';
import { useListenableObject } from '../../../studio/listenableobject/ListenableObject';
import { useListenableObjectInMap } from '../../../studio/listenableobject/ListenableObjectMap';
import SelectedCubeManager from '../../../studio/selections/SelectedCubeManager';
import { HistoryActionTypes } from '../../../studio/undoredo/UndoRedoHandler';
import CubeLocker from '../../../studio/util/CubeLocker';

const CanEditContext = createContext(false)

const emptySpan = (typeof window !== "undefined" && document.createElement("span")) as HTMLSpanElement
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
const moveSiblingsUp = (cubes: readonly DCMCube[]) => {
    const lockers = cubes.flatMap(cube => {
        const ret = cube.children.value.map(child => new CubeLocker(child))
        cube.children.value.forEach(child => {
            child.parent.deleteChild(child)
            cube.parent.addChild(child)
        })

        return ret
    })
    lockers.forEach(locker => locker.reconstruct())
}
const ModelerCubeList = ({ canEdit = true }: { canEdit?: boolean }) => {

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
        project.model.undoRedoHandler.startBatchActions()
        const cubes = project.model.identifListToCubes(project.selectedCubeManager.selected.value)
        let amount = 0;

        project.model.resetVisuals()
        moveSiblingsUp(cubes)
        cubes.forEach(cube => {
            cube.traverse(c => {
                c.selected.value = false
                c.mouseHover.value = false
                amount++
            })

            cube.parent.deleteChild(cube)
            cube.fullyDelete()
        })

        project.model.undoRedoHandler.endBatchActions(`${amount} Cube${amount === 1 ? "" : "s"} Deleted`, HistoryActionTypes.Remove)
    }, [project.model, project.selectedCubeManager])

    //Deletes all the selected cubes, and all their children.
    const deleteCubesAndChildren = useCallback(() => {
        const cubes = project.model.identifListToCubes(project.selectedCubeManager.selected.value)

        project.model.undoRedoHandler.startBatchActions()
        let amount = 0;
        cubes.forEach(cube => {
            cube.traverse(c => {
                c.selected.value = false
                c.mouseHover.value = false
                amount++
            })
            cube.parent.deleteChild(cube)
            cube.fullyDelete()
        })
        project.model.undoRedoHandler.endBatchActions(`${amount} Cube${amount === 1 ? "" : "s"} Deleted`, HistoryActionTypes.Remove)

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
        modeler: {
            delete_and_children: deleteCubesAndChildren,
            delete: deleteCubesKeepChildren,
        }
    }), [deleteCubesKeepChildren, deleteCubesAndChildren]))

    const [propertiesHeight, setPropertiesHeight] = usePanelValue("model_cube_size")

    const toggleRef = useRef<HTMLDivElement>(null)
    const [propertiesActive] = usePanelValue("cube_list")
    return (
        <CanEditContext.Provider value={canEdit}>
            <div ref={toggleRef} style={{ height: propertiesActive ? propertiesHeight : 32 }}>
                <CollapsableSidebarPannel title="CUBE LIST" heightClassname="h-full" panelName="cube_list">
                    <div className="rounded-sm dark:bg-gray-800 bg-gray-200 h-full flex flex-col">
                        {canEdit && (
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
                        )}
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
        </CanEditContext.Provider>
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
    cube, selectedCubeManager, dragData, setDragData, dragOverRef, dragEndRef, mousePositionRef, isDraggingRef,
    mouseDraggedElementRef, clearPreviousDragState, onDragFinish, parentAnimateChildRemove, updateDrag
}: {
    cube: DCMCube
    selectedCubeManager: SelectedCubeManager
    dragData: DragData | null
    setDragData: Dispatch<SetStateAction<DragData | null>>
    dragOverRef: MutableRefObject<boolean>
    dragEndRef: RefObject<HTMLDivElement>
    mousePositionRef: MutableRefObject<{ x: number, y: number }>
    isDraggingRef: MutableRefObject<boolean>
    mouseDraggedElementRef: RefObject<HTMLDivElement>
    clearPreviousDragState: MutableRefObject<(cube: DCMCube) => void>
    onDragFinish: () => void
    updateDrag: (x: number, y: number) => void
    parentAnimateChildRemove?: () => void
}) => {
    const [children] = useListenableObject(cube.children)
    const [hideChildren] = useListenableObject(cube.hideChildren)
    const [needsDraggingStart, setNeedsDraggingStart] = useListenableObject(cube.needsDraggingStart)


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

    //Called when a cube is dropped onto this element
    const onCubeDroppedOntoThis = useCallback(() => {
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

            if (!cube.model.undoRedoHandler.isBatching()) {
                cube.model.undoRedoHandler.startBatchActions()
            }
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
    }, [dragData, animateRef, mouseDraggedElementRef, cleanupRef, setHasAnimationChildrenForce, cube, dragState])

    const beginDrag = useCallback((mode: "add" | "takeover") => {
        if (draggableRef.current === null || cubeItemRef.current === null) {
            return
        }

        isDraggingRef.current = true

        if (parentAnimateChildRemove) {
            parentAnimateChildRemove()
        }

        const rect = draggableRef.current.getBoundingClientRect()

        //animate the remain ghost, as to make it not jump
        //When mode=add, and we don't use this timeout, it breaks???? 
        //I hate this shitty ass code wtf 
        const animateRemain = () => animateRef(remainGhostRef, false, rect.height)
        if (mode === "add") {
            setTimeout(animateRemain, 1)
        } else {
            animateRemain()
        }

        //Set the mouse dragged element to be at the current mouse
        if (mouseDraggedElementRef.current !== null) {
            const style = mouseDraggedElementRef.current.style
            style.left = rect.x + "px"
            style.top = rect.y + "px"
        }

        //Update the props
        if (mode === "add") {
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
    }, [setDragData, setIsDragging, parentAnimateChildRemove, animateRef, cube, mouseDraggedElementRef, isDraggingRef])

    const finishDrag = useCallback(() => {
        isDraggingRef.current = false
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
            style.top = rect.y + 5 + "px"

        }

        //After .3 seconds, do the actual cube movements
        setTimeout(() => {
            if (!dragOverRef.current) {
                if (mouseDraggedElementRef.current !== null) {
                    mouseDraggedElementRef.current.style.transition = ""
                }
                if (dragData !== null) {
                    if (!cube.model.undoRedoHandler.isBatching()) {
                        cube.model.undoRedoHandler.startBatchActions()
                    }
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
    }, [cleanupRef, setIsDragging, setIsAnimating, dragData, setDragData, onDragFinish, cube.model, dragEndRef, dragOverRef, mouseDraggedElementRef, isDraggingRef])

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
    }, [dragData, setDragState, clearPreviousDragState, cube, dragOverRef])

    useEffect(() => {
        if (needsDraggingStart) {
            beginDrag("add")
            setNeedsDraggingStart(false)
        }
    }, [beginDrag, needsDraggingStart, setNeedsDraggingStart])

    useEffect(() => {
        if (cube.hasBeenPastedNeedsPlacement) {
            beginDrag("add")
            updateDrag(mousePositionRef.current.x, mousePositionRef.current.y)

            const mousedown = (e: MouseEvent) => {
                if (cube.hasBeenPastedNeedsPlacement && cube === dragData?.cubes?.[0]) {
                    finishDrag()
                    e.preventDefault()
                    e.stopPropagation()
                }
            }
            document.addEventListener("click", mousedown, true)
            return () => {
                document.removeEventListener("click", mousedown, true)
            }
        }
    }, [beginDrag, finishDrag, cube, dragData?.cubes, mousePositionRef, updateDrag])

    const {
        drag_cube_only: dragCubeOnly,
        drag_cubes_locally: dragCubesLocally,
    } = useKeyComboUnknownEventMatcher("modeler")

    const canEdit = useContext(CanEditContext)

    return (

        //We need to basically hide this when the first frame is placed down, however we also need to know it's width and height
        <div className={cube.hasBeenPastedNeedsPlacement && (dragData === null || !dragData.cubes.includes(cube)) ? 'absolute w-full -top-[100000px]' : ''}>
            {/* The top ghost element for when cubes are dragged above */}
            <div ref={topGhostRef} />
            <div
                // Per frame, when this cube is dragged, set the mouse dragged element to be the position
                onDrag={useCallback((e: DragEvent) => {
                    if (!canEdit) return
                    e.preventDefault()
                }, [canEdit])}

                //Called when the cube is started to drag.
                onDragStart={useCallback((e: DragEvent) => {
                    if (!canEdit) return

                    //set the drag image to be empty
                    e.dataTransfer.setDragImage(emptySpan, 0, 0)

                    cube.model.undoRedoHandler.startBatchActions()

                    const cubes = cube.selected.value ? cube.model.identifListToCubes(cube.model.selectedCubeManager.selected.value) : [cube]
                    if (dragCubeOnly(e)) {
                        cube.model.resetVisuals()
                        const lockers = cubes.flatMap(cube => {
                            const ret = cube.children.value.map(child => new CubeLocker(child))
                            cube.children.value.forEach(child => {
                                child.parent.deleteChild(child)
                                cube.parent.addChild(child)
                            })

                            return ret
                        })
                        lockers.forEach(locker => locker.reconstruct())
                    }
                    if (!dragCubesLocally(e)) {
                        cubes.forEach(cube => {
                            cube.pastedWorldMatrix = cube.cubeGroup.matrixWorld.toArray()
                        })
                        cube.model.pastedInWorld = true
                    }

                    if (cube.selected.value) {
                        //We only want to drag cubes who don't share a common parent
                        const cubesToDrag = cube.model.identifListToCubes(cube.model.selectedCubeManager.selected.value)
                        cubesToDrag.forEach(cube => {
                            for (let parent = cube.parent; parent instanceof DCMCube; parent = parent.parent) {
                                if (cubesToDrag.includes(parent)) {
                                    return
                                }
                            }
                            cube.needsDraggingStart.value = true
                        })
                        setDragData({
                            cubes: [],
                            width: 0,
                            height: 0
                        })
                    } else {
                        beginDrag("takeover")
                    }
                    e.stopPropagation()
                }, [cube, setDragData, beginDrag, dragCubeOnly, dragCubesLocally, canEdit])}

                //Called when the element is stopped dragging
                onDragEnd={useCallback((e: DragEvent) => {
                    if (!canEdit) return

                    finishDrag()
                    e.preventDefault()
                    e.stopPropagation()
                }, [finishDrag, canEdit])}

                //Called when a cube is dragged over this
                onDragOver={useCallback((e: DragEvent) => {
                    if (!canEdit) return

                    onDragOver(e.clientY)
                    e.preventDefault()
                    e.stopPropagation()
                }, [onDragOver, canEdit])}

                onMouseMoveCapture={useCallback((e: ReactMouseEvent) => {
                    if (!canEdit) return

                    if (dragData !== null && dragData.cubes.some(cube => cube.hasBeenPastedNeedsPlacement)) {
                        onDragOver(e.clientY)
                    }
                }, [dragData, onDragOver, canEdit])}

                //Called when a cube exits being dragged over this
                onDragLeave={useCallback((e: DragEvent) => {
                    if (!canEdit) return

                    dragOverRef.current = false
                    setDragState(null)
                    e.preventDefault()
                    e.stopPropagation()
                }, [dragOverRef, setDragState, canEdit])}

                onMouseLeave={useCallback((e: ReactMouseEvent) => {
                    if (!canEdit) return

                    if (dragData !== null && dragData.cubes.some(cube => cube.hasBeenPastedNeedsPlacement)) {
                        dragOverRef.current = false
                        setDragState(null)
                        e.preventDefault()
                        e.stopPropagation()
                    }
                }, [dragData, dragOverRef, setDragState, canEdit])}

                //Called when a cube is dropped on this
                onDrop={useCallback((e: DragEvent) => {
                    if (!canEdit) return

                    setDragState(null)
                    e.preventDefault()
                    e.stopPropagation()
                    onCubeDroppedOntoThis()
                }, [setDragState, onCubeDroppedOntoThis, canEdit])}

                onMouseDown={useCallback((e: ReactMouseEvent) => {
                    if (!canEdit) return

                    if (dragData !== null && dragData.cubes.some(cube => cube.hasBeenPastedNeedsPlacement)) {
                        setDragState(null)
                        e.preventDefault()
                        e.stopPropagation()
                        onCubeDroppedOntoThis()
                    }
                }, [dragData, setDragState, onCubeDroppedOntoThis, canEdit])}
                draggable={canEdit}
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
                                isDraggingRef={isDraggingRef}
                                mouseDraggedElementRef={mouseDraggedElementRef}
                                clearPreviousDragState={clearPreviousDragState}
                                onDragFinish={onDragFinish}
                                updateDrag={updateDrag}
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

    const isDraggingRef = useRef(false)

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


    const updateDrag = useCallback((x: number, y: number) => {
        if (mouseDraggedElementRef.current !== null && isDraggingRef.current) {
            const style = mouseDraggedElementRef.current.style
            style.left = x + "px"
            style.top = y + "px"
        }
    }, [])

    useEffect(() => {
        const mouseMove = (e: MouseEvent) => {
            if (dragData !== null) {
                updateDrag(e.clientX, e.clientY)
            }
        }
        document.addEventListener("dragover", mouseMove, true)
        document.addEventListener("mousemove", mouseMove, true)
        return () => {
            document.removeEventListener("dragover", mouseMove, true)
            document.removeEventListener("mousemove", mouseMove, true)
        }
    }, [updateDrag, dragData])


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
                    isDraggingRef={isDraggingRef}
                    onDragFinish={onDragFinish}
                    updateDrag={updateDrag}
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

    const canEdit = useContext(CanEditContext)

    const [visible] = useListenableObject(cube.visible);
    const [locked] = useListenableObject(cube.locked);

    const {
        cube_list_apply_to_children: applyToChildren,
        cube_list_apply_to_selected: applyToSelected,
    } = useKeyComboUnknownEventMatcher("modeler")

    const setRecursiveFactory = (setter: (cube: DCMCube, value: boolean) => void) => (value: boolean, event: ReactMouseEvent) => {

        setter(cube, value)

        if (applyToSelected(event)) {
            cube.model.identifListToCubes(selectedCubeManager.selected.value).forEach(c => setter(c, value))
        }

        if (applyToChildren(event)) {
            cube.traverse(c => setter(c, value))
        }

        event.preventDefault()
        event.stopPropagation()
    }
    const setVisible = setRecursiveFactory((cube, value) => cube.visible.value = value)
    const setLocked = setRecursiveFactory((cube, value) => cube.locked.value = value)

    const [hovering, setHovering] = useListenableObject(cube.mouseHover)
    const [selected] = useListenableObject(cube.selected)
    const [hideChildren, setHideChildren] = useListenableObject(cube.hideChildren)

    const [name] = useListenableObject(cube.name)

    const [otherCubes] = useListenableObjectInMap(cube.model.cubeMap, name)
    const sharedName = useMemo(() => (otherCubes?.length ?? 1) > 1, [otherCubes])


    if (visible && !locked) {
        itemBackgroundColor = "text-white "
        if (selected) {
            itemBackgroundColor += "bg-sky-500 hover:bg-sky-400"
        } else if (sharedName) {
            itemBackgroundColor += "bg-red-300 hover:bg-red-100"
        } if (hovering && !isDragging) {
            itemBackgroundColor += "bg-red-600"
        } else {
            itemBackgroundColor += "dark:bg-gray-700 bg-gray-400"
        }
    } else {
        itemBackgroundColor = locked ? "bg-opacity-30 text-gray-400 " : "bg-opacity-40 text-gray-500 "
        if (sharedName) {
            itemBackgroundColor += "bg-red-100"
        } else if (locked) {
            itemBackgroundColor += "dark:bg-gray-500 bg-gray-100"
        } else {
            itemBackgroundColor += "bg-gray-700"
        }
    }

    const tooltipRef = useTooltipRef<HTMLDivElement>(() => sharedName ? "Cube's name is not unique" : null)

    return (
        <div
            ref={tooltipRef}
            onPointerEnter={() => setHovering(true)}
            onPointerLeave={() => setHovering(false)}
            onClick={e => {
                if (cube.model.parentProject === undefined) {
                    return
                }
                selectedCubeManager.clickOnCube(cube, e.ctrlKey)
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
                    disabled={!canEdit}
                    onStartEditing={() => cube.model.undoRedoHandler.startBatchActions()}
                    onFinishEditing={() => cube.model.undoRedoHandler.endBatchActions("Cube Name Changed")}
                    obj={cube.name}
                    className="truncate text-white text-s pl-1 flex-grow cursor-pointer"
                    inputClassName="p-0 w-full h-full bg-gray-500 text-black"
                />
                {canEdit && (
                    <div className="flex flex-row text-white m-0 p-0">
                        {
                            locked ?
                                <button className="bg-red-800 hover:bg-red-600 rounded px-1 py-1 mr-1" onClick={e => setLocked(false, e)}><SVGLocked className="h-4 w-4" /></button>
                                :
                                <button className="dark:bg-gray-800 bg-gray-500 dark:hover:bg-black hover:bg-gray-600 rounded px-1 py-1 mr-1" onClick={e => setLocked(true, e)}><SVGUnlocked className="h-4 w-4" /></button>
                        }
                        {
                            visible ?
                                <button className="dark:bg-gray-800 bg-gray-500 dark:hover:bg-black hover:bg-gray-600 rounded px-1 py-1 mr-1" onClick={e => setVisible(false, e)}><SVGEye className="h-4 w-4" /></button>
                                :
                                <button className="bg-red-800 hover:bg-red-600 rounded px-1 py-1 mr-1" onClick={e => setVisible(true, e)}><SVGEyeOff className="h-4 w-4" /></button>
                        }
                    </div>
                )}
            </div>
        </div>
    )
}

export default ModelerCubeList;
