import { readFile } from "../../displays.js"
import { CubePointTracker } from "../../modeling/cube_point_tracker.js"
import { generateSortedTextureOffsets } from "../../util.js"
import { getAndDeleteFiles } from "../../util/element_functions.js"
import { DCMCube, DCMModel } from "./dcm_model.js"

const DECODER = new TextDecoder('utf-8')

/**
 * Imports a blockbench model.
 * @param {*} data The data to read from
 * @param {*} texturePart the files texture part. Should only exist when file is uploaded from the files page.
 */
export async function readBBModel(data, texturePart = null) {    
    //The sum of all the dimensions. Used for estimiating the image size step
    let total = [0,0,0]

    let obj = JSON.parse(DECODER.decode(await data))
    let model = new DCMModel()

    let fileNameList
    //All the image promises to load and transform
    let imagePromises = []

    if(texturePart !== null) {
        //Get and open the modal
        let modal = await openModal('project/bbmodel_import')

        //Clear the file name entries
        fileNameList = modal.find('.file-name-entries')
        fileNameList.children().remove()

        //When the file import box is used, add to the image promises
        let inputDom = modal.find('.bbmodel-file-import')
        inputDom.on('input', e => getAndDeleteFiles(e).forEach(f => {
            fileNameList.append($(document.createElement('div')).text(f.name))
            let img = document.createElement("img")
            let id = imagePromises.length
            imagePromises.push(
                readFile(f, (reader, f) => reader.readAsDataURL(f)).then(durl => {
                    img.src = durl
                    return new Promise(resolve => img.onload = () => resolve({ id, name: f.name, img }))
                })
            )
        }))

        //When the continue button is clicked, apply the changes
        let submitDom = modal.find('.continue-button')
        submitDom.one('click', async() => {
            let allCubes = model.gatherAllCubes()
            inputDom.off('input')
            let finished = await Promise.all(imagePromises)
            let { map, texSize } = calculateCubeTextureLayout(allCubes, total)
            map.forEach((v, c) => c.updateTextureOffset([v.x, v.y]))
            applyReTexturing(allCubes, finished, texSize, texturePart, obj.resolution.width)
            allCubes.forEach(c => c._uvdata = undefined)
            model.setTextureSize(texSize, texSize)
            closeModal()
        })
    }

    //Iterate over the internal textures and add them to the image promises
    let directTexturePromises = []
    obj.textures.forEach((t, i) => {
        let img = document.createElement("img")
        if(fileNameList) {
            fileNameList.append($(document.createElement('div')).text(t.name))
        }
        let promise = new Promise(resolve => img.onload = () => resolve( { id: i, name: t.name, img }))
        imagePromises.push(promise)
        directTexturePromises.push(promise)
        img.src = t.source
    })

    let fulfilledTextures = await Promise.all(directTexturePromises)

    let scaleGetter = id => {
        let t = fulfilledTextures.find(t => t.id == id)
        if(!t) {
            return 1
        }
        return t.img.naturalWidth / obj.resolution.width
    }

    obj.elements.forEach(elem => {
        //Calculate the dimensions
        let dims = calculateCubeDimensions(elem, scaleGetter)
        //Calculate the offset.
        let off = elem.from.map((e, i) => e - elem.origin[i])
        //Calculate the inflate size
        let inf = elem.inflate ?? 0
        //Calculate the grow needed to to get the element from dims to to-from. Divided by 2 as it's in both directions
        let cg = dims.map((e, i) => (elem.to[i]-elem.from[i] - e) / 2)
        //Add the dimensions to the total
        total[0] += dims[0]
        total[1] += dims[1]
        total[2] += dims[2]

        let cube = new DCMCube(
            elem.name,
            dims,
            [elem.origin[0] - 8, elem.origin[1], elem.origin[2] - 8],
            off.map((o, i) => o + cg[i]), //the offset is the position it should be. The cube offset will be moved by -cubeGrow, so we need to account for this.
            elem.rotation ?? [0,0,0],
            [0, 0],
            false,
            [cg[0]+inf, cg[1]+inf, cg[2]+inf], //Cube grow value should be the cg + the inflate.
            [],
            model
        )
        if(texturePart !== null) {
            cube._uvdata = elem.faces
        }
        model.children.push(cube)
    })


    return model
    
}

function calculateCubeDimensions(elem, scaleGetter) {
    //First, we try and get the dimensions from the element uv. The reason for this is as follows:
    //The actual size of the element can be adjusted with cube grow. The space it takes up on the texturemap
    //however is tied directly to the dimensions. Here, we search the texturemap uv and get a list of all the 
    //width depth and height of the faces they represent. These w,d,h elements are added to a respective list
    //
    //Once we have the list of w,d,h elements, we get the mode (most common) element. If any of them are unique,
    //We use the default dimensions of getting the to-from of the element.(Note this will give incorrect uv)
    //
    //Element uvs are stored in the following format:
    //North/South: [xFrom, yFrom, xto, yTo]
    //West/East: [zFrom, yFrom, zTo, yTo]
    //Up/Down: [xFrom, zFrom, xTo, zTo]
    //
    //If we go in the order N,S,W,E,U,D: (-1 means not exist)
    //
    //          If we change it to N/W, W/E, U/D:
    //                        ↑
    //x: 0, 0, 0, 0, -1, -1   ->   0,0,-1
    //y: -1, -1, 1, 1, 1, 1   ->   -1,1,1
    //z: 1, 1, -1, -1, 0, 0   ->   1,-1,0

    let directionOrder = ["up", "down", "north", "south", "east", "west"]
    let xLocations = [0, 0, -1]
    let yLocations = [-1, 1, 1]
    let zLocations = [1, -1, 0]     
    let xPos = []
    let yPos = []
    let zPos = []
    for(let i = 0; i < 6; i++) {
        let c = elem.faces[directionOrder[i]]

        let scale = scaleGetter(c.texture)

        //Get the x location
        let x = xLocations[Math.floor(i/2)]
        if(x !== -1) {
            //Get the to-from
            xPos.push(Math.round(Math.abs((c.uv[x] - c.uv[2+x])*scale)))
        }   

        //Get the y location
        let y = yLocations[Math.floor(i/2)]
        if(y !== -1) {
            //Get the to-from
            yPos.push(Math.round(Math.abs((c.uv[y] - c.uv[2+y])*scale)))
        }
        
        //Get the z location
        let z = zLocations[Math.floor(i/2)]
        if(z !== -1) {  
            //Get the to-from
            zPos.push(Math.round(Math.abs((c.uv[z] - c.uv[2+z])*scale)))
        }
    }
    //Gets the mode of an array, or null if there was only unique elements
    function getMode(array) {
        //Countmap stores how many times an element exists.
        let countMap = new Map()
        //Set everything into countmap
        array.forEach(d => countMap.set(d, countMap.has(d) ? countMap.get(d)+1 : 1));
        //Reduce the entries, sorting by value (count)
        //The filter is to prevent 0 dimension values, as all other values are more favorable. 
        let entry = [...countMap.entries()].filter(a => a[0] !== 0).reduce((prev, curr) => prev[1] < curr[1] ? curr : prev)

        //Only return if there is more than 1 element
        if(entry[1] > 1) {
          return entry[0]
        }
        return null
    }

    //Get the x,y,z mode for the arrays.
    let xMode = getMode(xPos)
    let yMode = getMode(yPos)
    let zMode = getMode(zPos)
    if(xMode !== null && yMode !== null && zMode != null) {
        return [xMode, yMode, zMode]
    } else {
        //Fallback. Essentially just does ceil(to-from)
        return elem.to.map((e, i) => Math.ceil(e - elem.from[i]))
    }
}

/**
 * 
 * @param {[]]} allCubes All the cubes
 * @param {[]]} finished Finished image data. 
 * @param {number} texSize The texture size. Note this assumes the map is a square
 * @param {*} texturePart the file texture part
 * @param {string} width the width of the texture set inside the model file.
 */
function applyReTexturing(allCubes, finished, texSize, texturePart, width) {
    //Create the source canvas
    let srcC = document.createElement("canvas")
    let src = srcC.getContext('2d')

    let originalWidth = parseInt(width)
    finished.forEach(imgData => {
        //Set the source canvas to be the image width and draw the image.
        srcC.width = imgData.img.naturalWidth
        srcC.height = imgData.img.naturalWidth

        src.clearRect(0, 0, srcC.width, srcC.height)
        src.drawImage(imgData.img, 0, 0, srcC.width, srcC.height)

        //Get the scale of the image
        let scale = srcC.width / originalWidth
        if(scale % 1 !== 0) {
            throw new Error("Scale is at invalid size. " + originalWidth + ":" + srcC.width)
        }

        //The destination canvas is the new canvas.
        let destC = document.createElement("canvas")
        destC.width = destC.height = texSize * scale
        let dest = destC.getContext('2d')

        //For every cube, swap the cube texture from the old texture to the new one.
        allCubes.forEach(c => {
            let w = c.dimension[0]
            let h = c.dimension[1]
            let d = c.dimension[2]

            //        This is the minimum XY
            //                \
            //                 \               width       width
            //                  \         <------------><----------->
            //                   \
            //               Ʌ    X       ---------------------------
            //        depth  |            |     UP     |    DOWN    |
            //               V            |            |            |
            //               Ʌ    -------------------------------------------
            //               |    |       |            |       |            |
            //               |    |       |            |       |            |
            //       height  |    | EAST* |   NORTH    | WEST* |    SOUTH   |
            //               |    |       |            |       |            |
            //               |    |       |            |       |            |
            //               V    -------------------------------------------
            //                    <-------><-----------><------><----------->
            //                      depth      width      depth      width
            //
            // *East and west are swapped around than what they would usually be, due to the z flipping.
            //   [U][D]
            //[E][N][W][S]
            function swap(name, xoff, yoff, xSize, ySize) {
                let tx = c.textureOffset
                let uvData = c._uvdata[name]
                let uv = uvData.uv

                if((uvData.texture != imgData.id) || (uv[2] === uv[0]) || (uv[3] === uv[1]) || (xSize === 0) || (ySize === 0)) {
                    return
                }
                
                //Get the source image data
                let data = src.getImageData(Math.round(scale*uv[0]), Math.round(scale*uv[1]), Math.ceil(scale*(uv[2]-uv[0])), Math.ceil(scale*(uv[3]-uv[1])))

                let xPos = (tx[0]+xoff)*scale
                let yPos = (tx[1]+yoff)*scale

                let rotation = (uvData.rotation ? uvData.rotation : 0) / 90

                let normalSize = true
                let target = new ImageData((normalSize?xSize:ySize)*scale, (normalSize?ySize:xSize)*scale)
                for(let x = 0; x < target.width; x++) {
                    for(let y = 0; y < target.height; y++) {
                        let srcX = x / (target.width-1) - 0.5
                        let srcY = y / (target.height-1) - 0.5

                        for(let i = 0; i < rotation; i++) {
                            // ...    .X.
                            // ..X -> ...
                            // ...    ...
                            // ...    ...
                            // (2/2, 1/3) -> (1/3, 1 - 2/2)
                            // (x, y) -> (y, 1 - x)
                            let x = srcX
                            srcX = srcY
                            srcY = -x
                        }

                        srcX = Math.floor((Math.round((srcX + 0.5) * (target.width-1)) / (target.width)) * (data.width))
                        srcY = Math.floor((Math.round((srcY + 0.5) * (target.height-1)) / (target.height)) * (data.height))

                        // if(imgData.id == 4) {
                        //     console.log(x, y, Math.floor(srcX*data.width), Math.floor(srcY*data.height))
                        // }

                        let srcPixel = srcX + srcY*data.width
                        let destPixel = x + y*target.width
                        
                        for(let i = 0; i < 4; i++) {
                            target.data[4*destPixel + i] = data.data[4*srcPixel + i]
                        }
                    }
                }
                //Put it in the destination
                dest.putImageData(target, xPos, yPos)
             }

            //Swap all the parts
            swap("up", d, 0, w, d)
            swap("down", d+w, 0, w, d)
            swap("east", 0, d, d, h)
            swap("north", d, d, w, h)
            swap("west", d+w, d, d, h)
            swap("south", d+w+d, d, w, h)
        })

        //Create an img element from the destination canvas. When it's loaded, create it as a texture element.
        let img = document.createElement('img')
        img.onload = () => {
            img.onload = null
            texturePart.createTextureElement(imgData.name, img)
        }
        img.src = destC.toDataURL()
    })
}

/**
 * Calculates the size and layout of the texturemap. Note that this isn't a perfect calculation but is a good guess.
 * @param {[]} allCubes a list of all the cubes 
 * @param {number[]} total the sum of the cube dimensions
 */
function calculateCubeTextureLayout(allCubes, total) {
    let counter = 1
    const onceFoundIterations = 3
    let map = null
    let texSize

    //The total width if all textures were lined up next to each other
    let tw = 2*(total[0]+total[2])
    //The avarage height if all textures were lined up on next of eachother
    let th = (total[1]+total[2]) / allCubes.length
    //The avarage area of the texturemap
    let ts = tw * th
    
    //The size to guess at. Note it is better to overshoot than to undershoot.
    let size = Math.floor(Math.sqrt(ts))
    
    while(true) {
        //Keep increasing counter till we find one that fits.
        let dist = size*counter
        map = generateSortedTextureOffsets(allCubes, dist, dist)
        texSize = dist

        //If map isn't null then it's valid. Use a binary search algorithm with 3 iterations to 
        //find a potentially better version.
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

    return { map, texSize }
}