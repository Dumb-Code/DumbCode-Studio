import { Raycaster, Vector2 } from "../three.js"
import { listenForKeyChange } from "../util.js"

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

export class DragSelection {
    constructor(studio, selectionElement, orbitControls) {
        this.display = studio.display
        this.raytracer = studio.raytracer
        this.selectionElement = selectionElement
        this.previousIntersected = new Set()
        this.raytraceCache = new Map()
        this.active = false
        this.enabled = false

        this.setEnabled = (value = this.enabled) => {
            orbitControls.enabled = !value
            studio.transformControls.reason('drag', !value)
        }

        listenForKeyChange("Shift", value => {
            if(this.active) {
                this.enabled = value
                this.setEnabled(value)
            }
        })
    }

    onFrame() { 
        if(!this.enabled || !mousedown) {
            this.raytraceCache.clear()
            this.selectionElement.hide()
            this.previousIntersected.clear()
            return
        }

        console.log("e")

        let left = Math.min(mousePoint.x, mouseDownPoint.x)
        let top = Math.min(mousePoint.y, mouseDownPoint.y)
        let width = Math.abs(mousePoint.x - mouseDownPoint.x)
        let height = Math.abs(mousePoint.y - mouseDownPoint.y)


        this.selectionElement.show().css('left', left).css('top', top).css('width', width).css('height', height)
        
        //todo: maybe make the cubes intersected rather than selected before the mouse is released
        let intersectedObjects = new Set()
        let step = 5
        let calcsLeft = Math.max(500 / this.display.tbl.cubeMap.size, 75)
        for(let x = left; x <= left+width; x+=step) {
            for(let y = top; y <= top+height; y+=step) {
                let key = x+','+y
                if(!this.raytraceCache.has(key)) {
                    if(calcsLeft-- < 0) {
                        continue
                    }
                    let rect = this.display.renderer.domElement.getBoundingClientRect()
                    let cache = new Set()
                    mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
                    mouse.y = -((y - rect.top) / rect.height) * 2 + 1;
                    raycaster.setFromCamera(mouse, this.display.camera)
                    raycaster
                        .intersectObjects(this.display.tbl.modelCache.children, true)
                        .forEach(object => cache.add(object.object.parent))
                    this.raytraceCache.set(key, cache)
                }
                this.raytraceCache.get(key).forEach(c => intersectedObjects.add(c))  
            }
        }


        this.previousIntersected.forEach(cube => {
            if(!intersectedObjects.has(cube)) {
                this.raytracer.clickOnMesh(cube, false, false)
            }
        })

        intersectedObjects.forEach(cube => {
            if(!this.previousIntersected.has(cube)) {
                this.raytracer.clickOnMesh(cube, true, false)
            }
        })     

        this.previousIntersected.clear()
        intersectedObjects.forEach(c => this.previousIntersected.add(c))
    }

    onActive() {
        this.setEnabled()
        this.active = true
    }

    onInactive() {
        this.setEnabled(false)
        this.active = false
    }
}