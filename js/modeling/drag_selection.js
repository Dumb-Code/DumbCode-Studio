import { Raycaster, Vector2 } from "../libs/three.js"
import { listenForKeyChange } from "../util/element_functions.js"

const raycaster = new Raycaster()

let mousedown = false
let mouseDownPoint = new Vector2()
let mousePoint = new Vector2()
let mouse = new Vector2()

$(document)
.mousedown(e => {
    mouseDownPoint.set(e.clientX, e.clientY)
    mousedown = true
})
.mousemove(e => mousePoint.set(e.clientX, e.clientY))
.mouseup(() => {
    mousedown = false
})

/**
 * Used to handle the shift click dragging of selection cubes.
 */
export class DragSelection {
    constructor(studio, selectionElement, orbitControls) {
        this.display = studio.display
        this.pth = studio.pth
        this.raytracer = studio.raytracer
        this.selectionElement = selectionElement
        this.previousIntersected = new Set()
        this.raytraceCache = new Map()
        this.active = false
        this.enabled = false
        this.cubesToGoThrough = []

        //Sets enabled
        this.setEnabled = (value = this.enabled) => {
            orbitControls.enabled = !value
            studio.transformControls.reason('drag', !value)
        }

        //When the shift key is pressed/unpressed, set enabled.
        listenForKeyChange("Shift", value => {
            if(this.active) {
                this.enabled = value
                this.setEnabled(value)
            }
        })
    }

    /**
     * Run onn every frame
     */
    onFrame() { 
        if(!this.enabled || !mousedown) {
            this.raytraceCache.clear()
            this.cubesToGoThrough.length = 0
            this.selectionElement.hide()
            this.previousIntersected.clear()
            return
        }

        let elements = this.pth.model.cubeMap.size
        if(elements === 0) {
            return
        }

        let left = mouseDownPoint.x
        let top = mouseDownPoint.y
        let width = mousePoint.x - mouseDownPoint.x
        let height = mousePoint.y - mouseDownPoint.y

        //If there are no cubes to go through, re-add all the cubes.
        //Note that this currently means the algorith will repeat ittself once all cubes are clicked on.
        if(this.cubesToGoThrough.length === 0) {
            this.pth.model.cubeMap.forEach(cube => {
                if(cube.cubeMesh !== undefined) {
                    this.cubesToGoThrough.push(cube.cubeMesh)
                } else {
                    console.warn("Cube hasn't got a mesh", cube.name)
                }
            })
        }

        //Set the properties of the shift click element
        this.selectionElement.show()
        .css('left', Math.min(left, mousePoint.x))
        .css('top', Math.min(top, mousePoint.y))
        .css('width', Math.abs(width))
        .css('height', Math.abs(height))
        
        //todo: maybe make the cubes intersected rather than selected before the mouse is released
        let intersectedObjects = new Set()
        let step = 5
        let pixelsToScanPerFrame = 100

        //Basically in a version of range(left, left+width, step), that accounts for both directions.
        let xDir = Math.sign(width)
        let yDir = Math.sign(height)
        for(let x = left; xDir*x < xDir*(left+width); x+=(xDir*step)) {
            for(let y = top; yDir*y < yDir*(top+height); y+=(yDir*step)) {
                let key = x+','+y
                //If the pixel has already been calculated, don't recalculate it
                if(!this.raytraceCache.has(key)) {
                    //If we're out of pixels per frame to scan
                    if(pixelsToScanPerFrame-- < 0) {
                        continue
                    }
                    //Get the area size, and the mouse position for the raytracer.
                    let rect = this.display.renderer.domElement.getBoundingClientRect()
                    let cache = new Set()
                    mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
                    mouse.y = -((y - rect.top) / rect.height) * 2 + 1;
                    raycaster.setFromCamera(mouse, this.display.camera)
                    raycaster
                        .intersectObjects(this.cubesToGoThrough)
                        .forEach(object => {
                            //Remove the object from cubesToGoThrough, as if it's found, we shouldn't re-calculate it.
                            cache.add(object.object)
                            let ix = this.cubesToGoThrough.indexOf(object.object)
                            if(ix !== -1) { //Should always be true
                                this.cubesToGoThrough.splice(ix, 1)
                            }
                        })
                    this.raytraceCache.set(key, cache)
                }
                this.raytraceCache.get(key).forEach(c => intersectedObjects.add(c))  
            }
        }

        //Deselects the relevant cubes.
        let fireEvents = false
        this.previousIntersected.forEach(cube => {
            if(!intersectedObjects.has(cube)) {
                this.raytracer.clickOnMesh(cube, false, false, true)
            }
            fireEvents = true
        })
        if(fireEvents) {
            this.raytracer.dispatchEvents(false)
        }

        //Selects the relevant cubes.
        fireEvents = false
        intersectedObjects.forEach(cube => {
            if(!this.previousIntersected.has(cube)) {
                this.raytracer.clickOnMesh(cube, true, false, true)
            }
            fireEvents = true
        })
        if(fireEvents) {
            this.raytracer.dispatchEvents(true)
        } 

        //Set the previous intersected to the current intersected.
        this.previousIntersected.clear()
        intersectedObjects.forEach(c => this.previousIntersected.add(c))
    }

    /**
     * On the modeling tab active
     */
    onActive() {
        this.setEnabled()
        this.active = true
    }

    /**
     * On the modeling tab unactive
     */
    onInactive() {
        this.setEnabled(false)
        this.active = false
    }
}