import { CubeListBoard } from "./cube_list_board.js"
import { TblCube } from "./tbl_loader.js"
import { LinkedElement, LinkedSelectableList, ToggleableElement, CubeLocker, LayoutPart, listenForKeyChange, isKeyDown } from "./util.js"
import { Vector3, SphereGeometry, MeshBasicMaterial, Mesh, PlaneGeometry, Quaternion, Euler, Matrix4, EventDispatcher, Object3D, BoxGeometry, Color } from "./three.js"
import { DragSelection } from "./drag_selection.js"
import { TexturemapCanvas } from "./texturemap_canvas.js"
import { TransformControls } from './transform_controls.js'


const mainArea = document.getElementById("main-area")

const translateKey = "translate"
const rotateKey = "rotate"
const dimensionKey = "dimensions"

const totalPosition = new Vector3()

const decomposePosition = new Vector3()
const decomposeRotation = new Quaternion()
const decomposeEuler = new Euler()
const decomposeScale = new Vector3()

const decomposePosition2 = new Vector3()
const decomposeRotation2 = new Quaternion()
const decomposeScale2 = new Vector3()

const tempMatrix = new Matrix4()


export class ModelingStudio {

    constructor(domElement, display, raytracer, orbitControls, renameCube) {
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
        this.transformControls = display.createTransformControls()
        this.transformControls.studioCallback = (dims, offset) => {//todo: move to an event
            this.dimensions.value = dims
            this.offsets.value = offset
        }
        
        this.transformSelectParents = false
        this.transformAnchor = new Object3D()
        this.transformAnchor.rotation.order = "ZYX"

        this.transformAnchor.add(this.rotationPointSphere)

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

        this.selectedTranslate = new LinkedSelectableList(dom.find('.dropdown-translation > .dropdown-item')).onchange(() => this.toolTransformType.value = translateKey)
        this.selectedRotation = new LinkedSelectableList(dom.find('.dropdown-rotation > .dropdown-item')).onchange(() => this.toolTransformType.value = rotateKey)
        this.globalSpaceMode = new LinkedSelectableList(dom.find('.dropdown-transform-mode > .dropdown-item')).onchange(e => {
            this.transformControls.space = e.value
            this.gumballRotateTool.space = e.value
            this.gumballTranslateTool.space = e.value
        })
        this.gumballRotateTool = display.createTransformControls()
        this.gumballRotateTool.mode = 'rotate'
        this.gumballTranslateTool = display.createTransformControls()
        this.gumballTranslateTool.mode = 'translate'
        dom.find('.gumball-movement-freely').click(() => {
            this.toolTransformType.value = undefined
            this.gumballRotateTool.attach(this.transformAnchor)
            this.gumballTranslateTool.attach(this.transformAnchor)
        })
        dom.find('.gumball-movement-selected').click(() => this.updateTransformPoints())

        this.gumballRotateTool.traverse(e => e.material?.color?.addScalar(0.25))
        this.gumballTranslateTool.traverse(e => e.material?.color?.addScalar(0.25))

        this.gumballRotateTool.addEventListener('mouseDown', () => this.gumballTranslateTool.enabled = false)
        this.gumballTranslateTool.addEventListener('mouseDown', () => this.gumballRotateTool.enabled = false)
        this.gumballRotateTool.addEventListener('mouseUp', () => this.gumballTranslateTool.enabled = true)
        this.gumballTranslateTool.addEventListener('mouseUp', () => this.gumballRotateTool.enabled = true)

        this.transformControls.addEventListener('mouseDown', () => {
            this.startingCache.clear()
            this.raytracer.selectedSet.forEach(cube => {
                let elem = this.transformSelectParents ? cube.tabulaCube.cubeGroup : cube.tabulaCube.planesGroup
                this.startingCache.set(cube.tabulaCube, { 
                    position: [...cube.tabulaCube.rotationPoint], 
                    offset: [...cube.tabulaCube.offset],
                    dimension: [...cube.tabulaCube.dimension],
                    quaternion: elem.quaternion.clone()
                })
            })
            this.createLockedCubesCache()
            if(this.toolTransformType.value === translateKey && this.selectedTranslate.value === 'rotation_point') {
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
            this.lockedChildrenCache.clear()
            this.movingChildrenCache.clear()
        })
        let forEachCube = (axisIn, callback) => {
            this.transformAnchor.matrixWorld.decompose(decomposePosition, decomposeRotation, decomposeScale)
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
            if(this.selectedRotation.value === 'axis') {
                forEachCube(e.rotationAxis, (axis, cube, data) => {
                    decomposeRotation2.setFromAxisAngle(axis, e.rotationAngle)
                    decomposeRotation2.multiply(data.quaternion).normalize()
    
                    decomposeEuler.setFromQuaternion(decomposeRotation2, "ZYX")
                    cube.updateRotation(decomposeEuler.toArray().map(v => v * 180 / Math.PI))
                })
            } else if(this.selectedRotation.value === 'point')  {
                forEachCube(e.rotationAxis, (axis, cube, data) => {
                    let elem = cube.cubeGroup
                    let diff = decomposePosition.copy(elem.position).sub(this.transformAnchor.position)
                    elem.matrixWorld
                        .premultiply(tempMatrix.makeTranslation(-diff.x, -diff.y, -diff.z))
                        .premultiply(tempMatrix.makeRotationAxis(axis, e.rotationAngle))
                        .premultiply(tempMatrix.makeTranslation(diff.x, diff.y, diff.z))


                    elem.matrixWorld.decompose(decomposePosition2, decomposeRotation2, decomposeScale2)


                    //TODO: make the "rotate around a point work"

                    elem.position.copy(decomposePosition2)
                    elem.rotation.copy(decomposeRotation2)

                    decomposeEuler.setFromQuaternion(decomposeRotation2, "ZYX")
                    cube.updateRotation(decomposeEuler.toArray().map(v => v * 180 / Math.PI))
                    cube.updatePosition(decomposePosition2.toArray())
                })
            }
        })
        this.transformControls.addEventListener('studioTranslate', e => {
            forEachCube(e.axis, (axis, cube, data) => {
                axis.multiplyScalar(e.length)
                let pos = axis.toArray()
                switch(this.selectedTranslate.value) {
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
        this.transformControls.addEventListener('studioDimension', e => {
            let length = Math.floor(Math.abs(e.length))
            forEachCube(e.axis, (axis, cube, data) => {
                this.alignAxis(axis)

                cube.updateDimension(axis.toArray().map((e, i) => Math.abs(e)*length + data.dimension[i]))
                if(e.axis.x+e.axis.y+e.axis.z < 0) {
                    cube.updateOffset(e.axis.toArray().map((e, i) => e*length + data.offset[i]))
                }
            })
        })
        this.transformControls.addEventListener('objectChange', () => {
            this.reconstructLockedCubes()
            this.updateCubeValues()
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

        this.canvas = new TexturemapCanvas(dom.find('#texture-canvas'), display, raytracer, () => Math.min(this.rightArea, this.topRArea))
        
    }

    alignAxis(axis) {
        let xn = Math.abs(axis.x);
        let yn = Math.abs(axis.y);
        let zn = Math.abs(axis.z);

        if ((xn >= yn) && (xn >= zn)) {
            axis.set(axis.x > 0 ? 1 : -1, 0, 0)
        } else if ( (yn > xn) && (yn >= zn) ) {
            axis.set(0, axis.y > 0 ? 1 : -1, 0)
        } else if ( (zn > xn) && (zn > yn) ) {
            axis.set(0, 0, axis.z > 0 ? 1 : -1)
        } else {
            axis.set(0, 0, 0)
        }
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
        this.setMode(translateKey, this.selectedTranslate.value !== 'offset')
    }

    setRotationTool() {
        this.setMode(rotateKey, true)
    }

    setDimensionsTool() {
        this.setMode(dimensionKey, false)
    }

    setMode(mode, parent = this.transformSelectParents) {
        this.transformSelectParents = parent

        if(mode === "none") {
            this.transformControls.detach()
        } else {
            this.gumballRotateTool.detach()
            this.gumballTranslateTool.detach()
            this.transformControls.attach(this.transformAnchor);
            this.transformControls.mode = mode
        }
    }

    updateTransformPoints() {
        if(!this.raytracer.anySelected() && this.transformControls.visible === true) {
            return
        }

        totalPosition.set(0, 0, 0)
        let firstSelected = this.raytracer.firstSelected()
        this.raytracer.selectedSet.forEach(cube => {
            let elem = this.transformSelectParents ? cube.parent : cube
            elem.matrixWorld.decompose(decomposePosition, decomposeRotation, decomposeScale)

            totalPosition.add(decomposePosition)

            if(cube === firstSelected) {
                this.transformAnchor.quaternion.copy(decomposeRotation)
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
        this.canvas.drawTextureCanvas(this.rightArea, this.topRArea)
        this.display.tbl.resetAnimations()
        this.display.render()
        this.dragSelection.onFrame()
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
        this.gumballRotateTool.detach()
        this.gumballTranslateTool.detach()
        let isSelected = this.raytracer.selectedSet.size === 1
        this.updateCubeValues()
        if(!this.raytracer.anySelected() || (this.toolTransformType.value === dimensionKey && !isSelected)) {
            this.toolTransformType.value = undefined
        }

        this.selectedRequired.prop("disabled", !isSelected).toggleClass("is-active", isSelected)
    }

    updateCubeValues() {
        let isSelected = this.raytracer.selectedSet.size === 1
        if(isSelected) {
            this.rotationPointSphere.visible = true

            let cube = this.raytracer.firstSelected().tabulaCube
            this.cubeName.setInternalValue(cube.name)
            this.positions.setInternalValue(cube.rotationPoint)
            this.dimensions.setInternalValue(cube.dimension)
            this.rotation.setInternalValue(cube.rotation)
            this.offsets.setInternalValue(cube.offset)
            this.cubeGrow.setInternalValue(cube.mcScale)
            this.textureOffset.setInternalValue(cube.textureOffset)
            this.textureMirrored.setInternalValue(cube.textureMirrored)
        } else {
            this.rotationPointSphere.visible = false

            this.dimensions.setInternalValue(undefined)
            this.positions.setInternalValue(undefined)
            this.offsets.setInternalValue(undefined)
            this.rotation.setInternalValue(undefined)
            this.cubeGrow.setInternalValue(undefined)
            this.textureOffset.setInternalValue(undefined)
            this.textureMirrored.setInternalValue(undefined)
            this.cubeName.setInternalValue(undefined)
        }
        
    }
}