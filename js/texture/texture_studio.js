import { TexturePanels } from "./texture_panels.js"
import { TextureManager } from "./texture_manager.js"
import { TexturemapCanvas } from "./texturemap_canvas.js"
import { TextureCubeValues } from "./texture_cube_values.js"

export class TextureStudio {

    constructor(domElement, filesPage, display, raytracer, orbitControls, setTexture) {
        this.domElement = domElement
        let dom = $(domElement)
        this.display = display
        this.raytracer = raytracer

        this.studioPanels = new TexturePanels(dom, 300, 300)
        this.textureManager = new TextureManager(dom, this, setTexture, filesPage)
        this.canvas = new TexturemapCanvas(dom.find('#texture-canvas'), display, raytracer, this.studioPanels)
        this.cubeValues = new TextureCubeValues(dom, raytracer)
    }

    runFrame() {
        this.raytracer.update()
        this.display.tbl.resetAnimations()
        this.canvas.drawTextureCanvas(this.rightArea, this.topRArea)
        this.display.render()
    }

    setActive() {
        window.studioWindowResized()
        this.cubeValues.updateCubeValues()
    }

    setUnactive() {
        
    }

}