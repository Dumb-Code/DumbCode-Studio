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

        this.paintMode = new LinkedSelectableList(dom.find('.button-paint-mode'), false)

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
        let intersections = this.raytracer.gatherIntersections()

        if(intersections.length > 0 && this.paintMode.value !== undefined) {
            let uv = intersections[0].uv
            if(this.isInUse) {
                this.mouseDown(uv.x, uv.y)
            }
            this.textureManager.mouseOverPixel(uv.x, uv.y)
            this.previousMouseOver = true
        } else if(this.previousMouseOver) {
            this.textureManager.mouseOverPixel()
            this.previousMouseOver = false
        }
    }

    canDraw() {
        return this.textureManager.getSelectedLayer() !== undefined && this.paintMode.value !== undefined
    }

    mouseOverPixel(u, v) {
        if(this.paintMode.value !== undefined) {
            this.textureManager.mouseOverPixel(u, v)
        }
    }
    
    mouseDown(u, v) {
        let selected = this.textureManager.getSelectedLayer()
        if(selected !== undefined) {
            if(this.paintMode.value == 'pixel') {
                let ctx = selected.canvas.getContext('2d')
                ctx.fillStyle = "rgba(0, 0, 0, 1)"
                ctx.fillRect(Math.floor(u*selected.width), Math.floor(v*selected.height), 1, 1)
                selected.onCanvasChange()
                return
            }
            
        }
    }

}