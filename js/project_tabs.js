import { LinkedSelectableList } from "./util/linked_selectable_list.js"

/**
 * Used to handle which studio part is selected.
 */
export class ProjectTabs {
    constructor() {
        this.files = "file"
        this.modeling = "modeling"
        this.texture = "texture"
        this.animation = "animation"
        this.tabs = [this.files, this.modeling, this.texture, this.animation]

        this.selectableList = new LinkedSelectableList($('.tab-controller'), true, "navbar-is-active")
    }

    /**
     * Get the active area.
     */
    getActive(files, modeling, texture, animation) {
        let active = this.selectableList.value
        if(active == this.modeling) {
            return modeling
        }
        if(active == this.texture) {
            return texture
        }
        if(active == this.animation) {
            return animation
        }
        return files
    }
}