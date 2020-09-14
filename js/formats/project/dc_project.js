import { AnimationTabHandler } from "../../animator/animation_tabs.js"
import { DoubleSide, MeshLambertMaterial } from "../../three.js"

const material = new MeshLambertMaterial( {
    color: 0x777777,
    transparent: true,
    side: DoubleSide,
    alphaTest: 0.0001,
} )

export class DcProject {
    constructor(model, id, files, modeling, texture, animation) {
        this.model = model
        this.id = id
        this.textures = []
        this.animationTabHandler = new AnimationTabHandler(animation, files, model)
        this.metadata = model.fileName ? { modelName: model.fileName } : {}

        this.materials = this._createMaterialsObject()
        this.selectedSet = new Set()

        this.initiate(files, modeling, texture, animation)
    }

    initiate(files, modeling, texture, animation) {
        this.model.createModel(this.materials.normal)
        this.model.addEventListener("hierarchyChanged", () => modeling.cubeHierarchyChanged())
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