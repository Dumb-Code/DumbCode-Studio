import { Raycaster, Vector2 } from "../libs/three.js"
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
        this.pth = studio.pth
        this.raytracer = studio.raytracer
        this.selectionElement = selectionElement
        this.previousIntersected = new Set()
        this.raytraceCache = new Map()
        this.active = false
        this.enabled = false
        this.previousMoveState = {}
        this.cubesToGoThrough = []

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
            this.cubesToGoThrough.length = 0
            this.selectionElement.hide()
            this.previousIntersected.clear()
            return
        }

        let elements = this.pth.model.cubeMap.size
        if(elements === 0) {
            return
        }

        let left = Math.min(mousePoint.x, mouseDownPoint.x)
        let top = Math.min(mousePoint.y, mouseDownPoint.y)
        let width = Math.abs(mousePoint.x - mouseDownPoint.x)
        let height = Math.abs(mousePoint.y - mouseDownPoint.y)

        if(
            this.previousMoveState.left != left ||
            this.previousMoveState.top != top ||
            this.previousMoveState.width != width ||
            this.previousMoveState.height != height
        ) {
            this.previousMoveState = { left, top, width, height }
            this.cubesToGoThrough.length = 0
        }

        if(this.cubesToGoThrough.length === 0) {
            this.pth.model.cubeMap.forEach(cube => {
                if(cube.cubeMesh !== undefined) {
                    this.cubesToGoThrough.push(cube.cubeMesh)
                } else {
                    console.warn("Cube hasn't got a mesh", cube.name)
                }
            })
        }


        this.selectionElement.show().css('left', left).css('top', top).css('width', width).css('height', height)
        
        //todo: maybe make the cubes intersected rather than selected before the mouse is released
        let intersectedObjects = new Set()
        let step = 5
        let calcsLeft = Math.max(500 / this.pth.model.cubeMap.size, 75)
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
                        .intersectObjects(this.cubesToGoThrough)
                        .forEach(object => {
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