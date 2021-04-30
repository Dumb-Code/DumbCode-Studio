const disableSelect = e => e.preventDefault()

/**
 * Adds callbacks for an element to be dragged around. 
 * @param {*} element The element to make draggable
 * @param {*} infoClickGetter the info getter for this element
 * @param {*} callback the callback for when the element is dragged
 * @param {*} onreleased the release callback for when a drag stops
 */
export function onElementDrag(element, infoClickGetter = () => {}, callback = (dx, dy, info, x, y) => {}, onreleased = (max, dx, dy, x, y) => {}) {
    //When the element is clicked
    element.onmousedown = e => {
        let doc = element.ownerDocument
        let cx = e.clientX
        let cy = e.clientY
        let max = 0
        let info = infoClickGetter()
        //The mousemove callback
        let mousemove = evt => {
            let dx = evt.clientX - cx
            let dy = evt.clientY - cy

            max = Math.max(max, dx*dx + dy*dy)
            
            callback(dx, dy, info, evt.clientX, evt.clientY)
            evt.stopPropagation()
        }
        //Unbind the events
        let mouseup = evt => {
            doc.removeEventListener('mousemove', mousemove)
            doc.removeEventListener('mouseup', mouseup)
            doc.removeEventListener('selectstart', disableSelect)
            onreleased(Math.sqrt(max), evt.clientX - cx, evt.clientY - cy, evt.clientX, evt.clientY)
            evt.stopPropagation()
        }

        //Bind the events
        doc.addEventListener('mousemove', mousemove)
        doc.addEventListener('mouseup', mouseup)
        doc.addEventListener('selectstart', disableSelect)
        e.stopPropagation()
    }
}

/**
 * 
 * @param {*} container the dom container
 * @param {*} callback the callback for when the name changed
 * @param {*} current the current name (if any)
 */
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
/**
 * Direct keys. Used in every event.
 */
let directKeys = ["Alt", "Control", "Shift"]

//Bind the key events
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

/**
 * Get Whether a key is down
 * @param {string} key the key to test if down
 */
export function isKeyDown(key) {
    return pressedKeys.has(key)
}

/**
 * Binds a callback for a key
 * @param {string} key the key to bind to 
 * @param {*} onchange the callback
 */
export function listenForKeyChange(key, onchange) {
    let arr = keyListeners.has(key) ? keyListeners.get(key) : []
    arr.push(onchange)
    keyListeners.set(key, arr)
}

/**
 * Binds the element to be a file upload box. Allows for users to drag and drop files into the area
 * @param {*} dom the element to bind
 * @param {*} callback the callback for when a file is uploaded
 */
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

/**
 * Adjusts the inputs in the dom to change when the user is pressing shift or control
 * @param {*} dom the root element
 */
export function applyAdjustScrollable(dom) {
    dom.bind('mousewheel DOMMouseScroll', e => {
        if(e.target.classList.contains("studio-scrollchange") && e.target.disabled !== true && e.target.value !== "") {
            let direction = e.originalEvent.wheelDelta
            if(direction === undefined) { //Firefox >:(
                direction = -e.detail
            }

            //The step in the direction
            let change = Math.sign(direction) * (e.target.hasAttribute("step-mod") ? parseFloat(e.target.getAttribute('step-mod')) : 1)
           
            //If has the parent class, then don't apply the changes.
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

            //Set the event value and dispatch the event
            e.target.value = `${Math.round((parseFloat(e.target.value) + change) * 10000) / 10000}`
            e.target.dispatchEvent(new Event("input"))

            e.preventDefault()
            e.stopPropagation()
        }
        
    })
}

/**
 * Weird function to get if a future parent has a certian class.
 */
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


/**
 * Gets the files from a file input, and removes the events from the element
 * @param {*} event the upload event 
 */
export function getAndDeleteFiles(event) {
    let files = [...event.target.files]
    event.target.value = ""
    return files
}

let a = document.createElement("a");

/**
 * Downloads a blob as a certian name
 * @param {string} name name of the blob
 * @param {Blob} blob the blob to download
 */
export function downloadBlob(name, blob) {
    let url = window.URL.createObjectURL(blob)
    downloadHref(name, url)
    window.URL.revokeObjectURL(url)
}

/**
 * Downlaods a canvas as a png file
 * @param {string} name name to download
 * @param {*} canvas canvas to download
 */
export function downloadCanvas(name, canvas) {
    downloadHref(name, canvas.toDataURL("image/png;base64"))
}

/**
 * Downloads the dataurl as name
 * @param {string} name the name of the element
 * @param {*} href the href to download as
 */
export function downloadHref(name, href) {
    a.href = href
    a.download = name
    a.click()
}