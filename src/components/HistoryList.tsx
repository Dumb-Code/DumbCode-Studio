import { useStudio } from "../contexts/StudioContext";
import UndoRedoHandler, { ActionBatch, HistoryActionType } from "../studio/undoredo/UndoRedoHandler";
import { useListenableObject, useListenableObjectNullable } from "../studio/util/ListenableObject";
import CollapsableSidebarPannel from "./CollapsableSidebarPannel";


const HistoryList = ({ undoRedoHandler }: { undoRedoHandler?: UndoRedoHandler<any> }) => {
    const { getSelectedProject } = useStudio()
    const project = getSelectedProject()

    const [projectHistory] = useListenableObject(project.undoRedoHandler.history)
    const [history] = useListenableObjectNullable(undoRedoHandler?.history)

    const [projectIndex] = useListenableObject(project.undoRedoHandler.index)
    const [index] = useListenableObjectNullable(undoRedoHandler?.index)

    const mapToMeta = (index: number, batchs: readonly ActionBatch<any>[], otherBatches: readonly ActionBatch<any>[] | undefined) => batchs.map((batch, i) => ({
        batch,
        undone: index < i,
        isSelectedInHandler: i === index,
        selected: false
    }))
    const historyWithMeta = mapToMeta(index ?? 0, history ?? [], projectHistory)
    const projectHistoryWithMeta = mapToMeta(projectIndex, projectHistory, history)

    const joined = historyWithMeta.concat(projectHistoryWithMeta).sort((a, b) => a.batch.time - b.batch.time)

    for (let r = joined.length - 1; r >= 0; r--) {
        if (joined[r].isSelectedInHandler) {
            joined[r].selected = true
            break
        }
    }


    return (
        <CollapsableSidebarPannel title="HISTORY LIST" heightClassname="h-96" panelName="history_list">
            <div className="overflow-y-scroll h-96 studio-scrollbar px-1 mr-0.5 mt-1 flex flex-col-reverse">
                {joined.map((item, i) => <HistoryItem key={i} type={item.batch.actionType} reason={item.batch.reason} undone={item.undone} selected={item.selected} />)}
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