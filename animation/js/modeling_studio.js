import { CubeListBoard } from "./cube_list_board.js";

const mainArea = document.getElementById("main-area")
const leftDivider = document.getElementById("left-divider")
const rightDivider = document.getElementById("right-divider")
const canvasContainer = document.getElementById("display-div");

let clickedDivider = -1

let activeStudio

export class ModelingStudio {

    constructor(display, raytracer, transformControls, setMode, setPosition, setRotation, setCubeName) {
        this.display = display
        this.raytracer = raytracer
        this.setPosition = setPosition
        this.setRotation = setRotation
        this.setCubeName = setCubeName
        this.setMode = setMode
        this.cubeList = new CubeListBoard(document.getElementById("cube-list"), raytracer, display.tbl)
        this.transformControls = transformControls
        this.transformControls.studioCallback = (dims, offset) => {
            setDimension(dims)
            setOffset(offset)
        }

        this.leftArea = 300
        this.rightArea = 300
        
        document.onmouseup = () => clickedDivider = 0
        leftDivider.onmousedown = () => clickedDivider = 1
        rightDivider.onmousedown = () => clickedDivider = 2

        document.onmousemove = e => {
            if(clickedDivider !== 0) {
                if(clickedDivider === 1) {
                    this.leftArea = e.clientX
                } else if(clickedDivider === 2) {
                    this.rightArea = mainArea.clientWidth - e.clientX
                }
                this.updateAreas()
            }
        }

        this.updateAreas()
    }

    updateAreas() {
        leftDivider.style.left = this.leftArea + "px"
        rightDivider.style.right = this.rightArea + "px"

        mainArea.style.gridTemplateColumns = this.leftArea + "px " + " calc(100% - " + (this.leftArea + this.rightArea) + "px) " + this.rightArea + "px"

        window.studioWindowResized()
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
            this.setCubeName(cube.name, true)
        } else {
            setDimension([0, 0, 0])
            setOffset([0, 0, 0])
            setMcScale(0)
            setTextureOffset([0, 0])
            setTextureMirrored(false)
            this.setCubeName(cube.name, true)
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
window.setCubeName = elem => setCubeName(elem.value)

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

function setCubeName(value) {
    if(activeStudio !== undefined) {
        activeStudio.setCubeName(value)
    }
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