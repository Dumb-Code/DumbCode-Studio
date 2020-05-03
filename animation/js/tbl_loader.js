import { Group, BoxBufferGeometry, BufferAttribute, Mesh, Material, PlaneBufferGeometry, Vector3 } from "./three.js";

export class TBLModel {

    constructor(content) {

        let jobj = JSON.parse(content)

        this.texWidth = jobj.textureWidth
        this.texHeight = jobj.textureHeight

        this.cubeMap = new Map()
        this.rootGroup = parseGroupJson(jobj, this)

        this.checkedCulled = new Map()


    }

    createModel( material, animationMap ) {
        let mainCubeGroup = this.rootGroup.createGroup(material, animationMap)

        this.modelCache = new Group();
        this.modelCache.scale.set(-1/16, -1/16, 1/16)
        this.modelCache.position.set(0, 1.5, 0)
        this.modelCache.add(mainCubeGroup)

        return this.modelCache
    }

    resetAnimations() {
        this.rootGroup.resetAnimations()
    }
}

class CubeGroup {

    constructor(cubes, cubeGroups) {

       this.cubeList = cubes
       this.cubeGroups = cubeGroups
    }

    createGroup( material, animationMap ) {

        this.modelGroup = new Group();

        this.cubeGroups.forEach(child => { this.modelGroup.add(child.createGroup(material, animationMap)) })
        this.cubeList.forEach(cube => { this.modelGroup.add(cube.createGroup(material, animationMap)) })

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

        tbl.cubeMap.set(this.name, this)
    }

  
    createGroup( material, animationMap ) {
        this.cubeGroup = new Group();
        this.cubeGroup.tabulaCube = this

        this.planesGroup = new Group()
        this.planesGroup.tabulaCube = this

        this.cubeGroup.add(this.planesGroup)
        this.cubeMesh = []
        for(let f = 0; f < 6; f++) {
            let mesh = new Mesh(undefined, material)
            this.cubeMesh.push(mesh)
            this.planesGroup.add(mesh)
        }
        this.updateDimensions()

        this.cubeGroup.rotation.order = "ZYX"
        this.updatePosition()
        this.updateRotation()

        animationMap.set(this.name, this.cubeGroup)

        this.children.forEach(child => this.cubeGroup.add(child.createGroup(material, animationMap)))

        return this.cubeGroup
    }

    resetAnimations() {
        this.children.forEach(child => child.resetAnimations())

        this.cubeGroup.position.set(this.rotationPoint[0], this.rotationPoint[1], this.rotationPoint[2])
        this.cubeGroup.rotation.set(this.rotation[0] * Math.PI / 180, this.rotation[1] * Math.PI / 180, this.rotation[2] * Math.PI / 180)    
    }

    updateGeometry() {
        let w = this.dimension[0] + this.mcScale*2 + 0.02
        let h = this.dimension[1] + this.mcScale*2 + 0.02
        let d = this.dimension[2] + this.mcScale*2 + 0.02

        this.cubeMesh[0].geometry = new PlaneBufferGeometry(d, h); //+x
        this.cubeMesh[0].rotation.set(0, Math.PI / 2, 0)
        this.cubeMesh[0].position.set(w/2, 0, 0)

        this.cubeMesh[1].geometry = new PlaneBufferGeometry(d, h); //-x
        this.cubeMesh[1].rotation.set(0, -Math.PI / 2, 0)
        this.cubeMesh[1].position.set(-w/2, 0, 0)

        
        this.cubeMesh[2].geometry = new PlaneBufferGeometry(w, d); //+y
        this.cubeMesh[2].rotation.set(Math.PI / 2, 0, 0)
        this.cubeMesh[2].position.set(0, -h/2, 0)

        this.cubeMesh[3].geometry = new PlaneBufferGeometry(w, d); //-y
        this.cubeMesh[3].rotation.set(-Math.PI / 2, 0, 0)
        this.cubeMesh[3].position.set(0, h/2, 0)


        this.cubeMesh[4].geometry = new PlaneBufferGeometry(w, h); //+z
        this.cubeMesh[4].position.set(0, 0, d/2)

        this.cubeMesh[5].geometry = new PlaneBufferGeometry(w, h); //-z
        this.cubeMesh[5].rotation.set(0, Math.PI, 0)
        this.cubeMesh[5].position.set(0, 0, -d/2)
    }

    updateTexture() {
        let uvData = getUV(this.textureOffset[0], this.textureOffset[1], this.dimension[0], this.dimension[1], this.dimension[2], this.tbl.texWidth, this.tbl.texHeight, this.textureMirrored)
        for(let f = 0; f < 6; f++) {
            this.cubeMesh[f].geometry.addAttribute("uv", new BufferAttribute(new Float32Array(uvData.slice(f*8, (f+1)*8)), 2))
        }
    }

    updateDimensions(values = this.dimensions) {
        this.dimensions = values
        this.updateOffset()
        this.updateGeometry()
        this.updateTexture()
    }

    updateMcScale(value = this.mcScale) {
        this.mcScale = value
        this.updateGeometry()
    }

    updateTextureOffset(values = this.textureOffset) {
        this.textureOffset = values
        this.updateTexture()
    }

    updateTextureMirrored(value = this.textureMirrored) {
        this.textureMirrored = value
        this.updateTexture()
    }

    updateOffset(values = this.offset) {
        this.offset = values
        this.planesGroup.position.set( this.dimension[0] / 2 + this.offset[0], this.dimension[1] / 2 + this.offset[1], this.dimension[2] / 2 + this.offset[2] )
    }

    updatePosition(values = this.rotationPoint) {
        this.rotationPoint = values
        this.cubeGroup.position.set(this.rotationPoint[0], this.rotationPoint[1], this.rotationPoint[2])
    }

    updateRotation(values = this.rotation) {
        this.rotation = values
        this.cubeGroup.rotation.set(this.rotation[0] * Math.PI / 180, this.rotation[1] * Math.PI / 180, this.rotation[2] * Math.PI / 180)
    }

}

function parseCubeJson(json, tbl) {
    let children = []
    json.children.forEach(child => { children.push( parseCubeJson( child, tbl ) ) })
    return new Cube(json.name, json.dimensions, json.position, json.offset, json.rotation, json.scale, json.txOffset, json.mcScale, children, json.txMirror, tbl)
}

function getUV(offsetX, offsetY, w, h, d, texWidth, texHeight, texMirrored) {

    //Uv data goes west, east, down, up, south, north (+x, -x, +y, -y, +z, -z)
    //6 -> 6 faces
    //4 -> 4 vertices per face
    //2 -> 2 data per vertex (u, v)
    let uvData = new Array(6 * 4 * 2)
    let texBottomOrder = [ 1, 5, 0, 4 ]
    let texUpperOrder = [2, 3]

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
    let jsonContent = await zip.file("model.json").async("string")
    let model = new TBLModel(jsonContent);
    if(name) {
        model.fileName = name
    }
    return model
}
