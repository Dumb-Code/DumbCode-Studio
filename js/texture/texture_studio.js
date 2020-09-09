import { TexturePanels } from "./texture_panels.js"
import { TextureManager } from "./texture_manager.js"
import { TexturemapCanvas } from "./texturemap_canvas.js"
import { TextureCubeValues } from "./texture_cube_values.js"
import { TextureTools } from "./texture_tools.js"

export class TextureStudio {

    constructor(domElement, filesPage, display, raytracer, orbitControls, setTexture, updateTexture) {
        this.domElement = domElement
        this.updateTexture = updateTexture
        let dom = $(domElement)
        this.display = display
        this.raytracer = raytracer
        this.orbitControls = orbitControls

        this.studioPanels = new TexturePanels(dom, 300, 300)
        this.textureManager = new TextureManager(dom, this, setTexture, filesPage)
        this.cubeValues = new TextureCubeValues(dom, raytracer)
        this.textureTools = new TextureTools(dom, this)
        this.texturemapCanvas = new TexturemapCanvas(dom.find('#texture-canvas'), display, raytracer, this.textureTools, this.cubeValues)
    }

    runFrame() {
        this.raytracer.update()
        this.display.tbl.resetAnimations()
        this.texturemapCanvas.drawTextureCanvas(this.rightArea, this.topRArea)
        this.textureTools.runFrame()
        this.display.render()
    }

    setActive() {
        this.updateTexture(m => {
            this.isTextureSeleted = m.map !== null
            m._oldTextureStudioWireframe = m.wireframe
            m.map = m._mapCache
            m.wireframe = false
        })
        window.studioWindowResized()
        this.cubeValues.updateCubeValues()
        this.textureTools.tabInUse = true

    }

    setUnactive() {
        this.updateTexture(m => {
            //Texture can be updated, so we can't just cache it
            if(this.isTextureSeleted === true) {
                m.map = m._mapCache 
            } else {
                m.map = null
            }
            m.wireframe = m._oldTextureStudioWireframe

            m._oldTextureStudioMap = undefined
            m._oldTextureStudioWireframe = undefined
        })
        this.textureTools.tabInUse = false
    }

}