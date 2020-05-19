import { CubeListBoard } from "./cube_list_board.js"
import { TblCube } from "./tbl_loader.js"
import { LinkedElement, LinkedSelectableList, ToggleableElement, CubeLocker, isKeyDown } from "./util.js"
import { Vector3, SphereGeometry, MeshBasicMaterial, Mesh, PlaneGeometry, Quaternion, Euler, Matrix4 } from "./three.js"

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
        this.selectedTransform = new LinkedSelectableList(dom.find('.dropdown-translation > .dropdown-item')).onchange(() => this.toolTransformType.value = trans)
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

        //Setup the dividers to allow for changing the panel size
        this.leftDivider = dom.find("#left-divider")
        this.rightDivider = dom.find("#right-divider")
        this.leftArea = 300
        this.rightArea = 300
        let clickedDivider = -1
        $(document)
            .mouseup(() => clickedDivider = 0)
            .mousemove(e => {
                if(clickedDivider !== 0) {
                    if(clickedDivider === 1) {
                        this.leftArea = e.clientX
                    } else if(clickedDivider === 2) {
                        this.rightArea = mainArea.clientWidth - e.clientX
                    }
                    this.updateAreas()
                }
            })

        this.leftDivider.mousedown(() => clickedDivider = 1)
        this.rightDivider.mousedown(() => clickedDivider = 2)
        this.updateAreas()
    }

    createLockedCubesCache(selected = null) {//this.raytracer.selected?.tabulaCube
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

        //We need to compute everything in order so the parents matrixWorld is correct
        for(let i = 0; i <= this.display.tbl.maxCubeLevel; i++) {
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
        this.leftDivider.css('left', this.leftArea + "px")
        this.rightDivider.css('right', this.rightArea + "px")

        this.domElement.style.gridTemplateColumns = this.leftArea + "px " + " calc(100% - " + (this.leftArea + this.rightArea) + "px) " + this.rightArea + "px"

        window.studioWindowResized()
    }

    runFrame() {
        this.raytracer.update()

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

        this.display.tbl.resetAnimations()
        this.display.render()
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
        if(this.raytracer.selected !== undefined) {
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
    }

    updateSpherePosition() {
        if(this.raytracer.selected !== undefined) {
            this.raytracer.selected.parent.getWorldPosition(this.rotationPointSphere.position)
        }
    }
}