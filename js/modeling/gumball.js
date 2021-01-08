import { Vector3, Quaternion, Euler, Matrix4, Object3D, ReverseSubtractEquation } from "../libs/three.js"
import { LinkedSelectableList } from "../util/linked_selectable_list.js"

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

/**
 * The modeling gumball.
 */
export class Gumball {

    constructor(dom, studio) {
        this.transformControls = studio.transformControls
        this.raytracer = studio.raytracer
        this.pointTracker = studio.pointTracker
        //Helper method to get whether a cube is locked
        this.isCubeLocked = cube => studio.lockedCubes.isLocked(cube)

        //Get the transform anchor and add it to the studio group
        this.transformAnchor = new Object3D()
        this.transformAnchor.rotation.order = "ZYX"
        studio.group.add(this.transformAnchor)

        //Starting cache is the cache used to get the state of the cubes before the change
        this.startingCache = new Map()
        
        let objectSettings = dom.find('#gb-object')
        let gumballSettings = dom.find('#gb-gumball')

        //The option display type.
        this.optionDisplayType = new LinkedSelectableList(dom.find('.option-display-type'), true, "is-success").onchange(e => {
            switch(e.value) {
                case "object":
                    if(this.raytracer.anySelected() && this.toolTransformType.value !== undefined) {
                        this.transformControls.attach(this.transformAnchor)
                    } else {
                        this.transformControls.detach()
                    }
                    this.gumballTransformControls.detach()
                    objectSettings.css('display', '')
                    gumballSettings.css('display', 'none')
                    break;
                
                case "gumball":
                    this.transformControls.detach()
                    this.gumballTransformControls.attach(this.transformAnchor)
                    objectSettings.css('display', 'none')
                    gumballSettings.css('display', '')
                    break;
            }
        })

        //Create the transform controls
        this.gumballTransformControls = studio.display.createTransformControls()
        studio.group.add(this.gumballTransformControls)

        //The transform control tool
        this.gumballTransformMode = new LinkedSelectableList(dom.find('.gumball-control-tool'), true, 'is-info').onchange(e => this.gumballTransformControls.mode = e.value)

        //Cube selected elements
        let objectNoCubeSelected = dom.find('.object-no-object-selected')
        let objectNeedSelection = dom.find('.object-need-selection')
        objectNeedSelection.css('display', 'none')
        //When a selection is changed, update those values
        this.raytracer.addEventListener('selectchange', () => {
            objectNoCubeSelected.toggleClass('cube-selected', this.raytracer.anySelected())
            objectNeedSelection.css('display', this.raytracer.anySelected() ? '' : 'none')
            this.updateObjectModeVisibleElemenets()
        })

        //The object space, translation type and rotation type objects.
        this.objectSpaceOption = dom.find('.object-space-mode')
        this.translateTypeOption = dom.find('.object-translation-type')
        this.rotateTypeOption = dom.find('.object-rotation-type')

        //The translate type mode
        this.transformSelectParents = true
        this.toolTransformType = new LinkedSelectableList(dom.find('.transform-control-tool'), false, 'is-info').addPredicate(e => e === undefined || this.raytracer.anySelected()).onchange(e => {
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
            }
            this.updateObjectModeVisibleElemenets()
        })
        this.toolTransformType.value = undefined

        //Gumball reset options
        dom.find('.gumball-reset-position-world').click(() => this.transformAnchor.position.set(0, 0, 0))
        dom.find('.gumball-reset-rotation-world').click(() => this.transformAnchor.rotation.set(0, 0, 0))
        dom.find('.gumball-reset-position-cube').click(() => this.moveGumballToSelected( { rotation: false } ))
        dom.find('.gumball-reset-rotation-cube').click(() => this.moveGumballToSelected( { position: false } ))

        //The space
        this.spaceMode = new LinkedSelectableList(dom.find('.object-space-tool'), true, "is-info").onchange(e =>  this.transformControls.space = e.value)
        this.spaceMode.value = "local"

        //The selected translate mode
        this.selectedTranslate = new LinkedSelectableList(dom.find('.object-translate-type-entry'), true, "is-info").onchange(() => {
            this.toolTransformType.value = translateKey
            this.moveGumballToSelected()
        })
        
        //The selcted rotation mode
        this.selectedRotation = new LinkedSelectableList(dom.find('.object-rotate-type-entry'), true, "is-info").onchange(() => this.toolTransformType.value = rotateKey)

        //Whether the gumball should automatically move
        this.gumballAutomaticallyMove = dom.find('.gumball-automove-checkbox')
        .on('input', () => {
            if(this.gumballAutomaticallyMove.is(':checked')) {
                this.moveGumballToSelected()
            }
        })

        //The gumball movement point. Uses the pointracker
        dom.find('.gumball-movement-point').click(() => {
            this.pointTracker.enable(p => this.transformAnchor.position.copy(p))
        })

        const reason = 'gumball'
        //Block and unblock the memeneto traverser (undo/redo)
        this.transformControls.addEventListener('mouseDown', () => studio.pth.modelMementoTraverser.blockReason(reason))
        this.transformControls.addEventListener('mouseUp', () => studio.pth.modelMementoTraverser.unblockReason(reason))

        //When the mouse button is clicked, create the starting cache
        this.transformControls.addEventListener('mouseDown', () => {
            this.startingCache.clear()
            this.raytracer.selectedSet.forEach(cube => {
                //If rotation point, then create a cube locker for the cube's offset and children
                if(this.toolTransformType.value === translateKey && this.selectedTranslate.value === 'rotation_point') {
                    studio.lockedCubes.addToLocker(cube.tabulaCube, 1)
                    cube.tabulaCube.children.forEach(child => studio.lockedCubes.addToLocker(child, 2))
                }

                let elem = this.getObject(cube.tabulaCube)
                let parent = cube.tabulaCube.parent
                //Only move the cubes that don't have a parent moving too.
                let root = true
                while(parent) {
                    if(this.raytracer.isCubeSelected(parent)) {
                        root = false
                        break
                    }
                    parent = parent.parent
                }
                this.startingCache.set(cube.tabulaCube, { 
                    root: root,
                    position: [...cube.tabulaCube.rotationPoint], 
                    offset: [...cube.tabulaCube.offset],
                    dimension: [...cube.tabulaCube.dimension],
                    quaternion: elem.quaternion.clone(),
                    threePos: elem.getWorldPosition(elem.position.clone())
                })
            })
        })

        //Add the translate hooks
        this.transformControls.addEventListener('studioTranslate', e => {
            this.forEachCube(e.axis, true, (axis, cube, data) => {
                axis.multiplyScalar(e.length)
                let pos = axis.toArray()
                switch(this.selectedTranslate.value) {
                    case 'offset':
                        if(!this.isCubeLocked(cube)) {
                            cube.updateOffset(pos.map((e, i) => e + data.offset[i]))
                        }
                        break
                    case 'rotation_point':
                    case 'position':
                        cube.updatePosition(pos.map((e, i) => e + data.position[i]))
                        cube.cubeGroup.updateMatrixWorld(true)
                        break
                }
            })
        })

        //Add the rotate hooks
        this.transformControls.addEventListener('studioRotate', e => {
            this.forEachCube(e.rotationAxis, true, (axis, cube, data) => {
                decomposeRotation2.setFromAxisAngle(axis, e.rotationAngle)
                decomposeRotation2.multiply(data.quaternion).normalize()

                decomposeEuler.setFromQuaternion(decomposeRotation2, "ZYX")
                cube.updateRotation(decomposeEuler.toArray().map(v => v * 180 / Math.PI))

                if(this.selectedRotation.value === 'point')  {
                    let diff = decomposePosition.copy(data.threePos).sub(this.transformAnchor.position).multiply(decomposePosition2.set(16, 16, 16))
                    let rotatedPos = decomposePosition2.copy(diff).applyAxisAngle(axis, e.rotationAngle)
                    let rotatedDiff = rotatedPos.sub(diff)
                    cube.updatePosition(rotatedDiff.toArray().map((v, i) => v + data.position[i]))
                }
            })
        })

        //Add the dimension hooks
        this.transformControls.addEventListener('studioDimension', e => {
            let length = Math.floor(e.length*16)
            this.forEachCube(e.axis, false, (axis, cube, data) => {
                let len = [length, length, length]
                this.alignAxis(axis)
                cube.updateDimension(axis.toArray().map((e, i) => {
                    let ret = Math.abs(e)*length + data.dimension[i]
                    if(ret < 0) {
                        len[i] = -data.dimension[i]/Math.abs(e)
                        ret = 0
                    }
                    return ret
                }))
                if(e.axis.x+e.axis.y+e.axis.z < 0) {
                    cube.updateOffset(e.axis.toArray().map((e, i) => e*len[i] + data.offset[i]))
                }
            })
        })
    
    }

    /**
     * Updates the visible dom elements
     */
    updateObjectModeVisibleElemenets() {
        switch(this.optionDisplayType.value === 'object' && this.raytracer.anySelected() ? this.toolTransformType.value : undefined) {
            case translateKey: 
                this.objectSpaceOption.css('display', '')
                this.translateTypeOption.css('display', '')
                this.rotateTypeOption.css('display', 'none')
                break
            case rotateKey: 
                this.objectSpaceOption.css('display', '')
                this.translateTypeOption.css('display', 'none')
                this.rotateTypeOption.css('display', '')
                break
            case dimensionKey: 
                this.objectSpaceOption.css('display', 'none')
                this.translateTypeOption.css('display', 'none')
                this.rotateTypeOption.css('display', 'none')
                break
            default:
                this.objectSpaceOption.css('display', 'none')
                this.translateTypeOption.css('display', 'none')
                this.rotateTypeOption.css('display', 'none')
        };
    }


    /**
     * Runs callback with a transformed axis, the cube and any additional data.
     * Used for trasnform tools.
     */
    forEachCube(axisIn, applyRoots, callback) {
        this.transformAnchor.matrixWorld.decompose(decomposePosition, decomposeRotation, decomposeScale)
        this.startingCache.forEach((data, cube) => {
            if(applyRoots === true && data.root !== true) {
                return
            }
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

    /**
     * Aligns an vec3 to the closest axis.
     */
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
     
    /**
     * Sets this to use the translation tool.
     */
    setTranslationTool() {
        this.setMode(translateKey, this.selectedTranslate.value !== 'offset')
    }

    /**
     * Sets this to use the rotate tool
     */
    setRotationTool() {
        this.setMode(rotateKey, true)
    }

    /**
     * Sets this to use the dimensions tool
     */
    setDimensionsTool() {
        this.setMode(dimensionKey, false)
    }

    /**
     * Sets the mode in the transform controls.
     * @param {string} mode the mode to set
     * @param {boolean} parent whether the parent should be transformed
     */
    setMode(mode, parent = this.transformSelectParents) {
        this.transformSelectParents = parent
        
        if(mode === "none") {
            this.transformControls.detach()
        } else {
            this.gumballTransformControls.detach()
            this.transformControls.attach(this.transformAnchor);
            this.transformControls.mode = mode
        }
    }

    /**
     * Moves the anchor to the avarage position of the cubes, and the first cubes rotation
     * @param {*} param0 { position: if the position should move, rotation: if the rotaion should move} 
     */
    moveGumballToSelected({ position = true, rotation = true } = {}) {
        if(!this.raytracer.anySelected()) { // && this.transformControls.visible === true
            return
        }

        totalPosition.set(0, 0, 0)
        let firstSelected = this.raytracer.firstSelected()

        //Iterate over the cubes, adding the world position to `totalPostiion`, and setting the rotation if is the first cube.
        this.raytracer.selectedSet.forEach(cube => {
            let elem = this.transformSelectParents ? cube.parent : cube
            elem.matrixWorld.decompose(decomposePosition, decomposeRotation, decomposeScale)

            totalPosition.add(decomposePosition)

            if(cube === firstSelected && rotation === true) {
                this.transformAnchor.quaternion.copy(decomposeRotation)
            }
        })

        //Set the position to the avarage of the totalPosition
        if(position === true) {
            this.transformAnchor.position.copy(totalPosition).divideScalar(this.raytracer.selectedSet.size)
        }
    }

    /**
     * Gets the three object from the cube. Is the group if transformSelectParents is true, otherwise is the mesh.
     * @param {DCMCube} cube the cube to use
     */
    getObject(cube) {
        return this.transformSelectParents === true ? cube.cubeGroup : cube.cubeMesh
    }

    /**
     * Called when the raytracer selection size changes.
     */
    selectChange() {
        let isSelected = this.raytracer.selectedSet.size === 1

        if(!this.raytracer.anySelected()) {
            this.setMode("none")
        } else {
            this.toolTransformType.value = this.toolTransformType.value
        }
        if(this.gumballAutomaticallyMove.is(':checked')) {
            this.moveGumballToSelected()
        }

        this.transformAnchor.tabulaCube = isSelected ? this.raytracer.firstSelected()?.tabulaCube : undefined

    }

}