import { CanvasTransformControls } from "../util.js"

export class TexturemapCanvas {
    constructor(domElement, display, raytracer) {
        this.canvas = domElement.get(0)
        this.parnetNode = domElement.parent().parent()
        this.display = display
        this.raytracer = raytracer
        this.canvasMovingCube = null

        this.canvasTransformControls = new CanvasTransformControls(this.canvas, (a, b, c, d, e) => this.mouseOverCanvas(a, b, c, d, e))
    }

    drawTextureCanvas() {
        //TODO: don't do this. Make sure the canvas aspect ratio is the same as the tabula model.
        let size = Math.min(this.parnetNode.width(), this.parnetNode.height())
        this.canvas.width = this.canvas.height = size

        let ctx = this.canvas.getContext('2d')
        ctx.imageSmoothingEnabled = false

        this.canvasTransformControls.applyTransforms()

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

    mouseOverCanvas(type, mouseX, mouseY, buttons, misscallback) {
        let mouseBetween = (x, y, w, h) => mouseX >= x && mouseX < x+w && mouseY >= y && mouseY < y+h
        let size = Math.min(this.parnetNode.width(), this.parnetNode.height())
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
            
            //todo: this can be optimised to just be the bottom rectangle and the top rectangle
            let mouseOver = 
                mouseBetween(u, v+vd, ud, vh) || mouseBetween(u+ud, v, uw, vd) || mouseBetween(u+ud, v+vd, uw, vh) ||
                mouseBetween(u+ud+uw, v+vd, ud, vh) || mouseBetween(u+ud+uw, v, uw, vd) || mouseBetween(u+ud+uw+ud, v+vd, uw, vh)



            if(mouseOver) {
                if(type === 'mousedown') {
                    this.canvasMovingCube = {cube, x: mouseX-u, y: mouseY-v, moved: false}
                } else if(type === 'mouseup') {
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
            misscallback(this.canvasMovingCube === null && buttons & 1 !== 0)
            if(type === 'mouseup') {
                if(this.canvasTransformControls.hasMoved !== true) {
                    this.raytracer.deselectAll()
                }
            } else if(event.type === "mousedown") {
                this.canvasMovingCube = null
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

        if(type === "mouseup") {
            this.canvasMovingCube = null
        }
    }

    getSize() {

    }
}