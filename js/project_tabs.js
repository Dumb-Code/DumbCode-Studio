export class ProjectTabs {
    constructor() {
        this.files = "file"
        this.modeling = "modeling"
        this.animation = "animation"
        this.activeTab = this.files
        this.tabs = [this.files, this.modeling, this.animation]
        this.setActive()
    }

    getActive(files, modeling, animation) {
        if(this.activeTab == this.modeling) {
            return modeling
        }
        if(this.activeTab == this.animation) {
            return animation
        }
        return files
    }

    setActive() {
        activeProjectTab = this
    }
}

let activeProjectTab

window.setTab = (element, tab) => {
    Array.from(element.parentElement.children).forEach(elem => elem.classList.toggle("is-active", elem == element))
    activeProjectTab.activeTab = activeProjectTab.tabs[tab]
}