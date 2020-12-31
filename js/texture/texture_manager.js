import { readFile } from "../displays.js"
import { Texture, NearestFilter, Vector2, DataTexture, RGBAFormat, CanvasTexture } from "../three.js"
import { doubleClickToEdit, DraggableElementList, LinkedSelectableList, ToggleableElement } from "../util.js"
import { TextureGroupManager } from "./texture_group_manager.js"

export class TextureManager {

    constructor(model, pth) {
        this.model = model
        this.pth = pth
        this.filesPage = pth._files
        this.textures = []
        this.textureEmptyLayer = pth._texture._textureEmptyLayer
        this.groupManager = new TextureGroupManager(pth, this)

        this.highlightCanvas = document.createElement('canvas')
        this.highlightCanvas.width = model.texWidth
        this.highlightCanvas.height = model.texHeight
        this.highlightContext = this.highlightCanvas.getContext('2d')
        this.highlightContext.imageSmoothingEnabled = false
        this.highlighPixel = null

        model.addEventListener('textureSizeChanged', e => {
            this.highlightCanvas.width = e.width
            this.highlightCanvas.height = e.height
            this.highlightContext = this.highlightCanvas.getContext('2d')
            this.highlightContext.imageSmoothingEnabled = false
        })

        this.canvas = document.createElement('canvas')
        this.context = this.canvas.getContext('2d')
        this.context.imageSmoothingEnabled = false

        this.dragElementList = new DraggableElementList(false, (a, b, c) => this.textureDragged(a, b, c))
        this.selectedLayer = new LinkedSelectableList($(), false, "texture-layer-selected").onchange(e => {
            let layer = this.textures[e.value]
            if(layer) {
                this.highlightCanvas.width = layer.width
                this.highlightCanvas.height = layer.height
            }
        })
    }

    getSelectedLayer() {
        return this.textures[this.selectedLayer.value]
    }

    hightlightPixelBounds(u, v, bounds) {
        if(this.selectedLayer.value === undefined) {
            return
        }
        let layer = this.textures[this.selectedLayer.value]
        let pixel = u === undefined ? null : { u: Math.floor(u*layer.width), v:Math.floor(v*layer.height) }
        if(this.highlighPixel?.u === pixel?.u && this.highlighPixel?.v === pixel?.v) {
            return
        }

        this.highlightContext.clearRect(0, 0, this.highlightCanvas.width, this.highlightCanvas.height)

        this.highlighPixel = pixel
        if(this.highlighPixel !== null) {
            this.highlightContext.fillStyle = "rgba(150, 100, 200, 1)"

            if(bounds) {
                bounds.forEach(b => this.highlightContext.fillRect(Math.floor(b.u), Math.floor(b.v), Math.round(b.w), Math.round(b.h)))
            }
        }
        this.refresh()
    }


    textureDragged(drop, movedData, droppedOnData) {
        this.textures.splice(droppedOnData + (drop == 'bottom' ? 1 : 0), 0, ...this.textures.splice(movedData, 1))
        this.refresh()
    }
    
    addImage(name, img) {
        let width = this.model.texWidth
        let height = this.model.texHeight

        let empty = false

        if(name === undefined) {
            name = "New Layer " + this.textures.length
            img = document.createElement("img")
            empty = true
        } else {
            width = img.naturalWidth
            height = img.naturalHeight
        }

        let dom = this.textureEmptyLayer.clone()
        dom.removeClass("empty-layer layer-persistant")
        let data = {}

        data.dom = dom

        let container = dom.find('.texture-layer-name-container')
        data.text = container.find('.dbl-text')
        data._onRename = () => {}
        doubleClickToEdit(container, newName => {
            data.name = newName
            data.text.text(newName)
            data._onRename()
        }, name)

        this.selectedLayer.addElement(dom)
        data.name = name
        data.isHidden = false
        this.dragElementList.addElement(dom, () => data.idx)
        
        new ToggleableElement(dom.find('.texture-layer-visible')).onchange(e => {
            data.isHidden = !e.value
            this.refresh()
        })

        data.width = width
        data.height = height
        data.img = img
        data.img2 = img.cloneNode()

        dom.find('.texture-layer-preview').append(data.img2)


        data.onCanvasChange = (full = true) => {
            data.img.src = data.canvas.toDataURL()
            data.img.width = data.canvas.width
            data.img.height = data.canvas.height

            data.img2.src = data.canvas.toDataURL()
            data.img2.width = data.canvas.width
            data.img2.height = data.canvas.height

            if(full) {
                this.refresh()
            }
        }
        
        data.canvas = document.createElement("canvas")
        data.canvas.width = width
        data.canvas.height = height
        let ctx = data.canvas.getContext("2d")
        ctx.imageSmoothingEnabled = false

        if(empty) {
            ctx.fillStyle = "rgba(255, 255, 255, 1)"
            ctx.fillRect(0, 0, width, height)
        } else {
            ctx.drawImage(img, 0, 0, width, height)
        }

        data.onCanvasChange(false)

        this.textures.unshift(data)

        data.idx = this.textures.length
        this.groupManager.groups[0].layerIDs.unshift(data.idx)
        this.updateIDs()

        return data
    }

    removeAll() {
        this.filesPage.textureProjectPart.refreshTextureLayers()
        this.textureEmptyLayer.siblings().not('.layer-persistant').detach()
    }

    updateIDs() {
        this.groupManager.updateIds(this.textures.map(t => t.idx))
        this.textures.forEach((t, id) => t.idx = id)
    }

    refresh() {
        this.removeAll()
        this.updateIDs()
        this.textures.forEach(t => {
            t.dom.attr('select-list-entry', t.idx)
            t.text.text(t.name)
            t.dom.detach().insertBefore(this.textureEmptyLayer)
        })

        let group = this.groupManager.groups[this.groupManager.groupSelection.value]
        let textures = group.layerIDs.map(id => this.textures[id]).filter(t => !t.isHidden)
        
        let width = textures.map(t => t.width).reduce((a, c) => Math.abs(a * c) / this.gcd(a, c), 1)
        let height = textures.map(t => t.height).reduce((a, c) => Math.abs(a * c) / this.gcd(a, c), 1)

        if(textures.length === 0) {
            width = this.model.texWidth
            height = this.model.texHeight
        }

        this.canvas.width = width
        this.canvas.height = height
        this.context.imageSmoothingEnabled = false

        if(textures.length === 0) {
            this.context.fillStyle = `rgba(255, 255, 255, 1)`
            this.context.fillRect(0, 0, width, height)
        }

        textures.reverse().forEach(t => this.context.drawImage(t.canvas, 0, 0, width, height))

        if(this.selectedLayer.value !== undefined) {
            this.context.drawImage(this.highlightCanvas, 0, 0, width, height)
        }

        let tex = new CanvasTexture(this.canvas)
        tex.needsUpdate = true
        tex.flipY = false
        tex.magFilter = NearestFilter;
        tex.minFilter = NearestFilter;
        this.pth.setTexture(tex)
    }

    deleteTexture(data) {
        this.selectedLayer.value = undefined
        this.textures.splice(this.textures.indexOf(data), 1)
        data.dom.remove()
        this.refresh()
    }

    gcd(a, b) {
        if (!b) {
          return Math.abs(a);
        }
      
        return this.gcd(b, a % b);
      }
}
