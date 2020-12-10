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
        this.colourPanel = new LayoutPart(dom.find('#panel-colour'), () => this.panelChange())
        this.textureLayersPanel = new LayoutPart(dom.find('#panel-texture-layers'), () => this.panelChange())
        
        tex.find('.switch-canvas-button').click(() => {
            let s = mainDisplay.get(0).style.gridArea
            mainDisplay.css('grid-area', tex.get(0).style.gridArea)
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
        this.textureLayersDivider = dom.find("#texture-layers-divider")

        this.rightArea = 500
        this.offsetArea = 70
        this.layersArea = 250
        this.topArea = window.innerHeight - 52 - 70 - 240


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
                        this.topArea = e.clientY - mainArea.offsetTop
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

        if(this.topArea === 0) {
            this.topDivider.css('display', 'none')
        } else {
            this.topDivider.css('display', 'unset')
            this.topDivider.css('top', (mainArea.offsetTop+this.topArea-4) + "px").css('right', '0px').css('width', this.rightArea + "px").css('left', 'unset')
        }

        if(this.layersArea === 0) {
            this.textureLayersDivider.css('display', 'none')
        } else {
            this.textureLayersDivider.css('display', 'unset')
            this.textureLayersDivider.css('right', `${this.layersArea}px`).css('top', `${mainArea.offsetTop+this.topArea+this.offsetArea-4}px`).css('height', `${mainArea.clientHeight-this.topArea-this.offsetArea}px`).css('left', 'unset')
        }

        this.dom
            .css('grid-template-columns', `calc(100% - ${this.rightArea}px) ${this.rightArea-this.layersArea}px ${this.layersArea}px`) 
            .css('grid-template-rows', `${this.topArea}px ${this.offsetArea}px calc(100vh - ${this.topArea + this.offsetArea + 52}px)`) 

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

            if(bottom) {
                if(layers) {
                    if(palette) {
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
                        this.offsetArea = 70
                    } else {
                        if(this.topArea === 0) {
                            this.offsetArea = 70
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
