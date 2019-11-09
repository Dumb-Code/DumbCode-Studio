const data = {

    Home: { type: "single", link: "../index.html", text: "HOME" },
    Projects: [
        { link: "../index.html#projectnublar", text: "PROJECT NUBLAR" },
        { link: "../index.html#dumblibrary", text: "DUMB LIBRARY" },
        { link: "../index.html#gradlehook", text: "GRADLEHOOK" }
    ],

    Animation: [
        { link: "../studio/", text: "ANIMATION STUDIO" },
        { link: "../studio/viewer.html", text: "ANIMATION VIEWER" },
    ],

    AboutUs: { type:"single", link: "../team.html", text: "ABOUT US" }
}

element = (type, classname, text) => {
    let node = document.createElement(type)
    if(classname !== undefined) {
        node.className = classname
    }
    if(text !== undefined) {
        node.innerText = text
    }
    return node
}

for (let k in data) {
    let rootContainer = element("div")

    if(data[k].type === "single") {
        let node = rootContainer.appendChild(element("a", "navbar-item center"))
        node.href = data[k].link
        node.innerText = data[k].text
    } else {
        let root = rootContainer.appendChild(element("div", "navbar-item has-dropdown is-hoverable"))

        root.appendChild(element("a", "navbar-link", k))
        
        let container = root.appendChild(element("div", "navbar-dropdown is-hoverable has-background-black"))
        data[k].forEach(d => {
            let elem = container.appendChild(element("a", "navbar-item center is-size-7 has-text-light", d.text))
            elem.href = d.link
        })
    }
    document.write(rootContainer.innerHTML)
}