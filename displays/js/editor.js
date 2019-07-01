import { onWindowResize, createGif } from "./displays.js"

const container = document.getElementById("editor-container")
const panel = document.getElementById("editor");
const canvasContainer = document.getElementById("display-div");

window.downloadGif = async(elem) => {
    elem.classList.toggle("is-loading", true)
    elem.parentNode.classList.toggle("tooltip", true)

    elem.parentNode.dataset.tooltip = "Recording..."
    let blob = await createGif([...document.getElementsByClassName('fps-radio')].find(elem => elem.checked).getAttribute('fps'), p => {
        elem.parentNode.dataset.tooltip = Math.round(p * 100) + "%"
    })

    if(blob) {
        let url = URL.createObjectURL(blob)
        let a = document.createElement("a");
        a.href = url;
        a.download = "dinosaur.gif" //todo: name from model?
        a.click() 
    }

    elem.parentNode.classList.toggle("tooltip", false)
    elem.classList.toggle('is-loading', false)    
}

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

setHeights(300)

container.addEventListener("mousedown", e => {
    if (e.offsetY < 0) {
        clickY = 15 + e.offsetY
        document.addEventListener("mousemove", resize, false);
        document.body.className = "disable-select"
    }
}, false);

document.addEventListener("mouseup", () => {
    document.removeEventListener("mousemove", resize, false)
    document.body.className = undefined
}, false);