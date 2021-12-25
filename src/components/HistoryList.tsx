import React from "react";
import UndoRedoHandler, { HistoryActionType } from "../studio/undoredo/UndoRedoHandler";
import { useListenableObjectNullable } from "../studio/util/ListenableObject";
import CollapsableSidebarPannel from "./CollapsableSidebarPannel";

const HistoryList = ({ undoRedoHandler }: { undoRedoHandler?: UndoRedoHandler<any> }) => {
    const [history] = useListenableObjectNullable(undoRedoHandler?.history)
    return (
        <CollapsableSidebarPannel title="HISTORY LIST" heightClassname="h-96" panelName="history_list">
            <div className="overflow-y-scroll h-96 studio-scrollbar px-1 mr-0.5 mt-1 flex flex-col-reverse">
                {history && history.map((item, i) => <HistoryItem key={i} type={item.actionType} reason={item.reason} undone={false} selected={false} />)}
            </div>
        </CollapsableSidebarPannel>
    )
}

const HistoryItem = ({ type, reason, undone, selected }: { type: HistoryActionType, reason: String, undone: boolean, selected: boolean }) => {
    return (
        <div className={(undone ? "dark:text-gray-500 bg-gray-300 dark:bg-gray-700 bg-opacity-50 hover:bg-opacity-100" : (selected ? "text-white bg-blue-500 hover:bg-blue-600" : "dark:text-white bg-white dark:bg-gray-700 hover:bg-opacity-50")) + " flex flex-row items-center h-8 my-0.5 cursor-pointer"}>
            <type.Icon className="h-4 w-4 m-1.5" />
            <p className="">{reason}</p>
        </div>
    );
}

export default HistoryList;