import { DraggableElementList } from "../util/draggable_element_list.js"
import { doubleClickToEdit } from "../util/element_functions.js"
import { LinkedElement } from "../util/linked_element.js"
import { LinkedSelectableList } from "../util/linked_selectable_list.js"

const modal = "texture/texture_groups"
let groupTemplate, entryTemplate, entryGroupContainer, activeLayerContainer, unactiveLayerContainer
let activeGroupManager
//Get the texture group modal
getModal(modal).then(html => {
    let dom = $(html)
    groupTemplate = dom.find('.texture-group-template')
    entryTemplate = dom.find('.texture-entry-template')
    entryGroupContainer = dom.find('.texture-group-container')
    activeLayerContainer = dom.find('.texture-layer-container-active')
    unactiveLayerContainer = dom.find('.texture-layer-container-unactive')

    dom.find('.add-group').click(() => activeGroupManager.createNewGroup())
})

/**
 * Used to handle texture groups
 */
export class TextureGroupManager {
    constructor(pth, manager) {
        this.manager = manager
        this.groups = []

        this.draggedTexture = null
        this.textureLayerOptions = $('.texture-group-layers')

        //The editing list in the modal tab
        this.editGroupSelection = new LinkedSelectableList($()).onchange(() => this.refreshAllLayers(false))
        //The group selection list in the modal tab
        this.groupSelection = new LinkedSelectableList($()).onchange(e => {
            textureLayerLabel.text("Group: " + this.groups[e.value].name)
            manager.refresh(this.groupSelection._refreshManager)
        })

        let textureLayerLabel = $('.texture-group-label')
        this.editGroupDrag = new DraggableElementList(false, (a, b, c) => this.textureDragged(true, a, b, c))
        
        //Add a drop zone in the active area
        this.editGroupDrag.addDropZone(activeLayerContainer, id => {
            let data = this.groups[this.editGroupSelection.value]
            if(data.layerIDs.includes(id)) {
                data.layerIDs.push(...data.layerIDs.splice(data.layerIDs.indexOf(id), 1))
            } else {
                data.layerIDs.push(id)
            }
            this.refreshAllLayers()
        }, () => this.editGroupSelection.value != 0)
        //Add a drop zone in the unactive area
        this.editGroupDrag.addDropZone(unactiveLayerContainer, id => {
            let data = this.groups[this.editGroupSelection.value]
            if(data.layerIDs.includes(id)) {
                data.layerIDs.splice(data.layerIDs.indexOf(id), 1)
            }
            this.refreshAllLayers()
        }, () => this.editGroupSelection.value != 0)
    }

    /**
     * Callback for when a texture element is dragged
     * @param {*} useEditGroup Whether the edit group should be used to get the id
     * @param {*} drop the drop type. Either "top" or "bottom"
     * @param {*} movedData the datatype moved (texturename)
     * @param {*} droppedOnData the dropped on datatype (texturename)
     */
    textureDragged(useEditGroup, drop, movedData, droppedOnData) {
        //Get the selected id
        let selctedID = (useEditGroup ? this.editGroupSelection : this.groupSelection).value
        let data = this.groups[selctedID]
        //Get the index dropped at
        let droppedIndex = data.layerIDs.indexOf(droppedOnData) + (drop == 'bottom' ? 1 : 0)
        //If the layer is included already, remove it and place it back in,
        //otherwise just place it in
        if(data.layerIDs.includes(movedData)) {
            data.layerIDs.splice(droppedIndex, 0, ...data.layerIDs.splice(data.layerIDs.indexOf(movedData), 1))
        } else {
            data.layerIDs.splice(droppedIndex, 0, movedData)
        }
        //If is the first group, then we should modify the texture layers in the manager.
        //The first group is the default group, and directly reflects the texture manager.
        if(selctedID == 0) {
            let oldList = [...this.manager.textures]
            for (let i = 0; i < this.manager.textures.length; i++) {
                this.manager.textures[i] = oldList[data.layerIDs[i]]
                data.layerIDs[i] = i
            }
        }
        this.refreshAllLayers()
    }

    /**
     * Creates the default group if needed
     */
    initiateDefaultEntry() {
        if(this.groups.length === 0) {
            this.createNewGroup("Default")
            this.groups[0].isDefaultGroup = true
        }
    }

    /**
     * Updates the texture layer IDs. This is to ensure that `layerIDs` has a consistent reference to the correct texture.
     * idMap is an array of where each id went to. For example:
     * [0, 1, 2, 3, 5, 4] 
     * Means that layers ids 0 - 3 stayed the same, but the layer at index 4 now changed swapped with the layer at index 5
     * 
     * @param {number[]} idMap the id map. See above for explanation
     */
    updateIds(idMap) {
        this.groups.forEach(group => 
            group.layerIDs = group.layerIDs.map(v => idMap.indexOf(v)).filter(id => id !== -1)
        )
    }

    /**
     * Updates the dom elements
     */
    updateTextureLayerOption() {
        this.textureLayerOptions.children().detach()
        this.groups.forEach(g => this.textureLayerOptions.each((i, e) => e.appendChild(g.optionsDom.get(i))))
    }

    /**
     * Creates a new group with the name
     * @param {string?} name optional 
     */
    createNewGroup(name) {
        //Clone and create the dom
        let dom = groupTemplate.clone()
        dom.removeClass('texture-group-template')
        dom.attr('select-list-entry', this.groups.length)

        let rawOptionsDom = 
        $(document.createElement("a"))
        .addClass("dropdown-item option-select")
        .attr('select-list-entry', this.groups.length)
        let optionsDom = $()
        for(let i = 0; i < this.textureLayerOptions.length; i++) {
            optionsDom = optionsDom.add(rawOptionsDom.clone())
        }

        //The add the dom to the group selection
        this.groupSelection.addElement(optionsDom)
        this.editGroupSelection.addElement(dom)
        let data
        this.groups.push(data = {
            name: name || "New Texture Group",
            layerIDs: [],
            elementDomCache: [],

            dom,
            optionsDom
        })

        optionsDom.text(data.name)

        doubleClickToEdit(dom.find('.dbl-click-container'), name => {
            data.name = name
            optionsDom.text(name)
        }, data.name)

        this.refreshTextureGroups()
        this.updateTextureLayerOption()
        if(this.groups.length === 1) {
            this.groupSelection._refreshManager = false
            this.groupSelection.value = '0'
            this.groupSelection._refreshManager = undefined
        }
        this.editGroupSelection.setValue(this.groups.length-1)
        return data
    }

    /**
     * Opens the group modal
     */
    openGroupModal() {
        activeGroupManager = this
        openModal(modal)
        this.refreshTextureGroups()
        this.editGroupSelection.value = '0'
    }

    /**
     * Refresh the texture group doms
     */
    refreshTextureGroups() {
        entryGroupContainer.children().detach()
        this.groups.forEach(g => entryGroupContainer.append(g.dom))
    }

    /**
     * Refreshes all the layers
     * @param {boolean} refreshCanvas if the canvas should be refreshed. False to prevent recursion
     */
    refreshAllLayers(refreshCanvas = true) {
        activeLayerContainer.children().detach()
        unactiveLayerContainer.children().detach()
        let selctedID = this.editGroupSelection.value
        this.manager.textures.forEach(t => {
            if(t._groupDom === undefined) {
                this.createTextureDom(t)  
            }
            t._nameDom.text(t.name)
        })

        let textureIDs = selctedID == 0 ? this.manager.textures.map(t => t.idx) : this.groups[selctedID].layerIDs

        textureIDs.forEach(tID => {
            let t = this.manager.textures[tID]
            activeLayerContainer.append(t._groupDom)
            t._checkbox.value = true
            t._canDragOn(true)
        })
        this.manager.textures.filter(t => !textureIDs.includes(t.idx)).forEach(t => {
            unactiveLayerContainer.append(t._groupDom)
            t._checkbox.value = false
            t._canDragOn(false)
        })
        if(refreshCanvas === true) {
            this.manager.refresh()
        }
    }

    /**
     * Creates the texture dom elements and add it to the texture
     * @param {*} t the texture
     */
    createTextureDom(t) {
        t._groupDom = entryTemplate.clone()
        t._groupDom.removeClass('texture-entry-template')
        t._nameDom = t._groupDom.find('.entry-texture-name')
        t._checkbox = new LinkedElement(t._groupDom.find('.entry-is-selectable'), false, false, true).onchange(e => {
            let selId = this.editGroupSelection.value
            if(selId == 0) {
                if(!e.value) {
                    t._checkbox.setInternalValue(true)
                }
                return
            }
            let group = this.groups[selId]
            if(e.value) {
                if(!group.layerIDs.includes(t.idx)) {
                    group.layerIDs.unshift(t.idx)
                    this.refreshAllLayers()
                }
            } else if(group.layerIDs.includes(t.idx)) {
                group.layerIDs.splice(group.layerIDs.indexOf(t.idx), 1)
                this.refreshAllLayers()
            }
        })
        t._canDragOn = this.editGroupDrag.addElement(t._groupDom, () => t.idx)
    }
}