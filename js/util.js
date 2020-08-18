import { EventDispatcher, Matrix4, Vector3, Quaternion, Euler } from "./three.js";

export class ButtonSpeed {

    setupfor(element, callback) {
        this.element = element;
        this.callback = callback

        this.mouseStillDown = true
        this.timeout = 500; //todo?

        this.mouseUp = () => {
            this.mouseStillDown = false
            clearInterval(this.interval)
            document.removeEventListener("mouseup", this.mouseUp)
        }

        document.addEventListener("mouseup", this.mouseUp )
        this.tick()
    }

    tick() {
        if(!this.mouseStillDown) {
            return;
        }

        this.callback()

        if(this.timeout > 1) {
            this.timeout -= 75
        }
        clearInterval(this.interval)
        this.interval = setInterval(() => this.tick(), this.timeout)
    }
}

export class LinkedElement {

    constructor(elems, array = true, parseNum = true, checkbox = false) {
        this.array = array
        this.parseNum = parseNum
        this.checkbox = checkbox
        this.addElement(this.elems = elems)
        this.sliderElems = undefined
        if(this.array) {
            this.rawValue = [0, 0, 0]
        } else {
            this.rawValue = 0
        }
    }

    //todo: remove
    set value(value) {
        this.setValue(value)
    }
    setValue(value, ignore = -1) {
        let old = this.rawValue
        this.setInternalValue(value, ignore)
        this.dispatchEvent({ type: "changed", old, value, idx:ignore })
    }

    get value() {
        return this.rawValue
    }

    setInternalValue(value, ignore = -1) {
        if(this.array && value !== undefined) {
            value = [...value]
        }
        
        this.rawValue = value
        
        if(this.array && value !== undefined) {
            if(typeof value[0] == 'number') {
                value = value.map(v => this.makeKashHappy(v.toFixed(2)))
            }
        } else if(typeof value == 'number') {
            value = this.makeKashHappy(value.toFixed(2))
        }

        if(this.array) {
            this.elems.each((idx,e) => {
                if(idx != ignore) {
                    e.value = value===undefined?"":value[e.getAttribute('axis')]
                }
            })
            if(this.sliderElems !== undefined) {
                this.sliderElems.each((_i,e) => e.value = ((value===undefined?0:this.rawValue[e.getAttribute("axis")] + 180) % 360) - 180)
            }
        } else if(ignore != 0) {
            if(this.checkbox) {
                this.elems.prop('checked', value===undefined?false:value)
            } else {
                this.elems.val(value===undefined?"":value)
            }
        }
    }

    makeKashHappy(value) {
        if(value == '-0.00') {
            return '0.00'
        }
        return value
    }

    onchange(listener) {
        this.addEventListener('changed', listener)
        return this
    }

    withsliders(sliderElems) {
        this.addElement(this.sliderElems = sliderElems, false)
        return this
    }

    addElement(elem, ensure = true) {
        if(this.array) {
            elem.on('input', e => {
                let arr = this.rawValue.splice(0)
                let idx = e.target.getAttribute('axis')
                arr[idx] = this.parseNum ? parseFloat(e.target.value) : e.target.value
                this.setValue(arr, ensure ? idx : -1)
            })
        } else {
            elem.on('input', e => this.setValue(this.parseNum ? parseFloat(e.target.value) : (this.checkbox ? e.target.checked : e.target.value), 0))
        }

        //Ensure when the boxes are deselected, the text inside them should be updated and formatted
        elem.focusout(() => this.setInternalValue(this.value))
    }
}
Object.assign( LinkedElement.prototype, EventDispatcher.prototype );

export class LinkedSelectableList {
    constructor(elements, mustSelectOne = true) {
        this.elements = elements
        this.mustSelectOne = mustSelectOne
        this.predicate = () => true

        let getValue = () => this.value
        let setValue = v => this.value = v
        this.elements.click(function() { 
            let val = this.getAttribute('select-list-entry')
            if(val === getValue() && !mustSelectOne) {
                setValue(undefined)
            } else {
                setValue(val)
            }
         })
        if(this.mustSelectOne) {
            this.elements.first().addClass('is-activated').each((_i, elem) => this.value = elem.getAttribute('select-list-entry'))
        }
    }

    set value(value) {
        if(this.predicate(value)) {
            let old = this.rawValue
            this.rawValue = value
            this.elements.removeClass('is-activated')
            this.elements.filter(`[select-list-entry='${value}']`).addClass('is-activated')
            this.dispatchEvent({ type: "changed", old, value })
        }
    }

    get value() {
        return this.rawValue
    }

    onchange(listener) {
        this.addEventListener('changed', listener)
        return this
    }

    addPredicate(predicate) {
        let old = this.predicate
        this.predicate = e => old(e) && predicate(e)
        return this
    }
}
Object.assign( LinkedSelectableList.prototype, EventDispatcher.prototype );


export class ToggleableElement {
    constructor(elements) {
        this.elements = elements
        this.predicate = () => true
        let setValue = v => this.value = v
        this.elements.click(function() { setValue(!this.classList.contains("is-activated")) })
    }

    set value(value) {
        if(this.predicate(value)) {
            this.elements.toggleClass("is-activated", value)
            this.dispatchEvent({ type: "changed", value })
        }
    }

    get value() {
        return this.elements.is('.is-activated')
    }

    addPredicate(predicate) {
        let old = this.predicate
        this.predicate = e => old(e) && predicate(e)
        return this
    }

    onchange(listener) {
        this.addEventListener('changed', listener)
        return this
    }
}
Object.assign( ToggleableElement.prototype, EventDispatcher.prototype );

let resultMat = new Matrix4()
let decomposePos = new Vector3()
let decomposeRot = new Quaternion()
let decomposeScale = new Vector3()
let decomposeEuler = new Euler()

export class CubeLocker {
    //type 0: position
    //type 1: offset
    constructor(cube, type = 0) {
        this.cube = cube
        this.type = type
        switch(type) {
            case 0:
                this.element = cube.cubeGroup
                break
            case 1:
                this.element = cube.cubeMesh
                break
        }
        this.worldMatrix = this.element.matrixWorld.clone()
    }

    reconstruct() {
        //      parent_world_matrix * local_matrix = world_matrix
        //  =>  local_matrix = 'parent_world_matrix * world_matrix
        resultMat.getInverse(this.element.parent.matrixWorld).multiply(this.worldMatrix)
        resultMat.decompose(decomposePos, decomposeRot, decomposeScale)

        switch(this.type) {
            case 0:
                this.cube.updatePosition(decomposePos.toArray())
                decomposeEuler.setFromQuaternion(decomposeRot, "ZYX")
                this.cube.updateRotation(decomposeEuler.toArray().map(e => e * 180 / Math.PI))
                break
            case 1:
                this.cube.updateOffset(decomposePos.toArray().map((e, i) => e - this.cube.dimension[i]/2))
                break
        }

    }
}


let pressedKeys = new Set();
let keyListeners = new Map()
$(document)
    .keydown(e => {
        pressedKeys.add(e.key)
        keyListeners.get(e.key)?.forEach(func => func(true))
    })
    .keyup(e => {
        pressedKeys.delete(e.key)
        keyListeners.get(e.key)?.forEach(func => func(false))
    })
export function isKeyDown(key) {
    return pressedKeys.has(key)
} 
export function listenForKeyChange(key, onchange) {
    let arr = keyListeners.has(key) ? keyListeners.get(key) : []
    arr.push(onchange)
    keyListeners.set(key, arr)
}

const disableSelect = e => e.preventDefault()

export function onElementDrag(element, infoClickGetter = () => {}, callback = (dx, dy, info, x, y) => {}, onreleased = (max, dx, dy, x, y) => {}) {
    element.onmousedown = e => {
        let doc = element.ownerDocument
        let cx = e.clientX
        let cy = e.clientY
        let max = 0
        let info = infoClickGetter()
        let mousemove = evt => {
            let dx = evt.clientX - cx
            let dy = evt.clientY - cy

            max = Math.max(max, dx*dx + dy*dy)
            
            callback(dx, dy, info, evt.clientX, evt.clientY)
            evt.stopPropagation()
        }
        let mouseup = evt => {
            doc.removeEventListener('mousemove', mousemove)
            doc.removeEventListener('mouseup', mouseup)
            doc.removeEventListener('selectstart', disableSelect)
            onreleased(Math.sqrt(max), evt.clientX - cx, evt.clientY - cy, evt.clientX, evt.clientY)
            evt.stopPropagation()
        }
        doc.addEventListener('mousemove', mousemove)
        doc.addEventListener('mouseup', mouseup)
        doc.addEventListener('selectstart', disableSelect)
        e.stopPropagation()
    }
}

export class CanvasTransformControls {
    constructor(canvas, mouseCallback, redrawCallback = () => {}) {
        this.mouseCallback = mouseCallback
        this.redrawCallback = redrawCallback
        this.canvasMatrix = new DOMMatrix([1, 0, 0, 1, 0, 0])
        this.canvas = canvas
        this.hasMoved = false

        this.mulMatrix(new DOMMatrix())

        this.previousWidth = -1
        this.previousHeight = -1

        $(canvas)
            .mousemove(e => this.mouseEvent(e))
            .mousedown(e => this.mouseEvent(e))
            .mouseup(e => this.mouseEvent(e))
            .contextmenu(e => e.preventDefault())
            .bind('mousewheel DOMMouseScroll', e => {
                let direction = e.originalEvent.wheelDelta
                let amount =  1.1
                if(direction === undefined) { //Firefox >:(
                    direction = -e.detail
                }
                if(direction !== 0) {
                    this.mulMatrix(new DOMMatrix().scaleSelf(direction > 0 ? amount : 1/amount))
                    this.redrawCallback()
                }
            })
    }
    
    applyTransforms() {
        let ctx = this.canvas.getContext('2d')
        ctx.setTransform(this.getFinalMatrix())
    }

    mouseEvent(e) {
        let mousePoint = new DOMPoint(e.originalEvent.layerX, e.originalEvent.layerY)
        mousePoint = mousePoint.matrixTransform(this.getFinalMatrix().inverse())
        let mouseX = mousePoint.x
        let mouseY = mousePoint.y

        this.mouseCallback(e.type, mouseX, mouseY, e.buttons, v => this.misscallback(e, v === null || v === undefined ? true : v))
    }

    misscallback(e, v) {
        if(e.type === "mousedown") {
            this.hasMoved = false
        }
        if(v) {
            let x = e.originalEvent.movementX
            let y = e.originalEvent.movementY
            if(x !== 0 && y !== 0) {
                this.hasMoved = true
                this.mulMatrix(new DOMMatrix().translateSelf(x, y))
                this.redrawCallback()
            }
        }
    }

    getFinalMatrix() {
        let width = this.canvas.clientWidth
        let height = this.canvas.clientHeight

        if(width !== this.previousWidth || height !== this.previousHeight) {
            this.previousWidth = width
            this.previousHeight = height
            this.computeFinalMatrix()
        }
        
        return this.finalCanvasMatrix
    }


    mulMatrix(matrix) {
        this.canvasMatrix.preMultiplySelf(matrix)
        this.computeFinalMatrix()
    }

    computeFinalMatrix() {
        let width = this.canvas.clientWidth
        let height = this.canvas.clientHeight

        this.finalCanvasMatrix = new DOMMatrix().translate(width/2, height/2).multiply(this.canvasMatrix).multiply(new DOMMatrix().translate(-width/2, -height/2))
    }
}

export function doubleClickToEdit(container, callback, current) {
    let text = container.find('.dbl-text')
    let textEdit = container.find('.dbl-text-edit')

    container.dblclick(() => {
        container.addClass('is-editing')
        textEdit.val(text.text())
        textEdit.select()
    })
    textEdit
        .on('input', e => {
            let t = e.target.value
            text.text(t)
            callback(t)
        })
        .focusout(() => container.removeClass('is-editing'))
        .keyup(e => {
            if(e.key === "Enter") {
                container.removeClass('is-editing')
            }
        })

    if(current !== undefined) {
        text.text(current)
    }
}