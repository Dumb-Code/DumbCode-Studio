const canvasContainer = document.getElementById("display-div");

export class ModelingStudio {

    constructor(display) {
        this.display = display
    }

    runFrame() {
        this.display.tbl.resetAnimations()
        this.display.render()
    }

    setActive() {
        canvasContainer.style.height = (window.innerHeight + canvasContainer.offsetTop) + "px"
        window.studioWindowResized()
    }

    setUnactive() {

    }
}