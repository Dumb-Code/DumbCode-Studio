import { List, arrayMove, IItemProps } from 'react-movable';
import { BaseSyntheticEvent, useState } from 'react';
import { SVGChevronDown, SVGCube, SVGEye, SVGEyeOff, SVGLocked, SVGPlus, SVGTrash, SVGUnlocked } from '../../../components/Icons';
import { DragDropContext, Draggable, DraggableProvided, DraggableStateSnapshot, Droppable, DroppableProvided, DroppableStateSnapshot, DropResult } from 'react-beautiful-dnd';
import { useStudio } from '../../../contexts/StudioContext';
import { useModelRootCubes } from '../../../studio/formats/model/ModelHooks';
import { DCMCube, DCMModel } from '../../../studio/formats/model/DcmModel';

const ModelerCubeList = () => {
    return (
        <div className="rounded-sm bg-gray-800 h-full flex flex-col overflow-hidden">
            <div className="bg-gray-900 text-gray-400 font-bold text-xs p-1">
                <p className="flex-grow my-0.5">CUBE LIST</p>
            </div>
            <div className="flex flex-row mx-1">
                <button className="flex-grow bg-lightBlue-500 hover:bg-lightBlue-400 rounded text-white mr-0.5 flex flex-row">
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
            <div className="border-r border-black flex flex-col w-full pr-2 pl-1 min-h-0">
                <CubeList />
            </div>
        </div>
    )
}

const CubeList = () => {
    const [model, cubes] = useModelRootCubes()

    const findCubeByName = (name: string) => {
        const cube = model.cubeMap.get(name)
        if (cube === undefined) {
            throw new Error(`Cube With Name ${name} cannot be found ???`)
        }
        return cube
    }

    const findParentByName = (name: string) => {
        if (name === "root") {
            return model
        }
        if (name.startsWith("cube:")) {
            return findCubeByName(name.substring(5))
        }
        throw new Error(`Unable to infer parent from ${name}`)
    }

    const onDragEnd = ({ combine, draggableId, source, destination }: DropResult) => {
        if(destination && destination.droppableId.endsWith(draggableId)) {
            return
        }

        const dragged = findCubeByName(draggableId)
        dragged.parent.deleteChild(dragged)

        if (combine !== null && combine !== undefined) {
            const onto = findCubeByName(combine.draggableId)
            onto.addChild(dragged)
            return
        }

        if (destination) {
            let dest = destination.index

            //If on the same list and is dragged further on
            if (source.droppableId === destination.droppableId && destination.index > source.index) {
                dest -= 1
            }

            const parent = findParentByName(destination.droppableId)
            parent.children.splice(dest, 0, dragged)
            parent.onChildrenChange()
            
            return
        }

        model.addChild(dragged)
    }

    const renderCube = (cube: DCMCube, index: number, isDragging: boolean) => { 
        return (
            <Draggable draggableId={cube.name} key={cube.name} index={index} isDragDisabled={isDragging}>
                {(provided, snapshot) => {
                    return (
                        <div
                            className={"pl-2 " + ((snapshot.isDragging || isDragging) ? "bg-green-200" : (snapshot.combineTargetFor != null ? "bg-green-300" : "bg-green-500"))}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            // onDragStart={e => console.log(e)}
                            // style={ isDragging ? {}: {...provided.draggableProps.style}}
                          
                        >
                            {cube.name}
                            {
                                cube.children.length !== 0 &&
                                renderCubeList(`cube:${cube.name}`, cube.children, isDragging || snapshot.isDragging)
                            }
                        </div>
                    )
                }}
            </Draggable>

        )
    }

    const renderCubeList = (key: string, cubes: DCMCube[], isDragging: boolean) => {
        return (
            <Droppable droppableId={key} type={key} key={key} isCombineEnabled >
                {(provided, snapshot) => {
                    return (
                        <div
                            className={snapshot.isDraggingOver ? "bg-gray-200" : "bg-gray-500"}
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            {cubes.map((c, i) => renderCube(c, i, isDragging))}
                            {provided.placeholder}
                        </div>
                    )
                }}
            </Droppable>
        )
    }

    // const renderCube = (cube: DCMCube, index: number) => {
    //     return (
    //         <Droppable droppableId={cube.name} type={cube.name} key={cube.name}>
    //             {(dropProvided, dropSnapshot) => (
    // <div
    //     className={dropSnapshot.isDraggingOver ? "bg-gray-200" : "bg-gray-500"}
    //     ref={dropProvided.innerRef}
    //     {...dropProvided.droppableProps}
    // >

    //                 </div>
    //             )}
    //         </Droppable>
    //     )
    // }

    return (
        <DragDropContext onDragEnd={onDragEnd} >
            {renderCubeList("root", cubes, false)}
        </DragDropContext>
    )
}

// const CubeItem = ({ props, item }: { props: IItemProps, item: CubeItem }) => {
//     let itemBackgroundColor: string
//     if(item.visible) {
//         if(item.locked) {
//             itemBackgroundColor = "bg-gray-900"
//         } else if(item.selected) {
//             itemBackgroundColor = "bg-lightBlue-500 hover:bg-lightBlue-400"
//         } else {
//             itemBackgroundColor = "bg-gray-700 hover:bg-gray-600"
//         }
//     } else {
//         itemBackgroundColor = "bg-gray-900 cursor-not-allowed"
//     }
//     return (
//         <li
//             {...props}
//             className={`${itemBackgroundColor} ml-2 my-1`} 
//             style={{
//                 ...props.style,
//                 listStyleType: 'none',
//                 marginLeft: (item.indentAmmount * 15) + "px" 
//             }} >
//             <div className="flex flex-row py-0.5">
//                 {!item.hasChildren || <button className={(!item.collapsed || "transform -rotate-90") + " bg-gray-800 hover:bg-black rounded px-1 py-1 text-white ml-0.5"}><SVGChevronDown className="h-4 w-4" /></button>}
//                 <p className="truncate text-white text-s pl-1 flex-grow cursor-move">{item.name}</p>
//                 <div className="flex flex-row text-white m-0 p-0">
//                     <button className={(item.locked ? "bg-red-800 hover:bg-red-600" : "bg-gray-800 hover:bg-black") + " rounded px-1 py-1 mr-1"}>{item.locked ? <SVGLocked className="h-4 w-4" /> : <SVGUnlocked className="h-4 w-4" />}</button>
//                     <button className={(item.visible ? "bg-gray-800 hover:bg-black" : "bg-red-800 hover:bg-red-600") + " rounded px-1 py-1 mr-1"}>{item.visible ? <SVGEye className="h-4 w-4" /> : <SVGEyeOff className="h-4 w-4" />}</button>
//                 </div>
//             </div>
//         </li>
//     )

// }

export default ModelerCubeList;