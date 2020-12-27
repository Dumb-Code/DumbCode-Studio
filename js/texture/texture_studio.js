import { TexturePanels } from "./texture_panels.js"
import { TextureManager } from "./texture_manager.js"
import { TexturemapCanvas } from "./texturemap_canvas.js"
import { TextureCubeValues } from "./texture_cube_values.js"
import { TextureTools } from "./texture_tools.js"
import { EventDispatcher } from "../three.js"
import { getAndDeleteFiles } from "../util.js"

export class TextureStudio {

    constructor(domElement, filesPage, display, raytracer, orbitControls, pth) {
        this.domElement = domElement
        this.pth = pth
        let dom = $(domElement)
        this.display = display
        this.raytracer = raytracer
        this.orbitControls = orbitControls

        this.studioPanels = new TexturePanels(this, dom)
        this.cubeValues = new TextureCubeValues(dom, raytracer)
        this.textureTools = new TextureTools(dom, this)
        this.texturemapCanvas = new TexturemapCanvas(dom.find('#texture-canvas'), raytracer, this.textureTools, this.cubeValues, pth)

        this._textureEmptyLayer = dom.find('.texture-layer.empty-layer')
        dom.find('.texture-file-input').on('input', e => filesPage.textureProjectPart.uploadTextureFile(getAndDeleteFiles(e)))
        dom.find('.new-texture-button').click(() => filesPage.textureProjectPart.createEmptyTexture())
    }

    runFrame() {
        this.raytracer.update()
        this.pth.model.resetAnimations()
        this.texturemapCanvas.drawTextureCanvas(this.rightArea, this.topRArea)
        this.textureTools.runFrame()
        this.display.render()
    }

    setActive() {
        this.pth.updateTexture(m => {
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
        this.pth.updateTexture(m => {
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

Object.assign(TextureStudio.prototype, EventDispatcher.prototype)