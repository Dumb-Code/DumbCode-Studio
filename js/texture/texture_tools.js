import { LinkedSelectableList } from "../util.js"

export class TextureTools {

    constructor(dom, display, textureManager, orbitControls, raytracer) {
        this.display = display
        this.raytracer = raytracer
        this.textureManager = textureManager
        this.orbitControls  = orbitControls 
        
        this.tabInUse = false
        this.previousMouseOver = true
        this.isInUse = false

        this.frameReset = 0
        this.previousPixel = null

        this.paintMode = new LinkedSelectableList(dom.find('.button-paint-mode'), false)

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
                    rgba: true,
                    input: true,
                }
            }
         })

        let mouseUp = () => {
            orbitControls.enabled = true
            this.isInUse = false
            document.removeEventListener('mouseup', mouseUp)
        }

        display.renderer.domElement.addEventListener( 'mousedown', () => {
            if(this.tabInUse && this.raytracer.gatherIntersections().length > 0) {
                orbitControls.turnOff()
                orbitControls.enabled = false
                this.isInUse = true
                document.addEventListener('mouseup', mouseUp, false)
            }
        }, false );
    }

    runFrame() {
        if(this.frameReset-- <= 0) {
            this.previousPixel = null
        }
        let intersections = this.raytracer.gatherIntersections()

        if(intersections.length > 0 && this.paintMode.value !== undefined) {
            let obj = intersections[0]
            
            let uv = obj.uv

            if(this.isInUse) {
                this.mouseDown(uv.x, uv.y, false)
            }
            this.mouseOverPixel(uv.x, uv.y, { cube: obj.object.tabulaCube, face: Math.floor(obj.faceIndex / 2) })
            this.previousMouseOver = true
        } else if(this.previousMouseOver) {
            this.mouseOverPixel()
            this.previousMouseOver = false
        }
    }

    canDraw() {
        return this.textureManager.getSelectedLayer() !== undefined && this.paintMode.value !== undefined
    }

    mouseOverPixel(u, v, context) {
        this.mouseOverContext = context
        if(this.paintMode.value !== undefined) {
            this.textureManager.hightlightPixelBounds(u, v, this.gatherPixelBounds(u, v))
        }
    }
    
    gatherPixelBounds(u, v) {
        let layer = this.textureManager.getSelectedLayer()
        if(layer === undefined) {
            return
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
        }
    }
    
    mouseDown(u, v, allowPrevious) {
        let selected = this.textureManager.getSelectedLayer()
        u = Math.floor(u*selected.width)
        v = Math.floor(v*selected.height)
        let mode = this.paintMode.value
        if(selected !== undefined && mode !== undefined) {
            this.frameReset = 2
            let ctx = selected.canvas.getContext('2d')
            ctx.fillStyle = this.colorPicker.getColor().toRGBA().toString() 

            this._drawPixel(mode, ctx, u, v)

            if(allowPrevious && this.previousPixel !== null && (this.previousPixel.u !== u || this.previousPixel.v !== v)) {
                this.lineIntersection(u, v, this.previousPixel.u, this.previousPixel.v, (u, v) => this._drawPixel(mode, ctx, u, v))
            }
            this.previousPixel = { u, v }

            selected.onCanvasChange()
        }
    }

    //https://stackoverflow.com/a/4672319
    lineIntersection(x0, y0, x1, y1, callback) {
        let dots = [];
        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        let sx = (x0 < x1) ? 1 : -1;
        let sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;

        callback(x0, y0)

        while(!((x0 == x1) && (y0 == y1))) {
            let e2 = err << 1;

            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }

            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }

            callback(x0, y0)
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