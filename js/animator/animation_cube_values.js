import { LinkedElement } from "../util.js"

export class AnimationCubeValues {

    constructor(dom, studio) {
        this.raytracer = studio.raytracer
        this.position = new LinkedElement(dom.find('.input-position')).onchange(e => studio.setPosition(e.value, false))
        this.rotation = new LinkedElement(dom.find('.input-rotation')).withsliders(dom.find('.input-rotation-slider')).onchange(e => studio.setRotation(e.value, false))
        
        this.raytracer.addEventListener('selectchange', () => this.updateSelected())
    }

    updateSelected() {
        let selected = this.raytracer.oneSelected()
        if(selected !== null) {
            this.position.setInternalValue(selected.parent.position.toArray())
            this.rotation.setInternalValue(selected.parent.rotation.toArray().map(v => v * 180 / Math.PI))
        }
    }

}