export class TexturemapCanvas {
    constructor(domElement, display, raytracer, studioPanels) {
        this.canvas = domElement.get(0)
        this.display = display
        this.raytracer = raytracer
        this.studioPanels = studioPanels
        this.canvasMatrix = new DOMMatrix([1, 0, 0, 1, 0, 0])
        this.canvasMovingCube = null
        this.hasMoved = false
        this.mulMatrix(new DOMMatrix())
        domElement
            .mousemove(e => this.mouseOverCanvas(e))
            .mousedown(e => this.mouseOverCanvas(e))
            .mouseup(e => this.mouseOverCanvas(e))
            .bind('mousewheel DOMMouseScroll', e => {
                let direction = e.originalEvent.wheelDelta
                let amount =  1.1
                if(direction === undefined) { //Firefox >:(
                    direction = -e.detail
                }
                if(direction !== 0) {
                    this.mulMatrix(new DOMMatrix().scaleSelf(direction > 0 ? amount : 1/amount))
                }
                
            })
    }

    drawTextureCanvas() {
        let size = Math.min(this.studioPanels.rightArea, this.studioPanels.topRArea)
        this.canvas.width = this.canvas.height = size

        let ctx = this.canvas.getContext('2d')

        ctx.setTransform(this.finalCanvasMatrix)

        ctx.fillStyle = "rgba(255, 255, 255, 255)"
        ctx.fillRect(0, 0, size, size)

        let img = this.display.material?.map?.image
        if(img !== undefined) {
            ctx.drawImage(img, 0, 0, size, size)
        }

        let su = this.display.tbl.texWidth/size
        let sv = this.display.tbl.texHeight/size

        this.display.tbl.cubeMap.forEach(cube => {
            let r = 1.0
            let g = 1.0
            let b = 1.0
            let a = 0.2

            if(this.raytracer.intersected !== undefined && this.raytracer.intersected.tabulaCube === cube) {
                g = 0.2
                b = 0.2
                a = 0.5
            } else if(this.raytracer.isCubeSelected(cube)) {
                r = 0.2
                g = 0.2
                a = 0.5
            }

            let u = cube.textureOffset[0]/su
            let v = cube.textureOffset[1]/sv

            let w = cube.dimension[0]
            let h = cube.dimension[1]
            let d = cube.dimension[2]

            let uw = w/su
            let ud = d/su

            let vh = h/sv
            let vd = d/sv

            ctx.fillStyle = `rgba(${255*r}, 0, 0, ${a})`
            ctx.fillRect(u, v+vd, ud, vh)

            ctx.fillStyle = `rgba(0, ${255*g}, 0, ${a})`
            ctx.fillRect(u+ud, v, uw, vd)

            ctx.fillStyle = `rgba(0, 0, ${255*b}, ${a})`
            ctx.fillRect(u+ud, v+vd, uw, vh)


            ctx.fillStyle = `rgba(${127*r}, 0, 0, ${a})`
            ctx.fillRect(u+ud+uw, v+vd, ud, vh)

            ctx.fillStyle = `rgba(0, ${127*g}, 0, ${a})`
            ctx.fillRect(u+ud+uw, v, uw, vd)

            ctx.fillStyle = `rgba(0, 0, ${127*b}, ${a})`
            ctx.fillRect(u+ud+uw+ud, v+vd, uw, vh)

        })        
    }

    mouseOverCanvas(event) {
        let mousePoint = new DOMPoint(event.originalEvent.layerX, event.originalEvent.layerY)
        mousePoint = mousePoint.matrixTransform(this.finalCanvasMatrix.inverse())
        let mouseX = mousePoint.x
        let mouseY = mousePoint.y

        let mouseBetween = (x, y, w, h) => mouseX >= x && mouseX < x+w && mouseY >= y && mouseY < y+h
        let size = Math.min(this.studioPanels.rightArea, this.studioPanels.topRArea)
        let su = this.display.tbl.texWidth/size
        let sv = this.display.tbl.texHeight/size

        let overHandled = false

        this.display.tbl.cubeMap.forEach(cube => {
            if(overHandled) {
                return
            }

            let u = cube.textureOffset[0]/su
            let v = cube.textureOffset[1]/sv

            let w = cube.dimension[0]
            let h = cube.dimension[1]
            let d = cube.dimension[2]

            let uw = w/su
            let ud = d/su

            let vh = h/sv
            let vd = d/sv
            

            let mouseOver = 
                mouseBetween(u, v+vd, ud, vh) || mouseBetween(u+ud, v, uw, vd) || mouseBetween(u+ud, v+vd, uw, vh) ||
                mouseBetween(u+ud+uw, v+vd, ud, vh) || mouseBetween(u+ud+uw, v, uw, vd) || mouseBetween(u+ud+uw+ud, v+vd, uw, vh)

            if(mouseOver) {
                if(event.type === 'mousedown') {
                    this.canvasMovingCube = {cube, x: mouseX-u, y: mouseY-v, moved: false}
                } else if(event.type === 'mouseup') {
                    if(this.canvasMovingCube === null || this.canvasMovingCube.moved !== true) {
                        this.raytracer.clickOnMesh(cube.cubeMesh)
                    }
                } else {
                    this.raytracer.mouseOverMesh(cube.cubeMesh)
                }
                overHandled = true
            }
        })
        
        if(!overHandled) {
            if(event.type === 'mouseup') {
                if(this.hasMoved !== true) {
                    this.raytracer.deselectAll()
                }
            } else if(event.type === "mousedown") {
                this.canvasMovingCube = null
                this.hasMoved = false
            }
            if(event.buttons & 1 !== 0 && this.canvasMovingCube === null) {
                let x = event.originalEvent.movementX
                let y = event.originalEvent.movementY
                if(x !== 0 && y !== 0) {
                    this.hasMoved = true
                    this.mulMatrix(new DOMMatrix().translateSelf(x, y))
                }
            }
            this.raytracer.mouseOverMesh(undefined)
        }
        if(this.canvasMovingCube !== null) {
            let tex = this.canvasMovingCube.cube.textureOffset
            let u = Math.floor((mouseX-this.canvasMovingCube.x)*su)
            let v = Math.floor((mouseY-this.canvasMovingCube.y)*sv)
            if(u !== tex[0] || v !== tex[1]) {
                tex[0] = u
                tex[1] = v
                this.canvasMovingCube.moved = true
                this.canvasMovingCube.cube.updateTextureOffset()
            } 
        }

        if(event.type === "mouseup") {
            this.canvasMovingCube = null
        }
    }

    mulMatrix(matrix) {
        this.canvasMatrix.preMultiplySelf(matrix)
        this.finalCanvasMatrix = new DOMMatrix().translate(150, 150).multiply(this.canvasMatrix).multiply(new DOMMatrix().translate(-150, -150))
    }

    getSize() {

    }
}