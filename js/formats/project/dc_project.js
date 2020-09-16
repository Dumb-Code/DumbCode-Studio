import { AnimationTabHandler } from "../../animator/animation_tabs.js"
import { TextureManager } from "../../texture/texture_manager.js"
import { DoubleSide, MeshLambertMaterial } from "../../three.js"

const material = new MeshLambertMaterial( {
    color: 0x777777,
    transparent: true,
    side: DoubleSide,
    alphaTest: 0.0001,
} )

export class DcProject {//._files, this._modeling, this._texture, this._animation
    constructor(model, id, pth) {
        this.model = model
        this.id = id
        this.textureManager = new TextureManager(model, pth)
        this.animationTabHandler = new AnimationTabHandler(pth._animation, pth._files, model)
        this.metadata = model.fileName ? { modelName: model.fileName } : {}

        this.materials = this._createMaterialsObject()
        this.selectedSet = new Set()

        this.initiate(pth)
    }

    initiate(pth) {
        this.model.createModel(this.materials.normal)
        this.model.addEventListener("hierarchyChanged", () => pth._modeling.cubeHierarchyChanged())
    }

    _createMaterialsObject() {
        let normal = material.clone()
        
        let highlight = material.clone()
        highlight.emissive.setHex( 0xFF0000 )
        
        let selected = material.clone()
        selected.emissive.setHex( 0x0000FF )
    
        return { normal, highlight, selected }
    }
}