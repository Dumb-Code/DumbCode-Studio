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
}

Object.assign( ProjectTabHandler.prototype, EventDispatcher.prototype )