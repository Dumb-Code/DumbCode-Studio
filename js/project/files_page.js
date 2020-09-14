import { AnimationProjectPart } from "./animation_project_part.js"
import { ModelProjectPart } from "./model_project_part.js"
import { TextureProjectPart } from "./texture_project_part.js"

export class FilesPage { 

    constructor(dom, modellingGetter, textureGetter, animatorGetter, pth) {
        this.modelProjectPart = new ModelProjectPart(dom, pth)
        this.animationProjectPart = new AnimationProjectPart(dom, animatorGetter, pth)
        this.textureProjectPart = new TextureProjectPart(dom, pth)
    }



    createNewAnimationTab(name) {
       this.animationProjectPart.createNewAnimationTab(name)
    }

    runFrame() {

    }

    setActive() {
        
    }

    setUnactive() {
        
    }
}