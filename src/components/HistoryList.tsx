import CollapsableSidebarPannel from "./CollapsableSidebarPannel";
import { SvgArrows, SvgEdit, SVGEye, SVGLocked, SVGPlus, SVGTerminal, SVGTrash } from "./Icons";

const HistoryList = () => { 
    return (
        <CollapsableSidebarPannel title="HISTORY LIST" heightClassname="h-96" panelName="history_list">
            <HistoryListContainer />
        </CollapsableSidebarPannel>
    )
}

const HistoryListContainer = () => { 
    return (
        <div className="overflow-y-scroll h-96 studio-scrollbar px-1 mr-0.5 mt-1 flex flex-col-reverse">
            <HistoryItem type={HistoryActionTypes.Command} reason="Command Snap" undone={false} selected={false} />
            <HistoryItem type={HistoryActionTypes.Transformation} reason="Gumball Move" undone={false} selected={false} />
            <HistoryItem type={HistoryActionTypes.Add} reason="Cube Created" undone={false} selected={false} />
            <HistoryItem type={HistoryActionTypes.Remove} reason="Cube Deleted" undone={false} selected={true} />
            <HistoryItem type={HistoryActionTypes.Edit} reason="Cube Properties Edit" undone={true} selected={false} />
            <HistoryItem type={HistoryActionTypes.ToggleVisibility} reason="Cube Hidden" undone={true} selected={false} />
            <HistoryItem type={HistoryActionTypes.LockUnlock} reason="Cube Locked" undone={true} selected={false} />
            <HistoryItem type={HistoryActionTypes.LockUnlock} reason="Cube Locked" undone={true} selected={false} />
            <HistoryItem type={HistoryActionTypes.LockUnlock} reason="Cube Locked" undone={true} selected={false} />
            <HistoryItem type={HistoryActionTypes.LockUnlock} reason="Cube Locked" undone={true} selected={false} />
            <HistoryItem type={HistoryActionTypes.LockUnlock} reason="Cube Locked" undone={true} selected={false} />
            <HistoryItem type={HistoryActionTypes.LockUnlock} reason="Cube Locked" undone={true} selected={false} />
            <HistoryItem type={HistoryActionTypes.LockUnlock} reason="Cube Locked" undone={true} selected={false} />
            <HistoryItem type={HistoryActionTypes.LockUnlock} reason="Cube Locked" undone={true} selected={false} />
            <HistoryItem type={HistoryActionTypes.LockUnlock} reason="Cube Locked" undone={true} selected={false} />
            <HistoryItem type={HistoryActionTypes.LockUnlock} reason="Cube Locked" undone={true} selected={false} />
            <HistoryItem type={HistoryActionTypes.LockUnlock} reason="Cube Locked" undone={true} selected={false} />
            <HistoryItem type={HistoryActionTypes.LockUnlock} reason="Cube Locked" undone={true} selected={false} />
        </div>
    );
}

type HistoryActionType = { element: any}

const HistoryActionTypes: { [key: string]: HistoryActionType } = { 
    Command: { element: <SVGTerminal className="h-4 w-4 m-1 mt-1.5" /> },
    Transformation: { element: <SvgArrows className="h-3 w-3 mb-1 mx-1.5 mt-2" /> },
    Add: { element: <SVGPlus className="h-4 w-4 m-1 mt-1.5" /> },
    Remove: { element: <SVGTrash className="h-4 w-4 mx-1 mt-1.5" /> },
    Edit: { element: <SvgEdit className="h-3 w-3 mb-1 mx-1.5 mt-2" /> },
    ToggleVisibility: { element: <SVGEye className="h-4 w-4 m-1 mt-1.5" /> },
    LockUnlock: { element: <SVGLocked className="h-4 w-4 m-1 mt-1.5" /> }
}

const HistoryItem = ({ type, reason, undone, selected }: {type: HistoryActionType, reason: String, undone: boolean, selected: boolean}) => { 
    return (
        <div className={(undone ? "dark:text-gray-500 bg-gray-300 dark:bg-gray-700 bg-opacity-50 hover:bg-opacity-100" : (selected ? "text-white bg-blue-500 hover:bg-blue-600" : "dark:text-white bg-white dark:bg-gray-700 hover:bg-opacity-50")) + " flex flex-row h-8 my-0.5 cursor-pointer"}>
            {type.element}
            <p className="">{reason}</p>
        </div>
    );
}

export default HistoryList;