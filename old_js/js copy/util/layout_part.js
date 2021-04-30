let activeSet = new Set()
//This is to make sure when the main window is unloaded (closed/refreshed), all the open windows are also closed
window.onbeforeunload = () => activeSet.forEach(e => e.win?.close())

/**
 * Layout part is used to control the popped out / popped in state of certian parts.
 */
export class LayoutPart {
    constructor(rootDom, onChanged, name = "popped_out", contentChanged = () => {}) {
        this.rootDom = rootDom
        this.onChanged = onChanged
        this.name = name
        this.contentChanged = contentChanged
        this.parentNode = rootDom.parent()
        this.win = null
        this.poppedOut = false
        //When popout button is clicked, toggle
        rootDom.find('.popout-button').click(() => this.popped = !this.popped)
    }

    get popped() {
        return this.poppedOut
    }

    set popped(popped) {
        //If not changed, return
        if(this.poppedOut === popped) {
            return
        }
        this.poppedOut = popped
        if(popped) {
            //Popout the element
            activeSet.add(this)

            //If there is a window, use it, otherwise create it
            if(this.win === null) {
                let width = this.rootDom.width()
                let height = this.rootDom.height()
                let offset = this.rootDom.offset()
                let top = window.screenY + offset.top
                let left = window.screenX + offset.left
                this.rootDom.detach()
                //Create it from the template
                this.win = window.open(`templates/${this.name}.html`, 'Test Window ' + Math.random(), `top=${top},screenY=${top},left=${left},screenX=${left},height=${height},width=${width}`)
                //When  the window is loaded, set the unload stuff and append the dom elements
                this.win.onload = () => {
                    this.rootDom.appendTo($(this.win.document.body).find('#content-area'))
                    this.win.onbeforeunload  = () => {
                        if(this.popped) {
                            this.popped = false
                        }
                    }
                    this.contentChanged(popped)
                }
            }
        } else {
            //Unpopout the element
            activeSet.delete(this)
            if(this.win !== null) {
                //Close the window and remove it. Attach the dom elements back
                this.win.close()
                this.contentChanged(popped)
                this.win = null
                this.rootDom.detach().appendTo(this.parentNode)
            }
        }
        this.onChanged(popped)
    }
}

