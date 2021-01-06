import { DraggableElementList } from "../util/draggable_element_list.js"
import { isKeyDown, doubleClickToEdit } from "../util/element_functions.js"

/**
 * Holds and updates all the information pertaining to the cube like board on the right hand side of the modeler
 */
export class CubeListBoard {
    constructor(cubeList, raytracer, pth, lockedCubes, studioOptions, renameCube) {
        this.cubeList = cubeList
        this.raytracer = raytracer
        this.studioOptions = studioOptions
        this.renameCube = renameCube
        this.pth = pth
        this.lockedCubes = lockedCubes
        this.previousDragElement
        this.elementMap = new Map()

        //Create the dragelement list for elements to be dragged and dropped on
        this.dragElementList = new DraggableElementList(true, (drop, draggedCube, droppedOnto, e) => {
            //If the control key is down, use the default locked cube cache, otherwise use the dragged cube.
            //This means when the control key isn't held, the cube stays in the same place
            lockedCubes.createLockedCubesCache(e.ctrlKey ? undefined : [draggedCube.name], true)

            //Delete the cube from the parent
            draggedCube.parent.deleteChild(draggedCube, true)
            if(drop === "on") {
                droppedOnto.addChild(draggedCube)
            } else {
                let index = droppedOnto.parent.getChildren().indexOf(droppedOnto)
                if(drop === "bottom") {
                    index++
                }
                //Insert the cube at the dropped on idex
                droppedOnto.parent.getChildren().splice(index, 0, draggedCube)
                droppedOnto.parent.onChildrenChange(false)
            }
            lockedCubes.reconstructLockedCubes(e.ctrlKey)
        })

        //Add a drop zone on the whole body, that puts the cubes on the root. 
        //If the control key isn't down, the cube is kept in the same place.
        this.dragElementList.addDropZone($(document.body), cube => {
            this.lockedCubes.createLockedCubesCache(isKeyDown("Control") ? undefined : [cube.name], true)
            cube.parent.deleteChild(cube, true)
            pth.model.addChild(cube)
            this.lockedCubes.reconstructLockedCubes(isKeyDown("Control"))
        })

        
        //If a cube is selected on the root, deselect it.
        //Note, we can probally do this better with stopping propagation on the cube entries.
        this.cubeList.onclick = e => {
            if(e.target.nodeName == 'UL') {
                this.raytracer.deselectAll()
            }
        }
    }

    /**
     * Refreshes the whole cube list. 
     */
    refreshCompleatly() {
        let oldMap = new Map(this.elementMap)
        this.elementMap.clear()
        this.cubeList.innerHTML = "" //Remove all the children

        //The following code is to allow for a maximum of 50 elements to be created per frame.
        //This prevents the studio from freezing when a large amount of cubes have to be added. 
        //@todo: maybe move this to a timeout?
        const maxRefreshFrame = 50
        let refreshIndex = 0
        if(this.pth.anySelected()) {
            let model = this.pth.model
            //Run on frame function used to call on the next frame.
            let runOnFrame = () => {
                if(this.pth.anySelected()) {
                    //Make sure the model hasn't changed. If it has, return
                    if(this.pth.model !== model) {
                        return
                    }
                    //The target index to refresh too
                    let refreshTarget = refreshIndex + maxRefreshFrame
                    let cube
                    for(; refreshIndex < refreshTarget; refreshIndex++) {
                        cube = this.pth.model.children[refreshIndex]
                        if(cube) {
                            this.createCube(this.cubeList, cube, oldMap)    
                        } else {
                            break
                        }
                    }
                    //If cube, then theres potentially cubes left, so request the next frame.
                    if(cube) {
                        requestAnimationFrame(runOnFrame)
                    }
                }
            }
            runOnFrame()
        }        
    }

    /**
     * 
     * @param {*} parent parent dom
     * @param {*} cube cube to apply to
     * @param {*} oldMap the previous map
     */
    createCube(parent, cube, oldMap) {
        //TODO: this is kinda eh. We should move this to a hidden template
        let ul
        let li = document.createElement("li")

        let div = document.createElement("div")
        div.classList.add('cube-line-controller')

        //Make sure the intersected and selected elements are transfered.
        if(oldMap.has(cube)) {
            div.classList.toggle('cube-intersected', oldMap.get(cube).div.classList.contains('cube-intersected'))
            div.classList.toggle('cube-selected', oldMap.get(cube).div.classList.contains('cube-selected'))
        }

        div.setAttribute('cubename', cube.name)
        this.dragElementList.addElement($(div), () => cube)
        li.appendChild(div)

        //If the cube has children
        if(cube.children.length !== 0) {
            //Create the down element caret, and hook it up to when it's clicked.
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
        
        //Just create some elements. Should be a template
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

        //Create the hide icon span
        let hideIconSpan = document.createElement("span")
        hideIconSpan.classList.add("cube-hide-icon-container")
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

        //Create the lock icon span
        let lockIconSpan = document.createElement("span")
        lockIconSpan.classList.add("cube-lock-icon-container")
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

        //Attach the clicking and hovering stuff
        div.onclick = () => this.raytracer.clickOnMesh(cube.cubeMesh)
        div.onmousemove = () => this.raytracer.mouseOverMesh(cube.cubeMesh)
        div.onmouseleave = () => this.raytracer.mouseOverMesh(undefined)

        //Create the children elements.
        if(cube.children.length > 0) {
            ul = document.createElement("ul")
            ul.classList.add('nested')
            
            cube.children.forEach(c => this.createCube(ul, c, oldMap))
            li.appendChild(ul)
        }

        //Append it to the parent and set it in the map
        parent.appendChild(li)
        this.elementMap.set(cube, { 
            div, 
            getLockIcon: () => {
                let elems = $(lockIconSpan).children()
                if(this.raytracer.isCubeSelected(cube)) {
                    return elems.add(this.studioOptions.cubeLocked.children())
                }
                return elems
            },
            getHideIcon: () => {
                let elems = $(hideIconSpan).children()
                if(this.raytracer.isCubeSelected(cube)) {
                    return elems.add(this.studioOptions.cubeVisible.children())
                }
                return elems

            }
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