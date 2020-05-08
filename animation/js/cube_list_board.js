export class CubeListBoard {
    constructor(cubeList, raytracer, tbl) {
        this.cubeList = cubeList
        this.raytracer = raytracer
        this.tbl = tbl
        this.elementMap = new Map()
        this.refreshCompleatly()
    }

    refreshCompleatly() {
        this.elementMap.clear()
        this.cubeList.innerHTML = "" //Remove all the children
        let root = this.tbl.rootGroup

        root.cubeList.forEach(c => this.createCube(this.cubeList, c, 0))
    }

    createCube(parent, cube, level) {
        let li = document.createElement("li")
        let a = document.createElement("a")
        a.style.paddingRight = "5px"
        a.innerText = cube.name
        a.onclick = () => this.raytracer.clickOnMesh(cube.planesGroup)
        a.onmousemove = () => this.raytracer.mouseOverMesh(cube.planesGroup)
        a.onmouseleave = () => this.raytracer.mouseOverMesh(undefined)
        li.appendChild(a)

        if(cube.children.length > 0) {
            let collapseA = document.createElement("a")
            let i = document.createElement("i")
            i.className = "fas fa-chevron-up"
            collapseA.onclick = () => {
                li.classList.toggle("is-collapsed")
                
                collapseA.children[0].classList.toggle("fa-chevron-up")
                collapseA.children[0].classList.toggle("fa-chevron-down")
            }
            collapseA.appendChild(i)
            li.append(collapseA)

            let ul = document.createElement("ul")
            ul.style.paddingLeft = "10px"
            ul.style.borderLeftColor = "gray"
            ul.style.borderLeftWidth = "1px"
            ul.style.borderLeftStyle = "solid"
            
            cube.children.forEach(c => this.createCube(ul, c, level + 1))
            li.appendChild(ul)
        }

        parent.appendChild(li)
        this.elementMap.set(cube, li)
    }
}