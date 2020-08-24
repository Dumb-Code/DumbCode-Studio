import { Clock } from "./three.js"
import { objectEquals } from "./util.js"

export class MementoTraverser {

    constructor( mementoCreator, { maxLimit = 50, timeTillCheck = 5 } = {} ) {
        this.mementoCreator = mementoCreator
        this.maxLimit = maxLimit
        this.timeTillCheck = timeTillCheck
        this.mementoList = []
        this.index = -1
        
        this._internalClock = new Clock()
    }

    onFrame() {
        let time = this._internalClock.getElapsedTime()
        if(time >= this.timeTillCheck || this.mementoList.length == 0) {
            this.attemptPush()        
        }
    }

    attemptPush() {
        let memento = this.mementoCreator()
        let current = this.mementoList[this.index]

        if(!objectEquals(current, memento, true)) {
            this._internalClock.elapsedTime = 0
            this.mementoList.length = ++this.index
            this.mementoList.push(memento)
            return true
        }
        return false
    }

    canUndo() {
        return this.index > 0
    }

    canRedo() {
        return this.index < this.mementoList.length - 1
    }

    undo() {
        if(this.canUndo()) {
            if(this.mementoList.length === this.index + 1 && this.attemptPush() === true) {
                this.index--
            }
            this.mementoList[--this.index].reconstruct()
        }
    }

    redo() {
        if(this.canRedo()) {
            this.mementoList[++this.index].reconstruct()
        }
    }
}