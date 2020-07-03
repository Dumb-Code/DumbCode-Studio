import { LinkedElement } from "../util.js"
import { indexHandler, numberHandler, enumHandler, booleanHandler, ArgumentHandler, stringHandler, axisNumberHandler } from "../command_handler.js"
import { Vector3, Quaternion, Matrix4, Euler } from "../three.js"

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


export class CubeValueDisplay {

    constructor(dom, studio, renameCube) {
        this.raytracer = studio.raytracer
        this.display = studio.display
        this.root = studio.commandRoot
        this.commandResultChangeCache = null

        this.lockedCubes = studio.lockedCubes
        this.rotationPointMarkers = studio.rotationPointMarkers

        this.cubeName = new LinkedElement(dom.find('.input-cube-name'), false, false).onchange(e => {
            dom.find('.input-cube-name').toggleClass('input-invalid', renameCube(e.old, e.value))
        })
        this.dimensions = new LinkedElement(dom.find('.input-dimension')).onchange(e => this.runArrayCommand('dim', xyzAxis, e))
        this.positions = new LinkedElement(dom.find('.input-position')).onchange(e => this.runArrayCommand('pos', xyzAxis, e))
        this.offsets = new LinkedElement(dom.find('.input-offset')).onchange(e => this.runArrayCommand('off', xyzAxis, e))
        this.cubeGrow = new LinkedElement(dom.find('.input-cube-grow'), false).onchange(e =>  this.root.runCommand(`cubegrow set ${e.value}`))
        this.textureOffset = new LinkedElement(dom.find('.input-texure-offset')).onchange(e => this.runArrayCommand('tex', uvAxis, e))
        this.textureMirrored = new LinkedElement(dom.find('.input-texture-mirrored'), false, false, true).onchange(e => this.root.runCommand(`mirror ${e.value}`))
        this.rotation = new LinkedElement(dom.find('.input-rotation')).withsliders(dom.find('.input-rotation-slider')).onchange(e => this.runArrayCommand('rot', xyzAxis, e))

        studio.transformControls.addEventListener('objectChange', () => this.updateCubeValues())

        this.setCommands(studio.commandRoot)
    }

    runArrayCommand(name, axis, e) {
        if(e.idx !== -1) {
            this.root.runCommand(`${name} set ${axis[e.idx]} ${e.value[e.idx]}`)
        } else {
            this.root.runCommand(`${name} set ${axis} ${e.value.join(' ')}`)
        }
    }

    setCommands(root) {
        root.command('with', 'w')
            .argument('cube', this.cubeArgumentHandler())
            .argument('cmd', stringHandler(), true)
            .onRun(args => {
                let ctx = args.context
                ctx.cube = args.get('cube')
                root.runCommandSplit(args.get('cmd'), ctx)
            })

        let posChanged = (cube, values, visualOnly) => {
            this.lockedCubes.createLockedCubesCache()
            cube.updatePosition(values, visualOnly)
            this.lockedCubes.reconstructLockedCubes()
            this.rotationPointMarkers.updateSpheres()
        }
        this.createArrayCommand(root, cube => cube.rotationPoint, posChanged, xyzAxis, 'pos')
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

        let rotChanged = (cube, values, visualOnly) => {
            this.lockedCubes.createLockedCubesCache()
            cube.updateRotation(values, visualOnly)
            this.lockedCubes.reconstructLockedCubes()
            this.rotationPointMarkers.updateSpheres()
        }
        this.createArrayCommand(root, cube => cube.rotation, rotChanged, xyzAxis, 'rot')
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


        this.createArrayCommand(root, cube => cube.dimension, (cube, values, visualOnly) => cube.updateDimension(values, visualOnly), xyzAxis, 'dim', true)
        this.createArrayCommand(root, cube => cube.offset, (cube, values, visualOnly) => cube.updateOffset(values, visualOnly), xyzAxis, 'off')
        this.createArrayCommand(root, cube => cube.textureOffset, (cube, values, visualOnly) => cube.updateTextureOffset(values, visualOnly), 'uv', 'tex')

        root.command('cubegrow')
            .argument('mode', enumHandler('set', 'add'))
            .endSubCommands()
            .addCommandBuilder(`setcubegrow`, 'set')
            .addCommandBuilder(`addcubegrow`, 'add')
            .argument('value', numberHandler())
            .onRun(args => {
                let cube = this.commandCube(args.context)
                let mode = args.get('mode')
                let value = args.get('value') + (mode === 0 ? 0 : cube.mcScale)
                if(args.context.dummy === true) {
                    this.commandResultChangeCache = { cube, func: () => cube.updateCubeGrow(value, true) }
                } else {
                    cube.updateCubeGrow(value)
                    this.updateCubeValues()
                }
            })
            .onExit(() => this.onCommandExit())


        root.command('mirror')
            .addCommandBuilder(`mirror`)
            .argument('value', booleanHandler())
            .onRun(args => {
                let cube = this.commandCube(args.context)
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
                let cube = this.commandCube(args.context)
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
            this.rotationPointMarkers.updateSpheres()
        }
    }

    onRender() {
        if(this.commandResultChangeCache !== null) {
            this.commandResultChangeCache.func()
        }
    }
 
    commandCube(context) {
        if(context.cube !== undefined) {
            return context.cube
        }
        if(this.raytracer.selectedSet.size === 0) {
            throw new Error("No cube selected")
        }
        if(this.raytracer.selectedSet.size !== 1) {
            throw new Error("More than one cube selected")
        }
        return this.raytracer.firstSelected().tabulaCube
    }

    updateCubeValues() {
        let isSelected = this.raytracer.selectedSet.size === 1
        if(isSelected) {
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
            let cube = this.display.tbl.cubeMap.get(p)
            if(cube === undefined) {
                throw Error(`Cube ${p} does not exist`)
            }
            return cube
        }, p => [...this.display.tbl.cubeMap.keys()])
    }

}