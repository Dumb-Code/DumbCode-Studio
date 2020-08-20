export class TextureTools {

    constructor(dom, display, textureManager, orbitControls, raytracer) {
        this.display = display
        this.raytracer = raytracer
        this.textureManager = textureManager
        this.orbitControls  = orbitControls 
        
        this.tabInUse = false
        this.previousOrbit = true
        this.isInUse = false

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

        if(intersections.length > 0) {
            let uv = intersections[0].uv

            let uPixel = Math.floor(uv.x * this.display.tbl.texWidth)
            let vPixel = Math.floor(uv.y * this.display.tbl.texHeight)

            //TODO: selected textures
            if(this.isInUse && this.textureManager.textures.length > 0) {
                let texture = this.textureManager.textures[0]
                let ctx = texture.canvas.getContext('2d')

                ctx.fillStyle = "rgba(0, 0, 0, 1)"
                ctx.fillRect(uPixel, vPixel, 1, 1)
                texture.onCanvasChange()
            }
            this.textureManager.mouseOverPixel(uPixel, vPixel)
        } else {
            this.textureManager.mouseOverPixel()
        }
    }

}