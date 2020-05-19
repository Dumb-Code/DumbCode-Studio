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
        this.addElement(this.elems = elems)
        this.sliderElems = undefined
        if(this.array) {
            this.rawValue = [0, 0, 0]
        } else {
            this.rawValue = 0
        }
    }

    set value(value) {
        if(this.array) {
            value = [...value]
        }
        let old = this.rawValue
        this.rawValue = value
        this.visualValue = value
        this.dispatchEvent({ type: "changed", old, value })
    }
    get value() {
        return this.rawValue
    }

    set visualValue(value) {
        if(this.array) {
            this.elems.each((_i,e) => e.value = value[e.getAttribute('axis')])
            if(this.sliderElems !== undefined) {
                this.sliderElems.each((_i,e) => e.value = ((value[e.getAttribute("axis")] + 180) % 360) - 180)
            }
        } else {
            this.elems.val(value)
        }
    }

    onchange(listener) {
        this.addEventListener('changed', listener)
        return this
    }

    withsliders(sliderElems) {
        this.addElement(this.sliderElems = sliderElems)
        return this
    }

    addElement(elem) {
        if(this.array) {
            elem.on('input', e => {
                let arr = this.value.splice(0)
                arr[e.target.getAttribute('axis')] = this.parseNum ? parseInt(e.target.value) : e.target.value
                this.value = arr
            })
        } else {
            elem.on('input', e => this.value = this.parseNum ? parseInt(e.target.value) : e.target.value)
        }
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
    constructor(cube) {
        this.cube = cube
        this.worldMatrix = cube.cubeGroup.matrixWorld.clone()
    }

    reconstruct() {
        //      parent_world_matrix * local_matrix = world_matrix
        //  =>  local_matrix = 'parent_world_matrix * world_matrix
        resultMat.getInverse(this.cube.parent.getGroup().matrixWorld).multiply(this.worldMatrix)
        resultMat.decompose(decomposePos, decomposeRot, decomposeScale)

        this.cube.updatePosition(decomposePos.toArray())
        decomposeEuler.setFromQuaternion(decomposeRot, "ZYX")
        this.cube.updateRotation(decomposeEuler.toArray().map(e => e * 180 / Math.PI))
    }
}



let pressedKeys = new Map();
$(document).keyup(e => pressedKeys.delete(e.key)).keydown(e => pressedKeys.set(e.key, true))
export function isKeyDown(key) {
    return pressedKeys.has(key)
} 