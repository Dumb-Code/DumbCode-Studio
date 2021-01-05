export class CanvasTransformControls {
    constructor(canvas, mouseCallback, widthReboundModifier = 1, redrawCallback = () => {}) {
        this.mouseCallback = mouseCallback
        this.redrawCallback = redrawCallback
        this.widthReboundModifier = widthReboundModifier
        this.canvasMatrix = new DOMMatrix([1, 0, 0, 1, 0, 0])
        this.canvas = canvas
        this.hasMoved = false

        this.mulMatrix(new DOMMatrix())

        this.previousWidth = -1
        this.previousHeight = -1

        $(canvas)
            .mousemove(e => this.mouseEvent(e))
            .mousedown(e => this.mouseEvent(e))
            .mouseup(e => this.mouseEvent(e))
            .mouseleave(e => this.mouseEvent(e))
            .contextmenu(e => e.preventDefault())
            .bind('mousewheel DOMMouseScroll', e => {
                let direction = e.originalEvent.wheelDelta
                let amount =  1.1
                if(direction === undefined) { //Firefox >:(
                    direction = -e.detail
                }
                this.mulMatrix(new DOMMatrix().scaleSelf(direction > 0 ? amount : 1/amount))
                this.redrawCallback()
                e.preventDefault()
                e.stopPropagation()
            })
    }
    
    applyTransforms() {
        let ctx = this.canvas.getContext('2d')
        ctx.setTransform(this.getFinalMatrix())
    }

    mouseEvent(e) {
        let rect = this.canvas.getBoundingClientRect()
        let mousePoint = new DOMPoint(e.originalEvent.clientX - rect.left, e.originalEvent.clientY - rect.top)
        mousePoint = mousePoint.matrixTransform(this.getFinalMatrix().inverse())
        let mouseX = mousePoint.x
        let mouseY = mousePoint.y

        this.mouseCallback(e.type, mouseX, mouseY, e.buttons, v => this.misscallback(e, v === null || v === undefined ? true : v))
    }

    misscallback(e, v) {
        if(e.type === "mousedown") {
            this.hasMoved = false
        }
        if(v) {
            let x = e.originalEvent.movementX
            let y = e.originalEvent.movementY
            if(x !== 0 && y !== 0) {
                this.hasMoved = true
                this.mulMatrix(new DOMMatrix().translateSelf(x, y))
                this.redrawCallback()
            }
        }
    }

    getFinalMatrix() {
        let width = this.canvas.clientWidth
        let height = this.canvas.clientHeight

        if(width !== this.previousWidth || height !== this.previousHeight) {
            this.previousWidth = width
            this.previousHeight = height
            this.computeFinalMatrix()
        }
        
        return this.finalCanvasMatrix
    }


    mulMatrix(matrix) {
        this.canvasMatrix.preMultiplySelf(matrix)
        this.computeFinalMatrix()
    }

    computeFinalMatrix() {
        let width = this.canvas.clientWidth
        let height = this.canvas.clientHeight

        this.finalCanvasMatrix = new DOMMatrix().translate(width/2, height/2).multiply(this.canvasMatrix).multiply(new DOMMatrix().translate(-width/(2*this.widthReboundModifier), -height/2))
    }
}