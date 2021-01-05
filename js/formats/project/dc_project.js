import { AnimationTabHandler } from "../../animator/animation_tabs.js"
import { MementoTraverser } from "../../memento_traverser.js"
import { ModelingMemento } from "../../modeling/modeling_memento.js"
import { TextureManager } from "../../texture/texture_manager.js"
import { DoubleSide, Group, MeshLambertMaterial } from "../../libs/three.js"

const material = new MeshLambertMaterial( {
    color: 0x777777,
    // transparent: true,
    side: DoubleSide,
    alphaTest: 0.0001,
} )

export class DcProject {//._files, this._modeling, this._texture, this._animation
    constructor(model, id, pth) {
        this.model = model
        this.id = id
        this.group = new Group()
        this.textureManager = new TextureManager(model, pth)
        this.animationTabHandler = new AnimationTabHandler(pth._animation, pth._files, model)
        this.modelMementoTraverser = new MementoTraverser(() => new ModelingMemento(model, this.lockedCubes))
        this.metadata = model.fileName ? { modelName: model.fileName } : {}

        this.materials = this._createMaterialsObject()
        this.selectedSet = new Set()
        this.lockedCubes = new Set()
        this.unlockedAnimationCubes = new Set()
        this.referenceImages = []

        this.initiate(pth)
    }

    initiate(pth) {
        this.model.createModel(this.materials.normal)
        this.model.addEventListener("hierarchyChanged", () => {
            pth._modeling.cubeHierarchyChanged()
            pth.display.studioOptions.refreshOptionTexts()
        })
        
    }
    
    onActive(pth) {
        pth.display.scene.add(this.model.modelCache)
        pth.display.scene.add(this.group)
        
        this.textureManager.groupManager.updateTextureLayerOption()
    }
     
    onUnactive(pth) {
        pth.display.scene.remove(this.model.modelCache)
        pth.display.scene.remove(this.group)
    }

    _createMaterialsObject() {
        let normal = material.clone()
        
        let highlight = material.clone()
        highlight.emissive.setHex( 0xFF0000 )
        
        let selected = material.clone()
        selected.emissive.setHex( 0x000066 )
    
        return { normal, highlight, selected }
    }
}