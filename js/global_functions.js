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

applyModalPopups = async(html) => {
    $(html).find('.popup-modal-button').click(async function(e) {
        let modal = await getModal(html, this.getAttribute('modal-target'))

        modal.classList.add('modal', 'is-active')

        const parentHTML = document.getElementById('modal-area')
        parentHTML.innerHTML = ""
        parentHTML.appendChild(modal)
    })
}


getModal = async (dom, name) => {
    if(!_htmlCache.has(dom)) {
        _htmlCache.set(dom, new Map())
    }

    let map = _htmlCache.get(dom)
    if(!map.has(name)) {
        let h = await loadHtml(name)
        $(h).click(e => {
            if(e.target.classList.contains('modal-background')) {
                document.getElementById('modal-area').innerHTML = ""
            }
        })
        .find('.modal-close').click(() => document.getElementById('modal-area').innerHTML = "")
        
        map.set(name, h)
    }

    return map.get(name)
}

removeItem = (array, item) => {
    let newArr = [...array.filter(e => e !== item)]
    array.length = 0
    newArr.forEach(e => array.push(e))
}

$(document).ready(() => applyModalPopups(document))