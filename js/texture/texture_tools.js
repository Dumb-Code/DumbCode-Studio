import { LinkedSelectableList, lineIntersection } from "../util.js"

export class TextureTools {

    constructor(dom, studio) {
        this.pth = studio.pth
        this.raytracer = studio.raytracer
        this.orbitControls  = studio.orbitControls 
        
        this.tabInUse = false
        this.previousMouseOver = true
        this.isInUse = false

        this.frameReset = 0
        this.previousPixel = null

        dom.find('.button-generate-texturemap').click(() => {
            let layer = this.pth.textureManager.getSelectedLayer()
            if(layer === undefined) {
                return
            }
            layer.canvas.getContext('2d').clearRect(0, 0, layer.width, layer.height)
            studio.texturemapCanvas.drawCubesToCanvas(layer.canvas, layer.width, layer.height, false)
            layer.onCanvasChange()
        })

        this.paintMode = new LinkedSelectableList(dom.find('.button-paint-mode'), false, "has-text-info")

        this.colorPicker = Pickr.create({ 
            el: dom.find('.element-picker').get(0),
            theme: 'monolith',
            showAlways: true,
            inline: true,
            useAsButton: true,
            components: {
                opacity: true,
                hue: true,
                interaction: {
                    hex: true,
                    input: true,
                }
            }
         })

        let mouseUp = () => {
            this.orbitControls.enabled = true
            this.isInUse = false
            document.removeEventListener('mouseup', mouseUp)
        }

        studio.display.renderer.domElement.addEventListener('mousedown', () => {
            if(this.tabInUse && this.raytracer.gatherIntersections(true).length > 0) {
                this.orbitControls.turnOff()
                this.orbitControls.enabled = false
                this.isInUse = true
                document.addEventListener('mouseup', mouseUp, false)
            }
        }, false);
    }

    runFrame() {
        this.raytracer.disableRaycast = this.canDraw()
        if(this.frameReset-- <= 0) {
            this.previousPixel = null
        }
        let intersections = this.raytracer.gatherIntersections(true)

        if(intersections.length > 0 && this.canDraw()) {
            intersections.forEach(obj => {
                let uv = obj.uv
                this.mouseOverPixel(uv.x, uv.y, { cube: obj.object.tabulaCube, face: Math.floor(obj.faceIndex / 2) })
                if(this.isInUse) {
                    this.mouseDown(uv.x, uv.y, false)
                }
            })
            this.previousMouseOver = true
        } else if(this.previousMouseOver) {
            this.mouseOverPixel()
            this.previousMouseOver = false
        }
    }

    canDraw() {
        return this.pth.textureManager.getSelectedLayer() !== undefined && this.paintMode.value !== undefined
    }

    mouseOverPixel(u, v, context) {
        this.mouseOverContext = context
        if(this.paintMode.value !== undefined) {
            this.pth.textureManager.hightlightPixelBounds(u, v, this.gatherPixelBounds(u, v))
        }
    }
    
    gatherPixelBounds(u, v) {
        let layer = this.pth.textureManager.getSelectedLayer()
        if(layer === undefined) {
            return []
        }

        let cube = this.mouseOverContext?.cube
        let face = this.mouseOverContext?.face

        switch (this.paintMode.value) {
            case "pixel":
                return [{ u: u*layer.width, v: v*layer.height, w:1, h:1 }]
            
            case "face":
                if(!this.mouseOverContext) {
                    return
                }
                
                let array = [...cube.cubeMesh.geometry.getAttribute('uv').array].slice(face*8, face*8 + 8)
                return [{
                    u: Math.min(array[0], array[6])*layer.width,
                    v: Math.min(array[1], array[7])*layer.height,

                    w: Math.abs(array[0] - array[6])*layer.width,
                    h: Math.abs(array[1] - array[7])*layer.height,
                    
                }]
            case "cube":
                if(!this.mouseOverContext) {
                    return
                }
                let modW = layer.width / this.pth.model.texWidth
                let modH = layer.height / this.pth.model.texHeight

                let tu = cube.textureOffset[0]
                let tv = cube.textureOffset[1]
                

                let w = cube.dimension[0]
                let h = cube.dimension[1]
                let d = cube.dimension[2]

                return [
                    {
                        u: tu*modW, v: (tv+d)*modH,
                        w: 2*(d+w)*modW, h: h*modH
                    }, 
                    {
                        u: (tu+d)*modW, v: tv*modH,
                        w: 2*w*modW, h: d*modW
                    }
                ] 
        }
    }
    
    mouseDown(u, v, allowPrevious) {
        let selected = this.pth.textureManager.getSelectedLayer()
        u = Math.floor(u*selected.width)
        v = Math.floor(v*selected.height)
        let mode = this.paintMode.value
        if(selected !== undefined && mode !== undefined) {
            this.frameReset = 2
            let ctx = selected.canvas.getContext('2d')
            ctx.fillStyle = this.colorPicker.getColor().toRGBA().toString() 

            this._drawPixel(mode, ctx, u, v)

            if(allowPrevious && this.previousPixel !== null && (this.previousPixel.u !== u || this.previousPixel.v !== v)) {
                lineIntersection(u, v, this.previousPixel.u, this.previousPixel.v, (u, v) => this._drawPixel(mode, ctx, u, v))
            }
            this.previousPixel = { u, v }

            selected.onCanvasChange()
        }
    }
    
    _drawPixel(mode, ctx, u, v) {
        if(mode == 'pixel') {
            ctx.fillRect(u, v, 1, 1)
        } else {
            this.gatherPixelBounds().forEach(b => ctx.fillRect(Math.floor(b.u), Math.floor(b.v), Math.round(b.w), Math.round(b.h)))
        }
    }

}