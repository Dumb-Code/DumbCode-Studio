import { doubleClickToEdit, DraggableElementList } from "../util.js"

const modal = "texture/texture_groups"
let groupTemplate, entryTemplate, entryGroupContainer, textureLayerContainer
let activeGroupManager
getModal(modal).then(html => {
    let dom = $(html)
    groupTemplate = dom.find('.texture-group-template')
    entryTemplate = dom.find('.texture-layer-template')
    entryGroupContainer = dom.find('.texture-group-container')
    textureLayerContainer = dom.find('.texture-layer-container')

    dom.find('.add-group').click(() => activeGroupManager.createNewGroup())
})
export class TextureGroupManager {
    constructor(pth, manager) {
        this.manager = manager
        this.groups = []

        this.draggedTexture = null
    }

    updateIds(idMap) {
        this.groups.forEach(group => 
            group.layerIDs = group.layerIDs.map(v => idMap.indexOf(v)).filter(id => id !== -1)
        )
    }

    createNewGroup() {
        let dom = groupTemplate.clone()
        dom.removeClass('texture-group-template')
        
        let data
        this.groups.push(data = {
            name: "New Texture Group",
            layerIDs: [],
            elementDomCache: [],

            dom,
            entryDom: dom.find('.texture-group-entry-container'),

            dragList: new DraggableElementList(false, (drop, movedData, droppedOnData) => {
                data.layerIDs.splice(droppedOnData + (drop == 'bottom' ? 1 : 0), 0, ...data.layerIDs.splice(movedData, 1))
                this.refreshTextureGroups()
            })
        })
        
        dom.find('.texture-group-toppart')
        .on('dragover', e => {
            if(this.draggedTexture !== null) {
                dom.addClass('is-dragged')
                e.preventDefault()
                e.stopPropagation()
            }
        })
        .on('dragleave', e => {
            dom.removeClass('is-dragged')
        })
        .on('drop', e => {
            if(this.draggedTexture !== null) {
                data.layerIDs.unshift(this.draggedTexture.idx)
                this.refreshTextureGroups()
                e.preventDefault()
                e.stopPropagation()
            }
            dom.removeClass('is-dragged')
        })


        doubleClickToEdit(dom.find('.dbl-click-container'), name => data.name = name, data.name)

        this.refreshTextureGroups()
    }

    openGroupModal() {
        activeGroupManager = this
        openModal(modal)
        this.refreshTextureGroups()
        this.refreshAllLayers()
    }

    refreshTextureGroups() {
        entryGroupContainer.children().detach()
        this.groups.forEach(g => {
            entryGroupContainer.append(g.dom)
            g.entryDom.children().detach()
            g.layerIDs.forEach((id, idx) => {
                if(g.elementDomCache.length === idx) {
                    let cloned = entryTemplate.clone()
                    cloned.removeClass('texture-layer-template')
                    cloned.find('.remove-texture').click(() => {
                        g.layerIDs.splice(idx, 1)
                        this.refreshTextureGroups()
                    })
                    g.elementDomCache.push(cloned)
                }
                let elementDom = g.elementDomCache[idx]
                elementDom.find('.texture-name').text(this.manager.textures[id].name)
                g.dragList.addElement(elementDom.get(0), () => idx)

                g.entryDom.append(elementDom)
            })
        })
    }

    refreshAllLayers() {
        textureLayerContainer.children().remove()
        this.manager.textures.forEach(t => {
            let div = document.createElement('div')
            div.ondragstart = () => this.draggedTexture = t
            div.ondragend = () => this.draggedTexture = null
            div.setAttribute('draggable', true)
            
            div.innerText = t.name
            textureLayerContainer.append(div)
        })
    }
}