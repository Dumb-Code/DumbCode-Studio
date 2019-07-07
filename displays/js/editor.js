import { onWindowResize, createGif } from "./displays.js"

const container = document.getElementById("editor-container")
const panel = document.getElementById("editor");
const canvasContainer = document.getElementById("display-div");

let selected

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

window.setPosition = elem => {
    let num = Number(elem.value)
    if(Number.isNaN(num)) {
        return
    }
    let point = selected.tabulaCube.rotationPoint
    point[elem.getAttribute("axis")] = num
    setPosition(point)
}

window.setRotation = elem => {
    let num = Number(elem.value)
    if(Number.isNaN(num)) {
        return
    }
    let angles = selected.tabulaCube.rotation
    angles[elem.getAttribute("axis")] = num
    setRotation(angles)
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

export function setSelected(selectedElement) {
    [...document.getElementsByClassName("editor-require-selected")].forEach(elem => {
        elem.disabled = false
        elem.classList.toggle("is-active", true)
    })

    selected = selectedElement;

    setPosition(selected.tabulaCube.rotationPoint)
    setRotation(selected.tabulaCube.rotation)
}

function setPosition(values) {
    [...document.getElementsByClassName("input-position")].forEach(elem => {
        elem.value = values[elem.getAttribute("axis")]
    });

    selected.tabulaCube.rotationPoint = values
    selected.position.set(values[0], values[1], values[2])
}

function setRotation(values) {
    [...document.getElementsByClassName("input-rotation")].forEach(elem => {
        elem.value = values[elem.getAttribute("axis")]
    });

    [...document.getElementsByClassName("input-rotation-slider")].forEach(elem => {
        elem.value = ((values[elem.getAttribute("axis")] + 180) % 360) - 180
    });

    selected.tabulaCube.rotation = values
    selected.rotation.set(values[0] * Math.PI / 180, values[1] * Math.PI / 180, values[2] * Math.PI / 180)
}

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

document.addEventListener('DOMContentLoaded', () => setHeights(320), false);

