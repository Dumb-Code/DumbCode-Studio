import { readFile } from "../../displays.js"
import { CineonToneMapping } from "../../libs/three.js"
import { generateSortedTextureOffsets, getAndDeleteFiles } from "../../util.js"
import { DCMCube, DCMModel } from "./dcm_loader.js"

const DECODER = new TextDecoder('utf-8')
export async function readBBModel(data, texturePart) {
    let modal = await openModal('project/bbmodel_import')
    let fileNameList = modal.find('.file-name-entries')
    fileNameList.children().remove()

    let imagePromises = []

    let inputDom = modal.find('.bbmodel-file-import')
    inputDom.on('input', e => getAndDeleteFiles(e).forEach(f => {
        if(texturePart === undefined) {
            return
        }
        fileNameList.append($(document.createElement('div')).text(f.name))
        let img = document.createElement("img")
        imagePromises.push(
            readFile(f, (reader, f) => reader.readAsDataURL(f)).then(durl => {
                img.src = durl
                return new Promise(resolve => img.onload = () => resolve({ name: f.name, img }))
            })
        )
    }))

    let total = [0,0,0]

    let obj = JSON.parse(DECODER.decode(await data))
    let model = new DCMModel()

    let submitDom = modal.find('.continue-button')
    submitDom.one('click', async() => {
        let allCubes = model.gatherAllCubes()
        inputDom.off('input')
        if(texturePart === undefined) {
            allCubes.forEach(c => c._uvdata = undefined)
            return
        }
        let finished = await Promise.all(imagePromises)

        let counter = 1
        const onceFoundIterations = 3
        let map = null
        let texSize

        let tw = 2*(total[0]+total[2])
        let th = total[1]+total[2]
        let ts = tw * th
        let size = Math.floor(Math.sqrt(ts)/2)
        
        while(true) {
            let dist = size*counter
            map = generateSortedTextureOffsets(allCubes, dist, dist)
            texSize = dist
            if(map !== null) {
                let lower = size*(counter-1)
                let upper = dist
                for(let i = 0; i < onceFoundIterations; i++) {
                    let newPoint = Math.floor((lower + upper) / 2)
                    let testMap = generateSortedTextureOffsets(allCubes, newPoint, newPoint)
                    if(testMap !== null) {
                        upper = newPoint
                        map = testMap
                        texSize = newPoint
                    } else {
                        lower = newPoint
                    }
                }
                break
            }
            counter++
        }

        map.forEach((v, c) => c.updateTextureOffset([v.x, v.y]))

        let srcC = document.createElement("canvas")
        let originalWidth = parseInt(obj.resolution.width)
        let src = srcC.getContext('2d')
        finished.forEach(imgData => {
            srcC.width = imgData.img.naturalWidth
            srcC.height = imgData.img.naturalWidth
            src.clearRect(0, 0, srcC.width, srcC.height)
            src.drawImage(imgData.img, 0, 0, srcC.width, srcC.height)
    
            let scale = srcC.width / originalWidth
            if(scale % 1 !== 0) {
                throw new Error("Scale is at invalid size. " + originalWidth + ":" + srcC.width)
            }
            let destC = document.createElement("canvas")
            destC.width = destC.height = texSize * scale
            let dest = destC.getContext('2d')

            allCubes.forEach(c => {
                let w = c.dimension[0]
                let h = c.dimension[1]
                let d = c.dimension[2]

                //   [U][D]
                //[E][N][W][S]
                function swap(name, xoff, yoff, xSize, ySize) {
                    let uv = c._uvdata[name].uv
                    let tx = c.textureOffset
                    let data = src.getImageData(scale*uv[0], scale*uv[1], scale*(uv[2]-uv[0]), scale*(uv[3]-uv[1]))
                    dest.putImageData(data, (tx[0]+xoff)*scale, (tx[1]+yoff)*scale, 0, 0, xSize*scale, ySize*scale)
                }
                swap("up", d, 0, w, d)
                swap("down", d+w, 0, w, d)
                swap("east", 0, d, d, h)
                swap("north", d, d, w, h)
                swap("west", d+w, d, d, h)
                swap("south", d+w+d, d, w, h)
            })

            let img = document.createElement('img')
            img.onload = () => {
                img.onload = null
                texturePart.createTextureElement(imgData.name, img)
            }
            img.src = destC.toDataURL()
        })
        
        allCubes.forEach(c => c._uvdata = undefined)

        model.setTextureSize(texSize, texSize)
        closeModal()
    })

    obj.elements.forEach(elem => {
        let dims = elem.to.map((e, i) => Math.ceil(e - elem.from[i]))
        //North, South: [x, y]
        //West, East: [z, y]
        //Up, Down: [x, z]
        let directionOrder = ["up", "down", "north", "south", "east", "west"]
        //x: 0, 0, 0, 0, -1, -1 -> 0,0,-1
        //y: -1, -1, 1, 1, 1, 1 -> -1,1,1
        //z: 1, 1, -1, -1, 0, 0 -> 1,-1,0
        let xLocations = [0, 0, -1]
        let yLocations = [-1, 1, 1]
        let zLocations = [1, -1, 0]     
        let xPos = []
        let yPos = []
        let zPos = []       
        for(let i = 0; i < 6; i++) {
            let c = elem.faces[directionOrder[i]]       
            let x = xLocations[Math.floor(i/2)]
            if(x !== -1) {
                xPos.push(Math.abs(c.uv[x] - c.uv[2+x]))
            }       
            let y = yLocations[Math.floor(i/2)]
            if(y !== -1) {
                yPos.push(Math.abs(c.uv[y] - c.uv[2+y]))
            }       
            let z = zLocations[Math.floor(i/2)]
            if(z !== -1) {  
                zPos.push(Math.abs(c.uv[z] - c.uv[2+z]))
            }   
        }       
        //Gets the mode of an array, or null if there was only unique elements
        function getMode(array) {
            let countMap = new Map()
            array.forEach(d => countMap.set(d, countMap.has(d) ? countMap.get(d)+1 : 1));
            let entry = [...countMap.entries()].reduce((prev, curr) => prev[1] < curr[1] ? curr : prev)
            if(entry[1] > 1) {
              return entry[0]
            }
            return null
        }       
        let xMode = getMode(xPos)
        let yMode = getMode(yPos)
        let zMode = getMode(zPos)       
        if(xMode !== null && yMode !== null && zMode != null) {
            dims = [xMode, yMode, zMode]
        }             
        
        let off = elem.from.map((e, i) => e - elem.origin[i])
        let inf = elem.inflate ?? 0
        let cg = dims.map((e, i) => (elem.to[i]-elem.from[i] - e) / 2)
        total[0] += dims[0]
        total[1] += dims[1]
        total[2] += dims[2]
        let cube = new DCMCube(
            elem.name,
            dims,
            elem.origin,
            off.map((o, i) => o + cg[i]),
            elem.rotation ?? [0,0,0],
            [0, 0], //TODO: text offset
            false, //TODO: text offset
            [cg[0]+inf, cg[1]+inf, cg[2]+inf],
            [],
            model
        )
        cube._uvdata = elem.faces
        model.children.push(cube)
    })
    
    obj.textures.forEach(t => {
        let img = document.createElement("img")
        fileNameList.append($(document.createElement('div')).text(t.name))
        imagePromises.push(new Promise(resolve => img.onload = () => resolve( { name: t.name, img })))
        img.src = t.source
    })

    return model
    
}