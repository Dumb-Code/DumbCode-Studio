import { SVGCube, SVGPlus, SVGTrash } from '../../../components/Icons';
import { DCMCube } from '../../../studio/formats/model/DcmModel';
import { useModelRootCubes } from '../../../studio/formats/model/ModelHooks';
import { ItemInterface, ReactSortable } from "react-sortablejs";
import { CSSProperties, useRef, useState } from 'react';

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

class CubeItem implements ItemInterface {
    cube: DCMCube | null
    id: string
    parent?: CubeItem
    children: CubeItem[]

    constructor(parent?: CubeItem, cube?: DCMCube) {
        this.cube = cube ?? null
        this.id = cube?.identifier ?? 'root'
        this.children = cube?.children?.map(c => new CubeItem(this, c)) ?? []
    }
}

const CubeList = () => {
    const [model, cubes] = useModelRootCubes()
    const [items, setItems] = useState(() => cubes.map(c => new CubeItem(undefined, c)))

    let counter = 0

    const space = 10

    const Cube = ({ cube }: { cube: CubeItem | undefined }) => {
        const css1: CSSProperties = {
            backgroundColor: `hsl(${counter * 150}, 50%, 50%)`,
        }

        const css2: CSSProperties = {
            backgroundColor: `hsl(${counter++ * 150}, 75%, 50%)`,
            paddingBottom: cube?.children?.length ? '10px' : '',
            paddingLeft: '0.5rem'
        }

        const ref = useRef<ReactSortable<CubeItem>>(null);


        return (
            <div>
                {/* HEAD, for dropping onto, the onUpdate delegates it to the proper list */}
                <ReactSortable
                    list={cube ? [cube] : []}
                    setList={() => {}}
                    onUpdate={e => {
                        if (ref.current !== null) {
                            ref.current.onUpdate({
                                ...e,
                                clones: []
                            })
                        }
                        e.preventDefault()
                    }}
                    preventOnFilter={false}
                    filter={() => true}
                    style={css1}
                >
                    <div >
                        {cube?.cube?.name}
                    </div>
                </ReactSortable>

                <ReactSortable
                    ref={ref}
                    list={cube?.children}
                    setList={l => {
                        console.log(l)
                    }}
                    animation={150}
                    fallbackOnBody
                    preventOnFilter={false}
                    filter={() => false}
                    group={{ name: 'cubes', pull: true, put: true }}
                    style={css2}
                >
                    {cube?.children.map((cube) =>
                        <div
                            key={cube.cube?.identifier ?? ''}
                            data-cube={cube.cube?.identifier}
                            // className={cube !== undefined ? "pl-2" : ""}
                        >
                            <Cube cube={cube} />
                        </div>
                    )}


                </ReactSortable>
            </div>
        )
    }

    return (
        <div>
            {items.map(i => <Cube cube={i} />)}
            {/* <Cube cubes={items} /> */}
        </div>)
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