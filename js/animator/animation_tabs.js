import { AnimationHandler } from "../animations.js"
import { KeyframeManger } from "../keyframe_manager.js"

export class AnimationTabHandler {
    constructor(dom, studio) {
        this._internalTab = -1
        this.allTabs = []

        this.keyframeBoardConatiner = dom.find('.keyframe-board-container')

        let tabContainer = dom.find('.tab-container')
        dom.find('.tab-add').click(() => {
            let id = this.allTabs.length

            let element = document.createElement('span')
            element.classList.add('editor-tab')
            element.innerText = "Tab " + this.allTabs.length
            tabContainer.append(element)
            element.onclick = () => this.activeTab = id

            this.allTabs.push({
                tab: new AnimationTab(studio.display),
                element
            })

            this.activeTab = id

        })
    }

    set activeTab(activeTab) {
        let oldValue = this._internalTab
        let newValue = activeTab

        let oldElement = this.getIndex(oldValue)
        if(oldElement !== null) {
            oldElement.element.classList.remove('tab-selected')
        }
        this.keyframeBoardConatiner.empty()

        let newElement = this.getIndex(newValue)
        if(newElement !== null) {
            newElement.element.classList.add('tab-selected')
            this.keyframeBoardConatiner.append(newElement.tab.element)
        }



        this._internalTab = activeTab
        
    }

    get active() {
        return this.getIndex(this._internalTab)?.tab || null
    }

    getIndex(index) {
        if(index < 0 || index >= this.allTabs.length) {
            return null
        }
        let tab = this.allTabs[index]
        return tab === undefined ? null : tab
    }
}

export class AnimationTab {
    constructor(display) {
        this.element = document.createElement('div')
        this.element.classList.add('keyframe-board')

        this.animationHandler = new AnimationHandler(display.tbl)
        this.manager = new KeyframeManger(this.animationHandler, this.element)
        this.animationHandler.playstate = this.manager.playstate        

    }
}