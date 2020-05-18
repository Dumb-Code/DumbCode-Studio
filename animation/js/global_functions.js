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

removeItem = (array, item) => {
    let newArr = [...array.filter(e => e !== item)]
    array.length = 0
    newArr.forEach(e => array.push(e))
}