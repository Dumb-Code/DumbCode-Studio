export class AnimationPanel {

    constructor(dom) {
        this.editor = dom.find("#editor")
        this.displayDiv = dom.find("#display-div")
        this.panelHeight = 320
        this.clickY = 0
        let clickedDivider = false
        this.divider = dom.find('#animation-divider')
        this.divider.mousedown(() => clickedDivider = true)
        $(document)
        .mouseup(() => clickedDivider = false)
        .mousemove(e => {
            if(clickedDivider) {
                this.panelHeight = Math.min(Math.max(window.innerHeight - e.clientY + dom.get(0).getBoundingClientRect().top, 100), 500)
                this.updateAreas()
            }
        })
        this.updateAreas()
    }

    updateAreas() {
        this.divider.css('bottom', this.panelHeight + 4 + "px");
        this.editor.css("height", this.panelHeight + "px");
        this.displayDiv.css("height", (window.innerHeight - this.panelHeight) + "px");
        window.studioWindowResized()
    }

}