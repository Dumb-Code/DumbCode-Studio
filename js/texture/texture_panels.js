import { LayoutPart } from "../util.js"

const mainArea = document.getElementById("main-area")

export class TexturePanels {

    constructor(dom) {
        this.dom = dom

        let tex = dom.find('#panel-texturemap')
        let texPopout = tex.find('.popout-button')
        let mainDisplay = dom.find('#display-div')
        this.texturemapPanel = new LayoutPart(tex, () => this.panelChange())
        this.offsetPanel = new LayoutPart(dom.find('#panel-offset-editing'), () => this.panelChange())
        this.colourPickerPanel = new LayoutPart(dom.find('#panel-colour-picker'), () => this.panelChange())
        this.colourPalettePanel = new LayoutPart(dom.find('#panel-colour-palette'), () => this.panelChange())
        this.textureLayersPanel = new LayoutPart(dom.find('#panel-texture-layers'), () => this.panelChange())
        
        tex.find('.switch-canvas-button').click(() => {
            let s = mainDisplay.css('grid-area')
            mainDisplay.css('grid-area', tex.css('grid-area'))
            tex.css('grid-area', s)
            
            if(s.startsWith('main_area')) {
                texPopout.css('display', 'none')
            } else {
                texPopout.css('display', '')
            }

            window.studioWindowResized()
        })

        //Setup the dividers to allow for changing the panel size
        this.mainDivider = dom.find("#main-divider")
        this.topDivider = dom.find("#top-main-divider")
        this.bottomDivider = dom.find("#bottom-main-divider")
        this.textureLayersDivider = dom.find("#texture-layers-divider")
        this.pickerPaletteDivider = dom.find("#picker-palette-divider")

        this.rightArea = 500
        this.topArea = 300
        this.offsetArea = 200
        this.pickerArea = 200
        this.layersArea = 300

        let clickedDivider = 0
        $(document)
            .mouseup(() => clickedDivider = 0)
            .mousemove(e => {
                if(clickedDivider !== 0) {
                    if(clickedDivider === 1) {
                        this.rightArea = mainArea.clientWidth - e.clientX
                    } else if(clickedDivider === 2) {
                        this.topArea = e.clientY - mainArea.offsetTop
                    }  else if(clickedDivider === 3) {
                        this.offsetArea = e.clientY - mainArea.offsetTop - this.topArea
                    } else if(clickedDivider === 4) {
                        this.layersArea = mainArea.clientWidth - e.clientX
                    } else if(clickedDivider === 5) {
                        this.pickerArea = e.clientY - mainArea.offsetTop - this.topArea - this.offsetArea
                    }
                    this.updateAreas()
                }
            })

        this.mainDivider.mousedown(() => clickedDivider = 1)
        this.topDivider.mousedown(() => clickedDivider = 2)
        this.bottomDivider.mousedown(() => clickedDivider = 3)
        this.textureLayersDivider.mousedown(() => clickedDivider = 4)
        this.pickerPaletteDivider.mousedown(() => clickedDivider = 5)
        this.updateAreas()
    }

    updateAreas() {
        this.mainDivider.css('right', (this.rightArea-4) + "px")

        if(this.topArea === 0) {
            this.topDivider.css('display', 'none')
        } else {
            this.topDivider.css('display', 'unset')
            this.topDivider.css('top', (mainArea.offsetTop+this.topArea-4) + "px").css('right', '0px').css('width', this.rightArea + "px").css('left', 'unset')
        }

        if(this.offsetArea === 0) {
            this.bottomDivider.css('display', 'none')
        } else {
            this.bottomDivider.css('display', 'unset')
            this.bottomDivider.css('top', (mainArea.offsetTop+this.topArea+this.offsetArea-4) + "px").css('right', '0px').css('width', this.rightArea + "px").css('left', 'unset')
        }

        if(this.pickerArea === 0) {
            this.pickerPaletteDivider.css('display', 'none')
        } else {
            this.pickerPaletteDivider.css('display', 'unset')
            this.pickerPaletteDivider.css('top', (mainArea.offsetTop+this.topArea+this.offsetArea+this.pickerArea-4) + "px").css('right', `${this.layersArea}px`).css('width', `${this.rightArea - this.layersArea}px`).css('left', 'unset')
        }

        if(this.layersArea === 0) {
            this.textureLayersDivider.css('display', 'none')
        } else {
            this.textureLayersDivider.css('display', 'unset')
            this.textureLayersDivider.css('right', `${this.layersArea}px`).css('top', `${mainArea.offsetTop+this.topArea+this.offsetArea-4}px`).css('height', `${mainArea.clientHeight-this.topArea-this.offsetArea}px`).css('left', 'unset')
        }

        this.dom
            .css('grid-template-columns', `calc(100% - ${this.rightArea}px) ${this.rightArea-this.layersArea}px ${this.layersArea}px`) 
            .css('grid-template-rows', `${this.topArea}px ${this.offsetArea}px ${this.pickerArea}px calc(100vh - ${this.topArea + this.offsetArea + this.pickerArea + 52}px)`) 

        window.studioWindowResized()
    }

    panelChange() {
        let texture = !this.texturemapPanel.popped
        let offset = !this.offsetPanel.popped
        let picker = !this.colourPickerPanel.popped
        let palette = !this.colourPalettePanel.popped
        let layers = !this.textureLayersPanel.popped
        
        if(!texture && !offset && !picker && !palette && !layers) {
            this.rightArea = 0
        } else {
            let top = texture
            let middle = offset
            let bottom = picker || palette || layers

            if(this.rightArea === 0) {
                this.rightArea = 300
            }

            if(bottom) {
                if(picker) {
                    if(palette) {
                        this.pickerArea = 200
                    } else {
                        this.pickerArea = mainArea.clientHeight - this.topArea - this.offsetArea
                    }
                } else {
                    this.pickerArea = 0
                }

                if(layers) {
                    if(picker || palette) {
                        this.layersArea = 100
                    } else {
                        this.layersArea = this.rightArea
                    }
                } else {
                    this.layersArea = 0
                }

                if(middle) {
                    if(top) {
                        this.topArea = 300
                        this.offsetArea = 200
                    } else {
                        if(this.topArea === 0) {
                            this.offsetArea = 200
                        } else {
                            this.offsetArea += this.topArea
                        }
                        this.topArea = 0
                    }
                } else {
                    this.offsetArea =0
                    if(top) {
                        if(this.offsetArea === 0) {
                            this.topArea = 300
                        } else {
                            this.topArea += this.offsetArea
                        }
                    } else {
                        this.topArea = 0
                    }
                }

            } else {
                this.layersArea = 0
                this.pickerArea = 0

                if(middle) {
                    if(top) {
                        this.offsetArea = mainArea.clientHeight/2
                        this.topArea = mainArea.clientHeight/2
                    } else {
                        this.offsetArea = mainArea.clientHeight
                        this.topArea = 0
                    }
                } else {
                    this.offsetArea = 0
                    this.topArea = mainArea.clientHeight
                }
            }
        }
        this.updateAreas()
    }
}
