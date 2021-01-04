import { readFile } from "../../displays.js"
import { DCALoader } from "../animation/dca_loader.js"
import { DCMModel } from "../model/dcm_loader.js"

export class DcProjectZipConverter {
    constructor(pth, modelingPart, texturePart, animationPart) {
        this.pth = pth
        this.modelingPart = modelingPart
        this.texturePart = texturePart
        this.animationPart = animationPart
    }

    readFile(file) {
        return JSZip.loadAsync(readFile(file, (reader, file) => reader.readAsBinaryString(file)))
        .then(async(zip) => {
            this.pth.createNewProject(await DCMModel.loadModel(await zip.file('model.dcm').async('arraybuffer'), file.name, this.texturePart))
            
            let textureFolder = zip.folder('textures')
            let textureFile = textureFolder.file('texture_names')
            if(textureFile !== null) {
                textureFile.async('string')
                .then(res => {
                    //Shouldn't occur, but this is just to check
                    if(res === "") {
                        return
                    }
                    let layerNames = res.split("\n")
                    Promise.all(layerNames.map((_, i) => textureFolder.file(i + ".png").async('blob')))
                    .then(textures => Promise.all(textures.map((texture, index) => {
                        let img = document.createElement("img")
                        img.src = URL.createObjectURL(texture)
                        
                        return new Promise(resolve => img.onload = () => {
                            img.onload = null   
                            resolve( { name: layerNames[index], img } )
                        })
                    })))
                    .then(datas => datas.forEach(data => this.texturePart.createTextureElement(data.name, data.img)))
                    .then(() => {
                        let groupFile = textureFolder.file('groups.json')
                        if(groupFile !== null) {
                            return groupFile.async('string')
                            .then(res => {
                                JSON.parse(res).forEach(data => {
                                    let group = this.pth.textureManager.groupManager.createNewGroup(data.name)
                                    group.layerIDs = data.layerIDs
                                })
                            })
                        }
                    })
                    .then(() => this.pth.textureManager.refresh())
                })
            }
            

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
                    Promise.all(animationNames.map((_, i) => Promise.all([
                        animationFolder.file(i + ".dca").async('arraybuffer'), 
                        animationFolder.file(i + ".json").async('string').then(data => JSON.parse(data))
                    ])))
                    .then(fileDatas => fileDatas.forEach((data, index) => {
                        let tab = this.animationPart.createAndInitiateNewAnimationTab(animationNames[index], data[0])
                        tab.handler.keyframeInfo = data[1].keyframeInfo
                        tab.handler.ikaCubes = data[1].ikaCubes ?? []
                        this.animationPart.onAnimationTabAdded(tab)
                    }))
                })
            }

            let referenceImages = zip.folder('ref_images')
            let refImgNames = referenceImages.file('data.json')
            if(refImgNames !== null) {
                refImgNames.async('string')
                .then(res => {
                    let obj = JSON.parse(res)
                    obj.forEach(elem => 
                        referenceImages.file(`${elem.name}.png`).async('blob')
                        .then(blob => {
                            let img = document.createElement('img')
                            img.onload = () => this.modelingPart.addReferenceImage(img, elem.name).then(data => {
                                data.mesh.position.set(elem.pos[0], elem.pos[1], elem.pos[2])
                                data.mesh.rotation.set(elem.rot[0], elem.rot[1], elem.rot[2])
                                data.mesh.scale.set(elem.scale[0], elem.scale[1], elem.scale[2])
                                data.setOpacity(elem.opacity)
                                data.canSelect = elem.canSelect
                                img.onload = null
                            })
                            readFile(blob, (reader, file) => reader.readAsDataURL(file))
                            .then(data => img.src = data)
                        })
                    )
                })
            }
        })
    }

    writeFile(project) {
        let zip = new JSZip()

        zip.file('model.dcm', DCMModel.writeModel(project.model).getAsBlob())

        let textures = [...project.textureManager.textures].reverse()
        if(textures.length !== 0) {
            let texFolder = zip.folder('textures')
            texFolder.file('texture_names', textures.map(data => data.name).join("\n"))
            textures.forEach((data, index) => texFolder.file(index + ".png", data.img.src.substring(data.img.src.indexOf(',')+1), { base64: true }))
            let groupManager = project.textureManager.groupManager
            if(groupManager.groups.length > 1) {
                texFolder.file('groups.json', 
                    JSON.stringify(
                        groupManager.groups
                        .filter(g => !g.isDefaultGroup)
                        .map(g => { return { name: g.name, layerIDs: g.layerIDs }})
                    )
                )
            }
        }

        let animations = project.animationTabHandler.allTabs
        if(animations.length !== 0) {
            let animFolder = zip.folder('animations')
            animFolder.file('animation_names', animations.map(data => data.name).join("\n"))
            animations.forEach((data, index) => {
                animFolder.file(index + ".dca", DCALoader.exportAnimation(data.handler).getAsBlob())
                animFolder.file(index + ".json", JSON.stringify( { 
                    keyframeInfo: this.cleanKeyframeInfo(data.handler.keyframeInfo),
                    ikaCubes: data.handler.ikaCubes
                 } ))
            })
        }

        let refImages = project.referenceImages
        if(refImages.length !== 0) {
            let refFolder = zip.folder('ref_images')
            refFolder.file('data.json', JSON.stringify(refImages.map(i => { return { 
                name: i.name,
                pos: [i.mesh.position.x, i.mesh.position.y, i.mesh.position.z],
                rot: [i.mesh.rotation.x, i.mesh.rotation.y, i.mesh.rotation.z],
                scale: [i.mesh.scale.x, i.mesh.scale.y, i.mesh.scale.z],
                opacity: i.opacity,
                canSelect: i.canSelect
             } })))
             refImages.forEach(img => 
                 refFolder.file(`${img.name}.png`, img.img.src.substring(img.img.src.indexOf(',')), { base64: true })
             )
        }

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