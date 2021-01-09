import { LayoutPart } from "../util/layout_part.js"

const mainArea = document.getElementById("main-area")

/**
 * Controls the texture panels.
 */
export class TexturePanels {

    constructor(studio, dom) {
        this.dom = dom

        this.poppedOutChildren = null

        let tex = dom.find('#panel-texturemap')
        let texPopout = tex.find('.popout-button')
        let mainDisplay = dom.find('.display-div')
        //The layout parts
        this.texturemapPanel = new LayoutPart(tex, () => this.panelChange())
        this.offsetPanel = new LayoutPart(dom.find('#panel-offset-editing'), () => this.panelChange())
        //The color picker layout. Needed as the color picker needs weird js
        this.colourPanel = new LayoutPart(dom.find('#panel-colour'), () => this.panelChange(), "popped_out_colour_picker", popped => { 
            //Get the active color picker and set the color to the new active one 
            if(popped) {
                let dom = $(this.colourPanel.win.document.body) 
                let container = dom.find('.element-picker-container')               
                this.poppedOutChildren = container.children().detach()
                dom.find('.colour-picker-container').children().detach().appendTo(container)

                this.colourPanel.win.document._picker.setColor(studio.textureTools.colorPicker.getColor().toRGBA().toString())
                studio.textureTools.colorPicker = this.colourPanel.win.document._picker
            } else {
                let container = dom.find('.element-picker-container')
                container.children().detach()

                container.append(this.poppedOutChildren)
                studio.textureTools.colorPicker = studio.textureTools.originalPicker 
                studio.textureTools.colorPicker.setColor(this.colourPanel.win.document._picker.getColor().toRGBA().toString())
            }
        })
        this.textureLayersPanel = new LayoutPart(dom.find('#panel-texture-layers'), () => this.panelChange())
        
        //The button to switch texturemaps
        tex.find('.switch-canvas-button').click(() => {

            let switchElemet = document.getElementById("switch-button-texturer");
            let s = mainDisplay.get(0).style.gridArea
            mainDisplay.css('grid-area', tex.get(0).style.gridArea)
            tex.css('grid-area', s)

            if(s.startsWith('main_area')) {
                texPopout.css('display', 'none')
                switchElemet.style.left = "calc(100% + -20px)";
            } else {
                texPopout.css('display', '')
                switchElemet.style.left = "-20px";
            }

            window.studioWindowResized()
        })

        //Setup the dividers to allow for changing the panel size
        this.mainDivider = dom.find("#main-divider")
        this.topDivider = dom.find("#top-main-divider")
        this.textureLayersDivider = dom.find("#texture-layers-divider")

        this.rightArea = 500
        this.offsetArea = 70
        this.layersArea = 250
        this.bottomArea = 290


        let clickedDivider = 0
        $(document)
            .mouseup(() => clickedDivider = 0)
            .mousemove(e => {
                if(clickedDivider !== 0) {
                    if(clickedDivider === 1) {
                        let newDist = mainArea.clientWidth - e.clientX
                        let diff = newDist - this.rightArea
                        this.layersArea += diff * (this.layersArea / this.rightArea)
                        this.rightArea = newDist
                    } else if(clickedDivider === 2) {
                        this.bottomArea = mainArea.clientHeight - e.clientY - 16
                    } else if(clickedDivider === 3) {
                        this.layersArea = mainArea.clientWidth - e.clientX
                    }
                    this.updateAreas()
                }
            })

        this.mainDivider.mousedown(() => clickedDivider = 1)
        this.topDivider.mousedown(() => clickedDivider = 2)
        this.textureLayersDivider.mousedown(() => clickedDivider = 3)
        this.updateAreas()
    }

    updateAreas() {
        this.mainDivider.css('right', (this.rightArea-4) + "px")

        if(this.bottomArea === 0) {
            this.topDivider.css('display', 'none')
        } else {
            this.topDivider.css('display', 'unset')
            this.topDivider.css('bottom', (this.bottomArea+this.offsetArea-52-4) + "px").css('right', '0px').css('width', this.rightArea + "px").css('left', 'unset')
        }

        if(this.layersArea === 0) {
            this.textureLayersDivider.css('display', 'none')
        } else {
            this.textureLayersDivider.css('display', 'unset')
            this.textureLayersDivider.css('right', `${this.layersArea}px`).css('bottom', `0px`).css('height', `${this.bottomArea}px`).css('left', 'unset').css('top', 'unset')
        }

        this.dom
            .css('grid-template-columns', `calc(100% - ${this.rightArea}px) ${this.rightArea-this.layersArea}px ${this.layersArea}px`) 
            .css('grid-template-rows', `calc(100vh - ${this.bottomArea + this.offsetArea + mainArea.offsetTop}px - 28px) ${this.offsetArea}px ${this.bottomArea}px 28px`) 

        window.studioWindowResized()
    }

    panelChange() {
        let texture = !this.texturemapPanel.popped
        let offset = !this.offsetPanel.popped
        let palette = !this.colourPanel.popped
        let layers = !this.textureLayersPanel.popped
        
        if(!texture && !offset && !palette && !layers) {
            this.rightArea = 0
        } else {
            let top = texture
            let middle = offset
            let bottom = palette || layers

            if(this.rightArea === 0) {
                this.rightArea = 300
            }

            let height =  mainArea.clientHeight - mainArea.clientTop
            if(bottom) {
                if(layers) {
                    if(palette) {
                        this.layersArea = 250
                    } else {
                        this.layersArea = this.rightArea
                    }
                } else {
                    this.layersArea = 0
                }

                if(middle) {
                    this.offsetArea = 70
                    if(top) {
                        this.bottomArea = 290
                    } else {
                        this.bottomArea = height - this.offsetArea
                    }
                } else {
                    this.offsetArea = 0
                    if(top) {
                        this.bottomArea += 35
                    } else {
                        this.bottomArea = height
                    }
                }
            } else {
                this.layersArea = 0
                this.bottomArea = 0

                if(middle) {
                    this.offsetArea = 70
                    if(!top) {
                        this.offsetArea = mainArea.clientHeight
                    }
                } else {
                    this.offsetArea = 0
                    this.bottomArea = 0
                }
            }
        }
        this.updateAreas()
    }
}
