const mainArea = document.getElementById("main-area")

export class StudioPanels {
    constructor(dom, studio) {

        this.leftPanel = new LayoutPart(dom.find('#panel-left'), e => {
            this.leftArea = e ? 0 : 300
            this.updateAreas()
        })
        this.rightTopPanel = new LayoutPart(dom.find('#panel-right-top'), () => this.rightPanelChange())
        this.rightMiddlePanel = new LayoutPart(dom.find('#panel-right-middle'), () => this.rightPanelChange())
        this.rightBottomPanel = new LayoutPart(dom.find('#panel-right-bottom'), () => this.rightPanelChange())

        //Setup the dividers to allow for changing the panel size
        this.leftDivider = dom.find("#left-divider")
        this.rightDivider = dom.find("#right-divider")
        this.rightHorizontalTopDivider = dom.find("#right-horizontal-top-divider")
        this.rightHorizontalBottomDivider = dom.find("#right-horizontal-bottom-divider")

        this.leftArea = 300
        this.rightArea = 300
        this.topRArea = 300
        this.topMArea = 100
        let clickedDivider = 0
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
                    }  else if(clickedDivider === 4) {
                        this.topMArea = e.clientY - mainArea.offsetTop - this.topRArea
                    }
                    this.updateAreas()
                }
            })

        this.leftDivider.mousedown(() => clickedDivider = 1)
        this.rightDivider.mousedown(() => clickedDivider = 2)
        this.rightHorizontalTopDivider.mousedown(() => clickedDivider = 3)
        this.rightHorizontalBottomDivider.mousedown(() => clickedDivider = 4)
        this.updateAreas()
    }

    rightPanelChange() {
        if(this.rightTopPanel.popped && this.rightMiddlePanel.popped && this.rightBottomPanel.popped) {
            this.rightArea = 0
        } else {
            let top = this.rightTopPanel.popped
            let middle = this.rightMiddlePanel.popped
            let bottom = this.rightBottomPanel.popped

            if(this.rightArea === 0) {
                this.rightArea = 300
            }
            if(middle) {
                this.topMArea = 0
                if(top !== bottom) {
                    if(!top) {
                        this.topRArea = mainArea.clientHeight - 40 //Top panel only
                    } else {
                        this.topRArea = 0
                    }
                } else if(!top) {
                    this.topRArea = 300
                }
            } else {
                this.topMArea = 100
                if(!top && !bottom) {
                    this.topRArea = 300
                } else if(top && bottom) {
                    this.topRArea = 0
                    this.topMArea = mainArea.clientHeight - 40
                } else if(!top && bottom) {
                    this.topRArea = 300
                    this.topMArea = mainArea.clientHeight - 340
                } else { //top && !bottom
                    this.topRArea = 0
                    this.topMArea = 300
                }
            }
        }
        this.updateAreas()
    }

    updateAreas() {
        this.leftDivider.css('left', (this.leftArea-4) + "px")
        this.rightDivider.css('right', (this.rightArea-4) + "px")

        if(this.topRArea === 0) {
            this.rightHorizontalTopDivider.css('display', 'none')
        } else {
            this.rightHorizontalTopDivider.css('display', 'unset')
            this.rightHorizontalTopDivider.css('top', (mainArea.offsetTop+this.topRArea-4) + "px").css('right', '0px').css('width', this.rightArea + "px").css('left', 'unset')
        }

        if(this.topMArea === 0) {
            this.rightHorizontalBottomDivider.css('display', 'none')
        } else {
            this.rightHorizontalBottomDivider.css('display', 'unset')
            this.rightHorizontalBottomDivider.css('top', (mainArea.offsetTop+this.topRArea+this.topMArea-4) + "px").css('right', '0px').css('width', this.rightArea + "px").css('left', 'unset')
        }

        let d = document.getElementById('modeling-area')
        $('#modeling-area')
            .css('grid-template-columns', `${this.leftArea}px calc(100% - ${this.leftArea + this.rightArea}px) ${this.rightArea}px`) 
            .css('grid-template-rows', `${this.topRArea}px ${this.topMArea}px calc(100vh - ${this.topRArea + this.topMArea + 92}px) 40px`) 

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
