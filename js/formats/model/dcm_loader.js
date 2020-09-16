import { Group, BoxBufferGeometry, BufferAttribute, Mesh, Material, PlaneBufferGeometry, Vector3, Object3D, Quaternion, EventDispatcher } from "../../three.js";
import { ByteBuffer } from "../../animations.js";
import { readTblFile } from "./tbl_converter.js";

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
        this.children.forEach(child => child.recalculateHierarchy())
        this.dispatchEvent( hierarchyChangedEvent )
    }

    createModel( material ) {
        this.mat = material

        this.modelCache = new Group() 
        this.modelCache.scale.set(1/16, 1/16, 1/16)
        this.modelCache.position.set(0.5, 0, 0.5)
        
        this.children.forEach(child => this.modelCache.add(child.createGroup()))

        return this.modelCache
    }

    invalidateModelCache() {
        this.children.forEach(child => child.traverse(cube => cube.cubeGroup = undefined))
    }

    addChild(child, silent = false) {
        this.children.push(child)
        this.onChildrenChange(silent)   
    }

    deleteChild(child, silent = false) {
        child.parent = undefined
        this.children = this.children.filter(c => c != child)
        this.onChildrenChange(silent)
    }

    onChildrenChange(silent = false, childern = this.children) {
        if(!silent) {
            this.onCubeHierarchyChanged()
        }
        this.children.forEach(child => child.cubeGroup ? this.modelCache.remove(child.cubeGroup) : 0)
        this.children = childern;
        this.children.forEach(child => this.modelCache.add(child.createGroup()))
    }

    resetAnimations() {
        //todo: rename
        this.resetVisuals()
    }

    resetVisuals() {
        this.children.forEach(child => child.resetVisuals())
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
    }

  
    createGroup( ) {
        if(this.cubeGroup !== undefined) {
            return this.cubeGroup
        }
        this.cubeGroup = new Group();
        this.cubeGroup.tabulaCube = this

        this.cubeMesh = new Mesh(new BoxBufferGeometry(), this.model.mat)
        this.cubeMesh.tabulaCube = this

        this.cubeMesh.position.set(0.5, 0.5, 0.5)
        this.cubeMesh.updateMatrix();
        this.cubeMesh.geometry.applyMatrix(this.cubeMesh.matrix);
        this.cubeMesh.position.set(0, 0, 0)

        this.cubeGroup.add(this.cubeMesh)
        this.updateDimension()

        this.cubeGroup.rotation.order = "ZYX"
        this.updatePosition()
        this.updateRotation()
        
        this.onChildrenChange()

        return this.cubeGroup
    }

    getWorldPosition(xDelta, yDelta, zDelta, vector = new Vector3(), quat) {
        let w = this.dimension[0] + this.cubeGrow[0]*2 + 0.01
        let h = this.dimension[1] + this.cubeGrow[1]*2 + 0.01
        let d = this.dimension[2] + this.cubeGrow[2]*2 + 0.01
        tempVector.set(xDelta*w/16, yDelta*h/16, zDelta*d/16).applyQuaternion(this.cubeMesh.getWorldQuaternion(tempQuaterion))
        this.cubeMesh.getWorldPosition(vector).add(tempVector)
        return vector
    }

    recalculateHierarchy() {
        this.children.forEach(child => {
            child.hierarchyLevel = this.hierarchyLevel+1
            child.parent = this
            child.recalculateHierarchy()
        }) 
        if(this.children.length === 0) {
            this.model.maxCubeLevel = Math.max(this.model.maxCubeLevel, this.hierarchyLevel)
        }
    }

    addChild(child, silent = false) {
        this.children.push(child)
        this.onChildrenChange(silent)
        
    }

    deleteChild(child, silent = false) {
        child.parent = undefined
        this.children = this.children.filter(c => c != child)
        this.onChildrenChange(silent)
    }

    getGroup() {
        return this.cubeGroup
    }

    getChildren() {
        return this.children
    }

    cloneCube() {
         return new DCMCube(this.name, this.dimension, this.rotationPoint, this.offset, 
            this.rotation, this.textureOffset, this.cubeGrow, 
            this.children.map(c => c.cloneCube()),
            this.textureMirrored, this.model)
    }

    traverse(callback) {
        callback(this)
        this.children.forEach(c => c.traverse(callback))
    }

    onChildrenChange(silent = false, childern = this.children) {
        if(!silent) {
            this.model.onCubeHierarchyChanged()
        }
        this.children.forEach(child => child.cubeGroup ? this.cubeGroup.add(child.cubeGroup) : 0)
        this.children = childern;
        this.children.forEach(child => this.cubeGroup.add(child.createGroup()))
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

        // this.updateGeometry()
        // this.updateCubePosition()
        this.updatePositionVisuals()
        this.updateRotationVisuals()
    }

    updateGeometry( { dimension = this.dimension, cubeGrow = this.cubeGrow, updateTexture = true } = {}) {
        let w = dimension[0] + cubeGrow[0]*2 + 0.01
        let h = dimension[1] + cubeGrow[1]*2 + 0.01
        let d = dimension[2] + cubeGrow[2]*2 + 0.01

        this.cubeMesh.scale.set(w, h, d)
        this.updateTexture()
    }

    updateCubePosition( { offset = this.offset } = {} ) {
        this.cubeMesh.position.set(offset[0], offset[1], offset[2] )
    }

    updatePositionVisuals(position = this.rotationPoint) {
        this.cubeGroup.position.set(position[0], position[1], position[2])
    }

    updateRotationVisuals(rotation = this.rotation) {
        this.cubeGroup.rotation.set(rotation[0] * Math.PI / 180, rotation[1] * Math.PI / 180, rotation[2] * Math.PI / 180)
    }

    updateTexture({ textureOffset = this.textureOffset, dimension = this.dimension, texWidth = this.model.texWidth, texHeight = this.model.texHeight, textureMirrored = this.textureMirrored } = {}) {
        let uvData = getUV(textureOffset[0], textureOffset[1], dimension[0], dimension[1], dimension[2], texWidth, texHeight, textureMirrored)
        this.cubeMesh.geometry.addAttribute("uv", new BufferAttribute(new Float32Array(uvData), 2))
    }

    updateCubeName(value = this.name) {
        this.name = value;
    }

    updateDimension(values = this.dimension, visualOnly = false) {
        if(visualOnly !== true) {
            this.dimension = values.map(e => Math.round(e))
        }
        this.updateCubePosition()
        this.updateGeometry( { dimension:values } )
        this.updateTexture( { dimension:values } )
    }

    updateCubeGrow(value = this.cubeGrow, visualOnly = false) {
        if(visualOnly !== true) {
            this.cubeGrow = value
        }
        this.updateGeometry( {cubeGrow:value} )
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
        this.updateCubePosition( { offset:values } )
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
}

function getUV(offsetX, offsetY, w, h, d, texWidth, texHeight, texMirrored) {

    //Uv data goes west, east, down, up, south, north (+x, -x, +y, -y, +z, -z)
    //6 -> 6 faces
    //4 -> 4 vertices per face
    //2 -> 2 data per vertex (u, v)
    let uvData = new Array(6 * 4 * 2)
    let texBottomOrder = [ 1, 5, 0, 4 ]
    let texUpperOrder = [3, 2]

    let offX = 0
    for(let texh = 0; texh < texBottomOrder.length; texh++) {
        let minX = offsetX + offX
        let minY = offsetY + d

        let xDist = w;

        let index = texBottomOrder[texh]

        if (texh % 2 == 0) {
            xDist = d
            if(texMirrored) {
                index = texBottomOrder[(texh + 2) % 4]
            }
        }
        offX += xDist

        putUVData(uvData, index, minX, minY, xDist, h, texWidth, texHeight, texMirrored)
    }

    for(let texb = 0; texb < texUpperOrder.length; texb++) {
        let minXLower = offsetX + d + w * texb + w
        if(texb == 0) { //Up
            putUVData(uvData, texUpperOrder[texb], minXLower, offsetY+d, -w, -d, texWidth, texHeight, texMirrored)
        } else { //Down
            putUVData(uvData, texUpperOrder[texb], minXLower, offsetY, -w, d, texWidth, texHeight, texMirrored) 
        }
    }

    // console.log(uvData.slice(2*8, 3*8))
    return uvData
}

function putUVData(uvData, facingindex, minU, minV, uSize, vSize, texWidth, texHeight, texMirrored) {
    if(texMirrored) {
        minU += uSize
        uSize = -uSize
    }

    //1 0 1 0
    //1 1 0 0
    let u = [minU + uSize, minU, minU + uSize, minU]
    let v = [minV + vSize, minV + vSize, minV, minV]
    for(let vertex = 0; vertex < 4; vertex++) {
        let index = (facingindex * 4 + vertex) * 2
        uvData[index] = u[vertex] / texWidth
        uvData[index + 1] = v[vertex] / texHeight
    }
}


DCMModel.loadModel = async(arrayBuffer, name = "") => {
    let model
    if(name.endsWith('.tbl')) {
        model = await readTblFile(arrayBuffer)
    } else {
        let buffer = new ByteBuffer(await arrayBuffer)

        model = new DCMModel()
    
        let _version = buffer.readNumber()
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
    return model
}

DCMModel.writeModel = model => {
    let buffer = new ByteBuffer()

    buffer.writeNumber(1) //Version
    
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