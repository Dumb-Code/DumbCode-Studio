import { readFile } from "../displays.js"
import { Texture, NearestFilter, Vector2, DataTexture, RGBAFormat, CanvasTexture } from "../three.js"
import { DraggableElementList } from "../util.js"

export class TextureManager {

    constructor(dom, studio, setTexture) {
        this.display = studio.display
        this.setTexture = setTexture
        this.textures = []
        this.aspect = -1

        this.dragElementList = new DraggableElementList(false, (drop, movedData, droppedOnData) => {
            this.textures.splice(droppedOnData + (drop == 'bottom' ? 1 : 0), 0, ...this.textures.splice(movedData, 1))
            this.refresh()
        })

        this.mainList = dom.find('.texture-file-input-entry')
        dom.find('.texture-file-input').on('change', e => [...e.target.files].forEach(file => {
            let data = {}

            let li = document.createElement('li')
            data.li = li
            data.name = file.name
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

            let img = document.createElement("img")
            img.onload = () => {
                let width = img.naturalWidth
                let height = img.naturalHeight

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

                this.textures.unshift(data)
                this.refresh()
            }
            img.onerror = () => console.error(`Unable to define image from file: ${file.name}`)
            this.loadImgData(img, file)
        }))
    }
    
    async loadImgData(img, f) {
        img.src = await readFile(f, (reader, file) => reader.readAsDataURL(file))
    }

    async refresh() {
        this.textures.forEach((t, id) => {
            t.idx = id
            $(t.li).text(t.name).detach().insertBefore(this.mainList)
        })


        let width = this.textures.filter(t => !t.isHidden).map(t => t.width).reduce((a, c) => Math.max(a, c), 1)
        let height = Math.max(width / this.aspect, 1)

        let canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        let ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false

        if(!this.textures.find(t => !t.isHidden)) {
            ctx.fillStyle = `rgba(255, 255, 255, 255)`
            ctx.fillRect(0, 0, 1, 1)
        }

        this.textures.filter(t => !t.isHidden).reverse().forEach(t => ctx.drawImage(t.img, 0, 0, width, height))

        let tex = new CanvasTexture(canvas)
        tex.needsUpdate = true
        tex.flipY = false
        tex.magFilter = NearestFilter;
        tex.minFilter = NearestFilter;
        this.setTexture(tex)
        
    }
}
