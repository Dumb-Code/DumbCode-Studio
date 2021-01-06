import { EventDispatcher } from "../libs/three.js"

export class ToggleableElement {
    constructor(elements, clazz = "is-activated") {
        this.elements = elements
        this.clazz = clazz
        this.predicate = () => true
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

    setInternalValue(value) {
        if(this.predicate(value)) {
            this.elements.toggleClass(this.clazz, value)
            return true
        }
        return false
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