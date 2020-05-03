const canvasContainer = document.getElementById("display-div");

let activeStudio

export class ModelingStudio {

    constructor(display, raytracer, transformControls, setMode, setPosition, setRotation) {
        this.display = display
        this.raytracer = raytracer
        this.setPosition = setPosition
        this.setRotation = setRotation
        this.setMode = setMode
        this.transformControls = transformControls
        this.transformControls.studioCallback = (dims, offset) => {
            setDimension(dims)
            setOffset(offset)
        }
    }

    runFrame() {
        this.raytracer.update()
        this.display.tbl.resetAnimations()
        this.display.render()
    }

    setActive() {
        canvasContainer.style.height = (window.innerHeight + canvasContainer.offsetTop) + "px"
        window.studioWindowResized()
        activeStudio = this
    }

    setUnactive() {
        activeStudio = undefined
    }

    selectedChanged() {
        if(this.raytracer.selected !== undefined) {
            let cube = this.raytracer.selected.tabulaCube
            setDimension(cube.dimension)
            setOffset(cube.offset)
            setMcScale(cube.mcScale)
            setTextureOffset(cube.textureOffset)
            setTextureMirrored(cube.textureMirrored)
        } else {
            setDimension([0, 0, 0])
            setOffset([0, 0, 0])
            setMcScale(0)
            setTextureOffset([0, 0])
            setTextureMirrored(false)
        }
    }
}


window.toggleDimensionsTransform = () => {
    if(activeStudio !== undefined &&  activeStudio.transformControls.visible && activeStudio.transformControls.mode == "dimensions") {
        activeStudio.setMode("none")
    } else {
        activeStudio.setMode("dimensions")
    }
}

window.setDimension = elem => setValuesFromElem(c => c.dimension, elem, setDimension)
window.setOffset = elem => setValuesFromElem(c => c.offset, elem, setOffset)
window.setTextureOffset = elem => setValuesFromElem(c => c.textureOffset, elem, setTextureOffset)
window.setTextureMirrored = elem => setTextureMirrored(elem.value)
window.setMcScale = elem => {
    let num = Number(elem.value)
    if(Number.isNaN(num)) {
        return
    }
    setMcScale(num)
}

function setValuesFromElem(propertyGetter, elem, applier) {
    if(activeStudio !== undefined && activeStudio.raytracer.selected !== undefined) {
        let num = Number(elem.value)
        if(Number.isNaN(num)) {
            return
        }
        let values = propertyGetter(activeStudio.raytracer.selected.tabulaCube)
        values[elem.getAttribute("axis")] = num
        applier(values)
    }
    
}

function setDimension(values) {
    updateCubeValuesArray("input-dimension", c => c.updateDimensions(values), values)
}

function setOffset(values) {
    updateCubeValuesArray("input-offset", c => c.updateOffset(values), values)
}

function setMcScale(value) {
    updateCubeRaw("input-cube-grow", c => c.updateMcScale(value), e => e.value = value)
}

function setTextureOffset(values) {
    updateCubeValuesArray("input-texure-offset", c => c.updateTextureOffset(values), values)
}

function setTextureMirrored(value) {
    updateCubeRaw("input-texture-mirrored", c => c.updateTextureMirrored(value), e => e.value = value)
}

function updateCubeValuesArray(className, cubeFunction, values) {
    updateCubeRaw(className, cubeFunction, e => e.value = values[e.getAttribute("axis")])
}

function updateCubeRaw(className, cubeFunction, elemFunction) {
    if(activeStudio !== undefined) {
        [...document.getElementsByClassName(className)].forEach(elem => {
            elemFunction(elem)
            elem.checkValidity()
        });
        if(activeStudio.raytracer.selected !== undefined) {
            cubeFunction(activeStudio.raytracer.selected.tabulaCube)
        }
    }
}