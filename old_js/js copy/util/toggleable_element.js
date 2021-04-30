import { EventDispatcher } from "../libs/three.js"

/**
 * Used to handle elements that can clicked and unclicked on.
 */
export class ToggleableElement {
    constructor(elements, clazz = "is-activated") {
        this.elements = elements
        this.clazz = clazz
        this.predicate = () => true

        //When the element is clicked, toggle it
        this.elements.click(e => { 
            this.value = !this.value
            e.stopPropagation()
        })
    }

    set value(value) {
        if(this.setInternalValue(value)) {
            this.dispatchEvent({ type: "changed", value })
        }
    }

    get value() {
        return this.elements.hasClass(this.clazz)
    }

    /**
     * Sets the internal value
     * @param {boolean} value the new vlaue
     */
    setInternalValue(value) {
        if(this.predicate(value)) {
            //Update the elements
            this.elements.toggleClass(this.clazz, value)
            return true
        }
        return false
    }

    /**
     * Adds a predicate for when selecting a new element
     * @param {function} predicate the predicate to add
     */
    addPredicate(predicate) {
        let old = this.predicate
        this.predicate = e => old(e) && predicate(e)
        return this
    }

    /**
     * Adds a callback for when the element changes
     * @param {function} listener the callback 
     */
    onchange(listener) {
        this.addEventListener('changed', listener)
        return this
    }
}
Object.assign( ToggleableElement.prototype, EventDispatcher.prototype );