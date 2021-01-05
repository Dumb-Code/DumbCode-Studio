import { EventDispatcher } from "../libs/three.js"

export class LinkedSelectableList {
    constructor(elements, mustSelectOne = true, className = 'is-activated') {
        this.elements = $()
        this.mustSelectOne = mustSelectOne
        this.className = className
        this.predicate = () => true
        if(elements !== null) {
            this.addElement(elements)        
            if(this.mustSelectOne) {
                this.elements.first().each((_i, elem) => this.value = elem.getAttribute('select-list-entry'))
            }
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

    removeElement(elements) {
        this.elements = this.elements.not(elements)
    }

    set value(value) {
        this.setValue(value)
    }

    get value() {
        return this.rawValue
    }

    setValue(value, silent = false) {
        if(this.predicate(value)) {
            let old = this.rawValue
            this.rawValue = value
            this.elements.removeClass(this.className)
            let elements = this.elements.filter(`[select-list-entry='${value}']`).addClass(this.className)
            if(silent !== true) {
                this.dispatchEvent({ type: "changed", old, value, elements })
            }
        }
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
Object.assign( LinkedSelectableList.prototype, EventDispatcher.prototype )