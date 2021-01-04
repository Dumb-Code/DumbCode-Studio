import { Group, BoxBufferGeometry, BufferAttribute, Mesh, Material, PlaneBufferGeometry, Vector3, Object3D, Quaternion, EventDispatcher, MeshLambertMaterial } from "../../three.js";
import { ByteBuffer } from "../../animations.js";
import { readTblFile } from "./tbl_converter.js";
import { runInvertMath } from "../../modeling/cube_commands.js";
import { readBBModel } from "./bbmodel_loader.js";

const tempVector = new Vector3()
const tempQuaterion = new Quaternion()

const hierarchyChangedEvent = { type: "hierarchyChanged" }
const textureSizeChangedEvent = { type: "textureSizeChanged", width:64, hieght:64 }

export class DCMModel {

    constructor() {
        this.author = "???"
        this.fileName = "New Model"
        this.texWidth = 64
        this.texHeight = 64
        this.maxCubeLevel = 0
        
        this.cubeMap = new Map()
        this.children = []
    }

    setTextureSize(width, height) {
        this.texWidth = textureSizeChangedEvent.width = width
        this.texHeight = textureSizeChangedEvent.height = height
        this.dispatchEvent( textureSizeChangedEvent )
    }

    onCubeHierarchyChanged() {
        this.maxCubeLevel = 0
        this.cubeMap.clear()
        this.children.forEach(child => child.recalculateHierarchy(0, this))
        this.dispatchEvent( hierarchyChangedEvent )
    }

    createModel( material = this.mat ) {
        this.mat = material
        this.onCubeHierarchyChanged()

        this.modelCache = new Group() 
        this.modelCache.scale.set(1/16, 1/16, 1/16)
        this.modelCache.position.set(0.5, 0, 0.5)
        
        this.children.forEach(child => this.modelCache.add(child.createGroup()))

        return this.modelCache
    }

    invalidateModelCache() {
        this.traverseAll(cube => cube.cubeGroup = undefined)
    }

    traverseAll(func) {
        this.children.forEach(child => child.traverse(cube => func(cube)))
    }

    gatherAllCubes(arr = []) {
        this.traverseAll(c => arr.push(c))
        return arr
    }

    updateMatrixWorld(force = true) {
        this.modelCache.updateMatrixWorld(force)
    }

    addChild(child, silent = false) {
        this.onChildrenChange(silent, this.children.concat(child))   
    }

    deleteChild(child, silent = false) {
        this.onChildrenChange(silent, this.children.filter(c => c != child))
    }

    getChildren() {
        return this.children
    }

    onChildrenChange(silent = false, childern = this.children) {
        this.children.forEach(child => child.cubeGroup ? this.modelCache.remove(child.cubeGroup) : null)
        this.children = childern;
        this.children.forEach(child => this.modelCache.add(child.createGroup()))
        if(!silent) {
            this.onCubeHierarchyChanged()
        }
    }

    resetAnimations() {
        //todo: rename
        this.resetVisuals()
    }

    resetVisuals() {
        this.children.forEach(child => child.resetVisuals())
    }

    cloneModel() {
        let model = new DCMModel()
        
        model.author = this.author
        model.fileName = this.fileName
        model.texWidth = this.texWidth
        model.texHeight = this.texHeight

        model.children = this.children.map(c => c.cloneCube(model))

        model.onCubeHierarchyChanged()

        return model
    }
}

export class DCMCube {

    constructor(name, dimension, rotationPoint, offset, rotation, textureOffset, textureMirrored, cubeGrow, children, model) {
        this.name = name
        this.dimension = dimension
        this.rotationPoint = rotationPoint
        this.offset = offset
        this.rotation = rotation
        this.textureOffset = textureOffset
        this.textureMirrored = textureMirrored
        this.cubeGrow = cubeGrow
        this.children = children
        this.model = model
        this.hierarchyLevel = 0

        let counter = 0
        while(model.cubeMap.has(this.name)) {
            this.name = name + "~" + counter
            counter += 1
        }
        model.cubeMap.set(this.name, this)

        this.uvBuffer = new BufferAttribute(new Float32Array(new Array(6*4*2)), 2)
    }

  
    createGroup( ) {
        if(this.cubeGroup !== undefined && this.cubeMesh !== undefined) {
            return this.cubeGroup
        }
        this.cubeGroup = new Group();
        this.cubeGroup.tabulaCube = this

        this.cubeGrowGroup = new Group()
        this.cubeGrowGroup.tabulaCube = this

        this.cubeMesh = new Mesh(new BoxBufferGeometry(), this.model.mat)
        this.cubeMesh.tabulaCube = this
        this.cubeMesh.cubeGroup = this.cubeGroup

        this.cubeMesh.position.set(0.5, 0.5, 0.5)
        this.cubeMesh.updateMatrix();
        this.cubeMesh.geometry.applyMatrix(this.cubeMesh.matrix);
        this.cubeMesh.geometry.addAttribute("uv", this.uvBuffer)
        this.cubeMesh.position.set(0, 0, 0)

        this.cubeGrowGroup.add(this.cubeMesh)
        this.cubeGroup.add(this.cubeGrowGroup)

        this.cubeGroup.rotation.order = "ZYX"
        this.updatePosition()
        this.updateRotation()
        this.updateOffset()
        this.updateCubeGrow()
        
        this.onChildrenChange(true)
        
        return this.cubeGroup
    }

    getWorldPosition(xDelta, yDelta, zDelta, vector = new Vector3()) {
        let w = this.dimension[0] + this.cubeGrow[0]*2 + 0.0001
        let h = this.dimension[1] + this.cubeGrow[1]*2 + 0.0001
        let d = this.dimension[2] + this.cubeGrow[2]*2 + 0.0001
        tempVector.set(xDelta*w/16, yDelta*h/16, zDelta*d/16).applyQuaternion(this.cubeMesh.getWorldQuaternion(tempQuaterion))
        this.cubeMesh.getWorldPosition(vector).add(tempVector)
        return vector
    }

    recalculateHierarchy(hierarchyLevel, parent) {
        this.hierarchyLevel = hierarchyLevel
        this.parent = parent
        this.model.cubeMap.set(this.name, this)
        this.children.forEach(child => child.recalculateHierarchy(this.hierarchyLevel+1, this)) 
        if(this.children.length === 0) {
            this.model.maxCubeLevel = Math.max(this.model.maxCubeLevel, this.hierarchyLevel)
        }
    }

    addChild(child, silent = false) {
        this.onChildrenChange(silent, this.children.concat(child))   
    }

    deleteChild(child, silent = false) {
        this.onChildrenChange(silent, this.children.filter(c => c != child))
    }

    getChildren() {
        return this.children
    }

    cloneCube(model = this.model) {
        return new DCMCube(this.name.replace(/~\d+$/, ""), this.dimension, this.rotationPoint, this.offset, 
            this.rotation, this.textureOffset, this.textureMirrored, this.cubeGrow, 
            this.children.map(c => c.cloneCube(model)), model)
    }

    updateMatrixWorld(force = true) {
        this.cubeGroup.updateMatrixWorld(force)
    }

    traverse(callback) {
        callback(this)
        this.children.forEach(c => c.traverse(callback))
    }

    onChildrenChange(silent = false, childern = this.children) {
        this.children.forEach(child => child.cubeGroup ? this.cubeGroup.remove(child.cubeGroup) : null)
        this.children = childern;
        this.children.forEach(child => this.cubeGroup.add(child.createGroup()))
        if(!silent) {
            this.model.onCubeHierarchyChanged()
        }
    }

    getAllChildrenCubes(arr = [], includeSelf = false) {
        if(includeSelf) {
            arr.push(this)
        }
        this.children.forEach(c => {
            c.getAllChildrenCubes(arr)
            arr.push(c)
        })
        return arr
    }

    resetVisuals() {
        this.children.forEach(child => child.resetVisuals())

        this.updateGeometry({ shouldUpdateTexture: false })
        this.updateCubeGrow()
        this.updatePositionVisuals()
        this.updateRotationVisuals()
    }

    updateGeometry( { dimension = this.dimension, cubeGrow = this.cubeGrow, shouldUpdateTexture = true } = {}) {
        let w = dimension[0] + cubeGrow[0]*2 + 0.0001
        let h = dimension[1] + cubeGrow[1]*2 + 0.0001
        let d = dimension[2] + cubeGrow[2]*2 + 0.0001

        this.cubeMesh.scale.set(w, h, d)
        if(shouldUpdateTexture) {
            this.updateTexture({ dimension })
        }
    }

    updatePositionVisuals(position = this.rotationPoint) {
        this.cubeGroup.position.set(position[0], position[1], position[2])
    }

    updateRotationVisuals(rotation = this.rotation) {
        this.cubeGroup.rotation.set(rotation[0] * Math.PI / 180, rotation[1] * Math.PI / 180, rotation[2] * Math.PI / 180)
    }

    updateCubeGrowVisuals(value = this.cubeGrow) {
        this.cubeGrowGroup.position.set(-value[0], -value[1], -value[2])
        this.updateGeometry( {cubeGrow:value} )
    }

    updateTexture({ textureOffset = this.textureOffset, dimension = this.dimension, texWidth = this.model.texWidth, texHeight = this.model.texHeight, textureMirrored = this.textureMirrored } = {}) {
        
        let tm = textureMirrored
        let to = textureOffset
        let tw = texWidth
        let th = texHeight

        let w = dimension[0]
        let h = dimension[1]
        let d = dimension[2]
    
        this._genereateFaceData(tm ? 1 : 0, tm, to, tw, th, d, d+h, -d, -h)
        this._genereateFaceData(tm ? 0 : 1, tm, to, tw, th, d+w+d, d+h, -d, -h)
        this._genereateFaceData(2, tm, to, tw, th, d, 0, w, d)
        this._genereateFaceData(3, tm, to, tw, th, d+w, d, w, -d)
        this._genereateFaceData(4, tm, to, tw, th, d+w+d+w, d+h, -w, -h)
        this._genereateFaceData(5, tm, to, tw, th, d+w, d+h, -w, -h)

        this.uvBuffer.needsUpdate = true
    }

    updateCubeName(value = this.name) {
        this.name = value;
    }

    updateDimension(values = this.dimension, visualOnly = false) {
        if(visualOnly !== true) {
            this.dimension = values.map(e => Math.round(e))
        }
        this.updateGeometry( { dimension:values } )
    }

    updateCubeGrow(value = this.cubeGrow, visualOnly = false) {
        if(visualOnly !== true) {
            this.cubeGrow = value
        }
        this.updateCubeGrowVisuals(value)   
    }

    updateTextureOffset(values = this.textureOffset, visualOnly = false) {
        if(visualOnly !== true) {
            this.textureOffset = values.map(e => Math.round(e))
        }
        this.updateTexture( { textureOffset:values } )
    }

    updateTextureMirrored(value = this.textureMirrored, visualOnly = false) {
        if(visualOnly !== true) {
            this.textureMirrored = value
        }
        this.updateTexture( { textureMirrored: value } )
    }

    updateOffset(values = this.offset, visualOnly = false) {
        if(visualOnly !== true) {
            this.offset = values
        }
        this.cubeMesh.position.set(values[0], values[1], values[2])
    }

    updatePosition(values = this.rotationPoint, visualOnly = false) {
        if(visualOnly !== true) {
            this.rotationPoint = values
        }
        this.updatePositionVisuals(values)
    }

    updateRotation(values = this.rotation, visualOnly = false) {
        if(visualOnly !== true) {
            this.rotation = values
        }
        this.updateRotationVisuals(values)
    }

    _genereateFaceData(face, tm, toff, tw, th, offU, offV, heightU, heightV) {

        let u = toff[0]
        let v = toff[1]

        if(tm) {
            offU += heightU
            heightU *= -1
        }
        
        let uMin = (u + offU) / tw
        let vMin = (v + offV) / th
        let uMax = (u + offU + heightU) / tw
        let vMax = (v + offV + heightV) / th

        this.uvBuffer.set([
            uMax, vMax,
            uMin, vMax,
            uMax, vMin,
            uMin, vMin,
        ], face*8)
    }
}
DCMModel.loadModel = async(arrayBuffer, name = "", texturePart) => {
    let model
    let version = 2
    if(name.endsWith('.tbl')) {
        model = await readTblFile(arrayBuffer)
    } else if(name.endsWith('.bbmodel')) {
        model = await readBBModel(arrayBuffer, texturePart)
    } else {
        let buffer = new ByteBuffer(await arrayBuffer)

        model = new DCMModel()
    
        version = buffer.readNumber()
        model.author = buffer.readString()
        model.texWidth = buffer.readInteger()
        model.texHeight = buffer.readInteger()
    
        let readCubes = () => {
            let cubes = []
            let amount = buffer.readNumber()
            for(let i = 0; i < amount; i++) {
                cubes.push(new DCMCube(
                    buffer.readString(), //Name
                    [buffer.readInteger(), buffer.readInteger(), buffer.readInteger()], //Dimension
                    [buffer.readNumber(), buffer.readNumber(), buffer.readNumber()], //Rotation Point
                    [buffer.readNumber(), buffer.readNumber(), buffer.readNumber()], //Offset
                    [buffer.readNumber(), buffer.readNumber(), buffer.readNumber()], //Rotation
                    [buffer.readInteger(), buffer.readInteger()], //Texture Offset
                    buffer.readBool(), //Texture Mirrored
                    [buffer.readNumber(), buffer.readNumber(), buffer.readNumber()], //Cube Grow
                    readCubes(), //Children
                    model
                ))
            }
            return cubes
        }
    
        model.children = readCubes()    
    }
    if(name) {
        model.fileName = name.substring(0, name.lastIndexOf('.'))
    }

    if(version < 2) {
        model.createModel(new MeshLambertMaterial())
        model.modelCache.updateMatrix()
        model.modelCache.updateMatrixWorld(true)

        runInvertMath(model)
        
        model.invalidateModelCache()
    }
    return model
}

DCMModel.writeModel = model => {
    let buffer = new ByteBuffer()

    //0 - internally used version
    //    (???) [?]
    //
    //1 - Initial public version
    //    (13 SEP 2020) [e8c947bcc79583e3cd26eccb391b5f1e21ca7f27]
    //
    //2 - Model is inverted. This is done to fix tbl imported models. Having a version of 2 marks it as inverted
    //    (27 DEC 2020) [ba91a6db089353646b976c1fabb251910640db62]
    buffer.writeNumber(2) //Version
    
    buffer.writeString(model.author)
    buffer.writeNumber(model.texWidth)
    buffer.writeNumber(model.texHeight)

    let writeArr = (arr, amount) => [...Array(amount).keys()].forEach(num => buffer.writeNumber(arr[num]))

    let writeCubes = cubes => {
        buffer.writeNumber(cubes.length)
        cubes.forEach(cube => {
            buffer.writeString(cube.name)
            writeArr(cube.dimension, 3)
            writeArr(cube.rotationPoint, 3)
            writeArr(cube.offset, 3)
            writeArr(cube.rotation, 3)
            writeArr(cube.textureOffset, 2)
            buffer.writeBool(cube.textureMirrored)
            writeArr(cube.cubeGrow, 3)
            writeCubes(cube.children)
        })
    }

    writeCubes(model.children)

    return buffer
}

Object.assign( DCMModel.prototype, EventDispatcher.prototype )