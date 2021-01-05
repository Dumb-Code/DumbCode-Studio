loadHtml = async file => {
    return new Promise(resolve => {
        $.get("templates/" + file + ".html", html => {
            let div = document.createElement("div")
            $(html).appendTo(div)
            div.id = "template-div"
            applyModalPopups(div)
            resolve(div)
        }, "html")
    })
}

const _htmlCache = new Map()
let locked = false

applyModalPopups = async(html) => {
    $(html).find('.popup-modal-button').click(async function() {
        openModal(this.getAttribute('modal-target'))
    })
}

openModal = async name => {
    locked = false
    let modal = await getModal(name)

    modal.classList.add('modal', 'is-active')

    const parentHTML = document.getElementById('modal-area')
    parentHTML.innerHTML = ""
    parentHTML.appendChild(modal)
    return $(modal)
}

getModal = async(name) => {
    if(!_htmlCache.has(name)) {
        let h = await loadHtml(name)
        $(h).click(e => {
            if(e.target.classList.contains('modal-background') && locked !== true) {
                closeModal()
            }
        })
        .find('.modal-close, .modal-close-button').click(() => {
            if(locked !== true) {
                closeModal()
            }
        })
        
        _htmlCache.set(name, h)
    }

    return _htmlCache.get(name)
}

lockModalUserClose = () => {
    locked = true
}

closeModal = () => {
    document.getElementById('modal-area').innerHTML = ""
}

removeItem = (array, item) => {
    let newArr = [...array.filter(e => e !== item)]
    array.length = 0
    newArr.forEach(e => array.push(e))
}

$(document)
.ready(() => applyModalPopups(document))





// ############### TOOLTIPS ###############

const tooltipDiv = document.createElement('div')
const framesTillShowMs = 200 

let frameTimeTillShow = 0
let tooltipElement = null
let previousElement = null
let mousePoint = { x:0, y:0 }
let lockedMousePoint = null

const clampPadding = 5
function clamp(value, width, max) {
    if(value < clampPadding) {
        return clampPadding
    }
    if(value + width > max - clampPadding) {
        return max - width - clampPadding
    }
    return value
}

function updateTooltip(time) {
    requestAnimationFrame(updateTooltip)
    
    if(tooltipElement) {
        if(previousElement !== tooltipElement) {
            frameTimeTillShow = time + framesTillShowMs
            lockedMousePoint = null
        }
        if(frameTimeTillShow !== 0 && time >= frameTimeTillShow) {
            if(lockedMousePoint === null) {
                lockedMousePoint = {...mousePoint}
            }
            tooltipDiv.classList.add('is-active')
            tooltipDiv.innerText = tooltipElement.getAttribute('data-tooltip')?.replace('\\n', '\n')
            tooltipDiv.style.left = clamp(lockedMousePoint.x-tooltipDiv.clientWidth/2, tooltipDiv.clientWidth, window.innerWidth) + 'px'
            tooltipDiv.style.top = clamp(lockedMousePoint.y-tooltipDiv.clientHeight-15,tooltipDiv.clientHeight, window.innerHeight) + 'px'
        }
    } else {
        // frameTimeTillShow = 0
        lockedMousePoint = null
        tooltipDiv.classList.remove('is-active')
    }

    previousElement = tooltipElement
}

$(document)
.ready(() => {
    tooltipDiv.classList.add('tooltip-container')
    document.body.append(tooltipDiv)
    updateTooltip()
})
.mousemove(e => {
    for(let elem of document.elementsFromPoint(e.clientX, e.clientY)) {
        if(elem.classList.contains('tooltip')) {
            tooltipElement = elem
            mousePoint.x = e.clientX
            mousePoint.y = e.clientY
            return
        }
    }
    tooltipElement = null
})
