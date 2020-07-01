import { LinkedElement } from "../util.js"
import { indexHandler, numberHandler, enumHandler } from "../command_handler.js"

const xyzAxis = "xyz"
const uvAxis = "uv"

export class CubeValueDisplay {

    constructor(dom, studio, renameCube) {
        this.raytracer = studio.raytracer
        this.root = studio.commandRoot

        let lockedCubes = studio.lockedCubes

        this.cubeName = new LinkedElement(dom.find('.input-cube-name'), false, false).onchange(e => {
            dom.find('.input-cube-name').toggleClass('input-invalid', renameCube(e.old, e.value))
        })
        this.dimensions = new LinkedElement(dom.find('.input-dimension')).onchange(e => this.runArrayCommand('dim', xyzAxis, e))
        this.positions = new LinkedElement(dom.find('.input-position')).onchange(e => {
            lockedCubes.createLockedCubesCache()
            this.runArrayCommand('pos', xyzAxis, e)
            lockedCubes.reconstructLockedCubes()
            studio.rotationPointMarkers.updateSpheres()
        })
        this.offsets = new LinkedElement(dom.find('.input-offset')).onchange(e => this.runArrayCommand('off', xyzAxis, e))
        this.cubeGrow = new LinkedElement(dom.find('.input-cube-grow'), false).onchange(e => this.getCube()?.updateCubeGrow(e.value))
        this.textureOffset = new LinkedElement(dom.find('.input-texure-offset')).onchange(e => this.runArrayCommand('tex', uvAxis, e))
        this.textureMirrored = new LinkedElement(dom.find('.input-texture-mirrored'), false, false).onchange(e => this.getCube()?.updateTextureMirrored(e.value))
        this.rotation = new LinkedElement(dom.find('.input-rotation')).withsliders(dom.find('.input-rotation-slider')).onchange(e => {
            lockedCubes.createLockedCubesCache()
            this.runArrayCommand('rot', xyzAxis, e)
            lockedCubes.reconstructLockedCubes()
            studio.rotationPointMarkers.updateSpheres()
        })

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
        this.createArrayCommand(root, cube => cube.dimension, (cube, values) => cube.updateDimension(values), xyzAxis, 'dim', 'dimension')
        this.createArrayCommand(root, cube => cube.rotationPoint, (cube, values) => cube.updatePosition(values), xyzAxis, 'pos', 'position')
        this.createArrayCommand(root, cube => cube.offset, (cube, values) => cube.updateOffset(values), xyzAxis, 'off', 'offset')
        this.createArrayCommand(root, cube => cube.rotation, (cube, values) => cube.updateRotation(values), xyzAxis, 'rot', 'rotation')
        this.createArrayCommand(root, cube => cube.textureOffset, (cube, values) => cube.updateTextureOffset(values), 'uv', 'tex', 'textureoff')
    }

    createArrayCommand(root, cubeGetter, cubeSetter, axisNames, ...names) {
        root.command(...names)
            .argument('mode', enumHandler('set', 'add'))
            .endSubCommands()
            .argument('axis', indexHandler(axisNames))
            .argument("values", numberHandler(), true)
            .onRun(args => {
                let mode = args.get('mode')
                let axis = args.get('axis')
                let values = args.get('values')
                if(axis.length < values.length) {
                    throw new Error(`${axis.length} axis provided, but only ${values.length} values provided.`)
                }
                let cube = this.commandCube()
                let cubeValues = cubeGetter(cube)
                if(mode === 0) {
                    axis.forEach((a, idx) => cubeValues[a] = values[idx])
                } else {
                    axis.forEach((a, idx) => cubeValues[a] += values[idx])
                }
                cubeSetter(cube, cubeValues)
            })
    }

    commandCube() {
        if(this.raytracer.selectedSet.size === 0) {
            throw new Error("No cube selected")
        }
        if(this.raytracer.selectedSet.size !== 1) {
            throw new Error("More than one cube selected")
        }
        return this.raytracer.firstSelected().tabulaCube
    }

    getCube() {
        return this.raytracer.selectedSet.size === 1 ? this.raytracer.firstSelected().tabulaCube : undefined
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

}