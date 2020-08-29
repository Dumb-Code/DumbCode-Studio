import { isKeyDown, DraggableElementList, doubleClickToEdit } from "../util.js"

export class CubeListBoard {
    constructor(cubeList, raytracer, tbl, lockedCubes, renameCube) {
        this.cubeList = cubeList
        this.raytracer = raytracer
        this.renameCube = renameCube
        this.tbl = tbl
        this.lockedCubes = lockedCubes
        this.previousDragElement
        this.elementMap = new Map()

        this.dragElementList = new DraggableElementList(true, (drop, draggedCube, droppedOnto) => {
            lockedCubes.createLockedCubesCache()
            draggedCube.parent.deleteChild(draggedCube, true)
            if(drop === "on") {
                droppedOnto.addChild(draggedCube)
            } else {
                let index = droppedOnto.parent.getChildren().indexOf(droppedOnto)
                if(drop === "bottom") {
                    index++
                }
                droppedOnto.parent.getChildren().splice(index, 0, draggedCube)
                droppedOnto.parent.onChildrenChange(false)
            }
            lockedCubes.reconstructLockedCubes()
        })

        this.cubeList.ondragover = e => {
            if(e.target == this.cubeList) {
                this.dragElementList.removePreviousState()
                e.preventDefault()
            }
        }
        this.cubeList.ondrop = e => {
            let cube = this.dragElementList.getDraggedData()
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
        let ul
        let li = document.createElement("li")

        let div = document.createElement("div")
        div.classList.add('cube-line-controller')
        if(oldMap.has(cube)) {
            div.classList.toggle('cube-intersected', oldMap.get(cube).div.classList.contains('cube-intersected'))
            div.classList.toggle('cube-selected', oldMap.get(cube).div.classList.contains('cube-selected'))
        }

        div.setAttribute('cubename', cube.name)
        this.dragElementList.addElement(div, () => cube)
        li.appendChild(div)

        if(cube.children.length !== 0) {
            let caratSpan = document.createElement("span")
            caratSpan.classList.add("caret")
            div.appendChild(caratSpan)
            if(oldMap.has(cube)) {
                div.classList.toggle('children-hidden', oldMap.get(cube).div.classList.contains('children-hidden'))
            }
            $(caratSpan).click(e => {
                let val = div.classList.toggle('children-hidden')
                if(isKeyDown("Control")) {
                    cube.traverse(cube => this.elementMap.get(cube).div.classList.toggle('children-hidden', val))
                }
                e.stopPropagation()
            })
        }
        
        let cubesSpan = document.createElement("span")
        cubesSpan.style.marginRight = "6px"
        let cubesI = document.createElement("i")
        cubesI.classList.add("fas", cube.children.length === 0 ? "fa-cube" : "fa-cubes")
        cubesSpan.appendChild(cubesI)
        div.appendChild(cubesSpan)
        
        let nameSpan = document.createElement("span")
        nameSpan.draggable = true
        nameSpan.classList.add('dbl-click-container')
        let nameTextSpan = document.createElement("span")
        nameTextSpan.classList.add('dbl-text')
        let nameTextEdit = document.createElement("input")
        nameTextEdit.classList.add('dbl-text-edit')
        nameTextEdit.type = "text"
        nameSpan.appendChild(nameTextSpan)
        nameSpan.appendChild(nameTextEdit)
        div.appendChild(nameSpan)

        doubleClickToEdit($(nameSpan), name => {
            div.setAttribute('cubename', name)
            this.renameCube(cube, name)
        }, cube.name)

        let hideIconSpan = document.createElement("span")
        let hideIconI = document.createElement("i")
        hideIconI.classList.add('fas', cube.cubeMesh?.visible ? 'fa-eye' : 'fa-eye-slash', 'hide-icon') //fa-eye-slash
        $(hideIconSpan).click(e => {
            let val = cube.cubeMesh.visible = !cube.cubeMesh.visible
            let cubes = isKeyDown("Control") ? cube.getAllChildrenCubes([], true) : [cube]
            cubes.forEach(cube => this.elementMap.get(cube).getHideIcon().toggleClass('fa-eye', val).toggleClass('fa-eye-slash', !val))  
            e.stopPropagation()
        })
        hideIconSpan.appendChild(hideIconI)
        div.appendChild(hideIconSpan)

        let lockIconSpan = document.createElement("span")
        let lockIconI = document.createElement("i")
        lockIconI.classList.add('fas', this.lockedCubes.isLocked(cube) ? 'fa-lock' : 'fa-lock-open', 'lock-icon')
        $(lockIconSpan).click(e => {
            let isHidden = this.toggleLock(cube, 0)
            if(isKeyDown("Control")) {
                cube.getAllChildrenCubes().forEach(cube => this.toggleLock(cube, isHidden ? -1 : 1))
            }
            e.stopPropagation()
        })
        lockIconSpan.appendChild(lockIconI)
        div.appendChild(lockIconSpan)

        div.onclick = () => this.raytracer.clickOnMesh(cube.cubeMesh)
        div.onmousemove = () => this.raytracer.mouseOverMesh(cube.cubeMesh)
        div.onmouseleave = () => this.raytracer.mouseOverMesh(undefined)

        if(cube.children.length > 0) {
            ul = document.createElement("ul")
            ul.classList.add('nested')
            
            cube.children.forEach(c => this.createCube(ul, c, oldMap))
            li.appendChild(ul)
        }

        parent.appendChild(li)
        this.elementMap.set(cube, { 
            div, 
            getLockIcon: () => $(lockIconSpan).children(),
            getHideIcon: () => $(hideIconSpan).children()
        })
    }

    //toSet => -1 false, 0 toggle, 1 true
    toggleLock(cubeClicked, toSet) {
        let state = toSet < 0 || (toSet === 0 && this.lockedCubes.isLocked(cubeClicked))
        if(state) {
            this.lockedCubes.unlock(cubeClicked)
        } else {
            this.lockedCubes.lock(cubeClicked)
        }
        this.elementMap.get(cubeClicked).getLockIcon().toggleClass('fa-lock', !state).toggleClass('fa-lock-open', state)
        return state
    }
}