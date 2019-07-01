import { onWindowResize } from "./displays.js"

const BORDER_SIZE = 10;
const container = document.getElementById("editor-container")
const panel = document.getElementById("editor");
const canvasContainer = document.getElementById("display-div");

let clickY; //Used to track what part of the border has been clicked
function resize(e) {
    let range = window.innerHeight + canvasContainer.offsetTop
    let height = range - (e.y) + clickY 


    let panelHeight = Math.min(Math.max(height, 100), 500)
    setHeights(panelHeight)
}

function setHeights(panelHeight) {
    panel.style.height = panelHeight + "px";
    canvasContainer.style.height = (window.innerHeight - panelHeight) + "px"
    onWindowResize()
}

setHeights(100)

container.addEventListener("mousedown", e => {
    if (e.offsetY < BORDER_SIZE) {
        clickY = e.offsetY
        document.addEventListener("mousemove", resize, false);
    }
}, false);

document.addEventListener("mouseup", () => document.removeEventListener("mousemove", resize, false), false);