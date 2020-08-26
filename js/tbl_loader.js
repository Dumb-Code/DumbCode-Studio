import { Group, BoxBufferGeometry, BufferAttribute, Mesh, Material, PlaneBufferGeometry, Vector3, Object3D } from "./three.js";
import { downloadBlob } from "./util.js";

const tempVector = new Vector3()

export class TBLModel {

    constructor() {
        this.modelName = "New Model"
        this.author = "???"
        this.texWidth = 64
        this.texHeight = 64
        this.maxCubeLevel = 0
        
        this.cubeMap = new Map()
        this.rootGroup = new TblCubeGroup(this, [], [])

        this.onCubeHierarchyChanged = () => {
            this.maxCubeLevel = 0
            this.rootGroup.recalculateHierarchy()
        }
    }

    parseJson(content) {

        let jobj = JSON.parse(content)

        this.modelName = jobj.modelName
        this.author = jobj.authorName

        this.texWidth = jobj.textureWidth
        this.texHeight = jobj.textureHeight

        this.cubeMap = new Map()
        this.rootGroup = parseGroupJson(jobj, this)
    }

    createModel( material ) {
        this.mat = material
        let mainCubeGroup = this.rootGroup.createGroup()

        this.modelCache = new Group(); 
        this.modelCache.scale.set(1/16, 1/16, 1/16)
        //Instead of scaling by [-1, -1, 1], we can just rotate by [0, 0, PI]
        this.modelCache.rotation.set(0, 0, Math.PI)
        this.modelCache.position.set(0, 1.5, 0)
        this.modelCache.add(mainCubeGroup)


        return this.modelCache
    }

    resetAnimations() {
        //todo: rename
        this.resetVisuals()
    }

    resetVisuals() {
        this.rootGroup.resetVisuals()
    }
}

export class TblCubeGroup {

    constructor(tbl, cubes, cubeGroups) {
        this.tbl = tbl
        this.cubeList = cubes
        this.cubeGroups = cubeGroups

        this.cubeList.forEach(child => {
            child.parent = this
            child.hierarchyLevel = 0
        })
    }

    recalculateHierarchy() {
        this.cubeList.forEach(child => {
            child.hierarchyLevel = 0
            child.parent = this
            child.recalculateHierarchy()
        })
        this.cubeGroups.forEach(child => child.recalculateHierarchy())
    }

    addChild(child, silent = false) {
        this.cubeList.push(child)
        this.refreshGroup(silent)
    }

    deleteChild(child, silent = false) {
        child.parent = undefined
        this.cubeList = this.cubeList.filter(c => c != child)
        this.refreshGroup(silent)
    }

    onChildrenChange(silent = false, children = this.cubeList) {
        this.cubeList = children
        this.cubeList.forEach(c => {
            c.parent = this
            c.hierarchyLevel = 0
        })
        this.refreshGroup(silent)
    }

    getChildren() {
        return this.cubeList
    }

    createGroup() {
        if(this.modelGroup !== undefined) {
            return this.modelGroup
        }
        this.modelGroup = new Group()

        this.cubeGroups.forEach(child => this.modelGroup.add(child.createGroup()))
        this.cubeList.forEach(cube => this.modelGroup.add(cube.createGroup()))

        return this.modelGroup
    }
    
    refreshGroup(silent = false, cubes = this.cubeList, cubeGroups = this.cubeGroups) {
        this.cubeList = cubes
        this.cubeGroups = cubeGroups
        this.modelGroup.children.forEach(child => this.modelGroup.remove(child))
        this.cubeGroups.forEach(child => this.modelGroup.add(child.createGroup()))
        this.cubeList.forEach(cube => {
            this.modelGroup.add(cube.createGroup())
            cube.parent = this
        })
        if(!silent) {
            this.tbl.onCubeHierarchyChanged()
        }
    }

    resetVisuals() {
        this.cubeGroups.forEach(child => child.resetVisuals())
        this.cubeList.forEach(child => child.resetVisuals())
    }

    getGroup() {
        return this.modelGroup
    }
}

function parseGroupJson(json, tbl) {

     let cubeList = []
     let childGroups = []

     json.cubes.forEach(cube => { cubeList.push(parseCubeJson(cube, tbl)) })
     json.cubeGroups.forEach(group => { childGroups.push(parseGroupJson(group, tbl)) })

    return new TblCubeGroup(tbl, cubeList, childGroups)
}

export class TblCube {

    constructor(name, dimension, rotationPoint, offset, rotation, scale, textureOffset, cubeGrow, children, textureMirrored, tbl) {
        this.name = name
        this.dimension = dimension
        this.rotationPoint = rotationPoint
        this.offset = offset
        this.rotation = rotation
        this.scale = scale
        this.textureOffset = textureOffset
        this.cubeGrow = cubeGrow
        this.children = children
        this.tbl = tbl
        this.textureMirrored = textureMirrored
        this.hierarchyLevel = 0

        let counter = 0
        while(tbl.cubeMap.has(this.name)) {
            this.name = name + "~" + counter
            counter += 1
        }

        tbl.cubeMap.set(this.name, this)
    }

  
    createGroup( ) {
        if(this.cubeGroup !== undefined) {
            return this.cubeGroup
        }
        this.cubeGroup = new Group();
        this.cubeGroup.tabulaCube = this

        this.cubeMesh = new Mesh(new BoxBufferGeometry(), this.tbl.mat)
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

    recalculateHierarchy() {
        this.children.forEach(child => {
            child.hierarchyLevel = this.hierarchyLevel+1
            child.parent = this
            child.recalculateHierarchy()
        }) 
        if(this.children.length === 0) {
            this.tbl.maxCubeLevel = Math.max(this.tbl.maxCubeLevel, this.hierarchyLevel)
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
         return new TblCube(this.name, this.dimension, this.rotationPoint, this.offset, 
            this.rotation, this.scale, this.textureOffset, this.cubeGrow, 
            this.children.map(c => c.cloneCube()),
            this.textureMirrored, this.tbl)
    }

    traverse(callback) {
        callback(this)
        this.children.forEach(c => c.traverse(callback))
    }

    onChildrenChange(silent = false, childern = this.children) {
        if(!silent) {
            this.tbl.onCubeHierarchyChanged()
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

    updateTexture({ textureOffset = this.textureOffset, dimension = this.dimension, texWidth = this.tbl.texWidth, texHeight = this.tbl.texHeight, textureMirrored = this.textureMirrored } = {}) {
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

function parseCubeJson(json, tbl) {
    let children = []
    json.children.forEach(child => { children.push( parseCubeJson( child, tbl ) ) })

    let cubeGrow = json.cubeGrow
    if(cubeGrow === undefined) {
        cubeGrow = [json.mcScale, json.mcScale, json.mcScale]
    }

    return new TblCube(json.name, json.dimensions, json.position, json.offset, json.rotation, json.scale, json.txOffset, cubeGrow, children, json.txMirror, tbl)
}

function writeCubeJson(cube) {
    let obj = {
        name: cube.name,
        dimensions: cube.dimension, 
        position: cube.rotationPoint,
        offset: cube.offset,
        rotation: cube.rotation,
        scale: cube.scale,
        txOffset: cube.textureOffset,
        txMirror: cube.textureMirrored,
        cubeGrow: cube.cubeGrow,
        mcScale: cube.cubeGrow.reduce((a,b) => a+b, 0) / 3, //For tabula support
        opacity: 100,
        hidden: false,
        metadata: [],
        children: cube.children.map(child => writeCubeJson(child)),
        identifier: cube.name //lol
    }
    if(cube.parent) {
        obj.parentIdentifier = cube.parent.name
    }
    return obj
}

function getUV(offsetX, offsetY, w, h, d, texWidth, texHeight, texMirrored) {

    //Uv data goes west, east, down, up, south, north (+x, -x, +y, -y, +z, -z)
    //6 -> 6 faces
    //4 -> 4 vertices per face
    //2 -> 2 data per vertex (u, v)
    let uvData = new Array(6 * 4 * 2)
    let texBottomOrder = [ 1, 4, 0, 5 ]
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


TBLModel.loadModel = async(data, name = "") => {
    let zip = await JSZip.loadAsync(data)
    let model = new TBLModel();
    model.parseJson(await zip.file("model.json").async("string"))
    if(name) {
        model.fileName = name
    }
    return model
}

TBLModel.writeModel = tbl => {
    let zip = new JSZip()

    zip.file("model.json", JSON.stringify({ 
        modelName: tbl.modelName, 
        authorName: tbl.author, 
        projVersion: 4,
        metadata: [],
        textureWidth: tbl.texWidth,
        textureHeight: tbl.texHeight,
        scale: [1,1,1],
        cubeGroups:[],
        anims: [],
        cubes: tbl.rootGroup.cubeList.map(cube => writeCubeJson(cube)),
        cubeCount: tbl.cubeMap.size 
    }))
    zip.generateAsync({type:"blob"})
    .then(content => downloadBlob(tbl.fileName ? tbl.fileName : "model.tbl", content))
        

}