import { LayoutPart } from "../util.js"

const mainArea = document.getElementById("main-area")

export class StudioPanels {
    constructor(dom) {
        this.dom = dom
        this.topPanelDom = dom.find('#panel-top')
        this.bottomPanelDom = dom.find('#panel-bottom')
        this.topPanel = new LayoutPart(this.topPanelDom, () => this.rightPanelPopped())
        this.bottomPanel = new LayoutPart(this.bottomPanelDom, () => this.rightPanelPopped())

        //Setup the dividers to allow for changing the panel size
        this.rightDivider = dom.find("#right-divider")
        this.controlsDivider = dom.find("#controls-divider")
        this.commandDivider = dom.find("#command-divider")

        this.middleSplit = false

        this.commandsArea = 32
        this.rightArea = 320
        this.topArea = 430

        let clickedDivider = 0
        $(document)
            .mouseup(() => clickedDivider = 0)
            .mousemove(e => {
                if(clickedDivider !== 0) {
                    if(clickedDivider === 1) {
                        this.rightArea = mainArea.clientWidth - e.clientX
                    } else if(clickedDivider === 2) {
                        this.topArea = e.clientY - mainArea.offsetTop
                    } else if(clickedDivider === 3) {
                        this.commandsArea = e.clientY - mainArea.offsetTop
                    }
                    this.updateAreas()
                }
            })
        
            $(window).resize(() => this.updateAreas())

        this.rightDivider.mousedown(() => clickedDivider = 1)
        this.controlsDivider.mousedown(() => clickedDivider = 2)
        this.commandDivider.mousedown(() => clickedDivider = 3)
        this.updateAreas()
    }

    rightPanelPopped() {
        if(this.topPanel.popped && this.bottomPanel.popped) {
            this.rightArea = 0
        } else {
            if(this.rightArea === 0) {
                this.rightArea = 320
            }

            if(this.topPanel.popped !== this.bottomPanel.popped) {
                if(this.topPanel.popped) {
                    this.bottomPanelDom.css('grid-area', 'right_top / right_top / right_bottom / right_bottom')
                } else {
                    this.topPanelDom.css('grid-area', 'right_top / right_top / right_bottom / right_bottom')
                }
                this.middleSplit = true
            } else {
                this.topPanelDom.css('grid-area', 'right_top / right_top / right_top / right_top')
                this.bottomPanelDom.css('grid-area', 'right_bottom / right_bottom / right_bottom / right_bottom')
                this.middleSplit = false
            }

        }
        this.updateAreas()
    }

    useUpPanel() {
        if(this.rightArea === 0) {
            this.rightArea = 320
        }
        
        this.updateAreas()
    }

    discardRightPanel() {
        if(this.topPanel.popped && this.bottomPanel.popped) {
            this.rightArea = 0
        }
        this.updateAreas()
    }

    updateAreas() { 
        this.rightDivider.css('right', (this.rightArea-4) + "px")
        this.controlsDivider.css('left', `${mainArea.clientWidth - this.rightArea}px`).css('width', `${this.rightArea}px`).css('top', `${mainArea.offsetTop + this.topArea}px`)
        this.commandDivider.css('top', `${mainArea.offsetTop + this.commandsArea - 4}px`).css('width', `${mainArea.clientWidth-this.rightArea}px`)
        
        this.rightDivider.css('display', this.rightArea === 0 ? 'none' : 'unset')
        this.controlsDivider.css('display', this.middleSplit ? 'none' : 'unset')
        this.commandDivider.css('display', this.commandsArea === 0 ? 'none' : 'unset')

        this.dom
            .css('grid-template-columns', `32px ${mainArea.clientWidth - 32 - this.rightArea}px ${this.rightArea}px`)
            .css('grid-template-rows', `${this.commandsArea}px ${this.topArea - this.commandsArea}px ${window.innerHeight - mainArea.offsetTop - this.topArea - 60}px 32px 28px`)
            

        window.studioWindowResized()
    }
}
