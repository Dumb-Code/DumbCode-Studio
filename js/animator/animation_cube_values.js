import { LinkedElement } from "../util.js"

export class AnimationCubeValues {

    constructor(dom, studio) {
        this.position = new LinkedElement(dom.find('.input-position')).onchange(e => studio.setPosition(e.value, false))
        this.rotation = new LinkedElement(dom.find('.input-rotation')).withsliders(dom.find('.input-rotation-slider')).onchange(e => studio.setRotation(e.value, false))
    }

}