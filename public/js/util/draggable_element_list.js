export class DraggableElementList {

    constructor(canDropOnElement, callback) {
        let previousElement = null
        let draggedData = null

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
            .on('drop', function(e) {
                let drop = this.getAttribute("drag-state")
                if(draggedData !== null && drop !== undefined && canDragOn) {
                    callback(drop, draggedData, dataGetter(), e)
                }
                this.removeAttribute("drag-state")
                draggedData = null
            })
         
            return e => canDragOn = e
        }
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