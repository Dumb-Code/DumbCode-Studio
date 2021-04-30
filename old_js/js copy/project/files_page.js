import { EventDispatcher } from "../libs/three.js"
import { AnimationProjectPart } from "./animation_project_part.js"
import { ModelProjectPart } from "./model_project_part.js"
import { TextureProjectPart } from "./texture_project_part.js"

/**
 * The files page element. 
 */
export class FilesPage { 

    constructor(dom, modellingGetter, textureGetter, animatorGetter, pth) {
        this.animationProjectPart = new AnimationProjectPart(dom, animatorGetter, pth)
        this.textureProjectPart = new TextureProjectPart(dom, pth)
        this.modelProjectPart = new ModelProjectPart(dom, pth, modellingGetter, this.textureProjectPart, this.animationProjectPart)

        let rp = dom.find('.required-project').css('display', 'none')
        pth.addEventListener("initiateselection", () => rp.css('display', ''))
    }

    createNewAnimationTab(name) {
       this.animationProjectPart.createNewAnimationTab(name)
    }

    //Methods below are needed as any tab element needs them. Todo: don't do that

    runFrame() {

    }

    setActive() {
        
    }

    setUnactive() {
        
    }
}

Object.assign(FilesPage.prototype, EventDispatcher.prototype)