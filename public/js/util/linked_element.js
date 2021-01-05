import { EventDispatcher } from "../libs/three.js"

function parseOrThrow(value) {
    let num = parseFloat(value)
    if(isNaN(num)) {
        return 0
    }
    return num
}

export class LinkedElement {

    constructor(elems, array = true, parseNum = true, checkbox = false) {
        this.array = array
        this.parseValue = parseNum ? e => parseOrThrow(e) : e => e 
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

    setInternalValue(value, ignore = -1) {
        if(this.array && value !== undefined) {
            value = [...value]
        }
        
        this.rawValue = value

        this.elems.prop('disabled', value === undefined)
        if(this.sliderElems !== undefined) {
            this.sliderElems.prop('disabled', value === undefined)
        }
        
        if(this.array && value !== undefined) {
            if(typeof value[0] == 'number') {
                value = value.map(v => this.makeKashHappy(v.toFixed(2)))
            }
        } else if(typeof value == 'number') {
            value = this.makeKashHappy(value.toFixed(2))
        }

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