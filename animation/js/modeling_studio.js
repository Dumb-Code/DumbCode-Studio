import { CubeListBoard } from "./cube_list_board.js"
import { TblCube } from "./tbl_loader.js"
import { LinkedElement } from "./editor.js"

const mainArea = document.getElementById("main-area")

export class ModelingStudio {

    constructor(domElement, display, raytracer, transformControls, setMode, renameCube) {
        this.domElement = domElement
        let dom = $(domElement)
        this.canvasContainer = dom.find("#display-div").get(0)
        this.display = display
        this.raytracer = raytracer
        this.setMode = setMode
        this.cubeList = new CubeListBoard(dom.find("#cube-list").get(0), raytracer, display.tbl)
        this.transformControls = transformControls
        this.transformControls.studioCallback = (dims, offset) => {
            setDimension(dims)
            setOffset(offset)
        }

        let cube = () => raytracer.selected?.tabulaCube

        this.cubeName = new LinkedElement(dom.find('.input-cube-name'), false, false).onchange(e => renameCube(e.old, e.value))
        this.dimensions = new LinkedElement(dom.find('.input-dimension')).onchange(e => cube()?.updateDimension(e.value))
        this.positions = new LinkedElement(dom.find('.input-position')).onchange(e => cube()?.updatePosition(e.value))
        this.offsets = new LinkedElement(dom.find('.input-offset')).onchange(e => cube()?.updateOffset(e.value))
        this.cubeGrow = new LinkedElement(dom.find('.input-cube-grow'), false).onchange(e => cube()?.updateCubeGrow(e.value))
        this.textureOffset = new LinkedElement(dom.find('.input-texure-offset')).onchange(e => cube()?.updateTextureOffset(e.value))
        this.textureMirrored = new LinkedElement(dom.find('.input-texture-mirrored'), false, false).onchange(e => cube()?.updateTextureMirrored(e.value))
        this.rotation = new LinkedElement(dom.find('.input-rotation')).withsliders(dom.find('.input-rotation-slider')).onchange(e => cube()?.updateRotation(e.value))


        dom.find('.cube-create').click(() => {
            let cube = new TblCube("newcube", [1, 1, 1], [0, 0, 0], [0, 0, 0], [0, 0, 0], [1, 1, 1], [0, 0], 0, [], false, this.display.tbl)
            if(this.raytracer.selected !== undefined) {
                this.raytracer.selected.tabulaCube.children.push(cube)
                this.raytracer.selected.tabulaCube.onChildrenChange()
            } else {
                this.display.tbl.rootGroup.cubeList.push(cube)
                this.display.tbl.rootGroup.refreshGroup()
            }
        })

        this.leftDivider = dom.find("#left-divider")
        this.rightDivider = dom.find("#right-divider")
        this.leftArea = 300
        this.rightArea = 300
        let clickedDivider = -1
        $(document)
            .mouseup(() => clickedDivider = 0)
            .mousemove(e => {
                if(clickedDivider !== 0) {
                    if(clickedDivider === 1) {
                        this.leftArea = e.clientX
                    } else if(clickedDivider === 2) {
                        this.rightArea = mainArea.clientWidth - e.clientX
                    }
                    this.updateAreas()
                }
            })

        this.leftDivider.mousedown(() => clickedDivider = 1)
        this.rightDivider.mousedown(() => clickedDivider = 2)

        this.updateAreas()
    }

    updateAreas() {
        this.leftDivider.css('left', this.leftArea + "px")
        this.rightDivider.css('right', this.rightArea + "px")

        this.domElement.style.gridTemplateColumns = this.leftArea + "px " + " calc(100% - " + (this.leftArea + this.rightArea) + "px) " + this.rightArea + "px"

        window.studioWindowResized()
    }

    runFrame() {
        this.raytracer.update()
        this.display.tbl.resetAnimations()
        this.display.render()
    }

    cubeHierarchyChanged() {
        this.cubeList.refreshCompleatly()
    }

    setActive() {
        window.studioWindowResized()
    }

    selectedChanged() {
        if(this.raytracer.selected !== undefined) {
            let cube = this.raytracer.selected.tabulaCube
            this.cubeName.value = cube.name
            this.positions.value = cube.rotationPoint
            this.dimensions.value = cube.dimension
            this.rotation.value = cube.rotation
            this.offsets.value = cube.offset
            this.cubeGrow.value = cube.mcScale
            this.textureOffset.value = cube.textureOffset
            this.textureMirrored.value = cube.textureMirrored
        } else {
            this.dimensions.value = [0, 0, 0]
            this.positions.value = [0, 0, 0]
            this.offsets.value = [0, 0, 0]
            this.rotation.value = [0, 0, 0]
            this.cubeGrow.value = 0
            this.textureOffset.value = [0, 0]
            this.textureMirrored.value = false
            this.cubeName.value = ""
        }
    }
}

// window.toggleDimensionsTransform = () => {
//     if(activeStudio !== undefined &&  activeStudio.transformControls.visible && activeStudio.transformControls.mode == "dimensions") {
//         activeStudio.setMode("none")
//     } else {
//         activeStudio.setMode("dimensions")
//     }
// }


// window.setDimension = elem => setValuesFromElem(c => c.dimension, elem, setDimension)
// window.setOffset = elem => setValuesFromElem(c => c.offset, elem, setOffset)
// window.setTextureOffset = elem => setValuesFromElem(c => c.textureOffset, elem, setTextureOffset)
// window.setTextureMirrored = elem => setTextureMirrored(elem.value)
// window.setMcScale = elem => {
//     let num = Number(elem.value)
//     if(Number.isNaN(num)) {
//         return
//     }
//     setMcScale(num)
// }
// window.setCubeName = elem => setCubeName(elem.value)

// function setValuesFromElem(propertyGetter, elem, applier) {
//     if(activeStudio !== undefined && activeStudio.raytracer.selected !== undefined) {
//         let num = Number(elem.value)
//         if(Number.isNaN(num)) {
//             return
//         }
//         let values = propertyGetter(activeStudio.raytracer.selected.tabulaCube)
//         values[elem.getAttribute("axis")] = num
//         applier(values)
//     }
    
// }

// function setDimension(values) {
//     updateCubeValuesArray("input-dimension", c => c.updateDimensions(values), values)
// }

// function setOffset(values) {
//     updateCubeValuesArray("input-offset", c => c.updateOffset(values), values)
// }

// function setMcScale(value) {
//     updateCubeRaw("input-cube-grow", c => c.updateMcScale(value), e => e.value = value)
// }

// function setTextureOffset(values) {
//     updateCubeValuesArray("input-texure-offset", c => c.updateTextureOffset(values), values)
// }

// function setTextureMirrored(value) {
//     updateCubeRaw("input-texture-mirrored", c => c.updateTextureMirrored(value), e => e.value = value)
// }

// function setCubeName(value) {
//     if(activeStudio !== undefined) {
//         activeStudio.setCubeName(value)
//     }
// }

// function updateCubeValuesArray(className, cubeFunction, values) {
//     updateCubeRaw(className, cubeFunction, e => e.value = values[e.getAttribute("axis")])
// }

// function updateCubeRaw(className, cubeFunction, elemFunction) {
//     if(activeStudio !== undefined) {
//         [...document.getElementsByClassName(className)].forEach(elem => {
//             elemFunction(elem)
//             elem.checkValidity()
//         });
//         if(activeStudio.raytracer.selected !== undefined) {
//             cubeFunction(activeStudio.raytracer.selected.tabulaCube)
//         }
//     }
// }