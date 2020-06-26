import { LinkedElement } from "../util.js"

export class CubeValueDisplay {

    constructor(dom, studio, renameCube) {
        this.raytracer = studio.raytracer

        let lockedCubes = studio.lockedCubes

        this.cubeName = new LinkedElement(dom.find('.input-cube-name'), false, false).onchange(e => {
            dom.find('.input-cube-name').toggleClass('input-invalid', renameCube(e.old, e.value))
        })
        this.dimensions = new LinkedElement(dom.find('.input-dimension')).onchange(e => this.getCube()?.updateDimension(e.value))
        this.positions = new LinkedElement(dom.find('.input-position')).onchange(e => {
            lockedCubes.createLockedCubesCache()
            this.getCube()?.updatePosition(e.value)
            lockedCubes.reconstructLockedCubes()
        })
        this.offsets = new LinkedElement(dom.find('.input-offset')).onchange(e => this.getCube()?.updateOffset(e.value))
        this.cubeGrow = new LinkedElement(dom.find('.input-cube-grow'), false).onchange(e => this.getCube()?.updateCubeGrow(e.value))
        this.textureOffset = new LinkedElement(dom.find('.input-texure-offset')).onchange(e => this.getCube()?.updateTextureOffset(e.value))
        this.textureMirrored = new LinkedElement(dom.find('.input-texture-mirrored'), false, false).onchange(e => this.getCube()?.updateTextureMirrored(e.value))
        this.rotation = new LinkedElement(dom.find('.input-rotation')).withsliders(dom.find('.input-rotation-slider')).onchange(e => {
            lockedCubes.createLockedCubesCache()
            this.getCube()?.updateRotation(e.value)
            lockedCubes.reconstructLockedCubes()
        })

        studio.transformControls.addEventListener('objectChange', () => this.updateCubeValues())
    }

    getCube() {
        return this.raytracer.selectedSet.size === 1 ? this.raytracer.firstSelected().tabulaCube : undefined
    }

    updateCubeValues() {
        let isSelected = this.raytracer.selectedSet.size === 1
        if(isSelected) {
            let cube = this.raytracer.firstSelected().tabulaCube
            this.cubeName.setInternalValue(cube.name)
            this.positions.setInternalValue(cube.rotationPoint)
            this.dimensions.setInternalValue(cube.dimension)
            this.rotation.setInternalValue(cube.rotation)
            this.offsets.setInternalValue(cube.offset)
            this.cubeGrow.setInternalValue(cube.mcScale)
            this.textureOffset.setInternalValue(cube.textureOffset)
            this.textureMirrored.setInternalValue(cube.textureMirrored)
        } else {
            this.dimensions.setInternalValue(undefined)
            this.positions.setInternalValue(undefined)
            this.offsets.setInternalValue(undefined)
            this.rotation.setInternalValue(undefined)
            this.cubeGrow.setInternalValue(undefined)
            this.textureOffset.setInternalValue(undefined)
            this.textureMirrored.setInternalValue(undefined)
            this.cubeName.setInternalValue(undefined)
        }
        
    }

}