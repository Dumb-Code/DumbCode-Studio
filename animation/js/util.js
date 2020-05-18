import { EventDispatcher } from "./three.js";

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
        let old = this.rawValue
        this.rawValue = value
        this.elements.removeClass('is-activated')
        this.elements.filter(`[select-list-entry='${value}']`).addClass('is-activated')
        this.dispatchEvent({ type: "changed", old, value })
    }

    get value() {
        return this.rawValue
    }

    onchange(listener) {
        this.addEventListener('changed', listener)
        return this
    }
}
Object.assign( LinkedSelectableList.prototype, EventDispatcher.prototype );


export class ToggleableElement {
    constructor(elements, textActive = undefined, textUnactive = undefined) {
        this.elements = elements
        let setValue = v => this.value = v
        this.elements.click(function() { setValue(!this.classList.contains("is-activated")) })
    }

    set value(value) {
        this.elements.toggleClass("is-activated", value)
        this.dispatchEvent({ type: "changed", value })
    }

    get value() {
        return this.elements.is('.is-activated')
    }

    onchange(listener) {
        this.addEventListener('changed', listener)
        return this
    }
}
Object.assign( ToggleableElement.prototype, EventDispatcher.prototype );
