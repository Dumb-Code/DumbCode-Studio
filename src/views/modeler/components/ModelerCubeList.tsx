import { SVGChevronDown, SVGCube, SVGEye, SVGEyeOff, SVGLocked, SVGPlus, SVGTrash, SVGUnlocked } from '../../../components/Icons';
import { CubeParent, DCMCube } from '../../../studio/formats/model/DcmModel';
import { useModelRootCubes } from '../../../studio/formats/model/ModelHooks';
import { ItemInterface, ReactSortable } from "react-sortablejs";
import { CSSProperties, useRef, useState } from 'react';

const ModelerCubeList = () => {
    return (
        <div className="rounded-sm bg-gray-800 h-full flex flex-col overflow-hidden">
            <div className="bg-gray-900 text-gray-400 font-bold text-xs p-1">
                <p className="flex-grow my-0.5">CUBE LIST</p>
            </div>
            <div className="flex flex-row mx-1 bg-gray-900 pb-1">
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
            <div className="border-r border-black flex flex-col w-full pr-2 pl-1 min-h-0 overflow-y-scroll h-full">
                <CubeList />
            </div>
        </div>
    )
}

class CubeItem implements ItemInterface {
    cube: CubeParent
    id: string
    parent?: CubeItem
    children: CubeItem[]

    constructor(cube: CubeParent, identifier?: string) {
        this.cube = cube
        this.id = identifier ?? 'root'
        this.children = cube?.children?.map(c => new CubeItem(c, c.identifier)) ?? []
    }
}

const CubeList = () => {
    const [model, cubes] = useModelRootCubes()
    const root = new CubeItem(model)

    const Cube = ({ cube, first = false }: { cube: CubeItem, first?: boolean }) => {
        const ref = useRef<HTMLDivElement>(null);
        return (
            <div>
                {
                    //HEAD, for dropping onto, the onUpdate delegates it to the proper list
                    cube.cube instanceof DCMCube &&
                    <div className={first ? "" : "pt-1"}>
                        < ReactSortable
                            list={[cube]}
                            setList={(l) => {
                                const found = l[1]?.cube
                                if (found instanceof DCMCube) {
                                    cube.cube.children.splice(0, 0, found)
                                    cube.cube.onChildrenChange()
                                }
                            }}
                            onChange={() => {
                                if (ref.current !== null) {
                                    const sortableContainer = ref.current.parentElement
                                    if (sortableContainer !== null) {
                                        const children = sortableContainer.childNodes
                                        if (children.length === 2) {
                                            if (ref.current === children[1]) {
                                                sortableContainer.insertBefore(children[1], children[0])
                                            }
                                        } else if (children.length !== 1) {
                                            console.error(`Don't know how to handle children of length ${children.length}`)
                                        }
                                    }
                                }
                            }}
                            group={{ name: 'cubes', pull: false, put: true }}
                            preventOnFilter={false}
                            filter={() => true}
                            animation={150}
                            fallbackOnBody
                            className="dcs-cube-head"
                        >
                            {/* The ref needs to be on the first child of the head sortable */}
                            <div ref={ref}>
                                <CubeItemEntry cube={cube.cube} />
                            </div>
                        </ReactSortable>
                    </div>
                }
                {cube.children.length !== 0 &&
                    <ReactSortable
                        list={cube.children}
                        setList={(list, _, d) => {
                            if (d.dragging !== null) {
                                const list1 = list.map(l => l.id)
                                const list2 = cube.cube.children.map(l => l.identifier)
                                if (list1.length !== list2.length || list1.some((l, i) => l !== list2[i])) {
                                    //Filter is weird: https://stackoverflow.com/a/51577579
                                    cube.cube.onChildrenChange(list.map(l => l.cube).filter((cube): cube is DCMCube => cube !== null))
                                }
                            }
                        }}
                        animation={150}
                        fallbackOnBody
                        preventOnFilter={false}
                        filter={() => false}
                        group={{ name: 'cubes', pull: true, put: true }}
                        className={(cube.id === "root" ? "" : "pl-4") + (cube.children.length ? ' pb-1' : '')}
                    >
                        {cube.children.map((cube, idx) =>
                            <div
                                key={cube.id ?? ''}
                                data-cube={cube.id}
                            // className={cube !== undefined ? "pl-2" : ""}
                            >
                                <Cube cube={cube} />
                            </div>
                        )}
                    </ReactSortable>
                }
            </div >
        )
    }

    return (
        <div>
            {/* {items.map(i => <Cube cube={i} />)} */}
            <Cube cube={root} first/>
        </div>)
}

const CubeItemEntry = ({ cube }: { cube: DCMCube }) => {
    let itemBackgroundColor: string

    const visible = true
    const locked = false
    const selected = false
    const collapsed = false
    if (visible) {
        if (locked) {
            itemBackgroundColor = "bg-gray-900"
        } else if (selected) {
            itemBackgroundColor = "bg-lightBlue-500 hover:bg-lightBlue-400"
        } else {
            itemBackgroundColor = "bg-gray-700 hover:bg-gray-600"
        }
    } else {
        itemBackgroundColor = locked ? "bg-gray-100 bg-opacity-30 text-gray-400" : "bg-gray-700 bg-opacity-40 text-gray-500"
    }

    return (
        <div className={`${itemBackgroundColor} ml-2 my-1`}>
            <div className="flex flex-row py-0.5">
                {
                    cube.children.length !== 0 &&
                    <button
                        className={(collapsed ? "transform -rotate-90" : "") + " bg-gray-800 hover:bg-black rounded px-1 py-1 text-white ml-0.5"}>
                        <SVGChevronDown className="h-4 w-4" />
                    </button>
                }
                <p className="truncate text-white text-s pl-1 flex-grow cursor-move">{cube.name}</p>
                <div className="flex flex-row text-white m-0 p-0">
                    {
                        locked ?
                            <button className="bg-red-800 hover:bg-red-600 rounded px-1 py-1 mr-1">
                                <SVGLocked className="h-4 w-4" />
                            </button>
                            :
                            <button className="bg-gray-800 hover:bg-black rounded px-1 py-1 mr-1">
                                <SVGUnlocked className="h-4 w-4" />
                            </button>
                    }
                    {
                        visible ?
                            <button className="bg-gray-800 hover:bg-black rounded px-1 py-1 mr-1">
                                <SVGEye className="h-4 w-4" />
                            </button>
                            :
                            <button className="bg-red-800 hover:bg-red-600 rounded px-1 py-1 mr-1">
                                <SVGEyeOff className="h-4 w-4" />
                            </button>
                    }
                </div>
            </div>
        </div>
    )
}

export default ModelerCubeList;