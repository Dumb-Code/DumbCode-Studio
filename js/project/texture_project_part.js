import { readFile } from "../displays.js"
import { DraggableElementList, doubleClickToEdit, downloadCanvas, downloadHref, fileUploadBox, getAndDeleteFiles } from "../util.js"

export class TextureProjectPart {

    constructor(dom, pth) {
        this.pth = pth
        this.emptyTextureList = dom.find('.texture-list-entry.empty-column')
        this.dragableElementList = new DraggableElementList(false, (a, b, c) => pth.textureManager.groupManager.textureDragged(false, a, b, c))
        dom.find('#texture-file-input').on('input', e => this.uploadTextureFile(getAndDeleteFiles(e)))
        dom.find('.new-texture-button').click(() => this.createEmptyTexture())
        dom.find('.edit-texture-groups').click(() => pth.textureManager.groupManager.openGroupModal())

        fileUploadBox(dom.find('.texture-drop-area'), files => this.uploadTextureFile(files))
     
        pth.addEventListener('selectchange', () => this.refreshTextureLayers())
    }

    createEmptyTexture() {
        this.createTextureElement()
        this.pth.textureManager.refresh()
    }
    
    createTextureElement(name, img) {
        let data = this.pth.textureManager.addImage(name, img)
        let cloned = this.emptyTextureList.clone()
        .removeClass('empty-column')
        .insertBefore(this.emptyTextureList)
        .attr('draggable', true)

        cloned.find('.texture-preview').append(data.img)

        data._projectElement = cloned
        this.dragableElementList.addElement(cloned, () => data.idx)

        let container = cloned.find('.texture-name-container')
        doubleClickToEdit(container, name => {
            data.name = name
            data.text.text(name)
        }, data.name)

        let nameContainer = container.find('.dbl-text')
        data._onRename = () => nameContainer.text(data.name)

        cloned.find('.download-texture-file').click(e => {
            downloadCanvas(data.name + ".png", data.canvas)
            e.stopPropagation()
        })
        cloned.find('.delete-texture-button').click(e => {
            this.pth.textureManager.deleteTexture(data)
            cloned.remove()
            e.stopPropagation()
        })
        return data 
    }

    async uploadTextureFile(files) {
        Promise.all([...files].map(file => {
            let img = document.createElement("img")
            return new Promise(async(resolve) => {
                img.src = await readFile(file, (reader, f) => reader.readAsDataURL(f))
                img.onload = () => {
                    let name = file.name.includes('.') ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name.length
                    resolve({ name, img })
                    img.onload = null
                 }
            })
        }))
        .then(files => files.forEach(file => this.createTextureElement(file.name, file.img)))
        .then(() => this.pth.textureManager.refresh())
    }

    refreshTextureLayers() {
        this.emptyTextureList.siblings().not('.texture-layer-topbar').detach()
        if(this.pth.anySelected()) {
            let groupManager = this.pth.textureManager.groupManager
            groupManager.groups[groupManager.groupSelection.value].layerIDs.forEach(layer => {
                let t = this.pth.textureManager.textures[layer]
                let e = t._projectElement
                if(e === undefined) {
                    console.error("Layer created without project element " + t.name)
                    return
                }
                e.insertBefore(this.emptyTextureList)
            })
        }
    }
}