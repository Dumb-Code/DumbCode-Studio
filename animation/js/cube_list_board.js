export class CubeListBoard {
    constructor(cubeList, raytracer, tbl, toggleLock) {
        this.cubeList = cubeList
        this.raytracer = raytracer
        this.tbl = tbl
        this.toggleLock = toggleLock
        this.elementMap = new Map()
        this.refreshCompleatly()
    }

    refreshCompleatly() {
        let oldMap = new Map(this.elementMap)
        this.elementMap.clear()
        this.cubeList.innerHTML = "" //Remove all the children
        let root = this.tbl.rootGroup

        root.cubeList.forEach(c => this.createCube(this.cubeList, c, oldMap))
    }

    createCube(parent, cube, oldMap) {
        let li = document.createElement("li")
        let a = document.createElement("a")
        let lock = this.createLockIcon()

        li.setAttribute('cubename', cube.name)
        a.style.paddingRight = "5px"
        a.innerText = cube.name
        a.oncontextmenu = () => {
            if(this.toggleLock(cube)) {
                lock.style.display = null
            } else {
                lock.style.display = "none"
            }
            return false
        }
        a.onclick = () => this.raytracer.clickOnMesh(cube.planesGroup)
        a.onmousemove = () => this.raytracer.mouseOverMesh(cube.planesGroup)
        a.onmouseleave = () => this.raytracer.mouseOverMesh(undefined)
        lock.style.display = oldMap.has(cube) ? oldMap.get(cube).lock.style.display : "none"

        li.appendChild(a)
        li.appendChild(lock)
    
        let i
        if(cube.children.length > 0) {
            let collapseA = document.createElement("a")
            i = document.createElement("i")
            let className = oldMap.get(cube)?.i?.className

            i.className = className !== undefined ? className : "fas fa-chevron-up"

            if(oldMap.has(cube)) {
                li.classList.toggle("is-collapsed", oldMap.get(cube).li.classList.contains("is-collapsed"))
            }

            collapseA.onclick = () => {
                li.classList.toggle("is-collapsed")
                
                //Cannot just reference the i, as fa replaces the i tag
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
            
            cube.children.forEach(c => this.createCube(ul, c, oldMap))
            li.appendChild(ul)
        }

        parent.appendChild(li)
        this.elementMap.set(cube, {li, a, i, lock})
    }

    createLockIcon() {
        let lockSpan = document.createElement("span")
        lockSpan.classList.add("icon", "is-small")

        let lockI = document.createElement("i")
        lockI.classList.add("fas", "fa-lock")

        lockSpan.appendChild(lockI)
        return lockSpan
    }
}