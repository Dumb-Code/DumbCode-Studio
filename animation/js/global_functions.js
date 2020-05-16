loadHtml = async file => {
    return new Promise(resolve => {
        $.get("templates/" + file + ".html", html => {
            let div = document.createElement("div")
            $(html).appendTo(div)
            div.id = "template-div"
            resolve(div)
        }, "html")
    })
}