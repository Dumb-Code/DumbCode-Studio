import { CubeListBoard } from "./cube_list_board.js"
import { TblCube } from "./tbl_loader.js"
import { LinkedElement, LinkedSelectableList, ToggleableElement, CubeLocker, LayoutPart } from "./util.js"
import { Vector3, SphereGeometry, MeshBasicMaterial, Mesh, PlaneGeometry, Quaternion, Euler, Matrix4, EventDispatcher } from "./three.js"

const mainArea = document.getElementById("main-area")

const translateKey = "translate"
const rotateKey = "rotate"
const dimensionKey = "dimensions"

export class ModelingStudio {

    constructor(domElement, display, raytracer, transformControls, renameCube) {
        this.domElement = domElement
        let dom = $(domElement)
        this.canvasContainer = dom.find("#display-div").get(0)
        this.display = display
        this.raytracer = raytracer
        this.prevIntersected
        this.prevSelected
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

        //Tool Transform Types
        this.positionStart = new Vector3()
        this.offsetStart = new Vector3()
        this.rotationStart = new Quaternion()
        this.lockedChildrenCache = new Map()
        this.movingChildrenCache = new Set()
    
        
        this.toolTransformType = new LinkedSelectableList(dom.find('.transform-control-tool'), false).addPredicate(e => e === undefined || this.raytracer.selected !== undefined).onchange(e => {
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
        this.selectedTransform = new LinkedSelectableList(dom.find('.dropdown-translation > .dropdown-item')).onchange(() => this.toolTransformType.value = translateKey)
        this.globalSpace = new ToggleableElement(dom.find('.dropdown-global-space')).onchange(e => this.transformControls.space = e.value ? "world" : "local")
        this.transformControls.addEventListener('mouseDown', () => {
            this.positionStart.fromArray(this.positions.value)
            this.offsetStart.fromArray(this.offsets.value)
            this.rotationStart.copy(this.raytracer.selected.parent.quaternion)

            this.createLockedCubesCache()
        })
        this.transformControls.addEventListener('objectChange', () => {
            let selected = this.toolTransformType.value
            switch(selected) {
                case translateKey: 
                    switch(this.selectedTransform.value) {
                        case 'offset':
                            let cube = this.raytracer.selected.tabulaCube
                            this.offsets.value = this.raytracer.selected.position.toArray().map((e, i) => e - cube.dimension[i]/2)
                            break
                        case 'rotation_point':
                            let rotChangedInv = this.positionStart.clone()
                                .sub(this.raytracer.selected.parent.position)
                                .applyQuaternion(this.raytracer.selected.parent.quaternion.clone().inverse())
                            this.offsets.value = [rotChangedInv.x+this.offsetStart.x, rotChangedInv.y+this.offsetStart.y, rotChangedInv.z+this.offsetStart.z]
                        case 'position':
                                this.positions.value = this.raytracer.selected.parent.position.toArray()
                                break
                    }
                    break

                case rotateKey: 
                    this.rotation.value = this.raytracer.selected.parent.rotation.toArray().map(a => a * 180/Math.PI)
                    break
            };

            if(selected === translateKey || selected === rotateKey) {
                this.reconstructLockedCubes()
            }
            this.runFrame()
        });

        //All hooks on the left panel
        let cube = () => raytracer.selected?.tabulaCube
        this.cubeName = new LinkedElement(dom.find('.input-cube-name'), false, false).onchange(e => {
            dom.find('.input-cube-name').toggleClass('input-invalid', renameCube(e.old, e.value))
        })
        this.dimensions = new LinkedElement(dom.find('.input-dimension')).onchange(e => cube()?.updateDimension(e.value))
        this.positions = new LinkedElement(dom.find('.input-position')).onchange(e => {
            this.createLockedCubesCache()
            cube()?.updatePosition(e.value)
            this.reconstructLockedCubes()
            cube()?.planesGroup.updateMatrix()
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
            if(this.raytracer.selected !== undefined) {
                this.raytracer.selected.tabulaCube.addChild(cube)
            } else {
                this.display.tbl.rootGroup.addChild(cube)
            }
        })

        dom.find('.cube-delete').click(() => {
            if(this.raytracer.selected !== undefined) {
                let cube = this.raytracer.selected.tabulaCube
                cube.parent.deleteChild(cube)
                this.raytracer.clickOnMesh(undefined)
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
            .bind('mousewheel', e => {
                let amount = e.originalEvent.wheelDelta > 0 ? 1.1 : 1/1.1
                this.mulMatrix(new DOMMatrix().scaleSelf(amount, amount))
            })
    }

    createLockedCubesCache(selected = this.raytracer.selected?.tabulaCube) {
        this.lockedChildrenCache.clear()
        this.movingChildrenCache.clear()
        this.lockedCubes.forEach(cube => {
            if(selected === undefined || selected === null || cube !== selected) {
                this.traverseUnlockedCubes(cube)
                if(!this.lockedCubes.has(cube.parent) || cube.parent === selected) {
                    if(this.lockedChildrenCache.has(cube.hierarchyLevel)) {
                        this.lockedChildrenCache.get(cube.hierarchyLevel).push(new CubeLocker(cube))
                    } else {
                        this.lockedChildrenCache.set(cube.hierarchyLevel, [new CubeLocker(cube)])
                    }
                }
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

    reconstructLockedCubes(selected = this.raytracer.selected?.tabulaCube) {
        if(selected !== undefined) {
            selected.cubeGroup.parent.updateMatrixWorld(true)
        }

        //Moving cubes are cubes that SHOULD move but at some point a parent is locked preventing them from moving
        let movingCubesCache = new Map()
        this.movingChildrenCache.forEach(cube => {
            if(movingCubesCache.has(cube.hierarchyLevel)) {
                movingCubesCache.get(cube.hierarchyLevel).push(new CubeLocker(cube))
            } else {
                movingCubesCache.set(cube.hierarchyLevel, [new CubeLocker(cube)])
            }
        })

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
  
        this.lockedChildrenCache.clear()
        this.movingChildrenCache.clear()
    }

    setTranslationTool() {
        this.setMode(translateKey, this.selectedTransform.value === 'offset' ? this.raytracer.selected : this.raytracer.selected.parent)
    }

    setRotationTool() {
        this.setMode(rotateKey, this.raytracer.selected.parent)
    }

    setDimensionsTool() {
        this.setMode(dimensionKey, this.raytracer.selected)
    }

    setMode(mode, toAttach) {
        let newValue = mode !== "none" ? mode : undefined
        this.transformControls.visible = mode != "none"

        if(mode !== "none") {
            this.transformControls.attach(toAttach);
            this.transformControls.mode = mode
        }
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
        this.updateCubelistColors()
        this.drawTextureCanvas()
        this.display.tbl.resetAnimations()
        this.display.render()
    }

    updateCubelistColors() {
        let dom = $(this.cubeList.cubeList)
        if(this.prevSelected !== this.raytracer.selected) {
        
            if(this.prevSelected !== undefined) {
                dom.find(`[cubename='${this.prevSelected.tabulaCube.name}']`).removeClass('cube-selected')
            }
            if(this.raytracer.selected !== undefined) {
                dom.find(`[cubename='${this.raytracer.selected.tabulaCube.name}']`).addClass('cube-selected')
            }
            this.prevSelected = this.raytracer.selected
        }

        if(this.prevIntersected !== this.raytracer.intersected) {
            if(this.prevIntersected !== undefined) {
                dom.find(`[cubename='${this.prevIntersected.tabulaCube.name}']`).removeClass('cube-intersected')
            }
            if(this.raytracer.intersected !== undefined) {
                dom.find(`[cubename='${this.raytracer.intersected.tabulaCube.name}']`).addClass('cube-intersected')
            }
            this.prevIntersected = this.raytracer.intersected
        }
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
            } else if(this.raytracer.selected !== undefined && this.raytracer.selected.tabulaCube === cube) {
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
                this.raytracer.clickOnMesh(undefined)
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
        let isSelected = this.raytracer.selected !== undefined
        if(isSelected) {
            this.rotationPointSphere.visible = true
            this.updateSpherePosition()

            let cube = this.raytracer.selected.tabulaCube
            this.cubeName.value = cube.name
            this.positions.value = cube.rotationPoint
            this.dimensions.value = cube.dimension
            this.rotation.value = cube.rotation
            this.offsets.value = cube.offset
            this.cubeGrow.value = cube.mcScale
            this.textureOffset.value = cube.textureOffset
            this.textureMirrored.value = cube.textureMirrored
        } else {
            this.toolTransformType.value = undefined
            this.rotationPointSphere.visible = false

            this.dimensions.value = [0, 0, 0]
            this.positions.value = [0, 0, 0]
            this.offsets.value = [0, 0, 0]
            this.rotation.value = [0, 0, 0]
            this.cubeGrow.value = 0
            this.textureOffset.value = [0, 0]
            this.textureMirrored.value = false
            this.cubeName.value = ""
        }

        this.selectedRequired.prop("disabled", !isSelected).toggleClass("is-active", isSelected)
    }

    updateSpherePosition() {
        if(this.raytracer.selected !== undefined) {
            this.raytracer.selected.parent.getWorldPosition(this.rotationPointSphere.position)
        }
    }
}