import { readFile } from "../displays.js"
import { Texture, NearestFilter, Vector2, DataTexture, RGBAFormat, CanvasTexture } from "../three.js"
import { DraggableElementList } from "../util.js"

export class TextureManager {

    constructor(dom, studio, setTexture, filesPage) {
        this.display = studio.display
        this.setTexture = setTexture
        this.filesPage = filesPage
        this.textures = []
        this.aspect = -1
        this.canvas = document.createElement('canvas')
        this.context = this.canvas.getContext('2d')
        this.context.imageSmoothingEnabled = false

        this.dragElementList = new DraggableElementList(false, (a, b, c) => this.textureDragged(a, b, c))

        this.textureUpload = dom.find('.texture-file-input-entry')
        dom.find('.texture-file-input').on('input', e => filesPage.textureProjectPart.uploadTextureFiles(e))
    }

    textureDragged(drop, movedData, droppedOnData) {
        this.textures.splice(droppedOnData + (drop == 'bottom' ? 1 : 0), 0, ...this.textures.splice(movedData, 1))
        this.refresh()
    }
    
    addImage(name, img) {

        let width = this.display.tbl.texWidth
        let height = this.display.tbl.texHeight

        let empty = false

        if(name === undefined) {
            name = "New Layer " + this.textures.length
            img = document.createElement("img")
            empty = true
        } else {
            width = img.naturalWidth
            height = img.naturalHeight
        }

        let data = {}

        let li = document.createElement('li')
        data.li = li
        data.name = name
        data.isHidden = false
        this.dragElementList.addElement(li, () => data.idx)
        li.oncontextmenu = () => {
            data.isHidden = !data.isHidden
            li.classList.toggle('entry-hidden', data.isHidden)
            this.refresh()
            return false
        }
        li.classList.add('texture-file-entry')
        li.draggable = true

        let a = width / height

        if(this.aspect === -1) {
            this.aspect = a
        } else if(a !== this.aspect) {
            console.error(`Aspect Ratio is wrong: Expected ${this.aspect} found ${a}`)
            return
        }

        data.width = width
        data.height = height
        data.img = img

        data.onCanvasChange = () => {
            data.img.src = data.canvas.toDataURL()
            data.img.width = data.canvas.width
            data.img.height = data.canvas.height
            this.refresh()
        }
        
        data.canvas = document.createElement("canvas")
        data.canvas.width = width
        data.canvas.height = height
        let ctx = data.canvas.getContext("2d")

        if(empty) {
            ctx.fillStyle = "rgba(255, 255, 255, 1)"
            ctx.fillRect(0, 0, width, height)
            data.onCanvasChange()
        } else {
            ctx.drawImage(img, 0, 0, width, height)
        }

        this.textures.unshift(data)
        return data
    }

    refresh() {
        this.filesPage.textureProjectPart.refreshTextureLayers()

        this.textureUpload.siblings().detach()
        this.textures.forEach((t, id) => {
            t.idx = id
            $(t.li).text(t.name).detach().insertBefore(this.textureUpload)
        })


        let width = this.textures.filter(t => !t.isHidden).map(t => t.width).reduce((a, c) => Math.max(a, c), 1)
        let height = Math.max(width / this.aspect, 1)

        
        this.canvas.width = width
        this.canvas.height = height

        if(!this.textures.find(t => !t.isHidden)) {
            this.context.fillStyle = `rgba(255, 255, 255, 255)`
            this.context.fillRect(0, 0, 1, 1)
        }

        this.textures.filter(t => !t.isHidden).reverse().forEach(t => this.context.drawImage(t.canvas, 0, 0, width, height))

        let tex = new CanvasTexture(this.canvas)
        tex.needsUpdate = true
        tex.flipY = false
        tex.magFilter = NearestFilter;
        tex.minFilter = NearestFilter;
        this.setTexture(tex)
        
    }
}
