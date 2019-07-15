import { Group, BoxBufferGeometry, BufferAttribute, Mesh, Material } from "./three.js";

export class TBLModel {

    texWidth
    texHeight

    rootGroup

    cubeMap

    constructor(content) {

        let jobj = JSON.parse(content)

        this.texWidth = jobj.textureWidth
        this.texHeight = jobj.textureHeight

        this.cubeMap = new Map()
        this.rootGroup = parseGroupJson(jobj, this)

        this.checkedCulled = new Map()


    }

    createModel( material, allCubes, animationMap ) {
        if(this.modelCache) {
            return this.modelCache
        }

        let mainCubeGroup = this.rootGroup.createGroup(material, allCubes, animationMap)

        this.modelCache = new Group();
        this.modelCache.scale.set(-1/16, -1/16, 1/16)
        this.modelCache.add(mainCubeGroup)

        return this.modelCache
    }

    resetAnimations() {
        this.rootGroup.resetAnimations()
    }
}

class CubeGroup {

    cubeList
    childGroups

    modelGroup

    constructor(cubes, cubeGroups) {

       this.cubeList = cubes
       this.cubeGroups = cubeGroups
    }

    createGroup( material, allCubes, animationMap ) {

        this.modelGroup = new Group();

        this.cubeGroups.forEach(child => { this.modelGroup.add(child.createGroup(material, allCubes, animationMap)) })
        this.cubeList.forEach(cube => { this.modelGroup.add(cube.createGroup(material, allCubes, animationMap)) })

        return this.modelGroup
    }

    resetAnimations() {
        this.cubeGroups.forEach(child => child.resetAnimations())
        this.cubeList.forEach(child => child.resetAnimations())
    }
}

function parseGroupJson(json, tbl) {

     let cubeList = []
     let childGroups = []


     json.cubes.forEach(cube => { childGroups.push(parseCubeJson(cube, tbl)) })
     json.cubeGroups.forEach(group => { childGroups.push(parseGroupJson(group, tbl)) })

    return new CubeGroup(cubeList, childGroups, tbl)
}

class Cube {

    name
    dimension
    rotationPoint
    offset
    rotation
    scale
    textureoffset
    mcScale
    children

    tbl

    cubeGroup

    constructor(name, dimension, rotationPoint, offset, rotation, scale, textureoffset, mcScale, children, tbl) {
        this.name = name
        this.dimension = dimension
        this.rotationPoint = rotationPoint
        this.offset = offset
        this.rotation = rotation
        this.scale = scale
        this.textureoffset = textureoffset
        this.mcScale = mcScale
        this.children = children
        this.tbl = tbl

        tbl.cubeMap.set(this.name, this)
    }

  
    createGroup( material, allCubes, animationMap ) {
        this.cubeGroup = new Group();

        let padding = 0.001
        let geometry = new BoxBufferGeometry((this.dimension[0] + padding) + this.mcScale*2, (this.dimension[1] + padding) + this.mcScale*2, (this.dimension[2] + padding) + this.mcScale*2);
        allCubes.push(geometry)

        let rawUV = new Array(6 * 4)
        let uv = getUV(rawUV, this.textureoffset[0], this.textureoffset[1], this.dimension[0], this.dimension[1], this.dimension[2], this.tbl.texWidth, this.tbl.texHeight)
        geometry.addAttribute("uv", new BufferAttribute(new Float32Array(uv), 2))
        geometry.rawUV = rawUV

        let cube = new Mesh( geometry, material)
        cube.position.set( this.dimension[0] / 2 + this.offset[0], this.dimension[1] / 2 + this.offset[1], this.dimension[2] / 2 + this.offset[2] )
        cube.tabulaCube = this
        this.cubeGroup.tabulaCube = this
        this.cubeGroup.add( cube )

        this.cubeGroup.position.set(this.rotationPoint[0], this.rotationPoint[1], this.rotationPoint[2])
        this.cubeGroup.rotation.order = "ZYX"
        this.cubeGroup.rotation.set(this.rotation[0] * Math.PI / 180, this.rotation[1] * Math.PI / 180, this.rotation[2] * Math.PI / 180)

        animationMap.set(this.name, this.cubeGroup)

        this.children.forEach(child => this.cubeGroup.add(child.createGroup(material, allCubes, animationMap)))

        return this.cubeGroup
    }

    resetAnimations() {
        this.children.forEach(child => child.resetAnimations())

        this.cubeGroup.position.set(this.rotationPoint[0], this.rotationPoint[1], this.rotationPoint[2])
        this.cubeGroup.rotation.set(this.rotation[0] * Math.PI / 180, this.rotation[1] * Math.PI / 180, this.rotation[2] * Math.PI / 180)    }

}

function parseCubeJson(json, tbl) {
    let children = []
    json.children.forEach(child => { children.push( parseCubeJson( child, tbl ) ) })
    return new Cube(json.name, json.dimensions, json.position, json.offset, json.rotation, json.scale, json.txOffset, json.mcScale, children, tbl)
}

function getUV(rawData, offsetX, offsetY, w, h, d, texWidth, texHeight) {

    //Uv data goes west, east, down, up, south north

    //6 -> 6 faces
    //4 -> 4 vertices per face
    //2 -> 2 data per vertex (u, v)
    let uvdata = new Array(6 * 4 * 2)

    let texBottomOrder = [ 1, 5, 0, 4 ]
    let texUpperOrder = [3, 2]

    let offX = 0
    for(let texh = 0; texh < texBottomOrder.length; texh++) {
        let minX = offsetX + offX
        let minY = offsetY + d

        let xDist = w;
        if (texh % 2 == 0) {
            xDist = d
        }
        offX += xDist

        putUVData(rawData, uvdata, texBottomOrder[texh], minX, minY, xDist, h, texWidth, texHeight)
    }

    for(let texb = 0; texb < texUpperOrder.length; texb++) {
        let minXLower = offsetX + d + w * texb + w
        if(texb == 0) { //up
            putUVData(rawData, uvdata, texUpperOrder[texb], minXLower, offsetY+d, -w, -d, texWidth, texHeight)
        } else { //Down
            putUVData(rawData, uvdata, texUpperOrder[texb], minXLower-w, offsetY, w, d, texWidth, texHeight) //todo: double triple quadruple check that this isn't flipped on the x axis. If so, just chang the uv accordingly
        }
    }


    return uvdata
}

function putUVData(rawData, uvdata, facingindex, minU, minV, uSize, vSize, texWidth, texHeight) {
    //1 0 1 0
    //1 1 0 0
    let u = [minU + uSize, minU, minU + uSize, minU]
    let v = [minV + vSize, minV + vSize, minV, minV]
    for(let vertex = 0; vertex < 4; vertex++) {
        let index = (facingindex * 4 + vertex) * 2
        uvdata[index] = u[vertex] / texWidth
        uvdata[index + 1] = v[vertex] / texHeight
    }
    rawData[facingindex*4+0] = minU
    rawData[facingindex*4+1] = minV
    rawData[facingindex*4+2] = uSize
    rawData[facingindex*4+3] = vSize
}


TBLModel.loadModel = async(data, name = "") => {
    let zip = await JSZip.loadAsync(data)
    let jsonContent = await zip.file("model.json").async("string")
    let model = new TBLModel(jsonContent);
    if(name) {
        model.fileName = name
    }
    return model
}
