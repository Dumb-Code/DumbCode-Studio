import { readFile } from "../../displays.js"
import { DCALoader } from "../animation/dca_loader.js"
import { DCMLoader } from "../model/dcm_loader.js"
import { DCMModel } from "../model/dcm_model.js"
import { DcProject } from "./dc_project.js"

/**
 * Used to handle the writing and reading of .dcproj
 */
export class DcProjectZipConverter {
    constructor(pth, modelingPart, texturePart, animationPart) {
        this.pth = pth
        this.modelingPart = modelingPart
        this.texturePart = texturePart
        this.animationPart = animationPart
    }

    /**
     * Reads a DcProj from a file
     * @param {file} file the file to read from 
     * @returns {DcProject} the project
     */
    readFile(file) {
        //first unzip the project
        return JSZip.loadAsync(readFile(file, (reader, file) => reader.readAsBinaryString(file)))
        .then(async(zip) => {
            //Get the /model.dcm element and create a project from it.
            this.pth.createNewProject(await DCMLoader.loadModel(await zip.file('model.dcm').async('arraybuffer'), file.name, this.texturePart))
            
            //Load the texture data. A normal texture folder can look like this:
            //
            //textures             ┌───────────────────────┐
            // ├─ groups.json*     │ MyFirstLayer.png      │ (will be used for 0.png)
            // ├─ texture_names ───┤ Some Second Layer.png │ (will be used for 1.png)
            // ├─ 0.png            │ TheThirdLayer.png     │ (will be used for 2.png)
            // ├─ 1.png            └───────────────────────┘
            // └─ 2.png
            //
            // *groups.json holds an array of elements of the following format:
            //  {
            //      name -> a string of the group name
            //      layerIds -> a list of integers pertaining to the layer texture indexes.
            //  }
            //
            let textureFolder = zip.folder('textures')
            //texture_names stores the filenames of the textures.
            //In the future we can expand this to more metadata?
            let textureFile = textureFolder.file('texture_names')
            if(textureFile !== null) {
                textureFile.async('string')
                .then(res => {
                    //Shouldn't occur, but this is just to check
                    if(res === "") {
                        return
                    }
                    //The texture_names is an array of strings split by \n
                    let layerNames = res.split("\n")
                    //Get all the files by id
                    Promise.all(layerNames.map((_, i) => textureFolder.file(i + ".png").async('blob')))
                    .then(textures => Promise.all(textures.map((texture, index) => {
                        //Create the img element, bind the src, and when loaded resolve it.
                        let img = document.createElement("img")
                        img.src = URL.createObjectURL(texture)
                        return new Promise(resolve => img.onload = () => {
                            img.onload = null   
                            resolve( { name: layerNames[index], img } )
                        })
                    })))

                    //Create all the texture parts. This needs to be done once all the promises are done, as it has to be in the right order.
                    .then(datas => datas.forEach(data => this.texturePart.createTextureElement(data.name, data.img)))
                    
                    //Read, parse and create all the texture groups.
                    .then(() => {
                        let groupFile = textureFolder.file('groups.json')
                        //If the file doesn't exist, thats fine. Not any groups.
                        if(groupFile !== null) {
                            return groupFile.async('string')
                            .then(res => JSON.parse(res).forEach(data => {
                                //Create the group from the data entry.
                                let group = this.pth.textureManager.groupManager.createNewGroup(data.name)
                                group.layerIDs = data.layerIDs
                            }))
                        }
                    })

                    //Refresh the texture manager
                    .then(() => this.pth.textureManager.refresh())
                })
            }
            





            //Load the animation data. A normal animation folder can look like this:
            //
            //animations           ┌───────────────────────┐
            // ├─ animation_name ──┤ walking_animation     │ (will be used for 0.dca/0.json)
            // ├─ 0.dca            │ Some Second Aniamtion │ (will be used for 1.dca/1.json)
            // ├─ 0.json           │ WorldsBestAnimation   │ (will be used for 2.dca/2.json)
            // ├─ 1.dca            └───────────────────────┘
            // ├─ 1.json
            // ├─ 2.dca
            // └─ 2.json
            //
            //The .json part of each entry holds the metadata for the animation.
            //Currently, this handles keyframeInfo and (newly) ikaCubes
            //Note in the future this could be extended to include the name, so
            //animation_names doesn't have to exist.

            let animationFolder = zip.folder('animations')
            let animationFile = animationFolder.file('animation_names')
            if(animationFile !== null) {
                animationFile.async('string')
                .then(res => {
                    //Shouldn't occur, but this is just to check
                    if(res === "") {
                        return
                    }
                    let animationNames = res.split("\n")
                    //Get an array of arrays.
                    Promise.all(animationNames.map((_, i) => Promise.all([
                        animationFolder.file(i + ".dca").async('arraybuffer'), 
                        animationFolder.file(i + ".json").async('string').then(data => JSON.parse(data))
                    ])))

                    //Create and initiate the animation data.
                    .then(fileDatas => fileDatas.forEach((data, index) => {
                        let tab = this.animationPart.createAndInitiateNewAnimationTab(animationNames[index], data[0])
                        tab.handler.keyframeInfo = data[1].keyframeInfo
                        tab.handler.ikaCubes = data[1].ikaCubes ?? []
                        this.animationPart.onAnimationTabAdded(tab)
                    }))
                })
            }
            





             //Load the reference image data. A normal reference image folder can look like this:
            //
            //ref_images        
            // ├─ data.json
            // ├─ MyFirstReferenceImage.png
            // └─ MostIncredibleSideProfile.png
            //
            //data.json is a json list of entries in the following format:
            // {
            //      name -> a string of the file name.
            //      pos -> an array of 3 numbers of the ref images position
            //      rot -> an array of 3 numbers of the ref images rotation (radians)
            //      scale -> an array of 3 numbers of the ref images scale
            //      opacity -> a number from 0 to 100 for the ref images opacity
            //      canSelect -> true if the element can be selected, false otherwise. (changeable in the ref image menu)
            // }
            //
            let referenceImages = zip.folder('ref_images')
            let refImgNames = referenceImages.file('data.json')
            if(refImgNames !== null) {
                refImgNames.async('string')
                .then(res => {
                    //Parse then object and iterate over it
                    let obj = JSON.parse(res)
                    obj.forEach(elem => 
                        //Get the actual png file
                        referenceImages.file(`${elem.name}.png`).async('blob')
                        .then(blob => {
                            //Create the img, and when loaded set all the data from the obj
                            let img = document.createElement('img')
                            img.onload = () => this.modelingPart.addReferenceImage(img, elem.name).then(data => {
                                data.mesh.position.set(elem.pos[0], elem.pos[1], elem.pos[2])
                                data.mesh.rotation.set(elem.rot[0], elem.rot[1], elem.rot[2])
                                data.mesh.scale.set(elem.scale[0], elem.scale[1], elem.scale[2])
                                data.setOpacity(elem.opacity)
                                data.canSelect = elem.canSelect
                                img.onload = null
                            })

                            //Read the png file, and set it as the img src
                            readFile(blob, (reader, file) => reader.readAsDataURL(file))
                            .then(data => img.src = data)
                        })
                    )
                })
            }
        })
    }

    /**
     * Writes the project to a blob
     * @param {DcProject} project the project to write to
     * @returns {Blob} a blob of the dcproj file.
     */
    writeFile(project) {
        let zip = new JSZip()

        //Write the model as model.dcm
        zip.file('model.dcm', DCMLoader.writeModel(project.model).getAsBlob())

        //Write the textures
        let textures = [...project.textureManager.textures].reverse()
        if(textures.length !== 0) {
            let texFolder = zip.folder('textures')
            //Write a list of all the texture names
            texFolder.file('texture_names', textures.map(data => data.name).join("\n"))

            //Write the png files
            textures.forEach((data, index) => texFolder.file(index + ".png", data.img.src.substring(data.img.src.indexOf(',')+1), { base64: true }))
            
            //Write the texture groups, if there is more than one group
            let groupManager = project.textureManager.groupManager
            if(groupManager.groups.length > 1) {
                texFolder.file('groups.json', 
                    JSON.stringify(
                        groupManager.groups
                        .filter(g => !g.isDefaultGroup) //Don't write the default group
                        .map(g => { return { name: g.name, layerIDs: g.layerIDs }})
                    )
                )
            }
        }


        //Write the animations
        let animations = project.animationTabHandler.allTabs
        if(animations.length !== 0) {
            let animFolder = zip.folder('animations')

            //Write a list of all the animation names
            animFolder.file('animation_names', animations.map(data => data.name).join("\n"))
            //Iterate over the animations and write the .dca and .json part
            animations.forEach((data, index) => {
                animFolder.file(index + ".dca", DCALoader.exportAnimation(data.handler).getAsBlob())
                animFolder.file(index + ".json", JSON.stringify( { 
                    keyframeInfo: this.cleanKeyframeInfo(data.handler.keyframeInfo),
                    ikaCubes: data.handler.ikaCubes
                 } ))
            })
        }

        
        //Write the reference images
        let refImages = project.referenceImages
        if(refImages.length !== 0) {
            let refFolder = zip.folder('ref_images')

            //Write the data.json file
            refFolder.file('data.json', JSON.stringify(refImages.map(i => { return { 
                name: i.name,
                pos: [i.mesh.position.x, i.mesh.position.y, i.mesh.position.z],
                rot: [i.mesh.rotation.x, i.mesh.rotation.y, i.mesh.rotation.z],
                scale: [i.mesh.scale.x, i.mesh.scale.y, i.mesh.scale.z],
                opacity: i.opacity,
                canSelect: i.canSelect
             } })))

             //Write all the pngs
             refImages.forEach(img => 
                 refFolder.file(`${img.name}.png`, img.img.src.substring(img.img.src.indexOf(',')), { base64: true })
             )
        }

        //Genereate as a blob
        return zip.generateAsync( { type:"blob" } )
    }

    //When importing a keyframe on old versions, it would sometimes create way too many keyframe layer info. This is to fix that
    cleanKeyframeInfo(kfInfo) {
        let ret = []

        new Set(kfInfo.map(e => e.id)).forEach(id => {
            let entries = kfInfo.filter(e => e.id === id)
            ret.push(entries.find(e => (e.name != `Layer ${id}`) || (e.visible !== true) || (e.locked !== false)) || entries[0] ) 
        })

        return ret
    }
}