import { isKeyDown } from "../util.js"

export class CubeListBoard {
    constructor(cubeList, raytracer, tbl, lockedCubes) {
        this.cubeList = cubeList
        this.raytracer = raytracer
        this.tbl = tbl
        this.lockedCubes = lockedCubes
        this.previousDragElement
        this.elementMap = new Map()

        this.cubeList.ondragover = e => {
            if(e.target == this.cubeList) {
                this.previousDragElement?.removeAttribute("drag-state")
                e.preventDefault()
            }
        }
        this.cubeList.ondrop = e => {
            let cube = tbl.cubeMap.get(e.dataTransfer.getData("cubename"))
            if(e.target == this.cubeList && cube !== undefined) {
                this.lockedCubes.createLockedCubesCache()
                cube.parent.deleteChild(cube, true)
                tbl.rootGroup.addChild(cube)
                this.lockedCubes.reconstructLockedCubes()
            }
        }

        this.cubeList.onclick = e => {
            if(e.target.nodeName == 'UL') {
                this.raytracer.deselectAll()
            }
        }

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
        let div = document.createElement("div")
        let a = document.createElement("a")
        let lock = this.createLockIcon()

        a.draggable = true
        a.ondragstart = e => e.dataTransfer.setData("cubename", cube.name)
        div.classList.add("cube-line-controller")
        div.setAttribute('cubename', cube.name)

        let getPrevious = () => this.previousDragElement
        let setPrevious = p => this.previousDragElement = p
        div.ondragover = function(e) {
            let rect = this.getBoundingClientRect()
            let yPerc = (e.clientY - rect.top) / rect.height
    
            if(this !== getPrevious()) {
                getPrevious()?.removeAttribute("drag-state")
                setPrevious(this)
            }

            //Don't drag onto self
            if(e.dataTransfer.getData("cubename") === cube.name) {
                this.removeAttribute("drag-state")
                return
            }
    
            let buffer = 1/3
            if(yPerc <= buffer) {
                this.setAttribute("drag-state", "top")
            } else if(yPerc > 1 - buffer) {
                this.setAttribute("drag-state", "bottom")
            } else {
                this.setAttribute("drag-state", "on")
            }
    
            e.preventDefault()
        }
        
        let tbl = this.tbl
        let lockedCubes = this.lockedCubes
        div.ondrop = function(e) {
            let type = this.getAttribute("drag-state")
            let draggedCube = tbl.cubeMap.get(e.dataTransfer.getData("cubename"))
            let droppedOnto = tbl.cubeMap.get(cube.name)
            if(draggedCube !== undefined && droppedOnto !== undefined && type !== undefined) {
                this.lockedCubes.createLockedCubesCache()
                draggedCube.parent.deleteChild(draggedCube, true)
                if(type === "on") {
                    droppedOnto.addChild(draggedCube)
                } else {
                    let index = droppedOnto.parent.getChildren().indexOf(droppedOnto)
                    if(type === "bottom") {
                        index++
                    }
                    droppedOnto.parent.getChildren().splice(index, 0, draggedCube)
                    droppedOnto.parent.onChildrenChange(false)
                }
                this.lockedCubes.reconstructLockedCubes()
            }
        }
    
        a.style.paddingRight = "5px"
        a.innerText = cube.name
        a.oncontextmenu = () => {
            let ctrl = isKeyDown("Control")
            let isHidden = this.toggleLock(cube, 0)
            if(isHidden) {
                if(ctrl) {
                    cube.getAllChildrenCubes([]).forEach(cube => {
                        this.toggleLock(cube, -1)
                        this.elementMap.get(cube).lock.classList.remove("is-locked")
                    })
                }
                lock.classList.remove("is-locked")
            } else {
                if(ctrl) {
                    cube.getAllChildrenCubes([]).forEach(cube => {
                        this.toggleLock(cube, 1)
                        this.elementMap.get(cube).lock.classList.add("is-locked")
                    })
                }
                lock.classList.add("is-locked")
            }

            return false
        }
        a.onclick = () => this.raytracer.clickOnMesh(cube.planesGroup)
        a.onmousemove = () => this.raytracer.mouseOverMesh(cube.planesGroup)
        a.onmouseleave = () => this.raytracer.mouseOverMesh(undefined)
        if(oldMap.has(cube)) {
            lock.classList.toggle("is-locked", oldMap.get(cube).lock.classList.contains("is-locked"))
        }

        li.appendChild(div)
        div.appendChild(a)
        div.appendChild(lock)
    
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
            div.append(collapseA)

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

    //toSet => -1 false, 0 toggle, 1 true
    toggleLock(cubeClicked, toSet) {
        let state = toSet < 0 || (toSet === 0 && this.lockedCubes.isLocked(cubeClicked))
        if(state) {
            this.lockedCubes.unlock(cubeClicked)
        } else {
            this.lockedCubes.lock(cubeClicked)
        }
        return state
    }

    createLockIcon() {
        let lockSpan = document.createElement("span")
        lockSpan.classList.add("icon", "is-small", "cube-lock")

        let lockI = document.createElement("i")
        lockI.classList.add("fas", "fa-lock")

        lockSpan.appendChild(lockI)
        return lockSpan
    }
}