import { AnimationHandler } from "../animations.js"
import { MementoTraverser } from "../memento_traverser.js"
import { AnimationMemento } from "./animation_memento.js"

export class AnimationTabHandler {
    constructor(dom, studio, filesPage) {
        this.studio = studio
        this.tbl = studio.display.tbl
        this.filesPage = filesPage
        this._internalTab = -1
        this.allTabs = []
    
        this.onchange = newElement => {
            let manager = studio.keyframeManager
            manager.playstate = newElement.handler.playstate
            manager.reframeKeyframes()

            let values = studio.cubeDisplayValues
            values.updateKeyframeSelected()
            values.updateSelected()

            studio.panelButtons.onTabChange()
        }
        
        this.tabContainer = dom.find('.tab-container')
        dom.find('.tab-add').click(() => this.initiateNewTab())
    }

    initiateNewTab() {
        this.filesPage.createNewAnimationTab()
    }

    createNewTab() {
        let id = this.allTabs.length

        let element = document.createElement('span')
        element.classList.add('editor-tab')
        element.classList.add('heading')
        element.style.float = "left";
        element.innerText = "Tab " + id
        this.tabContainer.append(element)
        element.onclick = () => this.activeTab = id

        let data = {
            handler: new AnimationHandler(this.tbl),
            element,
            name: "Tab " + id
        }
        data.mementoTraverser = new MementoTraverser(() => new AnimationMemento(this.studio, data))
        this.allTabs.push(data)

        this.activeTab = id
        return data
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
            this.onchange(newElement)
        }
    }

    get active() {
        return this.activeData?.handler
    }

    get activeData() {
        if(this._internalTab === -1) {
            this.initiateNewTab()
        }
        return this.getIndex(this._internalTab) || null
    }

    isAny() {
        return this._internalTab !== -1
    }

    getIndex(index) {
        if(index < 0 || index >= this.allTabs.length) {
            return null
        }
        let tab = this.allTabs[index]
        return tab === undefined ? null : tab
    }
}