import { CubeListBoard } from "./cube_list_board.js"
import { TblCube } from "./tbl_loader.js"
import { LinkedElement, LinkedSelectableList, ToggleableElement, CubeLocker } from "./util.js"
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
        this.lockedCubes = []
        this.cubeList = new CubeListBoard(dom.find("#cube-list").get(0), raytracer, display.tbl, cube => {
            if(this.lockedCubes.includes(cube)) {
                removeItem(this.lockedCubes, cube)
                return false
            } else {
                this.lockedCubes.push(cube)
                return true
            }
            
        })
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
        this.lockedChildrenCache = []
        
        this.toolTransformType = new LinkedSelectableList(dom.find('.transform-control-tool'), false).onchange(e => {
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
        this.selectedTransform = new LinkedSelectableList(dom.find('.dropdown-translation > .dropdown-item')).onchange(() => this.setTranslationTool())
        this.clampChildren = new ToggleableElement(dom.find('.dropdown-clamp-children'))
        this.globalSpace = new ToggleableElement(dom.find('.dropdown-global-space')).onchange(e => this.transformControls.space = e.value ? "world" : "local")
        this.transformControls.addEventListener('mouseDown', () => {
            this.positionStart.fromArray(this.positions.value)
            this.offsetStart.fromArray(this.offsets.value)
            this.rotationStart.copy(this.raytracer.selected.parent.quaternion)

            this.createLockedCubesCache()
            if(this.clampChildren.value) {
                this.raytracer.selected.tabulaCube.children.forEach(child => this.lockedChildrenCache.push(new CubeLocker(child)))
            }
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

    createLockedCubesCache() {
        this.lockedChildrenCache.length = 0
        this.lockedCubes
            .filter(cube => this.raytracer.selected === undefined || cube !== this.raytracer.selected.tabulaCube)
            .forEach(cube => this.lockedChildrenCache.push(new CubeLocker(cube)))
    }

    reconstructLockedCubes() {
        if(this.raytracer.selected !== undefined) {
            this.raytracer.selected.parent.updateMatrixWorld(true)
        }
        this.lockedChildrenCache.forEach(lock => lock.reconstruct())
        this.lockedChildrenCache.length = 0
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
        if(this.toolTransformType.value !== newValue) {
            this.toolTransformType.value = newValue
        } 
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
                dom.find(`li[cubename='${this.prevSelected.tabulaCube.name}']`).removeClass('cube-selected')
            }
            if(this.raytracer.selected !== undefined) {
                dom.find(`li[cubename='${this.raytracer.selected.tabulaCube.name}']`).addClass('cube-selected')
            }
            this.prevSelected = this.raytracer.selected
        }

        if(this.prevIntersected !== this.raytracer.intersected) {
            if(this.prevIntersected !== undefined) {
                dom.find(`li[cubename='${this.prevIntersected.tabulaCube.name}']`).removeClass('cube-intersected')
            }
            if(this.raytracer.intersected !== undefined) {
                dom.find(`li[cubename='${this.raytracer.intersected.tabulaCube.name}']`).addClass('cube-intersected')
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