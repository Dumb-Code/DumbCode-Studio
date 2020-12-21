import { DCMModel } from "./formats/model/dcm_loader.js"
import { DcProject } from "./formats/project/dc_project.js"
import { EventDispatcher } from "./three.js"

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
        if(index < 0 || index >= this.allTabs.length) {
            console.warn("Invalid Index ID, " + index)
            return
        }
        if(index !== this.currentIndex) {
            if(this.currentIndex !== -1) {
                this.display.scene.remove(this.allTabs[this.currentIndex].model.modelCache)
            } else {
                this.dispatchEvent( { type: "initiateselection" } )

            }
            this.display.scene.add(this.allTabs[index].model.modelCache)
        }
        this.currentIndex = index
        this.dispatchEvent( { type: "selectchange", from: this.currentIndex, to: index } )
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
        this.allTabs.splice(idx, 1)

        this.allTabs.forEach((p, i) => p.id = i)

        if(this.currentIndex > idx) {
            this.selectIndex(this.currentIndex-1)
        } else if(this.currentIndex == idx) {
            if(idx == this.allTabs.length) {
                if(idx == 0) {
                    this.currentIndex = -1
                } else {
                    this.selectIndex(idx-1)
                }
            } else {
                this.selectIndex(idx+1)
            }
        }
    }
}

Object.assign( ProjectTabHandler.prototype, EventDispatcher.prototype )