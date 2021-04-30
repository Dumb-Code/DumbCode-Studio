import { DCMModel } from "./formats/model/dcm_model.js"
import { DcProject } from "./formats/project/dc_project.js"
import { EventDispatcher } from "./libs/three.js"

/**
 * Handles the multiple project tabs
 */
export class ProjectTabHandler {
    constructor(display) {
        this.display = display
        this.currentIndex = -1
        this.allTabs = []
    }

    /**
     * Create the tabs with the files, modeling, texture and animation project parts
     */
    inititateTabs(files, modeling, texture, animation) {
        this._files = files
        this._modeling = modeling
        this._texture = texture
        this._animation = animation
    }

    /**
     * Selects a project index. If -1, marks no project as selected
     * @param {number} index the index to selct
     */
    selectIndex(index) {
        if(index < -1 || index >= this.allTabs.length) {
            console.warn("Invalid Index ID, " + index)
            return
        }
        //If is a change, call `onUnactive` on the previous one, and `onActive` on the new one.
        if(index !== this.currentIndex) {
            let idx = this.currentIndex
            this.currentIndex = index
            if(idx !== -1) {
                this.allTabs[idx].onUnactive(this)
            } else {
                //Sent the first time a tab is created
                this.dispatchEvent( { type: "initiateselection" } )
            }
            if(index !== -1) {
                this.allTabs[index].onActive(this)
            }
            this.dispatchEvent( { type: "selectchange", from: this.currentIndex, to: index } )
        }
    }

    /**
     * Refreshs the selected index
     */
    refresh() {
        this.selectIndex(this.currentIndex)
    }

    /**
     * Gets whether any project is selected
     */
    anySelected() {
        return this.currentIndex !== -1
    }

    /**
     * Get the selected project. If none then create a new project
     */
    getSelected() {
        if(this.currentIndex === -1) {
            this.createNewProject()
        }
        return this.allTabs[this.currentIndex]
    }

    /**
     * Getter for the selected project's model
     */
    get model() {
        return this.getSelected().model
    }

    /**
     * Getter for the selected project's animation tabs
     */
    get animationTabs() {
        return this.getSelected().animationTabHandler
    }

    /**
     * Getter for the selected project's materials
     */
    get materials() {
        return this.getSelected().materials
    }

    /**
     * Getter for the selected project's texture manager
     */
    get textureManager() {
        return this.getSelected().textureManager
    }

    /**
     * Getter for the selected project's model memento traverser
     */
    get modelMementoTraverser() {
        return this.getSelected().modelMementoTraverser
    }

    /**
     * Getter for the selected project's locked cubes
     */
    get lockedCubes() {
        return this.getSelected().lockedCubes
    }

    /**
     * Getter for the selected project's display group
     */
    get displayGroup() {
        return this.getSelected().group
    }

    /**
     * Getter for the selected project's reference images
     */
    get referenceImages() {
        return this.getSelected().referenceImages
    }

    /**
     * Helper method to update all the materials for the selected project.
     * @param {function} callback the material callback
     */
    updateTexture(callback) {
        callback(this.materials.normal)
        callback(this.materials.selected)
        callback(this.materials.highlight)

        this.materials.normal.needsUpdate = true
        this.materials.selected.needsUpdate = true
        this.materials.highlight.needsUpdate = true
    }

    /**
     * Sets the texture to all the materials for the currently selected project.
     */
    setTexture(tex) {
        this.updateTexture(m => {
            m.map = tex
            m._mapCache = tex
        })
    }

    /**
     * Creates a new project.
     * @param {DCMModel} model the model. If none then a new model is created
     */
    createNewProject(model = new DCMModel()) {
        let project = new DcProject(model, this.allTabs.length, this)
        this.allTabs.push(project)
        this.dispatchEvent( { type: "newproject", project } )
        this.selectIndex(project.id)
        return project
    }
    
    /**
     * Deletes a project
     * @param {DcProject} project the project to delete
     */
    deleteProject(project) {
        let idx = this.allTabs.indexOf(project)
        if(idx == -1) {
            console.warn("Tried to delete an invalid project")
            return
        }

        let selctedIndex = this.currentIndex

        //Select a project before or after the current one.
        if(this.currentIndex === idx) {
            if(idx === this.allTabs.length - 1) {
                if(idx == 0) {
                    selctedIndex = -1
                } else {
                    selctedIndex = idx-1
                }
            } else {
                selctedIndex = idx+1
            }
        }

        this.selectIndex(selctedIndex)

        //Remove the current tab, reset currentIndex and set the ids in all the tabs
        this.allTabs.splice(idx, 1)
        this.currentIndex = this.allTabs.findIndex(p => p.id === this.currentIndex)
        this.allTabs.forEach((p, i) => p.id = i)


    }
}

Object.assign( ProjectTabHandler.prototype, EventDispatcher.prototype )