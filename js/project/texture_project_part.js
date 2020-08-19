import { readFile } from "../displays.js"
import { DraggableElementList, doubleClickToEdit } from "../util.js"

$(document).select(e => console.log(e.target))

export class TextureProjectPart {

    constructor(dom, textureGetter) {
        this.textureGetter = textureGetter
        this.emptyTextureList = dom.find('.texture-list-entry.empty-column')
        this.dragableElementList = new DraggableElementList(false, (a, b, c) => {
            let texture = textureGetter()
            if(texture === undefined) {
                return
            }
            texture.textureManager.textureDragged(a, b, c)

        })
        dom.find('#texture-file-input').on('input', e => this.uploadTextureFiles(e))
        dom.find('.new-texture-button').click(() => {
            let texture = this.textureGetter()
            if(texture === undefined) {
                return
            }
            this.createTextureElement(texture)
            texture.textureManager.refresh()
        })
    }
    
    createTextureElement(texture, name, img) {
        let data = texture.textureManager.addImage(name, img)
        let cloned = this.emptyTextureList.clone()
        cloned.removeClass('empty-column')
        cloned.insertBefore(this.emptyTextureList)    

        cloned.find('.texture-preview').append(data.img)

        let element = cloned.get(0)
        element.draggable = true

        data._projectElement = cloned
        this.dragableElementList.addElement(element, () => data.idx)

        doubleClickToEdit(cloned.find('.texture-name-container'), name => {
            data.name = name
            data.li.innerText = name
        }, data.name)
    }

    async uploadTextureFiles(element) {
        let texture = this.textureGetter()
        if(texture === undefined) {
            return
        }
        Promise.all([...element.target.files].map(file => {
            let img = document.createElement("img")
            return new Promise(async(resolve) => {
                img.src = await readFile(file, (reader, f) => reader.readAsDataURL(f))
                resolve({ name: file.name,  img} )
            })
        }))
        .then(files => files.forEach(file => this.createTextureElement(texture, file.name, file.img)))
        .then(() => texture.textureManager.refresh())
    }

    refreshTextureLayers() {
        let texture = this.textureGetter()
        if(texture === undefined) {
            return
        }
        this.emptyTextureList.siblings().not('.texture-layer-topbar').detach()
        texture.textureManager.textures.forEach(t => {
            let e = t._projectElement
            if(e === undefined) {
                console.error("Layer created without project element " + JSON.stringify(t))
                return
            }
            e.insertBefore(this.emptyTextureList)
        })

    }
}