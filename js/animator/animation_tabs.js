import { AnimationHandler, PlayState } from "../animations.js"
import { MementoTraverser } from "../memento_traverser.js"
import { AnimationMemento } from "./animation_memento.js"

export class AnimationTabHandler {
    constructor(studio, filesPage, model) {
        this.studio = studio
        this.model = model
        this.filesPage = filesPage
        this.tabContainer = studio._tabContainer
        this._internalTab = -1
        this.allTabs = []
    
        this.onchange = newElement => {
            let manager = studio.keyframeManager
            manager.playstate = newElement == undefined ? new PlayState() : newElement.handler.playstate
            manager.reframeKeyframes()

            let values = studio.cubeDisplayValues
            values.updateKeyframeSelected()
            values.updateSelected()
        }
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

        let textElement = document.createElement('span')
        textElement.innerText = "New Animation"

        let closeElement = document.createElement('span')
        closeElement.classList.add("icon", "is-small")
        closeElement.style.paddingLeft = "15px"
        closeElement.style.paddingTop = "1px"
        closeElement.style.float = "right"
        let i = document.createElement('i')
        i.classList.add("fas", "fa-times")

        closeElement.appendChild(i)
        element.appendChild(textElement)    
        element.appendChild(closeElement)

        this.tabContainer.append(element)
        element.onclick = () => this.activeTab = id
        closeElement.onclick = e => {
            data.toggleOpened() 
            e.stopPropagation()
        }

        let data = {
            handler: new AnimationHandler(this.model),
            element,
            textElement,
            name: "New Animation",
            opened: true,
            toggleOpened: (silent = false) => {
                if(data.opened) { //Removing
                    let openedArr = this.allTabs.filter(tab => tab.opened)
                    let idx = openedArr.indexOf(data)
                    let right = openedArr[idx+1]
                    let left = openedArr[idx-1]

                    if(right !== undefined) {
                        this.activeTab = idx+1
                    } else if(left !== undefined) {
                        this.activeTab = idx-1
                    } else {
                        this.activeTab = -1
                    }
                } else { //Adding
                    this.activeTab = this.allTabs.indexOf(data)
                }
                this.filesPage.animationProjectPart.toggleTabOpened(data)
                data.opened = !data.opened

                if(silent !== true) {
                    this.refreshTabs()
                    this.onchange()
                }
                
            }
        }
        data.mementoTraverser = new MementoTraverser(() => new AnimationMemento(this.studio, data))
        this.allTabs.push(data)

        this.activeTab = id
        return data
    }

    deleteAnimation(data) {
        if(data.opened) {
            data.toggleOpened(true)
        }
        this.allTabs.splice(this.allTabs.indexOf(data), 1)
        this.refreshTabs()
        this.onchange()
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
        let data = this.activeData
        if(data) {
            return data.handler
        }
        return null
    }

    get activeData() {
        if(this._internalTab === -1) {
            return null
            // this.initiateNewTab()
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

    refreshTabs() {
        this.tabContainer.children().detach()
        this.allTabs.filter(tab => tab.opened).forEach(tab => this.tabContainer.append(tab.element))
    }
}