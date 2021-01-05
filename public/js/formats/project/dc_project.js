import { AnimationTabHandler } from "../../animator/animation_tabs.js"
import { MementoTraverser } from "../../memento_traverser.js"
import { ModelingMemento } from "../../modeling/modeling_memento.js"
import { TextureManager } from "../../texture/texture_manager.js"
import { DoubleSide, Group, MeshLambertMaterial } from "../../libs/three.js"
import { ProjectTabHandler } from "../../project_tab_handler.js"

const material = new MeshLambertMaterial( {
    color: 0x777777,
    // transparent: true,
    side: DoubleSide,
    alphaTest: 0.0001,
} )

/**
 * DcProject holds all the per-project information and classes
 */
export class DcProject {//._files, this._modeling, this._texture, this._animation
    constructor(model, id, pth) {
        this.model = model
        this.id = id

        //Group used only when this project is active.
        this.group = new Group()

        //Texture manager for this project
        this.textureManager = new TextureManager(model, pth)

        //Animation manager for this project
        this.animationTabHandler = new AnimationTabHandler(pth._animation, pth._files, model)

        //Memento Traverse (undo/redo) for the modeling project
        this.modelMementoTraverser = new MementoTraverser(() => new ModelingMemento(model, this.lockedCubes))
        
        //Metadata. Not sure if this is used.
        this.metadata = model.fileName ? { modelName: model.fileName } : {}

        //The materials for this object. They're per project to allow for manipulation
        //of the materials per project
        this.materials = this._createMaterialsObject()

        //The selected set used for the raytracer
        this.selectedSet = new Set()

        //A list of locked cube names
        this.lockedCubes = new Set()

        //A list of reference image data
        this.referenceImages = []

        this.initiate(pth)
    }

    /**
     * initiates the project
     * @param {ProjectTabHandler} pth 
     */
    initiate(pth) {
        this.model.createModel(this.materials.normal)
        this.model.addEventListener("hierarchyChanged", () => {
            pth._modeling.cubeHierarchyChanged()
            pth.display.studioOptions.refreshOptionTexts()
        })
        
    }
    
    /**
     * Called when the project is selected
     * @param {ProjectTabHandler} pth 
     */
    onActive(pth) {
        pth.display.scene.add(this.model.modelCache)
        pth.display.scene.add(this.group)
        
        this.textureManager.groupManager.updateTextureLayerOption()
    }
     
    /**
     * Called when the project is unselected
     * @param {ProjectTabHandler} pth 
     */
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