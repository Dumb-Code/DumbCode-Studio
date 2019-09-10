export class HistoryList {
    constructor() {
        this.historyList = []
        this.index = -1 
    }

    canUndo() {
        return this.index >= 0
    }

    canRedo() {
        return this.index < this.historyList.length - 1
    }

    undo() {
        if(this.canUndo()) {
            this.historyList[this.index].undo()
            this.index--
        }
        this.updateHTML()
    }

    redo() {
        if(this.canRedo()) {
            this.index++
            this.historyList[this.index].redo()
        }
        this.updateHTML()
    }

    updateHTML() {
        document.getElementById("editor-undo").toggleAttribute("disabled", !this.canUndo())
        document.getElementById("editor-redo").toggleAttribute("disabled", !this.canRedo())
    }

    addAction(undo, redo) {
        while(this.historyList.length > this.index + 1) {
            this.historyList.pop()
        }
        this.index++
        this.historyList.push({undo, redo})
        this.updateHTML()
    }
}