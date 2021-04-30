import { AnimationHandler, PlayState } from "../animations.js"
import { DCMModel } from "../formats/model/dcm_model.js"
import { MementoTraverser } from "../memento_traverser.js"
import { FilesPage } from "../project/files_page.js"
import { AnimationMemento } from "./animation_memento.js"
import { AnimationStudio } from "./animation_studio.js"

/**
 * Stores and manages the information about the animation tabs.
 * Note different projects (models) have different aniamtion tabs.
 * 
 * Note an instance of this is held per project.
 */
export class AnimationTabHandler {
    /**
     * 
     * @param {AnimationStudio} studio the animation studio 
     * @param {FilesPage} filesPage the files page for the studio  
     * @param {DCMModel} model the model. 
     */
    constructor(studio, filesPage, model) {
        this.studio = studio
        this.model = model
        this.filesPage = filesPage
        this.tabContainer = studio._tabContainer
        this._internalTab = -1
        this.allTabs = []
    
        //Function for whenever the animation tab changes.
        this.onchange = newElement => {
            let manager = studio.keyframeManager
            manager.playstate = newElement == undefined ? new PlayState() : newElement.handler.playstate
            manager.reframeKeyframes()

            let values = studio.cubeDisplayValues
            values.updateKeyframeSelected()
            values.updateSelected()
            values.updateLoopedElements()
        }
    }

    /**
     * Create a new tab. Delegates to the files page
     */
    initiateNewTab() {
        this.filesPage.createNewAnimationTab()
    }

    /**
     * Creates a new tab. This should only be called from the files page. 
     */
    createNewTab() {
        let id = this.allTabs.length

        //Create the html elements. Note, this should probally be moved to a template
        //It's ugly lol
        let element = document.createElement('span')
        element.classList.add('editor-tab')
        element.classList.add('heading')
        element.style.float = "left";

        let textElement = document.createElement('span')
        textElement.innerText = "New Animation"

        let closeElement = document.createElement('span')
        closeElement.classList.add("icon", "is-small", "icon-close-button")
        closeElement.style.paddingLeft = "15px"
        closeElement.style.paddingTop = "1px"
        closeElement.style.float = "right"
        let i = document.createElement('i')
        i.classList.add("fas", "fa-times")

        closeElement.appendChild(i)
        element.appendChild(textElement)    
        element.appendChild(closeElement)

        this.tabContainer.append(element)
        
        //Hooks into when the tab is clicked and when the close element is clicked.
        element.onclick = () => this.activeTab = id
        closeElement.onclick = e => {
            data.toggleOpened() 
            e.stopPropagation()
        }

        //The data for the an animation tab.
        let data = {
            handler: new AnimationHandler(this.model),
            element,
            textElement,
            name: "New Animation",
            opened: true,
            mementoTraverser: new MementoTraverser(() => new AnimationMemento(this.studio, data)),
            //Toggle open toggles whether the animation is open or not. Open animations appear on the animation tab.
            //All animations appear on the project page.
            toggleOpened: (silent = false) => {
                if(data.opened) { //Removing. Needs to search for another tab to open
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
        this.allTabs.push(data)

        this.activeTab = id
        return data
    }

    /**
     * Deletes the animation data. Removes it entierly.
     * @param {*} data the animation data to delete
     */
    deleteAnimation(data) {
        if(data.opened) {
            data.toggleOpened(true)
        }
        this.allTabs.splice(this.allTabs.indexOf(data), 1)
        this.refreshTabs()
        this.onchange()
    }

    /**
     * Select a tab. Updates _internalTab
     */
    set activeTab(activeTab) {
        let oldValue = this._internalTab
        let newValue = activeTab
        this._internalTab = activeTab

        let oldElement = this.getTab(oldValue)
        if(oldElement !== null) {
            oldElement.element.classList.remove('tab-selected')
        }

        let newElement = this.getTab(newValue)
        if(newElement !== null) {
            newElement.element.classList.add('tab-selected')
            this.onchange(newElement)
        }
    }

    /**
     * Get the active tab animation handler. (not data)
     */
    get active() {
        let data = this.activeData
        if(data) {
            return data.handler
        }
        return null
    }

    /**
     * Gets the active tab data. 
     */
    get activeData() {
        if(this._internalTab === -1) {
            // this.initiateNewTab()
            return null
        }
        return this.getTab(this._internalTab) || null
    }

    /**
     * Is any animation tab selected
     */
    isAny() {
        return this._internalTab !== -1
    }

    /**
     * Get the tab at aan index, or null if there was none
     * @param {number} index the index to look at
     */
    getTab(index) {
        if(index < 0 || index >= this.allTabs.length) {
            return null
        }
        let tab = this.allTabs[index]
        return tab === undefined ? null : tab
    }
    
    /**
     * Removes all the tab doms.
     */
    removeAll() {
        this.tabContainer.children().detach()
    }

    /**
     * Refresh the tab dom data.
     */
    refreshTabs() {
        this.removeAll()
        this.allTabs.filter(tab => tab.opened).forEach(tab => this.tabContainer.append(tab.element))
    }
}