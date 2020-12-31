import { doubleClickToEdit, downloadCanvas, DraggableElementList, LinkedElement, LinkedSelectableList } from "../util.js"

const modal = "texture/texture_groups"
let groupTemplate, entryTemplate, entryGroupContainer, activeLayerContainer, unactiveLayerContainer
let activeGroupManager
getModal(modal).then(html => {
    let dom = $(html)
    groupTemplate = dom.find('.texture-group-template')
    entryTemplate = dom.find('.texture-entry-template')
    entryGroupContainer = dom.find('.texture-group-container')
    activeLayerContainer = dom.find('.texture-layer-container-active')
    unactiveLayerContainer = dom.find('.texture-layer-container-unactive')

    dom.find('.add-group').click(() => activeGroupManager.createNewGroup())
})
export class TextureGroupManager {
    constructor(pth, manager) {
        this.manager = manager
        this.groups = []

        this.draggedTexture = null
        this.textureLayerOptions = $('.texture-group-layers')

        this.editGroupSelection = new LinkedSelectableList($()).onchange(() => this.refreshAllLayers())
        this.groupSelection = new LinkedSelectableList($(), true).onchange(e => manager.refresh())

        this.editGroupDrag = new DraggableElementList(false, (drop, movedData, droppedOnData) => {
            let selctedID = this.editGroupSelection.value
            if(selctedID !== undefined) {
                let data = this.groups[selctedID]
                let droppedIndex = data.layerIDs.indexOf(droppedOnData) + (drop == 'bottom' ? 1 : 0)
                if(data.layerIDs.includes(movedData)) {
                    data.layerIDs.splice(droppedIndex, 0, ...data.layerIDs.splice(data.layerIDs.indexOf(movedData), 1))
                } else {
                    data.layerIDs.splice(droppedIndex, 0, movedData)
                }
                this.refreshAllLayers()
            }
        })
        
        this.editGroupDrag.addDropZone(activeLayerContainer, id => {
            let selctedID = this.editGroupSelection.value
            if(selctedID !== undefined) {
                let data = this.groups[selctedID]
                if(data.layerIDs.includes(id)) {
                    data.layerIDs.push(...data.layerIDs.splice(data.layerIDs.indexOf(id), 1))
                } else {
                    data.layerIDs.push(id)
                }
                this.refreshAllLayers()
            }
        })
        this.editGroupDrag.addDropZone(unactiveLayerContainer, id => {
            let selctedID = this.editGroupSelection.value
            if(selctedID !== undefined) {
                let data = this.groups[selctedID]
                if(data.layerIDs.includes(id)) {
                    data.layerIDs.splice(data.layerIDs.indexOf(id), 1)
                }
                this.refreshAllLayers()
            }
        })
    }

    initiateDefaultEntry() {
        this.createNewGroup("Default")
        this.groups[0].isDefaultGroup = true
    }

    updateIds(idMap) {
        this.groups.forEach(group => 
            group.layerIDs = group.layerIDs.map(v => idMap.indexOf(v)).filter(id => id !== -1)
        )
    }

    updateTextureLayerOption() {
        this.textureLayerOptions.children().detach()
        this.groups.forEach(g => this.textureLayerOptions.each((i, e) => e.appendChild(g.optionsDom.get(i))))
    }

    createNewGroup(name) {
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
        this.editGroupSelection.setValue(this.groups.length-1)
    }

    openGroupModal() {
        activeGroupManager = this
        openModal(modal)
        this.refreshTextureGroups()
        this.editGroupSelection.value = undefined
    }

    refreshTextureGroups() {
        entryGroupContainer.children().detach()
        this.groups.forEach(g => entryGroupContainer.append(g.dom))
    }

    refreshAllLayers() {
        activeLayerContainer.children().detach()
        unactiveLayerContainer.children().detach()
        let selctedID = this.editGroupSelection.value
        this.manager.textures.forEach(t => {
            if(t._groupDom === undefined) {
                this.createTextureDom(t)  
            }
            t._nameDom.text(t.name)
        })

        let textureIDs = selctedID === undefined ? this.manager.textures.map(t => t.idx) : this.groups[selctedID].layerIDs

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
        this.manager.refresh()
    }

    createTextureDom(t) {
        t._groupDom = entryTemplate.clone()
        t._groupDom.removeClass('texture-entry-template')
        t._nameDom = t._groupDom.find('.entry-texture-name')
        t._checkbox = new LinkedElement(t._groupDom.find('.entry-is-selectable'), false, false, true).onchange(e => {
            let selId = this.editGroupSelection.value
            if(selId === undefined) {
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