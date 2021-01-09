/**
 * Creates a draggable element list. Used to handle elements in a list that can be dragged to be re-arranged
 */
export class DraggableElementList {

    constructor(canDropOnElement, callback) {
        let previousElement = null
        let draggedData = null

        //Adds an element to the drag list
        this.addElement = (element, dataGetter) => {
            let canDragOn = true
            element
            .on('dragstart', () => {
                draggedData = dataGetter()
            })
            .on('dragleave', function(e) {
                if(draggedData !== null) {
                    this.removeAttribute("drag-state")
                    e.preventDefault()
                    e.stopPropagation()
                }
            })

            //When an element is dragged next to (or on) another element
            .on('dragover', function(e) {
                if(!canDragOn || draggedData == null) {
                    return
                }
                let rect = this.getBoundingClientRect()
                let yPerc = (e.clientY - rect.top) / rect.height
        
                if(this !== previousElement) {
                    previousElement?.removeAttribute("drag-state")
                    previousElement = this
                }

                if(draggedData === dataGetter()) {
                    this.removeAttribute("drag-state")
                    return
                }
        
                //If can drop on the element, then get if it's
                // - top 1/3
                // - middle 1/3 ("on")
                // - bottom 1/3
                //
                //Otherwise if it's
                // - top 1/2
                // - bottom 1/2
                if(yPerc <= (canDropOnElement ? 1/3 : 1/2)) {
                    this.setAttribute("drag-state", "top")
                } else if(!canDropOnElement || yPerc > 2/3) {
                    this.setAttribute("drag-state", "bottom")
                } else if(canDropOnElement) {
                    this.setAttribute("drag-state", "on")
                }

                e.preventDefault()
                e.stopPropagation()
            })
            //When dropped, call the callback
            .on('drop', function(e) {
                let drop = this.getAttribute("drag-state")
                if(draggedData !== null && drop !== undefined && canDragOn) {
                    callback(drop, draggedData, dataGetter(), e)
                }
                this.removeAttribute("drag-state")
                draggedData = null
            })

            //Returns a function to enable/disable the drop on
            return e => canDragOn = e
        }

        //Adds a drop zone. An area that can be dropped on
        this.addDropZone = (element, callback, predicate = () => true) => {
            element
            .on('dragover', e => {
                if(draggedData !== null && predicate(draggedData)) {
                    previousElement?.removeAttribute("drag-state")
                    e.preventDefault()
                    e.stopPropagation()
                }
            })
            .on('drop', e => {
                if(draggedData !== null && predicate(draggedData)) {
                    callback(draggedData)
                    e.preventDefault()
                    e.stopPropagation()
                }
            })
        }
    }
}