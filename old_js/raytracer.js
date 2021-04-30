import { Vector2, Raycaster, EventDispatcher } from "./libs/three.js";
import { lineIntersection } from "./util.js";
import { isKeyDown } from "./util/element_functions.js";


document.addEventListener( 'mousemove', onMouseMove, false );
// document.addEventListener( 'mousedown', onMouseDown, false );

let mouse = new Vector2(-5, -5);
let mouseClickDown = new Vector2(-5, -5)
let previousRawMouse = new Vector2()
let rawMouse = new Vector2();
let mouseDown = false
let mouseOnDiv = false

function onMouseMove( event ) {
    previousRawMouse.copy(rawMouse)
    rawMouse.x = event.clientX
    rawMouse.y = event.clientY
    setMouseFromPoint(rawMouse.x, rawMouse.y, true)
}

function setMouseFromPoint(x, y, updateOnDiv) {
    let div = $('.tab-area.is-active .display-div').get(0)
    mouse.set(-5, -5)
    if(div !== undefined) {
        let rect = div.getBoundingClientRect()
        mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        mouse.y = - ((y - rect.top) / rect.height) * 2 + 1;
        if(updateOnDiv) {
            mouseOnDiv = x > rect.left && x < rect.right && y > rect.top && y < rect.bottom
        }
    } else if(updateOnDiv) {
        mouseOnDiv = false
    }
    return mouse
}

export function raytraceUnderMouse(camera, elements, recursive = false) {
    raycaster.setFromCamera(mouse, camera)
    return raycaster.intersectObjects(elements, recursive)
}


const selectElementEvent = { type:"select", cubes:[] }
const deselectElementEvent = { type:"deselect", cubes:[] }
const selectChangeEvent = { type:"selectchange", }
const intersectionChangeEvent = { type:"intersection", old:undefined, cube:undefined }

const elementClickedEvent = {type:"clicked", ignore:false }

const raycaster = new Raycaster()

export class Raytracer {

    constructor(display, pth) {
        display.mousedown.addListener(999, event =>  { 
            mouseClickDown.x = event.originalEvent.clientX
            mouseClickDown.y = event.originalEvent.clientY
            mouseDown = true
        })
        // this.material = material
        // this.highlightMaterial = highlightMaterial
        // this.selectedMaterial = selectedMaterial
        this.pth = pth
        this.display = display
        // this.selectedSet = new Set()
        this.intersected
        this.intersectedDistance = Infinity
        this.disableRaycast = false

        document.addEventListener( 'mouseup', e => {
            if(mouseDown === false) {
                return
            }
            mouseDown = false
            let xMove = Math.abs(mouseClickDown.x - event.clientX)
            let yMove = Math.abs(mouseClickDown.y - event.clientY)
        
            if(e.target === display.renderer.domElement && xMove < 5 && yMove < 5 && mouse.x >= -1 && mouse.x <= 1 && mouse.y >= -1 && mouse.y <= 1) {
                elementClickedEvent.ignore = false
                this.dispatchEvent(elementClickedEvent)
                if(elementClickedEvent.ignore !== true) {
                    if(this.intersected !== undefined) {
                        this.clickOnMesh(this.intersected)
                    } else {
                        this.deselectAll()
                    }
                }
            }
            
        }, false );

        this.addEventListener('select', e => e.cubes.forEach(mesh => mesh.material = this.pth.materials.selected))
        this.addEventListener('deselect', e => e.cubes.forEach(mesh => mesh.material = this.pth.materials.normal))
    }

    get selectedSet() {
        return this.pth.getSelected().selectedSet
    }

    anySelected() {
        return this.pth.anySelected() ? this.selectedSet.size > 0 : false
    }

    isSelected(group) {
        return this.selectedSet.has(group)
    }

    isCubeSelected(cube) {
        return this.selectedSet.has(cube.cubeMesh)
    }

    firstSelected() {
        return this.selectedSet.values().next().value
    }

    oneSelected() {
        return this.selectedSet.size === 1 ? this.firstSelected() : null
    }

    get selected() {
        console.trace("deprecated get")
    }

    set selected(s) {
        console.trace("deprecated set")
    }
    
    clearEventData() {
        selectElementEvent.cubes.length = 0
        deselectElementEvent.cubes.length = 0
    }
    
    clickOnMesh(mesh, toSet, testPrevious = true, silent = false) {
        if(mesh === undefined) {
            console.trace("deprecated click undefined")
            return
        }
        let shouldRemove = this.selectedSet.has(mesh)
        if(toSet !== undefined) {
            shouldRemove = !toSet
        }

        if(silent !== true) {
            this.clearEventData()
        }

        if(testPrevious === true && !isKeyDown("Control")) {
            this.selectedSet.forEach(c => deselectElementEvent.cubes.push(c))
            this.selectedSet.clear()
        }
        if(shouldRemove) {
            this.selectedSet.delete(mesh)
            deselectElementEvent.cubes.push(mesh)
        } else {
            this.selectedSet.add(mesh)
            selectElementEvent.cubes.push(mesh)
            if(silent !== true) {
                this.dispatchEvent(selectElementEvent)
            }
        }

        if(silent !== true) {
            if(deselectElementEvent.cubes.length !== 0) {
                this.dispatchEvent(deselectElementEvent)
            }
    
            this.dispatchEvent(selectChangeEvent)
        }
    }

    dispatchEvents(selected) {
        if(selected === true) {
            this.dispatchEvent(selectElementEvent)
        } else {
            this.dispatchEvent(deselectElementEvent)
        }
        this.dispatchEvent(selectChangeEvent)
    }


    deselectAll() {
        deselectElementEvent.cubes.length = 0
        this.selectedSet.forEach(c => deselectElementEvent.cubes.push(c))
        this.selectedSet.clear()
        this.dispatchEvents(false)
    }

    mouseOverMesh(mesh, distance = Infinity) {
        if(mesh !== undefined) {
            if(this.intersected != mesh) {
                if(this.intersected && !this.selectedSet.has(this.intersected)) {
                    this.intersected.material = this.pth.materials.normal
                }
                intersectionChangeEvent.old = this.intersected
                intersectionChangeEvent.cube = mesh
                this.intersected = mesh
                this.intersectedDistance = distance
                this.dispatchEvent(intersectionChangeEvent)
                
                if(!this.selectedSet.has(this.intersected)) {
                    this.intersected.material = this.pth.materials.highlight
                } 
            } 
        } else if(this.intersected) {
            if(!this.selectedSet.has(this.intersected)) {
                this.intersected.material = this.pth.materials.normal
            }
            intersectionChangeEvent.old = this.intersected
            intersectionChangeEvent.cube = undefined
            this.intersectedDistance = Infinity
            this.intersected = undefined
            this.dispatchEvent(intersectionChangeEvent)
        }
    }

    update() {
        let textDiv = document.getElementById("editor-mouseover") //todo: cache?

        if(this.disableRaycast || !mouseOnDiv) {
            return undefined
        }

        if(this.intersected) {
            let style = textDiv.style
            let divRect = textDiv.getBoundingClientRect()
            textDiv.innerHTML = this.intersected.tabulaCube.name
            style.left = rawMouse.x - divRect.width/2 + "px"
            style.top = rawMouse.y - 35 + "px"
        }

        if(this.pth.anySelected()) {
            let intersects = this.gatherIntersections(false);
            if(!mouseDown) {
                if(intersects.length > 0) {
                    this.mouseOverMesh(intersects[0].object, intersects[0].distance)
                    textDiv.style.display = "block"
                } else {
                    this.mouseOverMesh(undefined)
                    textDiv.style.display = "none"
                }
            }
        }
    }

    gatherIntersections(usePrevious) {
        if(usePrevious) {
            let arr = []
            lineIntersection(previousRawMouse.x, previousRawMouse.y, rawMouse.x, rawMouse.y, (x, y) => {
                raycaster.setFromCamera(setMouseFromPoint(x, y, false), this.display.camera)
                let inters = raycaster.intersectObjects(this.pth.model.modelCache.children, true)
                if(inters.length > 0) {
                    arr.push(inters[0])
                }
            }, 5)
            return arr
        } else {
            raycaster.setFromCamera(mouse, this.display.camera);
            return raycaster.intersectObjects(this.pth.model.modelCache.children , true)
        }
    }
}
Object.assign( Raytracer.prototype, EventDispatcher.prototype );
