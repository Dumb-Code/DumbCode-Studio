import { CanvasTransformControls } from "../util/canvas_transform_controls.js"

/**
 * Handles the texturemap canvas 
 */
export class TexturemapCanvas {
    constructor(domElement, raytracer, textureTools, cubeValues, pth) {
        this.pth = pth
        this.canvas = domElement.get(0)
        this.canvas.width = this.canvas.height = 1
        this.parnetNode = domElement.parent().parent()
        this.raytracer = raytracer
        this.textureTools = textureTools
        //Helper method to update the cube values
        this.updateCubeValues = () => cubeValues.updateCubeValues()
        this.canvasMovingCube = null
        this._mouseOverContext = null

        //The canvas control tools
        this.canvasTransformControls = new CanvasTransformControls(this.canvas, (type, mouseX, mouseY, buttons, misscallback) => {
            //If the mouse is moved, then call the mouseover pixel.
            if(type == "mouseleave") {
                textureTools.mouseOverPixel()
                return
            }
            let size = Math.min(this.parnetNode.width(), this.parnetNode.height())
            textureTools.mouseOverPixel(mouseX/size, mouseY/size, this._mouseOverContext)
            let mouseDown = ((buttons & 1) === 1) && textureTools.canDraw()
            if(mouseDown) {
                //Draw the pixel
                textureTools.mouseDown(mouseX/size, mouseY/size, true)
                return
            }
            
            //Run the callback
            this.mouseOverCanvas(type, mouseX, mouseY, buttons, misscallback, mouseDown)
        }, 2)

        //Default scale be off
        this.canvasTransformControls.mulMatrix(new DOMMatrix().scaleSelf(1/1.1))
        this.canvasTransformControls.redrawCallback()
    }

    /**
     * Re-draws the texture canvas
     */
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

        //apply the transforms
        this.canvasTransformControls.applyTransforms()

        //Draw the background as white
        ctx.fillStyle = "rgba(255, 255, 255, 255)"
        ctx.fillRect(0, 0, drawWidth, drawHeight)

        //Draw the applied texture to the canvas
        let canvas = this.pth.materials.normal?.map?.image
        if(canvas !== undefined) {
            ctx.drawImage(canvas, 0, 0, drawWidth, drawHeight)
        }

        //Draw the cube overlays
        this.drawCubesToCanvas(this.canvas, drawWidth, drawHeight, false)
    }

    /**
     * Draws the cube overlays to a canvas
     * @param {*} canvas the canvas to draw to 
     * @param {*} drawWidth the width to draw with 
     * @param {*} drawHeight the height to draw with
     * @param {*} renderDirect Whether the rendering should be done direct. If direct, alpha is always 1 and intersected/select isn't done.
     */
    drawCubesToCanvas(canvas, drawWidth, drawHeight, renderDirect) {
        let ctx = canvas.getContext('2d')
        let su = this.pth.model.texWidth/drawWidth
        let sv = this.pth.model.texHeight/drawHeight

        this.pth.model.cubeMap.forEach(cube => {
            let r = 1.0
            let g = 1.0
            let b = 1.0
            let a = renderDirect ? 1.0 : 0.2

            //If not render direct, and intersected or selected, set the new color
            if(!renderDirect) {
                if(this.raytracer.intersected !== undefined && this.raytracer.intersected.tabulaCube === cube) {
                    g = 0.2
                    b = 0.2
                    a = 0.5
                } else if(this.raytracer.isCubeSelected(cube)) {
                    r = 0.2
                    g = 0.2
                    a =  0.5
                }
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

            //Draw the different faces with the different colors
            ctx.fillStyle = `rgba(${255*r}, 0, 0, ${a})`
            ctx.fillRect(u, v+vd, ud, vh)

            ctx.fillStyle = `rgba(0, ${255*g}, 0, ${a})`
            ctx.fillRect(u+ud, v, uw, vd)

            ctx.fillStyle = `rgba(0, 0, ${255*b}, ${a})`
            ctx.fillRect(u+ud+uw+ud, v+vd, uw, vh)


            ctx.fillStyle = `rgba(${127*r}, 0, 0, ${a})`
            ctx.fillRect(u+ud+uw, v+vd, ud, vh)

            ctx.fillStyle = `rgba(0, ${127*g}, 0, ${a})`
            ctx.fillRect(u+ud+uw, v, uw, vd)

            ctx.fillStyle = `rgba(0, 0, ${127*b}, ${a})`
            ctx.fillRect(u+ud, v+vd, uw, vh)
        })
    }

    /**
     * 
     * @param {string} type the event type
     * @param {number} mouseX the mouse position x
     * @param {number} mouseY the mouse position y
     * @param {number} buttons the buttons pressed 
     * @param {function} misscallback the callback for if nothing happens. Used to move the canvas around
     * @param {*} onlyUpdateContext Whether only the context should be updated
     */
    mouseOverCanvas(type, mouseX, mouseY, buttons, misscallback, onlyUpdateContext) {
        //The minimum size. This assumes a square?
        let size = Math.min(this.parnetNode.width(), this.parnetNode.height())

        //The scale width and height
        let su = this.pth.model.texWidth/size
        let sv = this.pth.model.texHeight/size

        //Whether it's been handled or not
        let overHandled = false

        //For each cube
        this.pth.model.cubeMap.forEach(cube => {
            //If it's been handled, return
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
            

            //The different face areas
            let faceAreas = [
                [u+ud+uw, v+vd, ud, vh], //0
                [u, v+vd, ud, vh], //1
                [u+ud+uw, v, uw, vd], //2
                [u+ud, v, uw, vd],  //3
                [u+ud+uw+ud, v+vd, uw, vh], //4
                [u+ud, v+vd, uw, vh]  //5
            ]
            
            //Get the index the face is over.
            let mouseOverArea = faceAreas.findIndex(arr => mouseX >= arr[0] && mouseX < arr[0]+arr[2] && mouseY >= arr[1] && mouseY < arr[1]+arr[3])

            //If the index is over a face
            if(mouseOverArea !== -1) {
                //If clicked set the moving cube data, otherwise if the mouse is up, click on the mesh.
                //If the mouse is moving, move over the mesh
                if(type === 'mousedown') {
                    this.canvasMovingCube = {cube, x: mouseX-u, y: mouseY-v, moved: false}
                } else if(type === 'mouseup') {
                    if((this.canvasMovingCube === null || this.canvasMovingCube.moved !== true) && !this.raytracer.disableRaycast) {
                        this.raytracer.clickOnMesh(cube.cubeMesh)
                    }
                } else if(!this.raytracer.disableRaycast) {
                    this.raytracer.mouseOverMesh(cube.cubeMesh)
                }
                //Set the mouse over context, update the texture tools and handle the event
                this._mouseOverContext = { cube, face: mouseOverArea }
                this.textureTools.mouseOverPixel(mouseX/size, mouseY/size, this._mouseOverContext)
                overHandled = true
            }
        })

        //Only update the context
        if(onlyUpdateContext) {
            return
        }
        
        //If not been handled, call the miss callback
        if(!overHandled) {
            this._mouseOverContext = null
            misscallback(this.canvasMovingCube === null && ((buttons & 1) !== 0 || (buttons & 2) !== 0))
            
            //If the mouse is up, and the transform controls havn't moved, deselect all the cubes
            if(type === 'mouseup') {
                if(this.canvasTransformControls.hasMoved !== true) {
                    this.raytracer.deselectAll()
                }
            } else if(type === "mousedown") {
                this.canvasMovingCube = null
            }
            this.raytracer.mouseOverMesh(undefined)
        }
        //If the cube isn't null, and the cube has moved, update it/
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

    //?
    getSize() {

    }
}