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

$(document).ready(() => applyModalPopups(document))