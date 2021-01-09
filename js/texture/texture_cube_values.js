import { LinkedElement } from "../util/linked_element.js"
import { ToggleableElement } from "../util/toggleable_element.js"

/**
 * The texture cube values on the right hand side
 */
export class TextureCubeValues {

    constructor(dom, raytracer) {
        this.raytracer = raytracer

        //Helper method to get the cube
        let getCube = () => this.raytracer.selectedSet.size === 1 ? this.raytracer.firstSelected().tabulaCube : undefined
        
        //The texture offset values
        this.textureOffset = new LinkedElement(dom.find('.input-texure-offset')).onchange(e => getCube()?.updateTextureOffset(e.value))
        this.textureMirrored = new ToggleableElement(dom.find('.input-texture-mirrored')).onchange(e => getCube()?.updateTextureMirrored(e.value))
        this.raytracer.addEventListener('selectchange', () => this.updateCubeValues())

    }

    /**
     * Updates the values. Used when a cube change is done.
     */
    updateCubeValues() {
        let isSelected = this.raytracer.selectedSet.size === 1
        if(isSelected) {
            let cube = this.raytracer.firstSelected().tabulaCube
            this.textureOffset.setInternalValue(cube.textureOffset)
            this.textureMirrored.setInternalValue(cube.textureMirrored)
        } else {
            this.textureOffset.setInternalValue(undefined)
            this.textureMirrored.setInternalValue(false)
        }   
    }
}