import { CubeListBoard } from "./cube_list_board.js"
import { TblCube } from "./tbl_loader.js"
import { LinkedElement, LinkedSelectableList, ToggleableElement, CubeLocker, LayoutPart, listenForKeyChange } from "./util.js"
import { Vector3, SphereGeometry, MeshBasicMaterial, Mesh, PlaneGeometry, Quaternion, Euler, Matrix4, EventDispatcher, Object3D, BoxGeometry } from "./three.js"
import { DragSelection } from "./drag_selection.js"

const mainArea = document.getElementById("main-area")

const translateKey = "translate"
const rotateKey = "rotate"
const dimensionKey = "dimensions"

const totalPosition = new Vector3()
const totalRotation = new Vector3()
const totalScale = new Vector3()

const decomposePosition = new Vector3()
const decomposeRotation = new Quaternion()
const decomposeEuler = new Euler()
const decomposeScale = new Vector3()

const decomposePosition2 = new Vector3()
const decomposeRotation2 = new Quaternion()
const decomposeEuler2 = new Euler()
const decomposeScale2 = new Vector3()

const inverseMatrix = new Matrix4()
const tabulaInverseMatrix = new Matrix4()
const recomposeMatrix = new Matrix4()

export class ModelingStudio {

    constructor(domElement, display, raytracer, transformControls, orbitControls, renameCube) {
        this.domElement = domElement
        let dom = $(domElement)
        this.canvasContainer = dom.find("#display-div").get(0)
        this.display = display
        this.raytracer = raytracer

        this.raytracer.addEventListener('intersection', e => {
            if(e.old !== undefined) {
                dom.find(`[cubename='${e.old.tabulaCube.name}']`).removeClass('cube-intersected')
            }
            if(e.cube !== undefined) {
                dom.find(`[cubename='${e.cube.tabulaCube.name}']`).addClass('cube-intersected')
            }
        })
        this.raytracer.addEventListener('select', e => e.cubes.forEach(cube => dom.find(`[cubename='${cube.tabulaCube.name}']`).addClass('cube-selected')))
        this.raytracer.addEventListener('deselect', e => e.cubes.forEach(cube => dom.find(`[cubename='${cube.tabulaCube.name}']`).removeClass('cube-selected')))
        this.raytracer.addEventListener('selectchange', () => this.selectedChanged())

        this.rotationPointSphere = this.createRotationPointObject()
        this.lockedCubes = new Set()
        this.cubeList = new CubeListBoard(dom.find("#cube-list").get(0), raytracer, display.tbl, (cubeClicked, toSet = 0) => {
            //toSet => -1 false, 0 toggle, 1 true
            let state = toSet < 0 || (toSet === 0 && this.lockedCubes.has(cubeClicked))
            if(state) {
                this.lockedCubes.delete(cubeClicked)
            } else {
                this.lockedCubes.add(cubeClicked)
            }
            return state
            
        }, () => this.createLockedCubesCache(null), cube => this.reconstructLockedCubes(cube))
        this.transformControls = transformControls
        this.transformControls.space = "local"
        this.transformControls.studioCallback = (dims, offset) => {//todo: move to an event
            this.dimensions.value = dims
            this.offsets.value = offset
        }
        
        this.transformSelectParents = false
        this.transformAnchor = new Object3D()
        this.transformPoint = new Object3D()
        this.transformPoint.rotation.order = "ZYX"
        this.transformAnchor.rotation.order = "ZYX"
        this.transformAnchor.add(this.transformPoint)
        display.scene.add(this.transformAnchor)

        //Tool Transform Types
        this.startingCache = new Map()
        this.lockedChildrenCache = new Map()
        this.movingChildrenCache = new Set()
    
        
        this.toolTransformType = new LinkedSelectableList(dom.find('.transform-control-tool'), false).addPredicate(e => e === undefined || this.raytracer.anySelected()).onchange(e => {
            switch(e.value) {
                case translateKey: 
                    this.setTranslationTool(); 
                    break
                case rotateKey: 
                    this.setRotationTool(); 
                    break
                case dimensionKey: 
                    this.setDimensionsTool(); 
                    break
                default:
                    this.setMode('none')
            };
        })
        
        this.dragSelection = new DragSelection(this.display, this.raytracer, dom.find('#drag-selection-overlay'))

        listenForKeyChange("Shift", value => {
            orbitControls.enabled = !value
            this.transformControls.enabled = !value
            this.dragSelection.enabled = value
        })

        this.selectedTransform = new LinkedSelectableList(dom.find('.dropdown-translation > .dropdown-item')).onchange(() => this.toolTransformType.value = translateKey)
        this.globalSpace = new ToggleableElement(dom.find('.dropdown-global-space')).onchange(e => this.transformControls.space = e.value ? "world" : "local")
        this.transformControls.addEventListener('mouseDown', () => {
            this.startingCache.clear()
            this.raytracer.selectedSet.forEach(cube => {
                let elem = this.transformSelectParents ? cube.tabulaCube.cubeGroup : cube.tabulaCube.planesGroup
                this.startingCache.set(cube.tabulaCube, { 
                    position: [...cube.tabulaCube.rotationPoint], 
                    offset: [...cube.tabulaCube.offset],
                    quaternion: elem.quaternion.clone()
                })
            })
            this.createLockedCubesCache()
            if(this.toolTransformType.value === translateKey && this.selectedTransform.value === 'rotation_point') {
                this.raytracer.selectedSet.forEach(cube => {
                    let tabula = cube.tabulaCube
                    if(this.lockedCubes.has(tabula)) {
                        return
                    }
                    this.addToHierarchyMap(this.lockedChildrenCache, tabula.hierarchyLevel, new CubeLocker(tabula, 1))

                    tabula.children.forEach(child => this.addToHierarchyMap(this.lockedChildrenCache, child.hierarchyLevel, new CubeLocker(child)))
                })
            }
        })
        this.transformControls.addEventListener('mouseUp', () => {
            this.updateTransformPoints()
            this.lockedChildrenCache.clear()
            this.movingChildrenCache.clear()
        })
        let forEachCube = (axisIn, callback) => {
            let selected  = this.raytracer.firstSelected()
            if(this.transformSelectParents) {
                selected = selected.parent
            }
            selected.matrixWorld.decompose(decomposePosition, decomposeRotation, decomposeScale)
            this.startingCache.forEach((data, cube) => {
                let elem = this.transformSelectParents ? cube.cubeGroup : cube.planesGroup

                elem.parent.matrixWorld.decompose(decomposePosition2, decomposeRotation2, decomposeScale2)
                let axis = axisIn.clone()
                if(this.transformControls.space === 'local') {
                    axis.applyQuaternion(decomposeRotation)
                }
                axis.applyQuaternion(decomposeRotation2.inverse())
                callback(axis, cube, data)
            })
        }
        this.transformControls.addEventListener('studioRotate', e => {
            forEachCube(e.rotationAxis, (axis, cube, data) => {
                decomposeRotation2.setFromAxisAngle(axis, e.rotationAngle)
                decomposeRotation2.multiply(data.quaternion).normalize()

                decomposeEuler.setFromQuaternion(decomposeRotation2, "ZYX")
                cube.updateRotation(decomposeEuler.toArray().map(v => v * 180 / Math.PI))
            })
           
        })
        this.transformControls.addEventListener('studioTranslate', e => {
            forEachCube(e.axis, (axis, cube, data) => {
                axis.divide(e.length)
                let pos = axis.toArray()
                switch(this.selectedTransform.value) {
                    case 'offset':
                        if(!this.lockedCubes.has(cube)) {
                            cube.updateOffset(pos.map((e, i) => e + data.offset[i]))
                        }
                        break
                    case 'rotation_point':
                    case 'position':
                        cube.updatePosition(pos.map((e, i) => e + data.position[i]))
                        break
                }
            })
        })
        this.transformControls.addEventListener('objectChange', () => {
            this.reconstructLockedCubes()
            this.selectedChanged()
            this.updateSpherePosition()
            this.runFrame()
        })

        //All hooks on the left panel
        let cube = () => raytracer.selectedSet.size === 1 ? raytracer.selectedSet.values().next().value.tabulaCube : undefined
        this.cubeName = new LinkedElement(dom.find('.input-cube-name'), false, false).onchange(e => {
            dom.find('.input-cube-name').toggleClass('input-invalid', renameCube(e.old, e.value))
        })
        this.dimensions = new LinkedElement(dom.find('.input-dimension')).onchange(e => cube()?.updateDimension(e.value))
        this.positions = new LinkedElement(dom.find('.input-position')).onchange(e => {
            this.createLockedCubesCache()
            cube()?.updatePosition(e.value)
            this.reconstructLockedCubes()
            this.updateSpherePosition()
        })
        this.offsets = new LinkedElement(dom.find('.input-offset')).onchange(e => cube()?.updateOffset(e.value))
        this.cubeGrow = new LinkedElement(dom.find('.input-cube-grow'), false).onchange(e => cube()?.updateCubeGrow(e.value))
        this.textureOffset = new LinkedElement(dom.find('.input-texure-offset')).onchange(e => cube()?.updateTextureOffset(e.value))
        this.textureMirrored = new LinkedElement(dom.find('.input-texture-mirrored'), false, false).onchange(e => cube()?.updateTextureMirrored(e.value))
        this.rotation = new LinkedElement(dom.find('.input-rotation')).withsliders(dom.find('.input-rotation-slider')).onchange(e => {
            this.createLockedCubesCache()
            cube()?.updateRotation(e.value)
            this.reconstructLockedCubes()
        })

        //Create cube and delete cube hooks
        dom.find('.cube-create').click(() => {
            let map = this.display.tbl.cubeMap
            let name = "newcube"
            if(map.has(name)) {
                let num = 0
                let newName = name
                while(map.has(newName)) {
                    newName = name + num++
                }
                name = newName
            }
            let cube = new TblCube(name, [1, 1, 1], [0, 0, 0], [0, 0, 0], [0, 0, 0], [1, 1, 1], [0, 0], 0, [], false, this.display.tbl)
            if(this.raytracer.anySelected()) {
                this.raytracer.firstSelected().tabulaCube.addChild(cube)
            } else {
                this.display.tbl.rootGroup.addChild(cube)
            }
        })

        dom.find('.cube-delete').click(() => {
            if(this.raytracer.anySelected()) {
                this.raytracer.selectedSet.forEach(cube => {
                    cube.parent.deleteChild(cube)
                    this.raytracer.clickOnMesh(cube, false)
                })
            }
        })

        this.selectedRequired = dom.find('.editor-require-selected')

        this.leftPanel = new LayoutPart(dom.find('#panel-left'), this).onchange(e => {
            this.leftArea = e.value ? 0 : 300
            this.updateAreas()
        })

        let rightPanelChange = e => {
            if(this.rightTopPanel.value && this.rightBottomPanel.value) {
                this.rightArea = 0
            } else {
                if(this.rightArea === 0) {
                    this.rightArea = 300
                }
                if(this.rightTopPanel.value !== this.rightBottomPanel.value) {
                    if(!this.rightTopPanel.value) { //Top panel only
                        this.topRArea = mainArea.clientHeight - 40
                    } else { //Bottom panel only
                        this.topRArea = 0
                    }
                } else if(!this.rightTopPanel.value) {
                    this.topRArea = 300
                }
            }
            this.updateAreas()
        }

        this.rightTopPanel = new LayoutPart(dom.find('#panel-right-top'), this).onchange(rightPanelChange)
        this.rightBottomPanel = new LayoutPart(dom.find('#panel-right-bottom'), this).onchange(rightPanelChange)

        //Setup the dividers to allow for changing the panel size
        this.leftDivider = dom.find("#left-divider")
        this.rightDivider = dom.find("#right-divider")
        this.rightHorizontalDivider = dom.find("#right-horizontal-divider")

        this.leftArea = 300
        this.rightArea = 300
        this.topRArea = 300
        let clickedDivider = -1
        $(document)
            .mouseup(() => clickedDivider = 0)
            .mousemove(e => {
                if(clickedDivider !== 0) {
                    if(clickedDivider === 1) {
                        this.leftArea = e.clientX
                    } else if(clickedDivider === 2) {
                        this.rightArea = mainArea.clientWidth - e.clientX
                    } else if(clickedDivider === 3) {
                        this.topRArea = e.clientY - mainArea.offsetTop
                    }
                    this.updateAreas()
                }
            })

        this.leftDivider.mousedown(() => clickedDivider = 1)
        this.rightDivider.mousedown(() => clickedDivider = 2)
        this.rightHorizontalDivider.mousedown(() => clickedDivider = 3)
        this.updateAreas()

        this.canvas = dom.find('#texture-canvas').get(0)
        this.canvasMatrix = new DOMMatrix([1, 0, 0, 1, 0, 0])
        this.canvasMovingCube = null
        this.mulMatrix(new DOMMatrix())
        $(this.canvas)
            .mousemove(e => this.mouseOverCanvas(e))
            .click(e => this.mouseOverCanvas(e))
            .mousedown(e => this.mouseOverCanvas(e))
            .mouseup(e => this.canvasMovingCube = null)
            .bind('mousewheel DOMMouseScroll', e => {
                let direction = e.originalEvent.wheelDelta
                let amount =  1.1
                if(direction === undefined) { //Firefox >:(
                    direction = -e.detail
                }
                if(direction !== 0) {
                    this.mulMatrix(new DOMMatrix().scaleSelf(direction > 0 ? amount : 1/amount))
                }
                
            })
    }

    createLockedCubesCache() {
        this.lockedChildrenCache.clear()
        this.movingChildrenCache.clear()
        this.lockedCubes.forEach(cube => {
            this.traverseUnlockedCubes(cube)
            if(!this.lockedCubes.has(cube.parent)) {
                this.addToHierarchyMap(this.lockedChildrenCache, cube.hierarchyLevel, new CubeLocker(cube))
            }
        })
    }

    traverseUnlockedCubes(cube) {
        if(this.lockedCubes.has(cube)) {
            cube.children.forEach(child => this.traverseUnlockedCubes(child))
        } else if(this.lockedCubes.has(cube.parent)) {
            this.movingChildrenCache.add(cube)
        }
    }

    reconstructLockedCubes() {
        this.display.tbl.modelCache.updateMatrixWorld(true)

        //Moving cubes are cubes that SHOULD move but at some point a parent is locked preventing them from moving
        let movingCubesCache = new Map()
        this.movingChildrenCache.forEach(cube => this.addToHierarchyMap(movingCubesCache, cube.hierarchyLevel, new CubeLocker(cube)))

        let size = Math.max(Math.max(...this.lockedChildrenCache.keys()), Math.max(...movingCubesCache.keys()))
        
        //We need to compute everything in order so the parents matrixWorld is correct
        for(let i = 0; i <= size; i++) {
            this.lockedChildrenCache.get(i)?.forEach(lock => {
                lock.reconstruct()
                lock.cube.cubeGroup.updateMatrixWorld(true)
            })

            movingCubesCache.get(i)?.forEach(lock => {
                lock.reconstruct()
                lock.cube.cubeGroup.updateMatrixWorld(true)
            })
        }
  
        // this.lockedChildrenCache.clear()
        // this.movingChildrenCache.clear()
    }

    addToHierarchyMap(map, level, cubeLocker) {
        if(map.has(level)) {
            map.get(level).push(cubeLocker)
        } else {
            map.set(level, [cubeLocker])
        }
    }

    setTranslationTool() {
        this.setMode(translateKey, this.selectedTransform.value !== 'offset')
    }

    setRotationTool() {
        this.setMode(rotateKey, true)
    }

    setDimensionsTool() {
        this.setMode(dimensionKey, false)
    }

    setMode(mode, parent = this.transformSelectParents) {
        this.transformSelectParents = parent
        this.transformControls.visible = mode != "none"

        this.updateTransformPoints()

        if(mode !== "none") {
            this.transformControls.attach(this.transformPoint);
            this.transformControls.mode = mode
        }
    }

    updateTransformPoints() {
        if(!this.raytracer.anySelected() && this.transformControls.visible === true) {
            this.setMode("none")
            return
        }
        this.transformPoint.position.set(0, 0, 0)
        this.transformPoint.rotation.set(0, 0, 0)

        totalPosition.set(0, 0, 0)
        let firstSelected = this.raytracer.firstSelected()
        this.raytracer.selectedSet.forEach(cube => {
            let elem = this.transformSelectParents ? cube.parent : cube
            elem.matrixWorld.decompose(decomposePosition, decomposeRotation, decomposeScale)

            totalPosition.add(decomposePosition)

            if(cube === firstSelected) {
                this.transformAnchor.quaternion.copy(decomposeRotation)
                this.transformAnchor.scale.copy(decomposeScale)
            }
        })

        this.transformAnchor.position.copy(totalPosition).divideScalar(this.raytracer.selectedSet.size)
    }

    createRotationPointObject() {
        let geometry = new SphereGeometry(1/32, 32, 32);
        let material = new MeshBasicMaterial({ color: 0x0624cf});
        let sphere = new Mesh(geometry, material);
        this.display.scene.add(sphere);
        sphere.visible = false
        return sphere
    }

    updateAreas() {
        this.leftDivider.css('left', (this.leftArea-4) + "px")
        this.rightDivider.css('right', (this.rightArea-4) + "px")
        this.rightHorizontalDivider.css('top', (mainArea.offsetTop+this.topRArea-4) + "px").css('right', '0px').css('width', this.rightArea + "px").css('left', 'unset')

        this.domElement.style.gridTemplateColumns = this.leftArea + "px " + " calc(100% - " + (this.leftArea + this.rightArea) + "px) " + this.rightArea + "px"
        this.domElement.style.gridTemplateRows = this.topRArea + "px " + " calc(100vh - " + (this.topRArea + 92) + "px) 40px"

        window.studioWindowResized()
    }

    runFrame() {
        this.raytracer.update()
        this.drawTextureCanvas()
        this.display.tbl.resetAnimations()
        this.display.render()
        this.dragSelection.onFrame()
    }

    drawTextureCanvas() {
        let size = Math.min(this.rightArea, this.topRArea)
        this.canvas.width = this.canvas.height = size

        let ctx = this.canvas.getContext('2d')

        ctx.setTransform(this.finalCanvasMatrix)

        ctx.fillStyle = "rgba(255, 255, 255, 255)"
        ctx.fillRect(0, 0, size, size)

        let img = this.display.material?.map?.image
        if(img !== undefined) {
            ctx.drawImage(img, 0, 0, size, size)
        }

        let su = this.display.tbl.texWidth/size
        let sv = this.display.tbl.texHeight/size

        this.display.tbl.cubeMap.forEach(cube => {
            let r = 1.0
            let g = 1.0
            let b = 1.0
            let a = 0.2

            if(this.raytracer.intersected !== undefined && this.raytracer.intersected.tabulaCube === cube) {
                g = 0.2
                b = 0.2
                a = 0.5
            } else if(this.raytracer.isCubeSelected(cube)) {
                r = 0.2
                g = 0.2
                a = 0.5
            }

            let u = cube.textureOffset[0]/su
            let v = cube.textureOffset[1]/sv

            let w = cube.dimension[0]
            let h = cube.dimension[1]
            let d = cube.dimension[2]

            let uw = w/su
            let ud = d/su

            let vh = h/sv
            let vd = d/sv

            ctx.fillStyle = `rgba(${255*r}, 0, 0, ${a})`
            ctx.fillRect(u, v+vd, ud, vh)

            ctx.fillStyle = `rgba(0, ${255*g}, 0, ${a})`
            ctx.fillRect(u+ud, v, uw, vd)

            ctx.fillStyle = `rgba(0, 0, ${255*b}, ${a})`
            ctx.fillRect(u+ud, v+vd, uw, vh)


            ctx.fillStyle = `rgba(${127*r}, 0, 0, ${a})`
            ctx.fillRect(u+ud+uw, v+vd, ud, vh)

            ctx.fillStyle = `rgba(0, ${127*g}, 0, ${a})`
            ctx.fillRect(u+ud+uw, v, uw, vd)

            ctx.fillStyle = `rgba(0, 0, ${127*b}, ${a})`
            ctx.fillRect(u+ud+uw+ud, v+vd, uw, vh)

        })        
    }

    mouseOverCanvas(event) {
        let mousePoint = new DOMPoint(event.originalEvent.layerX, event.originalEvent.layerY)
        mousePoint = mousePoint.matrixTransform(this.finalCanvasMatrix.inverse())
        let mouseX = mousePoint.x
        let mouseY = mousePoint.y

        let mouseBetween = (x, y, w, h) => mouseX >= x && mouseX < x+w && mouseY >= y && mouseY < y+h
        let size = Math.min(this.rightArea, this.topRArea)
        let su = this.display.tbl.texWidth/size
        let sv = this.display.tbl.texHeight/size

        let overHandled = false

        this.display.tbl.cubeMap.forEach(cube => {
            if(overHandled) {
                return
            }

            let u = cube.textureOffset[0]/su
            let v = cube.textureOffset[1]/sv

            let w = cube.dimension[0]
            let h = cube.dimension[1]
            let d = cube.dimension[2]

            let uw = w/su
            let ud = d/su

            let vh = h/sv
            let vd = d/sv
            

            let mouseOver = 
                mouseBetween(u, v+vd, ud, vh) || mouseBetween(u+ud, v, uw, vd) || mouseBetween(u+ud, v+vd, uw, vh) ||
                mouseBetween(u+ud+uw, v+vd, ud, vh) || mouseBetween(u+ud+uw, v, uw, vd) || mouseBetween(u+ud+uw+ud, v+vd, uw, vh)

            if(mouseOver) {
                overHandled = true
                if(event.type === 'mousedown') {
                    this.canvasMovingCube = {cube, x: mouseX-u, y: mouseY-v}
                } else if(event.type === 'click') {
                    this.raytracer.clickOnMesh(cube.planesGroup)
                } else {
                    this.raytracer.mouseOverMesh(cube.planesGroup)
                }
            }
        })
        if(!overHandled) {
            if(event.type === 'click') {
                this.raytracer.deselectAll()
            } else if(event.type === "mousedown") {
                this.canvasMovingCube = null
            }
            if(event.buttons & 1 !== 0 && this.canvasMovingCube === null) {
                this.mulMatrix(new DOMMatrix().translateSelf(event.originalEvent.movementX, event.originalEvent.movementY))
            }
            this.raytracer.mouseOverMesh(undefined)
        }
        if(this.canvasMovingCube !== null) {
            let tex = this.canvasMovingCube.cube.textureOffset
            tex[0] = (mouseX-this.canvasMovingCube.x)*su
            tex[1] = (mouseY-this.canvasMovingCube.y)*sv
            this.canvasMovingCube.cube.updateTextureOffset()
        }
    }

    mulMatrix(matrix) {
        this.canvasMatrix.preMultiplySelf(matrix)
        this.finalCanvasMatrix = new DOMMatrix().translate(150, 150).multiply(this.canvasMatrix).multiply(new DOMMatrix().translate(-150, -150))
    }

    cubeHierarchyChanged() {
        this.prevSelected = undefined
        this.prevIntersected = undefined
        this.cubeList.refreshCompleatly()
    }

    setActive() {
        window.studioWindowResized()
    }

    selectedChanged() {
        let isSelected = this.raytracer.selectedSet.size === 1
        this.updateTransformPoints()
        if(isSelected) {
            this.rotationPointSphere.visible = true

            let cube = this.raytracer.firstSelected().tabulaCube
            this.cubeName.visualValue = cube.name
            this.positions.visualValue = cube.rotationPoint
            this.dimensions.visualValue = cube.dimension
            this.rotation.visualValue = cube.rotation
            this.offsets.visualValue = cube.offset
            this.cubeGrow.visualValue = cube.mcScale
            this.textureOffset.visualValue = cube.textureOffset
            this.textureMirrored.visualValue = cube.textureMirrored
        } else {
            this.rotationPointSphere.visible = false

            this.dimensions.visualValue = undefined
            this.positions.visualValue = undefined
            this.offsets.visualValue = undefined
            this.rotation.visualValue = undefined
            this.cubeGrow.visualValue = undefined
            this.textureOffset.visualValue = undefined
            this.textureMirrored.visualValue = undefined
            this.cubeName.visualValue = undefined
        }
        
        this.updateSpherePosition()
        if(!this.raytracer.anySelected()) {
            this.toolTransformType.value = undefined
        }

        this.selectedRequired.prop("disabled", !isSelected).toggleClass("is-active", isSelected)
    }

    updateSpherePosition() {
        this.rotationPointSphere.visible = this.raytracer.anySelected()
        if(this.raytracer.anySelected()) {
            let cube = this.raytracer.firstSelected().tabulaCube
            cube.cubeGroup.updateMatrix()
            cube.cubeGroup.getWorldPosition(this.rotationPointSphere.position)
        }
    }
}