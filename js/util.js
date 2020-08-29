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
                let idx = parseInt(e.target.getAttribute('axis'))
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
        this.elements = $()
        this.mustSelectOne = mustSelectOne
        this.predicate = () => true
        this.addElement(elements)        
        if(this.mustSelectOne) {
            this.elements.first().addClass('is-activated').each((_i, elem) => this.value = elem.getAttribute('select-list-entry'))
        }
    }

    addElement(elements) {
        let getValue = () => this.value
        let setValue = v => this.value = v
        let mustSelectOne = this.mustSelectOne

        elements.click(function() { 
            let val = this.getAttribute('select-list-entry')
            if(val === getValue() && !mustSelectOne) {
                setValue(undefined)
            } else {
                setValue(val)
            }
        })
        this.elements = this.elements.add(elements)
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
        this.worldMatrix = getElementFromCube(this.cube, this.type).matrixWorld.clone()
    }

    reconstruct() {
        CubeLocker.reconstructLocker(this.cube, this.type, this.worldMatrix)
    }
}

CubeLocker.reconstructLocker = (cube, type, matrix) => {
        //      parent_world_matrix * local_matrix = world_matrix
        //  =>  local_matrix = 'parent_world_matrix * world_matrix
        resultMat.getInverse(getElementFromCube(cube, type).parent.matrixWorld).multiply(matrix)
        resultMat.decompose(decomposePos, decomposeRot, decomposeScale)

        switch(type) {
            case 0:
                cube.updatePosition(decomposePos.toArray())
                decomposeEuler.setFromQuaternion(decomposeRot, "ZYX")
                cube.updateRotation(decomposeEuler.toArray().map(e => e * 180 / Math.PI))
                break
            case 1:
                cube.updateOffset(decomposePos.toArray())
                break
        }
}

function getElementFromCube(cube, type) {
    switch(type) {
        case 0:
            return cube.cubeGroup
            break
        case 1:
            return cube.cubeMesh
            break
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
            .mouseleave(e => this.mouseEvent(e))
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
        let rect = this.canvas.getBoundingClientRect()
        let mousePoint = new DOMPoint(e.originalEvent.clientX - rect.left, e.originalEvent.clientY - rect.top)
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

export class DraggableElementList {

    constructor(canDropOnElement, callback) {
        let previousElement = null
        let draggedData = null

        this.removePreviousState = () => previousElement?.removeAttribute("drag-state")
        this.getDraggedData = () => draggedData

        this.addElement = (element, dataGetter) => {
            element.ondragstart = () => draggedData = dataGetter() 
            element.ondragover = function(e) {
                let rect = this.getBoundingClientRect()
                let yPerc = (e.clientY - rect.top) / rect.height
        
                if(this !== previousElement) {
                    previousElement?.removeAttribute("drag-state")
                    previousElement = this
                }

                if(draggedData === dataGetter()) {
                    this.removeAttribute("drag-state")
                    return
                }
        
                if(yPerc <= (canDropOnElement ? 1/3 : 1/2)) {
                    this.setAttribute("drag-state", "top")
                } else if(!canDropOnElement || yPerc > 2/3) {
                    this.setAttribute("drag-state", "bottom")
                } else if(canDropOnElement) {
                    this.setAttribute("drag-state", "on")
                }

                e.preventDefault()
            }
            element.ondrop = function() {
                let drop = this.getAttribute("drag-state")
                if(draggedData !== null && drop !== undefined) {
                    callback(drop, draggedData, dataGetter())
                }
                this.removeAttribute("drag-state")
                draggedData = null
            }
        }
    }
}

let activeSet = new Set()
//This is to make sure when the main window is unloaded (closed/refreshed), all the open windows are also closed
window.onbeforeunload = () => activeSet.forEach(e => e.win?.close())
export class LayoutPart {
    constructor(rootDom, onChanged) {
        this.rootDom = rootDom
        this.onChanged = onChanged
        this.parentNode = rootDom.parent()
        this.win = null
        this.poppedOut = false
        rootDom.find('.popout-button').click(() => this.popped = !this.popped)
    }

    get popped() {
        return this.poppedOut
    }

    set popped(popped) {
        if(this.poppedOut === popped) {
            return
        }
        this.poppedOut = popped
        if(popped) {
            activeSet.add(this)
            if(this.win === null) {
                let width = this.rootDom.width()
                let height = this.rootDom.height()
                let offset = this.rootDom.offset()
                let top = window.screenY + offset.top
                let left = window.screenX + offset.left
                this.rootDom.detach()
                this.win = window.open('templates/popped_out.html', 'Test Window ' + Math.random(), `top=${top},screenY=${top},left=${left},screenX=${left},height=${height},width=${width}`)
                this.win.onload = () => this.rootDom.appendTo(this.win.document.body)
                this.win.onbeforeunload  = () => {
                    if(this.popped) {
                        this.popped = false
                    }
                }
            }
        } else {
            activeSet.delete(this)
            if(this.win !== null) {
                this.win.close()
                this.win = null
                this.rootDom.detach().appendTo(this.parentNode)
            }
        }
        this.onChanged(popped)
    }
}

let a = document.createElement("a");

export function downloadBlob(name, blob) {
    let url = window.URL.createObjectURL(blob)
    downloadHref(name, url)
    window.URL.revokeObjectURL(url)
}

export function downloadCanvas(name, canvas) {
    downloadHref(name, canvas.toDataURL("image/png;base64"))
}

export function downloadHref(name, href) {
    a.href = href
    a.download = name
    a.click()
}


//https://stackoverflow.com/a/4672319
export function lineIntersection(x0, y0, x1, y1, callback, skip = 1) {
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;
    let count = 1
    callback(x0, y0)
    while(!((x0 == x1) && (y0 == y1))) {
        let e2 = err << 1;
        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
        if((count++ % skip) === 0) {
            callback(x0, y0)
        }
    }
}

export function objectEquals(obj1, obj2, deep = false) {
    if(typeof obj1 != typeof obj2) {
        return false
    }
    if(typeof obj1 == "object") {
        for (var i in obj1) {
            if (obj1.hasOwnProperty(i)) {
                if (!obj2.hasOwnProperty(i)) {
                    return false
                }
                if(deep === true ? !objectEquals(obj1[i], obj2[i], true) : obj1[i] != obj2[i]) {
                    return false
                }
            }
        }
        for (var i in obj2) {
            if (obj2.hasOwnProperty(i)) {
                if (!obj1.hasOwnProperty(i)) {
                    return false
                }
                if(deep === true ? !objectEquals(obj1[i], obj2[i], true) : obj1[i] != obj2[i]) {
                    return false
                }
            }
        }
        return true;
    } else if(typeof obj1 == "function") {
        return true //don't compare functions
    } else {
        return obj1 == obj2
    }
  }