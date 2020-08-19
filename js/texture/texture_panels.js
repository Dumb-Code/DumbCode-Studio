import { LayoutPart } from "../util.js"

const mainArea = document.getElementById("main-area")

export class TexturePanels {

    constructor(dom) {
        this.dom = dom
        this.topPanel = new LayoutPart(dom.find('#panel-top'), () => this.panelChange())
        this.middlePanel = new LayoutPart(dom.find('#panel-middle'), () => this.panelChange())
        this.bottomPanel = new LayoutPart(dom.find('#panel-bottom'), () => this.panelChange())

        //Setup the dividers to allow for changing the panel size
        this.verticalDivider = dom.find("#vertical-divider")
        this.topDivider = dom.find("#top-divider")
        this.bottomDivider = dom.find("#bottom-divider")

        this.rightArea = 300
        this.topArea = 300
        this.middleArea = 200
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
                        this.middleArea = e.clientY - mainArea.offsetTop - this.topArea
                    }
                    this.updateAreas()
                }
            })

        this.verticalDivider.mousedown(() => clickedDivider = 1)
        this.topDivider.mousedown(() => clickedDivider = 2)
        this.bottomDivider.mousedown(() => clickedDivider = 3)
        this.updateAreas()
    }

    panelChange() {
        if(this.topPanel.popped && this.middlePanel.popped && this.bottomPanel.popped) {
            this.rightArea = 0
        } else {
            let top = this.topPanel.popped
            let middle = this.middlePanel.popped
            let bottom = this.bottomPanel.popped

            if(this.rightArea === 0) {
                this.rightArea = 300
            }
            if(middle) {
                this.middleArea = 0
                if(top !== bottom) {
                    if(!top) {
                        this.topArea = mainArea.clientHeight - 40 //Top panel only
                    } else {
                        this.topArea = 0
                    }
                } else if(!top) {
                    this.topArea = 300
                }
            } else {
                this.middleArea = 100
                if(!top && !bottom) {
                    this.topArea = 300
                } else if(top && bottom) {
                    this.topArea = 0
                    this.middleArea = mainArea.clientHeight - 40
                } else if(!top && bottom) {
                    this.topArea = 300
                    this.middleArea = mainArea.clientHeight - 340
                } else { //top && !bottom
                    this.topArea = 0
                    this.middleArea = 300
                }
            }
        }
        this.updateAreas()
    }

    updateAreas() {
        this.verticalDivider.css('right', (this.rightArea-4) + "px")

        if(this.topArea === 0) {
            this.topDivider.css('display', 'none')
        } else {
            this.topDivider.css('display', 'unset')
            this.topDivider.css('top', (mainArea.offsetTop+this.topArea-4) + "px").css('right', '0px').css('width', this.rightArea + "px").css('left', 'unset')
        }

        if(this.middleArea === 0) {
            this.bottomDivider.css('display', 'none')
        } else {
            this.bottomDivider.css('display', 'unset')
            this.bottomDivider.css('top', (mainArea.offsetTop+this.topArea+this.middleArea-4) + "px").css('right', '0px').css('width', this.rightArea + "px").css('left', 'unset')
        }

        this.dom
            .css('grid-template-columns', `calc(100% - ${this.rightArea}px) ${this.rightArea}px`) 
            .css('grid-template-rows', `${this.topArea}px ${this.middleArea}px calc(100vh - ${this.topArea + this.middleArea + 52}px)`) 

        window.studioWindowResized()
    }
}
