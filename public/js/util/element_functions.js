const disableSelect = e => e.preventDefault()

export function onElementDrag(element, infoClickGetter = () => {}, callback = (dx, dy, info, x, y) => {}, onreleased = (max, dx, dy, x, y) => {}) {
    element.onmousedown = e => {
        let doc = element.ownerDocument
        let cx = e.clientX
        let cy = e.clientY
        let max = 0
        let info = infoClickGetter()
        let mousemove = evt => {
            let dx = evt.clientX - cx
            let dy = evt.clientY - cy

            max = Math.max(max, dx*dx + dy*dy)
            
            callback(dx, dy, info, evt.clientX, evt.clientY)
            evt.stopPropagation()
        }
        let mouseup = evt => {
            doc.removeEventListener('mousemove', mousemove)
            doc.removeEventListener('mouseup', mouseup)
            doc.removeEventListener('selectstart', disableSelect)
            onreleased(Math.sqrt(max), evt.clientX - cx, evt.clientY - cy, evt.clientX, evt.clientY)
            evt.stopPropagation()
        }
        doc.addEventListener('mousemove', mousemove)
        doc.addEventListener('mouseup', mouseup)
        doc.addEventListener('selectstart', disableSelect)
        e.stopPropagation()
    }
}

export function doubleClickToEdit(container, callback, current) {
    let text = container.find('.dbl-text')
    let textEdit = container.find('.dbl-text-edit')

    container.dblclick(() => {
        container.addClass('is-editing')
        textEdit.val(text.text())
        textEdit.select()
    })
    textEdit
        .on('input', e => {
            let t = e.target.value
            text.text(t)
            callback(t)
        })
        .focusout(() => container.removeClass('is-editing'))
        .keyup(e => {
            if(e.key === "Enter") {
                container.removeClass('is-editing')
            }
        })

    if(current !== undefined) {
        text.text(current)
    }
}


let pressedKeys = new Set();
let keyListeners = new Map()
let keydown = key => {
    pressedKeys.add(key)
    keyListeners.get(key)?.forEach(func => func(true))
}
let keyup = key => {
    pressedKeys.delete(key)
    keyListeners.get(key)?.forEach(func => func(false))
}
let mouseMoveKey = (key, pressed) => {
    if(pressed !== pressedKeys.has(key)) {
        if(pressed) {
            keydown(key)
        } else {
            keyup(key)
        }
    }
}
let runEventDirectKeys = e => {
    mouseMoveKey(directKeys[0], e.altKey)
    mouseMoveKey(directKeys[1], e.ctrlKey)
    mouseMoveKey(directKeys[2], e.shiftKey)
}
let directKeys = ["Alt", "Control", "Shift"]

$(document)
    .keydown(e => {
        keydown(e.key)
        runEventDirectKeys(e)
    })
    .keyup(e => {
        keyup(e.key)
        runEventDirectKeys(e)
    })
    .mousemove(e => runEventDirectKeys(e))
export function isKeyDown(key) {
    return pressedKeys.has(key)
} 
export function listenForKeyChange(key, onchange) {
    let arr = keyListeners.has(key) ? keyListeners.get(key) : []
    arr.push(onchange)
    keyListeners.set(key, arr)
}


export function fileUploadBox(dom, callback) {
    dom.on('dragenter', e => {
        if(e.originalEvent.dataTransfer.types.includes('Files')) {
            dom.addClass('is-dragging')
            e.originalEvent.preventDefault()
            e.originalEvent.stopPropagation()
        }
    }).on('dragover', e => {
        if(e.originalEvent.dataTransfer.types.includes('Files')) {
            dom.addClass('is-dragging')
            e.originalEvent.preventDefault()
            e.originalEvent.stopPropagation()
        }
    }).on('dragleave', e => {
        if(e.originalEvent.dataTransfer.types.includes('Files')) {
            dom.removeClass('is-dragging')
            e.originalEvent.preventDefault()
            e.originalEvent.stopPropagation()
        }
    }).on('drop', e => {
        if(e.originalEvent.dataTransfer.files.length !== 0) {
            callback(e.originalEvent.dataTransfer.files)
            dom.removeClass('is-dragging')
            e.originalEvent.preventDefault()
            e.originalEvent.stopPropagation()
        }
    })
}


export function applyAdjustScrollable(dom) {
    dom.bind('mousewheel DOMMouseScroll', e => {
        if(e.target.classList.contains("studio-scrollchange") && e.target.disabled !== true && e.target.value !== "") {
            let direction = e.originalEvent.wheelDelta
            if(direction === undefined) { //Firefox >:(
                direction = -e.detail
            }

            let change = Math.sign(direction) * (e.target.hasAttribute("step-mod") ? parseFloat(e.target.getAttribute('step-mod')) : 1)
           
            if(hasParentClass(e.target, "step-constant-marker", "input-top-level")) {
                let ctrl = e.ctrlKey
                let shift = e.shiftKey
    
                if(ctrl && shift) {
                    change *= 10 
                } else if(ctrl) {
                    change *= 0.01
                } else if(!shift) {
                    change *= 0.1
                }
            }

            e.target.value = `${Math.round((parseFloat(e.target.value) + change) * 10000) / 10000}`
            e.target.dispatchEvent(new Event("input"))

            e.preventDefault()
            e.stopPropagation()
        }
        
    })
}

function hasParentClass(element, className, clazzBeforeCheck) {
    if(element.classList.contains("disable-upwards-looking")) {
        return true
    }
    let node = element
    while(!node.classList.contains(clazzBeforeCheck)) {
        node = node.parentNode
    }
    return !node.parentNode.classList.contains(className)
}



export function getAndDeleteFiles(event) {
    let files = [...event.target.files]
    event.target.value = ""
    return files
}

let a = document.createElement("a");

export function downloadBlob(name, blob) {
    let url = window.URL.createObjectURL(blob)
    downloadHref(name, url)
    window.URL.revokeObjectURL(url)
}

export function downloadCanvas(name, canvas) {
    downloadHref(name, canvas.toDataURL("image/png;base64"))
}

export function downloadHref(name, href) {
    a.href = href
    a.download = name
    a.click()
}