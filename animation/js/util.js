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

    constructor(elems, array = true, parseNum = true) {
        this.array = array
        this.parseNum = parseNum
        this.addElement(this.elems = elems, true)
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
        this.dispatchEvent({ type: "changed", old, value })
    }

    get value() {
        return this.rawValue
    }

    setInternalValue(value, ignore = -1) {
        this.rawValue = value
        
        if(this.array && value !== undefined) {
            value = [...value]
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
            this.elems.val(value===undefined?"":value)
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

    addElement(elem, runIgnore) {
        if(this.array) {
            elem.on('input', e => {
                let arr = this.rawValue.splice(0)
                let idx = e.target.getAttribute('axis')
                arr[idx] = this.parseNum ? parseFloat(e.target.value) : e.target.value
                this.setValue(arr, runIgnore?idx:undefined)
            })
        } else {
            elem.on('input', e => this.setValue(this.parseNum ? parseFloat(e.target.value) : e.target.value, runIgnore?0:undefined))
        }

        //Ensure when the boxes are deselected, the text inside them should be updated and formatted
        elem.focusout(() => this.setValue(this.value))
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

let activeSet = new Set()
//This is to make sure when the main window is unloaded (closed/refreshed), all the open windows are also closed
window.onbeforeunload = () => activeSet.forEach(e => e.win?.close())
export class LayoutPart {
    constructor(rootDom, modelingStudio) {
        this.rootDom = rootDom
        this.parentNode = rootDom.parent()
        this.modelingStudio = modelingStudio
        this.win = null
        this.value = false
        rootDom.find('.popout-button').click(() => this.value = !this.value)
    }

    get value() {
        return this.poppedOut
    }

    set value(popped) {
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
                    if(this.value) {
                        this.value = false
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
        this.dispatchEvent({ type: "changed", value: popped })
    }

    onchange(listener) {
        this.addEventListener('changed', listener)
        return this
    }
}
Object.assign( LayoutPart.prototype, EventDispatcher.prototype );


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
                this.element = cube.planesGroup
                break
        }
        this.worldMatrix = this.element.matrixWorld.clone()
    }

    reconstruct() {
        console.log("reconstuct")
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
    let arr = keyListeners.has(key) ? keyListeners.get(arr) : []
    arr.push(onchange)
    keyListeners.set(key, arr)
}