const mainArea = document.getElementById("main-area")

export class StudioPanels {
    constructor(dom, studio) {
        this.domElement = studio.domElement

        this.leftPanel = new LayoutPart(dom.find('#panel-left'), e => {
            this.leftArea = e ? 0 : 300
            this.updateAreas()
        })
        this.rightTopPanel = new LayoutPart(dom.find('#panel-right-top'), () => this.rightPanelChange())
        this.rightBottomPanel = new LayoutPart(dom.find('#panel-right-bottom'), () => this.rightPanelChange())

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
        if(this.rightTopPanel.popped && this.rightBottomPanel.popped) {
            this.rightArea = 0
        } else {
            if(this.rightArea === 0) {
                this.rightArea = 300
            }
            if(this.rightTopPanel.popped !== this.rightBottomPanel.popped) {
                if(!this.rightTopPanel.popped) { //Top panel only
                    this.topRArea = mainArea.clientHeight - 40
                } else { //Bottom panel only
                    this.topRArea = 0
                }
            } else if(!this.rightTopPanel.popped) {
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


let activeSet = new Set()
//This is to make sure when the main window is unloaded (closed/refreshed), all the open windows are also closed
window.onbeforeunload = () => activeSet.forEach(e => e.win?.close())

class LayoutPart {
    constructor(rootDom, onChanged) {
        this.rootDom = rootDom
        this.onChanged = onChanged
        this.parentNode = rootDom.parent()
        this.win = null
        this.poppedOut = false
        rootDom.find('.popout-button').click(() => this.popped = !this.popped)
    }

    get popped() {
        return this.poppedOut
    }

    set popped(popped) {
        if(this.poppedOut === popped) {
            return
        }
        this.poppedOut = popped
        if(popped) {
            activeSet.add(this)
            if(this.win === null) {
                let width = this.rootDom.width()
                let height = this.rootDom.height()
                let offset = this.rootDom.offset()
                let top = window.screenY + offset.top
                let left = window.screenX + offset.left
                this.rootDom.detach()
                this.win = window.open('templates/popped_out.html', 'Test Window ' + Math.random(), `top=${top},screenY=${top},left=${left},screenX=${left},height=${height},width=${width}`)
                this.win.onload = () => this.rootDom.appendTo(this.win.document.body)
                this.win.onbeforeunload  = () => {
                    if(this.popped) {
                        this.popped = false
                    }
                }
            }
        } else {
            activeSet.delete(this)
            if(this.win !== null) {
                this.win.close()
                this.win = null
                this.rootDom.detach().appendTo(this.parentNode)
            }
        }
        this.onChanged(popped)
    }
}
