import { AnimationProjectPart } from "./animation_project_part.js"
import { TextureProjectPart } from "./texture_project_part.js"

export class FilesPage { 

    constructor(dom, modellingGetter, textureGetter, animatorGetter) {
        this.animationProjectPart = new AnimationProjectPart(dom, animatorGetter)
        this.textureProjectPart = new TextureProjectPart(dom, textureGetter)
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