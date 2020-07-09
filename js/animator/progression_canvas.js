const radius = 7.5

export class ProgressionCanvas {
    constructor(dom, studio) {
        this.animationTabHandler = studio.animationTabHandler
        this.selectedPoint = null
        this.waitAndSetCanvas(studio)
        dom.find('.popup-animator-progression').click(() => this.redrawProgressionCanvas())
    }

    async waitAndSetCanvas(studio) {
        let pc = $(await getModal(studio.domElement, 'animator/progression')).find('#progression_canvas')
        this.progressionCanvas = pc.get(0)
        this.canvasCtx = this.progressionCanvas.getContext("2d")

        pc.mousedown(e => {
            let handler = this.animationTabHandler.active
            if(handler !== null && handler.selectedKeyFrame !== undefined) {
                let points = handler.selectedKeyFrame.progressionPoints
            
                let width = this.progressionCanvas.width
                let height = this.progressionCanvas.height
            
                let clickedOn = points.find(p => !p.required && Math.pow(width*p.x-e.offsetX, 2) + Math.pow(height*p.y-e.offsetY, 2) <= 3*radius*radius) //The 3 is just for comedic effect.
            
                if(clickedOn !== undefined) {
                    clickedOn.startX = clickedOn.x
                    clickedOn.startY = clickedOn.y
                    this.selectedPoint = clickedOn
                } else {
                    let newPoint = { x: e.offsetX / width, y: e.offsetY / height }
                    points.push( newPoint )
                    handler.selectedKeyFrame.resortPointsDirty()
                    this.selectedPoint = newPoint
                }
            
                this.redrawProgressionCanvas()
            }
        }).mousemove(e => {
            let handler = this.animationTabHandler.active
            if(handler !== undefined && this.selectedPoint !== null) {
                this.selectedPoint.x = e.offsetX / this.progressionCanvas.width
                this.selectedPoint.y = e.offsetY / this.progressionCanvas.height
                this.redrawProgressionCanvas()
                handler.selectedKeyFrame.resortPointsDirty()
            }
        }).mouseup(() => {
            let handler = this.animationTabHandler.active

            if(handler !== undefined) {
                let width = this.progressionCanvas.width
                let height = this.progressionCanvas.height
                if(this.selectedPoint !== null) {
                    if(this.selectedPoint.startX !== undefined && this.selectedPoint.startY !== undefined) {
                        let distX = width*(this.selectedPoint.startX - this.selectedPoint.x)
                        let distY = height*(this.selectedPoint.startY - this.selectedPoint.y)
                        if(distX*distX + distY*distY < radius*radius*3) {
                            handler.selectedKeyFrame.progressionPoints = handler.selectedKeyFrame.progressionPoints.filter(p => p !== this.selectedPoint)
                            handler.selectedKeyFrame.resortPointsDirty()
                        }
                    }
                    this.selectedPoint = null
                    this.redrawProgressionCanvas()
                }
            }
        })

    }


    redrawProgressionCanvas() {
        let handler = this.animationTabHandler.active

        if(handler !== null && handler.selectedKeyFrame !== undefined) {
            let width = this.progressionCanvas.width
            let height = this.progressionCanvas.height
        
            this.canvasCtx.clearRect(0, 0, width, height);
            this.canvasCtx.strokeStyle = "#363636";
            let points = handler.selectedKeyFrame.progressionPoints
        
            for(let i = 0; i < points.length; i++) {
                let point = points[i]
                let next = points[i+1]
        
                this.canvasCtx.beginPath();
                this.canvasCtx.arc(point.x * width, point.y * height, radius, 0, 2 * Math.PI);
        
                if(next !== undefined) {
                    this.canvasCtx.moveTo(point.x * width, point.y * height);
                    this.canvasCtx.lineTo(next.x * width, next.y * height);
                }
        
                this.canvasCtx.stroke();
            }
        }
    }
    
}