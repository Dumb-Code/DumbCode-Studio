import { CanvasTransformControls } from "../util.js"

export class TexturemapCanvas {
    constructor(domElement, raytracer, textureTools, cubeValues, pth) {
        this.pth = pth
        this.canvas = domElement.get(0)
        this.canvas.width = this.canvas.height = 1
        this.parnetNode = domElement.parent().parent()
        this.raytracer = raytracer
        this.textureTools = textureTools
        this.updateCubeValues = () => cubeValues.updateCubeValues()
        this.canvasMovingCube = null
        this._mouseOverContext = null

        this.canvasTransformControls = new CanvasTransformControls(this.canvas, (type, mouseX, mouseY, buttons, misscallback) => {
            if(type == "mouseleave") {
                textureTools.mouseOverPixel()
                return
            }
            let size = Math.min(this.parnetNode.width(), this.parnetNode.height())
            textureTools.mouseOverPixel(mouseX/size, mouseY/size, this._mouseOverContext)
            let mouseDown = ((buttons & 1) === 1) && textureTools.canDraw()
            if(mouseDown) {
                textureTools.mouseDown(mouseX/size, mouseY/size, true)
            }
            this.mouseOverCanvas(type, mouseX, mouseY, buttons, misscallback, mouseDown)
        })
    }

    drawTextureCanvas() {
        //TODO: don't do this. Make sure the canvas aspect ratio is the same as the tabula model.
        // let size = Math.max(Math.min(this.parnetNode.width(), this.parnetNode.height()), 1)
        // this.canvas.width = this.canvas.height = size

        let aspect = this.pth.model.texWidth / this.pth.model.texHeight

        let drawWidth = Math.min(this.parnetNode.width(), this.parnetNode.height() * aspect)
        let drawHeight = drawWidth / aspect

        this.canvas.width = this.parnetNode.width()
        this.canvas.height = this.parnetNode.height()

        let ctx = this.canvas.getContext('2d')
        ctx.imageSmoothingEnabled = false

        this.canvasTransformControls.applyTransforms()

        ctx.fillStyle = "rgba(255, 255, 255, 255)"
        ctx.fillRect(0, 0, drawWidth, drawHeight)

        let canvas = this.pth.material?.map?.image
        if(canvas !== undefined) {
            ctx.drawImage(canvas, 0, 0, drawWidth, drawHeight)
        }

        this.drawCubesToCanvas(this.canvas, drawWidth, drawHeight, true)
    }

    drawCubesToCanvas(canvas, drawWidth, drawHeight, opacity) {
        let ctx = canvas.getContext('2d')
        let su = this.pth.model.texWidth/drawWidth
        let sv = this.pth.model.texHeight/drawHeight

        this.pth.model.cubeMap.forEach(cube => {
            let r = 1.0
            let g = 1.0
            let b = 1.0
            let a = opacity ? 0.2 : 1.0

            if(this.raytracer.intersected !== undefined && this.raytracer.intersected.tabulaCube === cube) {
                g = 0.2
                b = 0.2
                a = opacity ? 0.5 : 1.0
            } else if(this.raytracer.isCubeSelected(cube)) {
                r = 0.2
                g = 0.2
                a = opacity ? 0.5 : 1.0
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


    mouseOverCanvas(type, mouseX, mouseY, buttons, misscallback, onlyUpdateContext) {
        let size = Math.min(this.parnetNode.width(), this.parnetNode.height())
        let su = this.pth.model.texWidth/size
        let sv = this.pth.model.texHeight/size

        let overHandled = false

        this.pth.model.cubeMap.forEach(cube => {
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
            

            let faceAreas = [
                [u+ud+uw, v+vd, ud, vh], //0
                [u, v+vd, ud, vh], //1
                [u+ud+uw, v, uw, vd], //2
                [u+ud, v, uw, vd],  //3
                [u+ud+uw+ud, v+vd, uw, vh], //4
                [u+ud, v+vd, uw, vh]  //5
            ]
            
            let mouseOverArea = faceAreas.findIndex(arr => mouseX >= arr[0] && mouseX < arr[0]+arr[2] && mouseY >= arr[1] && mouseY < arr[1]+arr[3])

            if(mouseOverArea !== -1) {
                if(type === 'mousedown') {
                    this.canvasMovingCube = {cube, x: mouseX-u, y: mouseY-v, moved: false}
                } else if(type === 'mouseup') {
                    if((this.canvasMovingCube === null || this.canvasMovingCube.moved !== true) && !this.raytracer.disableRaycast) {
                        this.raytracer.clickOnMesh(cube.cubeMesh)
                    }
                } else if(!this.raytracer.disableRaycast) {
                    this.raytracer.mouseOverMesh(cube.cubeMesh)
                }
                this._mouseOverContext = { cube, face: mouseOverArea }
                this.textureTools.mouseOverPixel(mouseX/size, mouseY/size, this._mouseOverContext)
                overHandled = true
            }
        })

        if(onlyUpdateContext) {
            return
        }
        
        if(!overHandled) {
            this._mouseOverContext = null
            misscallback(this.canvasMovingCube === null && ((buttons & 1) !== 0 || (buttons & 2) !== 0))
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
                this.updateCubeValues()
            } 
        }

        if(type === "mouseup") {
            this.canvasMovingCube = null
        }
    }

    getSize() {

    }
}