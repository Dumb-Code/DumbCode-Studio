import { LayoutPart } from "../util.js"

const mainArea = document.getElementById("main-area")

export class StudioPanels {
    constructor(dom) {
        this.dom = dom
        this.leftPanel = new LayoutPart(dom.find('#panel-left'), e => {
            this.leftArea = e ? 0 : 300
            this.updateAreas()
        })
        this.rightPanel = new LayoutPart(dom.find('#panel-right'), () => {
            this.rightArea = e ? 0 : 300
            this.updateAreas()
        })

        //Setup the dividers to allow for changing the panel size
        this.leftDivider = dom.find("#left-divider")
        this.rightDivider = dom.find("#right-divider")

        this.leftArea = 300
        this.rightArea = 300
        let clickedDivider = 0
        $(document)
            .mouseup(() => clickedDivider = 0)
            .mousemove(e => {
                if(clickedDivider !== 0) {
                    if(clickedDivider === 1) {
                        this.leftArea = e.clientX
                    } else if(clickedDivider === 2) {
                        this.rightArea = mainArea.clientWidth - e.clientX
                    }
                    this.updateAreas()
                }
            })

        this.leftDivider.mousedown(() => clickedDivider = 1)
        this.rightDivider.mousedown(() => clickedDivider = 2)
        this.updateAreas()
    }

    updateAreas() {
        this.leftDivider.css('left', (this.leftArea-4) + "px")
        this.rightDivider.css('right', (this.rightArea-4) + "px")

        this.dom
            .css('grid-template-columns', `${this.leftArea}px calc(100% - ${this.leftArea + this.rightArea}px) ${this.rightArea}px`) 
            .css('grid-template-rows', `${window.innerHeight - 92}px 40px`) 

        window.studioWindowResized()
    }
}
