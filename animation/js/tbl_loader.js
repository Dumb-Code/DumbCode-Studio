import { Group, BoxBufferGeometry, BufferAttribute, Mesh, Material, PlaneBufferGeometry, Vector3 } from "./three.js";

export class TBLModel {

    constructor() {
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

    constructor(name, dimension, rotationPoint, offset, rotation, scale, textureOffset, mcScale, children, textureMirrored, tbl) {
        this.name = name
        this.dimension = dimension
        this.rotationPoint = rotationPoint
        this.offset = offset
        this.rotation = rotation
        this.scale = scale
        this.textureOffset = textureOffset
        this.mcScale = mcScale
        this.children = children
        this.tbl = tbl
        this.textureMirrored = textureMirrored
        this.hierarchyLevel = 0

        tbl.cubeMap.set(this.name, this)
    }

  
    createGroup( ) {
        if(this.cubeGroup !== undefined) {
            return this.cubeGroup
        }
        this.cubeGroup = new Group();
        this.cubeGroup.tabulaCube = this

        this.planesGroup = new Group()
        this.planesGroup.tabulaCube = this
        this.planesGroup.partOfTheGroup = true
        
        this.cubeGroup.add(this.planesGroup)
        this.cubeMesh = []
        for(let f = 0; f < 6; f++) {
            let mesh = new Mesh(undefined, this.tbl.mat)
            mesh.isTabulaPlane = true
            this.cubeMesh.push(mesh)
            this.planesGroup.add(mesh)
        }
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

    onChildrenChange(silent = false, childern = this.children) {
        if(!silent) {
            this.tbl.onCubeHierarchyChanged()
        }
        this.cubeGroup.children.forEach(child => {
            if(child.partOfTheGroup !== true) {
                this.cubeGroup.remove(child)
            }
        })
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

    resetVisuals(children = false) {
        if(children === true) {
            this.children.forEach(child => child.resetVisuals(true))
        }

        this.updateGeometry()
        this.updatePlanesGroup()
        this.updatePositionVisuals()
        this.updateRotationVisuals()
        this.updateTexture()  
    }

    updateGeometry( { dimension = this.dimension, mcScale = this.mcScale } = {}) {
        let w = dimension[0] + mcScale*2 + 0.0001
        let h = dimension[1] + mcScale*2 + 0.0001
        let d = dimension[2] + mcScale*2 + 0.0001

        this.cubeMesh[0].geometry = new PlaneBufferGeometry(d, h); //+x
        this.cubeMesh[0].rotation.set(0, Math.PI / 2, 0)
        this.cubeMesh[0].position.set(w/2, 0, 0)

        this.cubeMesh[1].geometry = new PlaneBufferGeometry(d, h); //-x
        this.cubeMesh[1].rotation.set(0, -Math.PI / 2, 0)
        this.cubeMesh[1].position.set(-w/2, 0, 0)

        this.cubeMesh[2].geometry = new PlaneBufferGeometry(w, d); //+y
        this.cubeMesh[2].rotation.set(-Math.PI / 2, 0, 0)
        this.cubeMesh[2].position.set(0, h/2, 0)

        this.cubeMesh[3].geometry = new PlaneBufferGeometry(w, d); //-y
        this.cubeMesh[3].rotation.set(Math.PI / 2, 0, 0)
        this.cubeMesh[3].position.set(0, -h/2, 0)

        this.cubeMesh[4].geometry = new PlaneBufferGeometry(w, h); //-z but actually +z
        this.cubeMesh[4].rotation.set(0, Math.PI, 0)
        this.cubeMesh[4].position.set(0, 0, -d/2)

        this.cubeMesh[5].geometry = new PlaneBufferGeometry(w, h); //+z but actually -z
        this.cubeMesh[5].position.set(0, 0, d/2)
        this.updateTexture()
    }

    updatePlanesGroup( { dimension = this.dimension, offset = this.offset } = {} ) {
        this.planesGroup.position.set( dimension[0] / 2 + offset[0], dimension[1] / 2 + offset[1], dimension[2] / 2 + offset[2] )
    }

    updatePositionVisuals(position = this.rotationPoint) {
        this.cubeGroup.position.set(position[0], position[1], position[2])
    }

    updateRotationVisuals(rotation = this.rotation) {
        this.cubeGroup.rotation.set(rotation[0] * Math.PI / 180, rotation[1] * Math.PI / 180, rotation[2] * Math.PI / 180)
    }

    updateTexture({ textureOffset = this.textureOffset, dimension = this.dimension, texWidth = this.tbl.texWidth, texHeight = this.tbl.texHeight, textureMirrored = this.textureMirrored } = {}) {
        let uvData = getUV(textureOffset[0], textureOffset[1], dimension[0], dimension[1], dimension[2], texWidth, texHeight, textureMirrored)
        for(let f = 0; f < 6; f++) {
            this.cubeMesh[f].geometry.addAttribute("uv", new BufferAttribute(new Float32Array(uvData.slice(f*8, (f+1)*8)), 2))
        }
    }

    updateCubeName(value = this.name) {
        this.name = value;
    }

    updateDimension(values = this.dimension, visualOnly = false) {
        if(visualOnly !== true) {
            this.dimension = values.map(e => Math.round(e))
        }
        this.updatePlanesGroup( { dimension:values } )
        this.updateGeometry( { dimension:values } )
        this.updateTexture( { dimension:values } )
    }

    updateCubeGrow(value = this.mcScale, visualOnly = false) {
        if(visualOnly !== true) {
            this.mcScale = value
        }
        this.updateGeometry( {mcScale:value} )
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
        this.updatePlanesGroup( { offset:values } )
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

    return new TblCube(json.name, json.dimensions, json.position, json.offset, json.rotation, json.scale, json.txOffset, json.mcScale, children, json.txMirror, tbl)
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
