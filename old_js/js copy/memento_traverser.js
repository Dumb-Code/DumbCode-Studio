import { Clock } from "./libs/three.js"

/**
 * Memento traverser. Used to undo/redo 
 */
export class MementoTraverser {

    constructor( mementoCreator, { maxLimit = 50, timeTillCheck = 2, skipFrames = 10 } = {} ) {
        this.mementoCreator = mementoCreator
        this.maxLimit = maxLimit
        this.timeTillCheck = timeTillCheck
        this.skipFrames = skipFrames
        this.frameCounter = 0
        this.mementoList = []
        this.blockedReason = new Set()
        this.index = -1
        
        this._internalClock = new Clock()
    }

    /**
     * Blocks this memento traverser from working for a reason
     * @param {string} reason the reason to block
     */
    blockReason(reason) {
        this.blockedReason.add(reason)
    }

    /**
     * Unblocks this memento traverser from working for the reason
     * @param {string} reason the reason to remove
     */
    unblockReason(reason) {
        this.blockedReason.delete(reason)
    }

    /**
     * Called per frame
     */
    onFrame() {
        let time = this._internalClock.getElapsedTime()
        //If: 
        // - this isn't blocked
        // - the time since the last check is more than `timeTillCheck`
        // - the frame counter isn't skipped (frameCounter % skipFrames == 0)
        //OR
        // - there isn't any mementos in the list
        if((this.blockedReason.size === 0 && time >= this.timeTillCheck && (this.frameCounter++ % this.skipFrames) === 0) || this.mementoList.length == 0) {
            //Push a new memento and reset the frame counter.
            this.attemptPush()
            this.frameCounter = 0
        }
    }

    /**
     * Handles the key events. Used to do ctrl+z, ctrl+y ect
     * @param {Event} event the key down event
     */
    onKeyDown(event) {
        if(document.activeElement.nodeName == "INPUT") {
            return
        }
        //Ctrl + z = undo
        //Ctrl + shift + z = redo
        if(event.ctrlKey && event.keyCode === 90) { //z
            if(event.shiftKey) {
                this.redo()
            } else {
                this.undo()
            }
        }
    
        //Ctrl + y = redo
        if(event.ctrlKey && event.keyCode === 89) { //y
            this.redo()
        }
    }

    /**
     * Attempts a push of a new element
     */
    attemptPush() {
        //Create a new memento
        let memento = this.mementoCreator()
        //stringify the data
        memento._JSON = JSON.stringify(memento.data)
        //Get the current memento
        let current = this.mementoList[this.index]

        //If the current memento doesn't exist, or the .data part is different
        if(current === undefined || current._JSON != memento._JSON) {

            //Reset the clock and push the memento
            this._internalClock.elapsedTime = 0
            //Setting the length means any mementos after the index are removed
            this.mementoList.length = ++this.index
            this.mementoList.push(memento)
            
            //If we've reached the max limit, we need to remove the bottom elements.
            while(this.mementoList.length > this.maxLimit) {
                this.mementoList.shift()
                this.index--
            }
            return true
        }
        return false
    }

    /**
     * Gets if the traverser can undo
     */
    canUndo() {
        return this.index > 0
    }

    /**
     * Get if the traverser can redo
     */
    canRedo() {
        return this.index < this.mementoList.length - 1
    }

    /**
     * Undo the traverser
     */
    undo() {
        if(this.canUndo()) {
            //If at the end of the list, then attempt a state before undoing.
            //This ensures that when redoing that state is resored
            if(this.mementoList.length === this.index + 1) {
                this.attemptPush()
            }
            this.mementoList[--this.index].reconstruct()
        }
    }

    /**
     * Redoes the traverser
     */
    redo() {
        if(this.canRedo()) {
            this.mementoList[++this.index].reconstruct()
        }
    }
}