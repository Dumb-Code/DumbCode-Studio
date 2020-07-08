import { AnimationHandler } from "../animations.js"

export class AnimationTabHandler {
    constructor(dom, studio) {
        this.manager = studio.keyframeManager
        this._internalTab = -1
        this.allTabs = []
        
        let tabContainer = dom.find('.tab-container')
        dom.find('.tab-add').click(() => {
            let id = this.allTabs.length

            let element = document.createElement('span')
            element.classList.add('editor-tab')
            element.innerText = "Tab " + this.allTabs.length
            tabContainer.append(element)
            element.onclick = () => this.activeTab = id

            this.allTabs.push({
                handler: new AnimationHandler(studio.display.tbl),
                element
            })

            this.activeTab = id

        })
    }

    set activeTab(activeTab) {
        let oldValue = this._internalTab
        let newValue = activeTab
        this._internalTab = activeTab

        let oldElement = this.getIndex(oldValue)
        if(oldElement !== null) {
            oldElement.element.classList.remove('tab-selected')
        }

        let newElement = this.getIndex(newValue)
        if(newElement !== null) {
            newElement.element.classList.add('tab-selected')
            this.manager.playstate = newElement.handler.playstate
            this.manager.reframeKeyframes()

        }

    }

    get active() {
        return this.getIndex(this._internalTab)?.handler || null
    }

    getIndex(index) {
        if(index < 0 || index >= this.allTabs.length) {
            return null
        }
        let tab = this.allTabs[index]
        return tab === undefined ? null : tab
    }
}