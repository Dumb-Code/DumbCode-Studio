import { EventDispatcher } from "../libs/three.js"

/**
 * Parses the value as a number. Returns 0 if the value is invalid
 * @param {string} value the value to parse
 */
function parseOr0(value) {
    let num = parseFloat(value)
    if(isNaN(num)) {
        return 0
    }
    return num
}

/**
 * Linked elements are elements linked to the ui.
 */
export class LinkedElement {

    constructor(elems, array = true, parseNum = true, checkbox = false) {
        this.array = array
        this.parseValue = parseNum ? e => parseOr0(e) : e => e 
        this.checkbox = checkbox
        this.addElement(this.elems = elems)
        this.sliderElems = undefined
        this.indexSelected = -1
        if(this.array) {
            this.rawValue = [0, 0, 0]
        } else {
            this.rawValue = 0
        }
        this.idf = Math.random()
    }

    /**
     * Marks this as not having negative numbers
     */
    absNumber() {
        this.parseValue = e => Math.max(e, 0)
        return this
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

    /**
     * Sets a value internally. Updates the value varible and the dom elements
     * @param {number} value the value to set as
     * @param {number} ignore the index to ignore
     */
    setInternalValue(value, ignore = -1) {
        //If is an array, clone it.
        if(this.array && value !== undefined) {
            value = [...value]
        }
        
        this.rawValue = value

        this.elems.prop('disabled', value === undefined)
        if(this.sliderElems !== undefined) {
            this.sliderElems.prop('disabled', value === undefined)
        }
        
        //If is a number, make it so -0.00 isn't a thing
        if(this.array && value !== undefined) {
            if(typeof value[0] == 'number') {
                value = value.map(v => this.makeKashHappy(v.toFixed(2)))
            }
        } else if(typeof value == 'number') {
            value = this.makeKashHappy(value.toFixed(2))
        }

        //If is an array, update each element
        if(this.array) {
            this.elems.each((_,e) => {  
                let axis = e.getAttribute('axis')
                if(ignore != axis) {
                    e.value = value===undefined?"":value[axis]
                }
            })
            if(this.sliderElems !== undefined) {
                this.sliderElems.each((_i,e) => e.value = ((value===undefined?0:this.rawValue[e.getAttribute("axis")] + 180) % 360) - 180)
            }
        } else if(ignore != 0) {
            //Update the single element
            if(this.checkbox) {
                this.elems.prop('checked', value===undefined?false:value)
            } else {
                this.elems.val(value===undefined?"":value)
            }
        }
    }

    /**
     * Make sure there isnt -0.00
     * @param {string} value the number value
     */
    makeKashHappy(value) {
        if(value == '-0.00') {
            return '0.00'
        }
        return value
    }

    /**
     * Binds a change listener
     */
    onchange(listener) {
        this.addEventListener('changed', listener)
        return this
    }

    /**
     * Adds slider elements
     * @param {*} sliderElems the slider elements to add
     */
    withsliders(sliderElems) {
        this.addElement(this.sliderElems = sliderElems, false)
        return this
    }

    /**
     * 
     * @param {*} elem Elements to add
     * @param {*} ensure whehter the element shouldn't be updated when changed. True if is a text box
     */
    addElement(elem, ensure = true) {
        if(this.array) {
            elem.focusin(e => this.indexSelected = parseInt(e.target.getAttribute('axis')))
            elem.on('input', e => {
                if(this.rawValue == undefined) {
                    return
                }
                let arr = this.rawValue.splice(0)
                let idx = parseInt(e.target.getAttribute('axis'))
                try {
                    arr[idx] = this.parseValue(e.target.value)
                    this.setValue(arr, ensure ? idx : -1)
                } catch(e) {
                    console.error(e)
                    //Ignore
                } 
            })
        } else {
            elem.focusin(() => this.indexSelected = 0)
            elem.on('input', e => {
                try {
                    this.setValue(this.checkbox ? e.target.checked : this.parseValue(e.target.value), 0)
                } catch(err) {
                    //Ignored
                }
            })
        }

        //Ensure when the boxes are deselected, the text inside them should be updated and formatted
        elem.focusout(() => {
            this.setInternalValue(this.value)
            this.indexSelected = -1
        })
    }
}
Object.assign( LinkedElement.prototype, EventDispatcher.prototype );