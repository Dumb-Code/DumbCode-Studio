import { DCMModel } from "./formats/model/dcm_loader.js"
import { DcProject } from "./formats/project/dc_project.js"
import { EventDispatcher } from "./libs/three.js"

export class ProjectTabHandler {
    constructor(display) {
        this.display = display
        this.currentIndex = -1
        this.allTabs = []
    }

    inititateTabs(files, modeling, texture, animation) {
        this._files = files
        this._modeling = modeling
        this._texture = texture
        this._animation = animation
    }

    selectIndex(index) {
        if(index < -1 || index >= this.allTabs.length) {
            console.warn("Invalid Index ID, " + index)
            return
        }
        if(index !== this.currentIndex) {
            let idx = this.currentIndex
            this.currentIndex = index
            if(idx !== -1) {
                this.allTabs[idx].onUnactive(this)
            } else {
                this.dispatchEvent( { type: "initiateselection" } )
            }
            if(index !== -1) {
                this.allTabs[index].onActive(this)
            }
            this.dispatchEvent( { type: "selectchange", from: this.currentIndex, to: index } )
        }
    }

    refresh() {
        this.selectIndex(this.currentIndex)
    }

    anySelected() {
        return this.currentIndex !== -1
    }

    getSelected() {
        if(this.currentIndex === -1) {
            this.createNewProject()
        }
        return this.allTabs[this.currentIndex]
    }

    get model() {
        return this.getSelected().model
    }

    get animationTabs() {
        return this.getSelected().animationTabHandler
    }

    get materials() {
        return this.getSelected().materials
    }

    get textureManager() {
        return this.getSelected().textureManager
    }

    get modelMementoTraverser() {
        return this.getSelected().modelMementoTraverser
    }

    get lockedCubes() {
        return this.getSelected().lockedCubes
    }

    get unlockedAnimationCubes() {
        return this.getSelected().unlockedAnimationCubes
    }

    get displayGroup() {
        return this.getSelected().group
    }

    get referenceImages() {
        return this.getSelected().referenceImages
    }

    updateTexture(callback) {
        callback(this.materials.normal)
        callback(this.materials.selected)
        callback(this.materials.highlight)

        this.materials.normal.needsUpdate = true
        this.materials.selected.needsUpdate = true
        this.materials.highlight.needsUpdate = true
    }

    setTexture(tex) {
        this.updateTexture(m => {
            m.map = tex
            m._mapCache = tex
        })
    }

    createNewProject(model = new DCMModel()) {
        let project = new DcProject(model, this.allTabs.length, this)
        this.allTabs.push(project)
        this.dispatchEvent( { type: "newproject", project } )
        this.selectIndex(project.id)
        return project
    }
    
    deleteProject(project) {
        let idx = this.allTabs.indexOf(project)
        if(idx == -1) {
            console.warn("Tried to delete an invalid project")
            return
        }

        let selctedIndex = this.currentIndex

        if(this.currentIndex === idx) {
            if(idx === this.allTabs.length - 1) {
                if(idx == 0) {
                    selctedIndex = -1
                } else {
                    selctedIndex = idx-1
                }
            } else {
                console.log(idx)
                selctedIndex = idx+1
            }
        }

        this.selectIndex(selctedIndex)

        this.allTabs.splice(idx, 1)
        this.currentIndex = this.allTabs.findIndex(p => p.id === this.currentIndex)
        this.allTabs.forEach((p, i) => p.id = i)


    }
}

Object.assign( ProjectTabHandler.prototype, EventDispatcher.prototype )