import { readFile } from "../displays.js"
import { Texture, NearestFilter, Vector2, DataTexture, RGBAFormat, CanvasTexture } from "../libs/three.js"
import { doubleClickToEdit } from "../util/element_functions.js"
import { DraggableElementList } from "../util/draggable_element_list.js"
import { ToggleableElement } from "../util/toggleable_element.js"
import { TextureGroupManager } from "./texture_group_manager.js"
import { LinkedSelectableList } from "../util/linked_selectable_list.js"

/**
 * Used to control and manage the textures
 */
export class TextureManager {

    constructor(model, pth) {
        this.model = model
        this.pth = pth
        this.filesPage = pth._files
        this.textures = []
        this.textureEmptyLayer = pth._texture._textureEmptyLayer
        //The group manager
        this.groupManager = new TextureGroupManager(pth, this)

        //The highlight canvas.
        this.highlightCanvas = document.createElement('canvas')
        this.highlightCanvas.width = model.texWidth
        this.highlightCanvas.height = model.texHeight
        this.highlightContext = this.highlightCanvas.getContext('2d')
        this.highlightContext.imageSmoothingEnabled = false

        //The highlighted pixel
        this.highlighPixel = null

        //When the texture size changed
        model.addEventListener('textureSizeChanged', e => {
            this.highlightCanvas.width = e.width
            this.highlightCanvas.height = e.height
            this.highlightContext = this.highlightCanvas.getContext('2d')
            this.highlightContext.imageSmoothingEnabled = false
        })

        //The main canvas 
        this.canvas = document.createElement('canvas')
        this.context = this.canvas.getContext('2d')
        this.context.imageSmoothingEnabled = false

        //The drag selection list
        this.dragElementList = new DraggableElementList(false, (a, b, c) => this.groupManager.textureDragged(false, a, b, c))
        //The selected layer list
        this.selectedLayer = new LinkedSelectableList($(), false, "texture-layer-selected").onchange(e => {
            let layer = this.textures[e.value]
            if(layer) {
                this.highlightCanvas.width = layer.width
                this.highlightCanvas.height = layer.height
            }
        })

        //Create the default entry.
        this.groupManager.initiateDefaultEntry()
    }

    /**
     * Get the selected layer
     */
    getSelectedLayer() {
        return this.textures[this.selectedLayer.value]
    }

    /**
     * Draws on the highlight layer
     * @param {number} u the highlighted pixel u
     * @param {number v the highlighted pixel v
     * @param {*} bounds the selection bounds
     */
    hightlightPixelBounds(u, v, bounds) {
        if(this.selectedLayer.value === undefined) {
            return
        }
        //Get the texture layer
        let layer = this.textures[this.selectedLayer.value]
        //Get the pixel
        let pixel = u === undefined ? null : { u: Math.floor(u*layer.width), v:Math.floor(v*layer.height) }
        //If it's the same pixel, then ignore
        if(this.highlighPixel?.u === pixel?.u && this.highlighPixel?.v === pixel?.v) {
            return
        }

        //Clear the highlight context
        this.highlightContext.clearRect(0, 0, this.highlightCanvas.width, this.highlightCanvas.height)

        this.highlighPixel = pixel
        if(this.highlighPixel !== null) {
            //Draw on the highlight context
            this.highlightContext.fillStyle = "rgba(150, 100, 200, 1)"

            if(bounds) {
                bounds.forEach(b => this.highlightContext.fillRect(Math.floor(b.u), Math.floor(b.v), Math.round(b.w), Math.round(b.h)))
            }
        }

        //Refresh the textures
        this.refresh()
    }
    
    /**
     * Adds a new image.
     * @param {string} name the name
     * @param {*} img the img tag
     */
    addImage(name, img) {
        let width = this.model.texWidth
        let height = this.model.texHeight

        let empty = false

        //If the parameters are defined
        if(name === undefined) {
            name = "New Layer " + this.textures.length
            img = document.createElement("img")
            empty = true
        } else {
            width = img.naturalWidth
            height = img.naturalHeight
        }

        //Create the dom
        let dom = this.textureEmptyLayer.clone()
        dom.removeClass("empty-layer layer-persistant")
        let data = {}

        //Add some of the default elements to the data
        data.dom = dom
        data.width = width
        data.height = height
        data.name = name
        data.isHidden = false
        data.img = img
        data.img2 = img.cloneNode()

        //Bind the name dom elements
        let container = dom.find('.texture-layer-name-container')
        data.text = container.find('.dbl-text')
        data._onRename = () => {}
        doubleClickToEdit(container, newName => {
            data.name = newName
            data.text.text(newName)
            data._onRename()
        }, name)

        //Add the dom to the selecct layer and the drag list
        this.selectedLayer.addElement(dom)
        this.dragElementList.addElement(dom, () => data.idx)
        
        //Bind the toggable element
        new ToggleableElement(dom.find('.texture-layer-visible')).onchange(e => {
            data.isHidden = !e.value
            this.refresh()
        })

        //Append the img element to the preview dom
        dom.find('.texture-layer-preview').append(data.img2)

        //Callback for when the canvas changes
        data.onCanvasChange = (refresh = true) => {
            data.img.src = data.canvas.toDataURL()
            data.img.width = data.canvas.width
            data.img.height = data.canvas.height

            data.img2.src = data.canvas.toDataURL()
            data.img2.width = data.canvas.width
            data.img2.height = data.canvas.height

            if(refresh === true) {
                this.refresh()
            }
        }
        
        //Create the canvas and set the width and height
        data.canvas = document.createElement("canvas")
        data.canvas.width = width
        data.canvas.height = height
        let ctx = data.canvas.getContext("2d")
        ctx.imageSmoothingEnabled = false

        //Fill the canvas with either white, or the img if there is one
        if(empty) {
            ctx.fillStyle = "rgba(255, 255, 255, 1)"
            ctx.fillRect(0, 0, width, height)
        } else {
            ctx.drawImage(img, 0, 0, width, height)
        }

        //the canvas is changed
        data.onCanvasChange(false)

        //Insert the data at index 0, and set the id
        this.textures.unshift(data)
        data.idx = this.textures.length
        
        //Insert the texture id in the default group manager
        this.groupManager.groups[0].layerIDs.unshift(data.idx)

        //If there is a group selected, add the group id to that layer
        if(this.groupManager.groupSelection.value != 0) {
            this.groupManager.groups[this.groupManager.groupSelection.value].layerIDs.unshift(data.idx)
        }

        //ID's have changed, so update them
        this.updateIDs()

        return data
    }

    /**
     * Remove all the dom stuff
     */
    removeAll() {
        this.filesPage.textureProjectPart.refreshTextureLayers()
        this.textureEmptyLayer.siblings().not('.layer-persistant').detach()
    }

    /**
     * Update the texture ids
     */
    updateIDs() {
        this.groupManager.updateIds(this.textures.map(t => t.idx))
        this.textures.forEach((t, id) => t.idx = id)
    }

    /**
     * Refreshes the canvas. Re-draws all the textures to the main canvas, which is then used as a texture
     * @param {boolean} refreshCanvas if the canvas should be refreshed. Optional to help prevent recursion]
     */
    refresh(refreshCanvas = true) {
        //Remove all the doms, update the ids and update the select list entry index
        this.removeAll()
        this.updateIDs()
        this.textures.forEach(t => {
            t.dom.attr('select-list-entry', t.idx)
            t.text.text(t.name)
        })

        //The active group
        let group = this.groupManager.groups[this.groupManager.groupSelection.value]
        //The active group in textures
        let textures = group.layerIDs.map(id => this.textures[id])

        //Insert the dom before the texture layer.
        textures.forEach(t => t.dom.detach().insertBefore(this.textureEmptyLayer))
        textures = textures.filter(t => !t.isHidden)

        //Everything beyond this is re-rendering.
        if(refreshCanvas !== true) {
            return
        }

        //Get the width/height to render. Gets the width/height needed for all textures to render fully
        let width = textures.map(t => t.width).reduce((a, c) => Math.abs(a * c) / this.gcd(a, c), 1)
        let height = textures.map(t => t.height).reduce((a, c) => Math.abs(a * c) / this.gcd(a, c), 1)

        //If no textures, then render with the default width/height
        if(textures.length === 0) {
            width = this.model.texWidth
            height = this.model.texHeight
        }

        this.canvas.width = width
        this.canvas.height = height
        this.context.imageSmoothingEnabled = false

        //If there's no textures then draw white.
        if(textures.length === 0) {
            this.context.fillStyle = `rgba(255, 255, 255, 1)`
            this.context.fillRect(0, 0, width, height)
        }

        //Draw the textures in reverse order.
        textures.reverse().forEach(t => this.context.drawImage(t.canvas, 0, 0, width, height))

        //If there is a layer selected, then draw the highlight canvas.
        if(this.selectedLayer.value !== undefined) {
            this.context.drawImage(this.highlightCanvas, 0, 0, width, height)
        }

        //Create the canvas texture. Maybe we can re-use the texture?
        let tex = new CanvasTexture(this.canvas)
        tex.needsUpdate = true
        tex.flipY = false
        tex.magFilter = NearestFilter;
        tex.minFilter = NearestFilter;
        this.pth.setTexture(tex)
    }

    /**
     * Deletes a texture.
     * @param {*} data the texture to delete
     */
    deleteTexture(data) {
        this.selectedLayer.value = undefined
        this.textures.splice(this.textures.indexOf(data), 1)
        data.dom.remove()
        this.refresh()
    }

    /**
     * Greatest common dividor
     */
    gcd(a, b) {
        if (!b) {
          return Math.abs(a);
        }
      
        return this.gcd(b, a % b);
      }
}
