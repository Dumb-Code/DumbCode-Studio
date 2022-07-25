import { useCallback, useMemo } from "react";
import { useStudio } from "../contexts/StudioContext";
import { useListenableObjectNullable } from "../studio/listenableobject/ListenableObject";
import UndoRedoHandler, { ActionBatch, HistoryActionIcons } from "../studio/undoredo/UndoRedoHandler";
import CollapsableSidebarPannel from "./CollapsableSidebarPannel";


const HistoryList = ({ undoRedoHandler }: { undoRedoHandler?: UndoRedoHandler<any> }) => {
    const { getSelectedProject } = useStudio()

    const [history] = useListenableObjectNullable(undoRedoHandler?.history)

    const [index] = useListenableObjectNullable(undoRedoHandler?.index)

    const head = UndoRedoHandler.getHead(undoRedoHandler)


    const makeBatchHead = useCallback((batch: ActionBatch<any>) => {
        if (head === null) {
            console.warn("Tried to undo with an empty head")
            return
        }
        const isUndo = batch.time < head.time
        while (UndoRedoHandler.getHead(undoRedoHandler) !== batch) {
            (isUndo ? UndoRedoHandler.undo : UndoRedoHandler.redo)(undoRedoHandler)
        }
    }, [head, undoRedoHandler])

    return (
        <CollapsableSidebarPannel title="HISTORY LIST" heightClassname="h-96" panelName="history_list">
            <div className="overflow-y-scroll h-96 studio-scrollbar px-1 mr-0.5 mt-1 flex flex-col-reverse">
                {index !== undefined && history !== undefined &&
                    history.map((item, i) => <HistoryItem key={i} batch={item} undone={index < i} selected={i === index} makeBatchHead={makeBatchHead} />)
                }
            </div>
        </CollapsableSidebarPannel>
    )
}

const HistoryItem = ({ batch, undone, selected, makeBatchHead }: { batch: ActionBatch<any>, undone: boolean, selected: boolean, makeBatchHead: (batch: ActionBatch<any>) => void }) => {
    const onClick = useCallback(() => makeBatchHead(batch), [batch, makeBatchHead])

    const iconData = useMemo(() => HistoryActionIcons[batch.actionType], [batch.actionType])
    return (
        <button
            className={(undone ? "dark:text-gray-500 bg-gray-300 dark:bg-gray-700 bg-opacity-50 hover:bg-opacity-100" : (selected ? "text-white bg-blue-500 hover:bg-blue-600" : "dark:text-white bg-white dark:bg-gray-700 hover:bg-opacity-50")) + " flex flex-row items-center h-8 my-0.5"}
            onClick={onClick}
        >
            <iconData.Icon className="h-4 w-4 m-1.5" />
            <p className="">{batch.reason}</p>
        </button>
    );
}

export default HistoryList;