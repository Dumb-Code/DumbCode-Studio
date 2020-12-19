import { Clock } from "./three.js"

export class MementoTraverser {

    constructor( mementoCreator, { maxLimit = 50, timeTillCheck = 2, skipFrames = 10 } = {} ) {
        this.mementoCreator = mementoCreator
        this.maxLimit = maxLimit
        this.timeTillCheck = timeTillCheck
        this.skipFrames = skipFrames
        this.frameCounter = 0
        this.mementoList = []
        this.index = -1
        
        this._internalClock = new Clock()
    }

    onFrame() {
        let time = this._internalClock.getElapsedTime()
        if((time >= this.timeTillCheck && (this.frameCounter++ % this.skipFrames) === 0) || this.mementoList.length == 0) {
            this.attemptPush()
            this.frameCounter = 0
        }
    }

    onKeyDown(event) {
        if(document.activeElement.nodeName == "INPUT") {
            return
        }
        if(event.ctrlKey && event.keyCode === 90) { //z
            if(event.shiftKey) {
                this.redo()
            } else {
                this.undo()
            }
        }
    
        if(event.ctrlKey && event.keyCode === 89) { //y
            this.redo()
        }
    }

    attemptPush() {
        let memento = this.mementoCreator()
        memento._JSON = JSON.stringify(memento.data)
        let current = this.mementoList[this.index]

        if(current === undefined || current._JSON != memento._JSON) {
            this._internalClock.elapsedTime = 0
            this.mementoList.length = ++this.index
            this.mementoList.push(memento)
            while(this.mementoList.length > this.maxLimit) {
                this.mementoList.shift()
                this.index--
            }
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
            if(this.mementoList.length === this.index + 1) {
                this.attemptPush()
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