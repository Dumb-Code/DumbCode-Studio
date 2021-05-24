import { SVGChevronDown, SVGCube, SVGEye, SVGEyeOff, SVGLocked, SVGPlus, SVGTrash, SVGUnlocked } from '../../../components/Icons';
import { DCMCube, DCMModel } from '../../../studio/formats/model/DcmModel';
import { MutableRefObject, useRef, useState } from 'react';
import { useStudio } from '../../../contexts/StudioContext';
import { useListenableObject } from '../../../studio/util/ListenableObject';
import { DblClickEditLO } from '../../../components/DoubleClickToEdit';


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

const CubeListItem = ({ cube, dragData }: {
    cube: DCMCube
    dragData: MutableRefObject<DCMCube | null>
}) => {
    const [children] = useListenableObject(cube.children)
    const [dragState, setDragState] = useState<"bottom" | "on" | "top" | null>(null)
    const [isDragging, setIsDragging] = useState(false)

    const onCubeDroppedOntoThis = (_: React.DragEvent<HTMLDivElement>) => {
        const cubeDragged = dragData.current
        if (cubeDragged === null) {
            return
        }

        cubeDragged.parent.deleteChild(cubeDragged)
        if (dragState === "on") {
            cube.addChild(cubeDragged)
        } else {
            const parentCubes = [...cube.parent.children.value]

            let index = parentCubes.indexOf(cube)
            if (dragState === "bottom") {
                index++
            }

            parentCubes.splice(index, 0, cubeDragged)
            cube.parent.children.value = parentCubes
        }
    }

    return (
        <div
            onDragStart={e => {
                setIsDragging(true)
                dragData.current = cube
            }}
            onDragEnd={e => {
                setIsDragging(false)
                dragData.current = null
                e.preventDefault()
                e.stopPropagation()
            }}

            onDragOver={e => {
                if (dragData.current === cube) {
                    return
                }
                let rect = e.currentTarget.getBoundingClientRect()
                let yPerc = (e.clientY - rect.top) / rect.height

                if (yPerc <= 1 / 3) {
                    setDragState("top")
                } else if (yPerc >= 2 / 3) {
                    setDragState("bottom")
                } else {
                    setDragState("on")
                }

                e.preventDefault()
                e.stopPropagation()
            }}
            onDragLeave={e => {
                setDragState(null)
                e.preventDefault()
                e.stopPropagation()
            }}
            onDrop={e => {
                setDragState(null)
                e.preventDefault()
                e.stopPropagation()
                onCubeDroppedOntoThis(e)
            }}
            draggable
        >
            <div><CubeItemEntry cube={cube} dragState={dragState} isDragging={isDragging} /></div>
            {
                <div className="ml-2">{children.map(c =>
                    <CubeListItem
                        key={c.identifier}
                        cube={c}
                        dragData={dragData}
                    />
                )}</div>
            }
            <div></div>
        </div>
    )
}

const CubeList = ({ model }: { model: DCMModel }) => {
    const [children] = useListenableObject(model.children)
    const dragData = useRef<DCMCube | null>(null)
    return (
        <div>
            {children.map(c =>
                <CubeListItem
                    key={c.identifier}
                    cube={c}
                    dragData={dragData}
                />
            )}
        </div>
    )
}

const CubeItemEntry = ({ cube, dragState, isDragging }: { cube: DCMCube, dragState: "top" | "bottom" | "on" | null, isDragging: boolean }) => {
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