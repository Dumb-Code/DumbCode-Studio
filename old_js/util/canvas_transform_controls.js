/**
 * Used to control the a transform. Provides a way to move the canvas by clicking and draggin
 * Also allows for zooming.
 */
export class CanvasTransformControls {
    constructor(canvas, mouseCallback, widthReboundModifier = 1, redrawCallback = () => {}) {
        this.mouseCallback = mouseCallback
        this.redrawCallback = redrawCallback
        this.widthReboundModifier = widthReboundModifier
        this.canvasMatrix = new DOMMatrix([1, 0, 0, 1, 0, 0])
        this.canvas = canvas
        this.hasMoved = false

        //Mul the default matrix
        this.mulMatrix(new DOMMatrix())

        this.previousWidth = -1
        this.previousHeight = -1

        //Bind events to the canvas
        $(canvas)
            //Mouse events
            .mousemove(e => this.mouseEvent(e))
            .mousedown(e => this.mouseEvent(e))
            .mouseup(e => this.mouseEvent(e))
            .mouseleave(e => this.mouseEvent(e))
            
            //Don't allow for right clicking
            .contextmenu(e => e.preventDefault())

            //On scroll, cause the scroll events.
            .bind('mousewheel DOMMouseScroll', e => {
                let direction = e.originalEvent.wheelDelta
                let amount =  1.1
                if(direction === undefined) { //Firefox >:(
                    direction = -e.detail
                }
                //Scale
                this.mulMatrix(new DOMMatrix().scaleSelf(direction > 0 ? amount : 1/amount))
                this.redrawCallback()
                e.preventDefault()
                e.stopPropagation()
            })
    }
    
    /**
     * Applies the transforms to the canvas
     */
    applyTransforms() {
        let ctx = this.canvas.getContext('2d')
        ctx.setTransform(this.getFinalMatrix())
    }

    /**
     * Called when a mouse event is fired.
     * @param {Event} e a mouse event
     */
    mouseEvent(e) {
        let rect = this.canvas.getBoundingClientRect()
        //Get the mouse point and transform it
        let mousePoint = new DOMPoint(e.originalEvent.clientX - rect.left, e.originalEvent.clientY - rect.top)
        mousePoint = mousePoint.matrixTransform(this.getFinalMatrix().inverse())
        
        //Get the mouse him
        let mouseX = mousePoint.x
        let mouseY = mousePoint.y

        //Call the mouse callback
        this.mouseCallback(e.type, mouseX, mouseY, e.buttons, v => this.misscallback(e, v === null || v === undefined ? true : v))
    }

    /**
     * The misscallback for the mouse callback. Used to move the canvas.
     * @param {Event} e the mouse event
     * @param {boolean} v whether the event should be counted as a move or not
     */
    misscallback(e, v) {
        if(e.type === "mousedown") {
            this.hasMoved = false
        }
        
        //If movement should do
        if(v) {
            let x = e.originalEvent.movementX
            let y = e.originalEvent.movementY
            if(x !== 0 && y !== 0) {
                this.hasMoved = true
                //Translate
                this.mulMatrix(new DOMMatrix().translateSelf(x, y))
                this.redrawCallback()
            }
        }
    }

    /**
     * Gets the final matrix to multiply with
     */
    getFinalMatrix() {
        let width = this.canvas.clientWidth
        let height = this.canvas.clientHeight

        //If the width or height has changed, recompute the final matrix
        if(width !== this.previousWidth || height !== this.previousHeight) {
            this.previousWidth = width
            this.previousHeight = height
            this.computeFinalMatrix()
        }
        
        return this.finalCanvasMatrix
    }

    /**
     * Mutliplys the final matrix
     * @param {DOMMatrix} matrix the matrix to multiply
     */
    mulMatrix(matrix) {
        this.canvasMatrix.preMultiplySelf(matrix)
        this.computeFinalMatrix()
    }

    /**
     * Recomputes the final matrix. Needed as we need to translate (-50% -50%) before and (50% 50%) after
     */
    computeFinalMatrix() {
        let width = this.canvas.clientWidth
        let height = this.canvas.clientHeight

        this.finalCanvasMatrix = new DOMMatrix().translate(width/2, height/2).multiply(this.canvasMatrix).multiply(new DOMMatrix().translate(-width/(2*this.widthReboundModifier), -height/2))
    }
}