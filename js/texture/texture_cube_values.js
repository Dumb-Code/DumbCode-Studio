import { LinkedElement } from "../util.js"

export class TextureCubeValues {

    constructor(dom, raytracer) {
        this.raytracer = raytracer
        let getCube = () => this.raytracer.selectedSet.size === 1 ? this.raytracer.firstSelected().tabulaCube : undefined
        this.textureOffset = new LinkedElement(dom.find('.input-texure-offset')).onchange(e => getCube()?.updateTextureOffset(e.value))
        this.textureMirrored = new LinkedElement(dom.find('.input-texture-mirrored'), false, false).onchange(e => getCube()?.updateTextureMirrored(e.value))
        this.raytracer.addEventListener('selectchange', () => this.updateCubeValues())

    }

    updateCubeValues() {
        let isSelected = this.raytracer.selectedSet.size === 1
        if(isSelected) {
            let cube = this.raytracer.firstSelected().tabulaCube
            this.textureOffset.setInternalValue(cube.textureOffset)
            this.textureMirrored.setInternalValue(cube.textureMirrored)
        } else {
            this.textureOffset.setInternalValue(undefined)
            this.textureMirrored.setInternalValue(undefined)
        }   
    }
}