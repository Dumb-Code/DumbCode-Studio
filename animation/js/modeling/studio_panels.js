import { LayoutPart } from "../util.js"

const mainArea = document.getElementById("main-area")

export class StudioPanels {
    constructor(dom, studio) {
        this.domElement = studio.domElement


        this.leftPanel = new LayoutPart(dom.find('#panel-left'), this).onchange(e => {
            this.leftArea = e.value ? 0 : 300
            this.updateAreas()
        })

        this.rightTopPanel = new LayoutPart(dom.find('#panel-right-top'), this).onchange(() => this.rightPanelChange())
        this.rightBottomPanel = new LayoutPart(dom.find('#panel-right-bottom'), this).onchange(() => this.rightPanelChange())

        //Setup the dividers to allow for changing the panel size
        this.leftDivider = dom.find("#left-divider")
        this.rightDivider = dom.find("#right-divider")
        this.rightHorizontalDivider = dom.find("#right-horizontal-divider")

        this.leftArea = 300
        this.rightArea = 300
        this.topRArea = 300
        let clickedDivider = -1
        $(document)
            .mouseup(() => clickedDivider = 0)
            .mousemove(e => {
                if(clickedDivider !== 0) {
                    if(clickedDivider === 1) {
                        this.leftArea = e.clientX
                    } else if(clickedDivider === 2) {
                        this.rightArea = mainArea.clientWidth - e.clientX
                    } else if(clickedDivider === 3) {
                        this.topRArea = e.clientY - mainArea.offsetTop
                    }
                    this.updateAreas()
                }
            })

        this.leftDivider.mousedown(() => clickedDivider = 1)
        this.rightDivider.mousedown(() => clickedDivider = 2)
        this.rightHorizontalDivider.mousedown(() => clickedDivider = 3)
        this.updateAreas()
    }

    rightPanelChange() {
        if(this.rightTopPanel.value && this.rightBottomPanel.value) {
            this.rightArea = 0
        } else {
            if(this.rightArea === 0) {
                this.rightArea = 300
            }
            if(this.rightTopPanel.value !== this.rightBottomPanel.value) {
                if(!this.rightTopPanel.value) { //Top panel only
                    this.topRArea = mainArea.clientHeight - 40
                } else { //Bottom panel only
                    this.topRArea = 0
                }
            } else if(!this.rightTopPanel.value) {
                this.topRArea = 300
            }
        }
        this.updateAreas()
    }

    updateAreas() {
        this.leftDivider.css('left', (this.leftArea-4) + "px")
        this.rightDivider.css('right', (this.rightArea-4) + "px")
        this.rightHorizontalDivider.css('top', (mainArea.offsetTop+this.topRArea-4) + "px").css('right', '0px').css('width', this.rightArea + "px").css('left', 'unset')

        this.domElement.style.gridTemplateColumns = this.leftArea + "px " + " calc(100% - " + (this.leftArea + this.rightArea) + "px) " + this.rightArea + "px"
        this.domElement.style.gridTemplateRows = this.topRArea + "px " + " calc(100vh - " + (this.topRArea + 92) + "px) 40px"

        window.studioWindowResized()
    }
}