//deprecated. Used to be for the animation panels. 
export class AnimationPanel {

    constructor(dom) {
        this.editor = dom.find("#editor")
        this.displayDiv = dom.find(".display-div")
        this.panelHeight = 340
        this.clickY = 0
        this.updateAreas()
    }

    updateAreas() {
        // this.editor.css("height", this.panelHeight + "px");
        // this.displayDiv.css("height", window.innerHeight + "px");
        window.studioWindowResized()
    }

}