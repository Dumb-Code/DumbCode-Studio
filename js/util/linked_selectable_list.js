import { EventDispatcher } from "../libs/three.js"

/**
 * Used to handle a list of selectable elements. Any element in this can be clicked on and selected.
 */
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

    /**
     * @param {*} elements the element to add
     */
    addElement(elements) {
        let getValue = () => this.value
        let setValue = v => this.value = v
        let mustSelectOne = this.mustSelectOne

        //When the element is clicked, select it
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

    /**
     * @param {*} elements the elemen to rmove
     */
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
            //Update the selection for all the elements
            let elements = this.elements.filter(`[select-list-entry='${value}']`).addClass(this.className)
            if(silent !== true) {
                this.dispatchEvent({ type: "changed", old, value, elements })
            }
        }
    }

    /**
     * Binds a listener for when the value changes
     * @param {function} listener the callback listener
     */
    onchange(listener) {
        this.addEventListener('changed', listener)
        return this
    }

    /**
     * Binds a predicate for selection values
     * @param {function} predicate the predicate
     */
    addPredicate(predicate) {
        let old = this.predicate
        this.predicate = e => old(e) && predicate(e)
        return this
    }
}
Object.assign( LinkedSelectableList.prototype, EventDispatcher.prototype )