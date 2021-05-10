import { SVGChevronDown, SVGCube, SVGEye, SVGEyeOff, SVGLocked, SVGPlus, SVGTrash, SVGUnlocked } from '../../../components/Icons';
import { CubeParent, DCMCube, DCMModel } from '../../../studio/formats/model/DcmModel';
import { ItemInterface, ReactSortable } from "react-sortablejs";
import { useRef, useState } from 'react';
import { useStudio } from '../../../contexts/StudioContext';
import { useListenableObject } from '../../../studio/util/ListenableObject';

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
        <div className="rounded-sm bg-gray-800 flex flex-col h-full">
            <div className="bg-gray-900 text-gray-400 font-bold text-xs p-1">
                <p className="flex-grow my-0.5">CUBE LIST</p>
            </div>
            <div className="flex flex-row px-1 bg-gray-900 pb-1">
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

class CubeItem implements ItemInterface {
    cube: CubeParent
    id: string
    parent?: CubeItem
    children: CubeItem[] = []

    constructor(cube: CubeParent, identifier?: string) {
        this.cube = cube
        this.id = identifier ?? 'root'
    }
}

const CubeList = ({ model }: { model: DCMModel }) => {
    const root = new CubeItem(model)

    const Cube = ({ cube, first = false }: { cube: CubeItem, first?: boolean }) => {
        const ref = useRef<HTMLDivElement>(null);
        const [children, setChildren] = useListenableObject(cube.cube.children)
        cube.children = children.map(c => new CubeItem(c, c.identifier))
        return (
            <div>
                {
                    //HEAD, for dropping onto, the onUpdate delegates it to the proper list
                    cube.cube instanceof DCMCube &&
                    <div className={first ? "" : "pt-0.5"}>
                        < ReactSortable
                            list={[cube]}
                            setList={(l) => {
                                const found = l[1]?.cube
                                if (found instanceof DCMCube) {
                                    setChildren([found].concat(cube.cube.getChildren()))
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
                                const list2 = cube.cube.getChildren().map(l => l.identifier)
                                if (list1.length !== list2.length || list1.some((l, i) => l !== list2[i])) {
                                    //Filter is weird: https://stackoverflow.com/a/51577579
                                    setChildren(list.map(l => l.cube).filter((cube): cube is DCMCube => cube !== null))
                                }
                            }
                        }}
                        animation={150}
                        fallbackOnBody
                        preventOnFilter={false}
                        filter={() => false}
                        group={{ name: 'cubes', pull: true, put: true }}
                        className={(cube.id === "root" ? "" : "pl-4") + (cube.children.length ? ' pb-0.5' : '')}
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
            <Cube cube={root} first />
        </div>)
}

const CubeItemEntry = ({ cube }: { cube: DCMCube }) => {
    let itemBackgroundColor: string

    const [visible, setVisible] = useState(true);
    const [locked, setLocked] = useState(false);

    const [mouseState, setMouseState] = useListenableObject(cube.mouseState)

    const collapsed = false

    if (visible && !locked) {
        itemBackgroundColor = "text-white "
        if (mouseState === "selected") {
            itemBackgroundColor += "bg-lightBlue-500 hover:bg-lightBlue-400"
        } else if (mouseState === "hover") {
            itemBackgroundColor += "bg-red-600"
        } else {
            itemBackgroundColor += "bg-gray-700"
        }
    } else {
        itemBackgroundColor = locked ? "bg-gray-100 bg-opacity-30 text-gray-400" : "bg-gray-700 bg-opacity-40 text-gray-500"
    }

    const setIfNotSelected = (state: "none" | "hover") => {
        if (mouseState !== "selected") {
            setMouseState(state)
        }
    }

    return (
        <div onMouseEnter={() => setIfNotSelected("hover")} onMouseLeave={() => setIfNotSelected("none")} className={`${itemBackgroundColor} ml-2 my-0.5`}>
            <div className="flex flex-row py-0.5">
                {
                    cube.getChildren().length !== 0 &&
                    <button className={(collapsed ? "transform -rotate-90" : "") + " bg-gray-800 hover:bg-black rounded px-1 py-1 text-white ml-0.5"}><SVGChevronDown className="h-4 w-4" /></button>
                }
                <p className="truncate text-white text-s pl-1 flex-grow cursor-pointer">{cube.name.value}</p>
                <div className="flex flex-row text-white m-0 p-0">
                    {
                        locked ?
                            <button className="bg-red-800 hover:bg-red-600 rounded px-1 py-1 mr-1" onClick={() => setLocked(false)}><SVGLocked className="h-4 w-4" /></button>
                            :
                            <button className="bg-gray-800 hover:bg-black rounded px-1 py-1 mr-1" onClick={() => setLocked(true)}><SVGUnlocked className="h-4 w-4" /></button>
                    }
                    {
                        visible ?
                            <button className="bg-gray-800 hover:bg-black rounded px-1 py-1 mr-1" onClick={() => setVisible(false)}><SVGEye className="h-4 w-4" /></button>
                            :
                            <button className="bg-red-800 hover:bg-red-600 rounded px-1 py-1 mr-1" onClick={() => setVisible(true)}><SVGEyeOff className="h-4 w-4" /></button>
                    }
                </div>
            </div>
        </div>
    )
}

export default ModelerCubeList;