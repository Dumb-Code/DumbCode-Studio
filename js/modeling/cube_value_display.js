import { indexHandler, numberHandler, enumHandler, booleanHandler, ArgumentHandler, stringHandler, axisNumberHandler } from "../command_handler.js"
import { Vector3, Quaternion, Matrix4, Euler } from "../libs/three.js"
import { LinkedElement } from "../util/linked_element.js"
import { ToggleableElement } from "../util/toggleable_element.js"

const xyzAxis = "xyz"
const uvAxis = "uv"

const tempVec = new Vector3()
const tempQuat = new Quaternion()
const tempEuler = new Euler()

const decomposePosition = new Vector3()
const decomposeRotation = new Quaternion()
const decomposeEuler = new Euler()
const decomposeScale = new Vector3()

const resultMat = new Matrix4()
const resultMat2 = new Matrix4()


/**
 * Used for the right hand display of the cube values
 */
export class CubeValueDisplay {

    constructor(dom, studio, renameCube) {
        this.raytracer = studio.raytracer
        this.pth = studio.pth
        this.root = studio.commandRoot
        this.commandResultChangeCache = null

        this.lockedCubes = studio.lockedCubes
        this.rotationPointMarkers = studio.rotationPointMarkers

        //Gets the selected cube, or null if no cube selected
        let getCube = () => this.raytracer.selectedSet.size === 1 ? this.raytracer.firstSelected().tabulaCube : null

        //The cube name property
        this.cubeName = new LinkedElement(dom.find('.input-cube-name'), false, false).onchange(e => {
            dom.find('.input-cube-name').toggleClass('input-invalid', renameCube(e.old, e.value))
        })
        //The cube dimensions property
        this.dimensions = new LinkedElement(dom.find('.input-dimensions .input-part')).onchange(e => getCube()?.updateDimension(e.value))
        //The cube position property
        this.positions = new LinkedElement(dom.find('.input-position .input-part')).onchange(e => {
            this.lockedCubes.createLockedCubesCache()
            getCube()?.updatePosition(e.value)
            this.lockedCubes.reconstructLockedCubes()
        })
        //The cube offset property
        this.offsets = new LinkedElement(dom.find('.input-offset .input-part')).onchange(e => getCube()?.updateOffset(e.value))
        
        //The cube grow locked property
        this.cubeGrowLocked = new ToggleableElement(dom.find('.cube-grow-lock'), 'is-locked')
        .addPredicate(() => this.cubeGrow.value !== undefined)
        .onchange(() => {
            let values = this.cubeGrow.value
            if(values === undefined) {
                return
            }
            if(this.cubeGrowLocked.value === true) {
                let val = (values[0]+values[1]+values[2]) / 3
                values[0] = val
                values[1] = val
                values[2] = val
                this.cubeGrow.value = values
            }
        })
        //The cube grow element
        this.cubeGrow = new LinkedElement(dom.find('.input-cube-grow .input-part')).onchange(e => {
            if(e.idx !== -1 && this.cubeGrowLocked.value) {
                let val = e.value[e.idx]
                e.value[0] = val
                e.value[1] = val
                e.value[2] = val
                this.cubeGrow.setInternalValue(e.value)
            }
            getCube()?.updateCubeGrow(e.value)
        })

        //The texture offset element (not used: remove)
        this.textureOffset = new LinkedElement(dom.find('.input-texure-offset')).onchange(e => getCube()?.updateTextureOffset(e.value))
        //The texture mirrored element (not used: remove)
        this.textureMirrored = new LinkedElement(dom.find('.input-texture-mirrored'), false, false).onchange(e => getCube()?.updateTextureMirrored(e.value))
        
        //The rotation property.
        this.rotation = new LinkedElement(dom.find('.input-rotation .input-part')).withsliders(dom.find('.input-rotation .input-part-slider')).onchange(e => {
            this.lockedCubes.createLockedCubesCache()
            getCube()?.updateRotation(e.value)
            this.lockedCubes.reconstructLockedCubes()
        })

        //Shouldn't this be the raytracer select change?
        studio.transformControls.addEventListener('objectChange', () => this.updateCubeValues())

        //Sets the commands
        this.setCommands(studio.commandRoot)
    }

    setCommands(root) {
        //With command. Used to run commands with spefic cubes
        root.command('with', 'w')
            .argument('cube', this.cubeArgumentHandler())
            .argument('cmd', stringHandler(), true)
            .onRun(args => {
                let ctx = args.context
                ctx.cube = args.get('cube')
                root.runCommandSplit(args.get('cmd'), ctx)
            })

        //Called when the position is changed.
        let posChanged = (cube, values, visualOnly) => {
            this.lockedCubes.createLockedCubesCache()
            cube.updatePosition(values, visualOnly)
            this.lockedCubes.reconstructLockedCubes()
        }

        //Create the rotation point command (local)
        this.createArrayCommand(root, cube => cube.rotationPoint, posChanged, xyzAxis, 'pos')
        //Create the rotation point command (world)
        this.createArrayCommand(root, cube => cube.rotationPoint, posChanged, xyzAxis, 'posworld', false, (mode, axisValues, cube) => {
            cube.resetVisuals()
            cube.parent.resetVisuals()

            if(mode === 0) { //Set
                cube.cubeGroup.matrixWorld.decompose(decomposePosition, decomposeRotation, decomposeScale)
                axisValues.forEach((e, idx) => e === undefined ? null : decomposePosition.setComponent(idx, (idx==1?1.5:0) + (e/16)))
                resultMat.compose(decomposePosition, decomposeRotation, decomposeScale)

                resultMat2.getInverse(cube.cubeGroup.parent.matrixWorld).multiply(resultMat)
                resultMat2.decompose(decomposePosition, decomposeRotation, decomposeScale)

                decomposePosition.toArray(axisValues)
            } else { //Add
                tempVec.fromArray(axisValues.map(e => e===undefined?0:e))
                cube.cubeGroup.parent.matrixWorld.decompose(decomposePosition, decomposeRotation, decomposeScale)
                tempVec.applyQuaternion(decomposeRotation.inverse()).toArray(axisValues)
            }
        })

        //Called when rotation is changed
        let rotChanged = (cube, values, visualOnly) => {
            this.lockedCubes.createLockedCubesCache()
            cube.updateRotation(values, visualOnly)
            this.lockedCubes.reconstructLockedCubes()
        }
        //Create the rotation command (local)
        this.createArrayCommand(root, cube => cube.rotation, rotChanged, xyzAxis, 'rot')
        //Create the rotation command (world)
        this.createArrayCommand(root, cube => cube.rotation, rotChanged, xyzAxis, 'rotworld', false, (mode, axisValues, cube) => {
            cube.parent.resetVisuals()
            cube.resetVisuals()

            if(mode === 0) { //Set
                cube.cubeGroup.matrixWorld.decompose(decomposePosition, decomposeRotation, decomposeScale)
                decomposeEuler.setFromQuaternion(decomposeRotation, "ZYX").toVector3(tempVec)
                axisValues.forEach((e, idx) => e === undefined ? null : tempVec.setComponent(idx, e * Math.PI / 180))
                resultMat.compose(decomposePosition, decomposeRotation.setFromEuler(decomposeEuler.setFromVector3(tempVec, "ZYX")), decomposeScale)

                resultMat2.getInverse(cube.cubeGroup.parent.matrixWorld).multiply(resultMat)
                resultMat2.decompose(decomposePosition, decomposeRotation, decomposeScale)

                decomposeEuler.setFromQuaternion(decomposeRotation, "ZYX").toArray(axisValues)
                axisValues.forEach((v, idx) => axisValues[idx] = v * 180 / Math.PI) // :/
            } else { //Add
                let result = [0, 0, 0]
                for(let i = 0; i < 3; i++) {
                    if(axisValues[i] === undefined) {
                        continue
                    }
                    cube.cubeGroup.parent.matrixWorld.decompose(decomposePosition, decomposeRotation, decomposeScale)
                    let axis = tempVec.set(i==0?1:0, i==1?1:0, i==2?1:0).applyQuaternion(decomposeRotation.inverse())

                    tempQuat.setFromAxisAngle(axis, axisValues[i] * Math.PI / 180)
                    tempQuat.multiply(cube.cubeGroup.quaternion).normalize()

                    tempEuler.setFromQuaternion(cube.cubeGroup.quaternion, "ZYX")
                    decomposeEuler.setFromQuaternion(tempQuat, "ZYX")

                    result[0] += (decomposeEuler.x - tempEuler.x) * 180 / Math.PI
                    result[1] += (decomposeEuler.y - tempEuler.y) * 180 / Math.PI
                    result[2] += (decomposeEuler.z - tempEuler.z) * 180 / Math.PI
                }


                result.forEach((e, idx) => axisValues[idx] = e)
            }

        })


        //Create the dimension, offset, texOffset and cubegrow commands
        this.createArrayCommand(root, cube => cube.dimension, (cube, values, visualOnly) => cube.updateDimension(values, visualOnly), xyzAxis, 'dim', true)
        this.createArrayCommand(root, cube => cube.offset, (cube, values, visualOnly) => cube.updateOffset(values, visualOnly), xyzAxis, 'off')
        this.createArrayCommand(root, cube => cube.textureOffset, (cube, values, visualOnly) => cube.updateTextureOffset(values, visualOnly), 'uv', 'tex')
        this.createArrayCommand(root, cube => cube.cubeGrow, (cube, values, visualOnly) => cube.updateCubeGrow(values, visualOnly), xyzAxis, 'cg')

        //Create the texture mirrored command
        root.command('texmirror')
            .addCommandBuilder(`texmirror`)
            .argument('value', booleanHandler())
            .onRun(args => {
                let cube = args.context.getCube()
                let value = args.get('value')

                if(args.context.dummy === true) {
                    this.commandResultChangeCache = { cube, func: () => cube.updateTextureMirrored(value, true) }
                } else {
                    cube.updateTextureMirrored(value)
                    this.updateCubeValues()
                }
            })
            .onExit(() => this.onCommandExit())
    }

    /**
     * Creates an array command to update cube values.
     */
    createArrayCommand(root, cubeGetter, cubeSetter, axisNames, name, integer = false, axisEditor = (_mode, _axisValues, _cube) => {}) {
        root.command(name)
            .argument('mode', enumHandler('set', 'add'))
            .endSubCommands()
            .addCommandBuilder(`set${name}`, 'set')
            .addCommandBuilder(`add${name}`, 'add')
            .argument('axis', axisNumberHandler(axisNames, integer))
            .onRun(args => {
                let mode = args.get('mode')
                let axis = args.get('axis')
                let cube = args.context.getCube()
                let cubeValues = [...cubeGetter(cube)]

                let axisValues = [ undefined, undefined, undefined ]
                axis.forEach(a => axisValues[a.axisID] = a.value)

                axisEditor(mode, axisValues, cube)

                if(mode === 0) {
                    axisValues.forEach((a, idx) => a === undefined ? null : cubeValues[idx] = a)
                } else {
                    axisValues.forEach((a, idx) => a === undefined ? null : cubeValues[idx] += a)
                }
                
                if(args.context.dummy === true) {
                    this.commandResultChangeCache = { cube, func: () => cubeSetter(cube, cubeValues, true) }
                } else {
                    cubeSetter(cube, cubeValues, false)
                    this.updateCubeValues()
                }
            })
            .onExit(() => this.onCommandExit())
    }

    onCommandExit() {
        if(this.commandResultChangeCache !== null) {
            this.commandResultChangeCache.cube.resetVisuals()
            this.commandResultChangeCache.cube.cubeGroup.updateMatrixWorld(true)
            this.commandResultChangeCache = null
        }
    }

    onRender() {
        if(this.commandResultChangeCache !== null) {
            this.commandResultChangeCache.func()
        }
    }

    //Update the cube values.
    updateCubeValues() {
        let isSelected = this.raytracer.selectedSet.size === 1
        if(isSelected) {
            let cube = this.raytracer.firstSelected().tabulaCube

            let vals = cube.cubeGrow

            this.cubeName.setInternalValue(cube.name)
            this.positions.setInternalValue(cube.rotationPoint)
            this.dimensions.setInternalValue(cube.dimension)
            this.rotation.setInternalValue(cube.rotation)
            this.offsets.setInternalValue(cube.offset)
            this.cubeGrow.setInternalValue(vals)
            this.textureOffset.setInternalValue(cube.textureOffset)
            this.textureMirrored.setInternalValue(cube.textureMirrored)
            this.cubeGrowLocked.setInternalValue(vals[0] === vals[1] && vals[1] === vals[2])
        } else {
            this.cubeGrowLocked.setInternalValue(true)
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

    cubeArgumentHandler() {
        return new ArgumentHandler(p => {
            let cube = this.pth.model.cubeMap.get(p)
            if(cube === undefined) {
                throw Error(`Cube ${p} does not exist`)
            }
            return cube
        }, p => [...this.pth.model.cubeMap.keys()])
    }

}