import { LinkedSelectableList, ToggleableElement } from "../util.js"
import { Vector3, Quaternion, Euler, Matrix4, Object3D } from "../three.js"

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

export class Gumball {

    constructor(dom, studio) {
        let root = studio.commandRoot
        this.transformControls = studio.transformControls
        this.raytracer = studio.raytracer
        this.pointTracker = studio.pointTracker
        this.isCubeLocked = cube => studio.lockedCubes.isLocked(cube)

        this.transformAnchor = new Object3D()
        this.transformAnchor.rotation.order = "ZYX"

        studio.display.scene.add(this.transformAnchor)

        this.startingCache = new Map()
        
        this.transformSelectParents = true
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

        this.selectedTranslate = new LinkedSelectableList(dom.find('.dropdown-translation > .dropdown-item')).onchange(() => this.toolTransformType.value = translateKey)
        this.selectedRotation = new LinkedSelectableList(dom.find('.dropdown-rotation > .dropdown-item')).onchange(() => this.toolTransformType.value = rotateKey)
        this.globalSpaceMode = new LinkedSelectableList(dom.find('.dropdown-transform-mode > .dropdown-item')).onchange(e => {
            this.transformControls.space = e.value
            this.gumballRotateTool.space = e.value
            this.gumballTranslateTool.space = e.value
        })

        this.gumballRotateTool = studio.display.createTransformControls()
        this.gumballRotateTool.mode = 'rotate'
        this.gumballTranslateTool = studio.display.createTransformControls()
        this.gumballTranslateTool.mode = 'translate'

        this.gumballRotateTool.traverse(e => e.material?.color?.addScalar(0.25))
        this.gumballTranslateTool.traverse(e => e.material?.color?.addScalar(0.25))
        this.gumballRotateTool.addEventListener('mouseDown', () => this.gumballTranslateTool.enabled = false)
        this.gumballTranslateTool.addEventListener('mouseDown', () => this.gumballRotateTool.enabled = false)
        this.gumballRotateTool.addEventListener('mouseUp', () => this.gumballTranslateTool.enabled = true)
        this.gumballTranslateTool.addEventListener('mouseUp', () => this.gumballRotateTool.enabled = true)

        dom.find('.gumball-movement-freely').click(() => {
            this.toolTransformType.value = undefined
            this.gumballRotateTool.attach(this.transformAnchor)
            this.gumballTranslateTool.attach(this.transformAnchor)
        })

        this.gumballAutomaticallyMove = new ToggleableElement(dom.find('.gumball-movement-selected')).onchange(e => {
            if(e.value) {
                this.moveGumballToSelected()
            }
        })
        this.gumballAutomaticallyMove.value = true

        dom.find('.gumball-movement-point').click(() => {
            this.pointTracker.enable(p => this.transformAnchor.position.copy(p))
        })

        this.transformControls.addEventListener('mouseDown', () => {
            this.startingCache.clear()
            this.raytracer.selectedSet.forEach(cube => {
                let elem = this.getObject(cube.tabulaCube)
                this.startingCache.set(cube.tabulaCube, { 
                    position: [...cube.tabulaCube.rotationPoint], 
                    offset: [...cube.tabulaCube.offset],
                    dimension: [...cube.tabulaCube.dimension],
                    quaternion: elem.quaternion.clone(),
                    threePos: elem.getWorldPosition(elem.position.clone())
                })
            })
        })

        this.transformControls.addEventListener('studioTranslate', e => {
            this.forEachCube(e.axis, (axis, cube, data) => {
                axis.multiplyScalar(e.length)
                let pos = axis.toArray()
                switch(this.selectedTranslate.value) {
                    case 'offset':
                        if(!this.isCubeLocked(cube)) {
                            root.runCommand(`with ${cube.name} off set xyz ${pos.map((e, i) => e + data.offset[i]).join(' ')}`)
                        }
                        break
                    case 'rotation_point':
                    case 'position':
                        cube.updatePosition(pos.map((e, i) => e + data.position[i]))
                        break
                }
            })
        })

        this.transformControls.addEventListener('studioRotate', e => {
            this.forEachCube(e.rotationAxis, (axis, cube, data) => {
                decomposeRotation2.setFromAxisAngle(axis, e.rotationAngle)
                decomposeRotation2.multiply(data.quaternion).normalize()

                decomposeEuler.setFromQuaternion(decomposeRotation2, "ZYX")
                cube.updateRotation(decomposeEuler.toArray().map(v => v * 180 / Math.PI))

                if(this.selectedRotation.value === 'point')  {
                    let diff = decomposePosition.copy(data.threePos).sub(this.transformAnchor.position).multiply(decomposePosition2.set(-16, -16, 16))
                    let rotatedPos = decomposePosition2.copy(diff).applyAxisAngle(axis, e.rotationAngle)
                    let rotatedDiff = rotatedPos.sub(diff)
                    cube.updatePosition(rotatedDiff.toArray().map((v, i) => v + data.position[i]))
                }
            })
        })

        this.transformControls.addEventListener('studioDimension', e => {
            let length = Math.floor(Math.abs(e.length*16))
            this.forEachCube(e.axis, (axis, cube, data) => {
                this.alignAxis(axis)

                cube.updateDimension(axis.toArray().map((e, i) => Math.abs(e)*length + data.dimension[i]))
                if(e.axis.x+e.axis.y+e.axis.z < 0) {
                    cube.updateOffset(e.axis.toArray().map((e, i) => e*length + data.offset[i]))
                }
            })
        })
    
    }


    forEachCube(axisIn, callback) {
        this.transformAnchor.matrixWorld.decompose(decomposePosition, decomposeRotation, decomposeScale)
        this.startingCache.forEach((data, cube) => {
            let elem = this.getObject(cube)

            elem.parent.matrixWorld.decompose(decomposePosition2, decomposeRotation2, decomposeScale2)
            let axis = axisIn.clone()
            if(this.transformControls.space === 'local') {
                axis.applyQuaternion(decomposeRotation)
            }
            axis.applyQuaternion(decomposeRotation2.inverse())
            callback(axis, cube, data)
        })
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

    moveGumballToSelected() {
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

    getObject(cube) {
        return this.transformSelectParents === true ? cube.cubeGroup : cube.planesGroup
    }

    isTranslateRotationPoint() {
        return this.toolTransformType.value === translateKey && this.selectedTranslate.value === 'rotation_point'
    }

    selectChange() {
        let isSelected = this.raytracer.selectedSet.size === 1

        this.gumballRotateTool.detach()
        this.gumballTranslateTool.detach()
        if(!this.raytracer.anySelected() || (this.toolTransformType.value === dimensionKey && !isSelected)) {
            this.setMode("none")
        } else {
            this.toolTransformType.value = this.toolTransformType.value
        }
        if(this.gumballAutomaticallyMove.value) {
            this.moveGumballToSelected()
        }

        this.transformAnchor.tabulaCube = isSelected ? this.raytracer.firstSelected()?.tabulaCube : undefined

    }

}