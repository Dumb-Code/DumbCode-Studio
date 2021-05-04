import { List, arrayMove, IItemProps } from 'react-movable';
import { useState } from 'react';
import { SVGChevronDown, SVGCube, SVGEye, SVGEyeOff, SVGLocked, SVGPlus, SVGTrash, SVGUnlocked } from '../../../components/Icons';

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
            <div className="border-r border-black flex flex-col w-full pr-2 pl-1 min-h-0">
                <CubeList />
            </div>
        </div>
    )
}

type CubeItem = {
    name: string;
    visible: boolean;
    locked: boolean;
    selected: boolean;
    hasChildren: boolean;
    indentAmmount: number;
    collapsed: boolean;
}

const CubeList = () => {

    const Cubes: CubeItem[] = [
        { name: "A Normal Cube", visible: true, locked: false, selected: false, hasChildren: false, indentAmmount: 0, collapsed: false },
        { name: "Hidden Cube", visible: false, locked: false, selected: false, hasChildren: false, indentAmmount: 0, collapsed: false },
        { name: "Locked Cube", visible: true, locked: true, selected: false, hasChildren: false, indentAmmount: 0, collapsed: false },
        { name: "Active Cube", visible: true, locked: false, selected: true, hasChildren: false, indentAmmount: 0, collapsed: false },
        { name: "Parent Cube", visible: true, locked: false, selected: false, hasChildren: true, indentAmmount: 0, collapsed: false },
        { name: "Child Cube", visible: true, locked: false, selected: false, hasChildren: false, indentAmmount: 1, collapsed: false },
        { name: "Parent Cube 2", visible: true, locked: false, selected: false, hasChildren: true, indentAmmount: 0, collapsed: false },
        { name: "Child Cube 2", visible: true, locked: false, selected: false, hasChildren: true, indentAmmount: 1, collapsed: false },
        { name: "Child Cube 3", visible: true, locked: false, selected: false, hasChildren: true, indentAmmount: 2, collapsed: true },
        { name: "A Normal Cube 2", visible: true, locked: false, selected: false, hasChildren: false, indentAmmount: 0, collapsed: false },
        { name: "Hidden Cube 2", visible: false, locked: false, selected: false, hasChildren: false, indentAmmount: 0, collapsed: false },
        { name: "Locked Cube 2", visible: true, locked: true, selected: false, hasChildren: false, indentAmmount: 0, collapsed: false },
        { name: "Parent Cube 3", visible: true, locked: false, selected: false, hasChildren: true, indentAmmount: 0, collapsed: false },
        { name: "Child Cube 4", visible: true, locked: false, selected: false, hasChildren: false, indentAmmount: 1, collapsed: false },
        { name: "Parent Cube 4", visible: true, locked: false, selected: false, hasChildren: true, indentAmmount: 0, collapsed: false },
        { name: "Child Cube 5", visible: true, locked: false, selected: false, hasChildren: true, indentAmmount: 1, collapsed: false },
        { name: "Child Cube 6", visible: true, locked: false, selected: false, hasChildren: true, indentAmmount: 2, collapsed: true },
    ]

    const [items, setItems] = useState(Cubes);

    return (
        <List
            values={items}
            onChange={({ oldIndex, newIndex }) =>
                setItems(arrayMove(items, oldIndex, newIndex))
            }
            renderList={({ children, props }) => {
                console.log(props)
                return <ul className="-mr-2 overflow-y-scroll" {...props}>{children}</ul>
            }}
            renderItem={({ value, props }) => {
                return <CubeListItem item={value} props={props} />
            }}
        />
    )
}

const CubeListItem = ({ props, item }: { props: IItemProps, item: CubeItem }) => {
    
    let itemBackgroundColor: string
    if(item.visible && !item.locked) {
        itemBackgroundColor = item.selected ? "bg-lightBlue-500 hover:bg-lightBlue-400 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
    } else {
        itemBackgroundColor = item.locked ? "bg-gray-100 bg-opacity-30 text-gray-400" : "bg-gray-700 bg-opacity-40 text-gray-500"
    }

    return (
        <li
            {...props}
            className={`${itemBackgroundColor} ml-2 my-1`} 
            style={{
                ...props.style,
                listStyleType: 'none',
                marginLeft: (item.indentAmmount * 15) + "px" 
            }} >
            <div className="flex flex-row py-0.5">
                {!item.hasChildren || <button className={(!item.collapsed || "transform -rotate-90") + " bg-gray-800 hover:bg-black rounded px-1 py-1 text-white ml-0.5"}><SVGChevronDown className="h-4 w-4" /></button>}
                <p className={(item.locked ? "cursor-not-allowed" : "cursor-move" ) + " truncate text-s pl-1 flex-grow"}>{item.name}</p>
                <div className="flex flex-row text-white m-0 p-0">
                    <button className={(item.locked ? "bg-red-800 hover:bg-red-600" : "bg-gray-800 hover:bg-black") + " rounded px-1 py-1 mr-1"}>{item.locked ? <SVGLocked className="h-4 w-4" /> : <SVGUnlocked className="h-4 w-4" />}</button>
                    <button className={(item.visible ? "bg-gray-800 hover:bg-black" : "bg-red-800 hover:bg-red-600") + " rounded px-1 py-1 mr-1"}>{item.visible ? <SVGEye className="h-4 w-4" /> : <SVGEyeOff className="h-4 w-4" />}</button>
                </div>
            </div>
        </li>
    )
}

export default ModelerCubeList;