import { ByteBuffer } from "../animations.js"
import { readFile } from "../displays.js"
import { DCALoader } from "../formats/animation/dca_loader.js"
import { DCMModel } from "../formats/model/dcm_loader.js"
import { DcProject } from "../formats/project/dc_project.js"
import { doubleClickToEdit, downloadBlob, fileUploadBox, LinkedSelectableList } from "../util.js"

export class ModelProjectPart {
    constructor(dom, pth, texturePart, animationPart) {
        this.pth = pth
        this.texturePart = texturePart
        this.animationPart = animationPart
        this.emptyModelEntry = dom.find('.model-list-entry.empty-column')

        this.projectSelectList = new LinkedSelectableList(null, true).onchange(v => pth.selectIndex(v.value))

        pth.addEventListener('newproject', e => this.initiateEntry(e.project))
        pth.addEventListener('selectchange', e => this.projectSelectList.setValue(e.to, true))

        dom.find('.new-model-button').click(() => pth.createNewProject())

        dom.find('#model-file-input').on('input', e => this.loadModelFiles(e.target.files))
        fileUploadBox(dom.find('.model-drop-area'), files => this.loadModelFiles(files))

        dom.find('#project-file-input').on('input', e => this.loadProjectFiles(e.target.files))
    }
    
    async loadModelFiles(files) {
        [...files].forEach(file => DCMModel.loadModel(readFile(file), file.name).then(model => this.pth.createNewProject(model)))
    }

    async loadProjectFiles(files) {
        [...files].forEach(file => {
            JSZip.loadAsync(readFile(file, (reader, file) => reader.readAsBinaryString(file)))
            .then(async(zip) => {
                this.pth.createNewProject(await DCMModel.loadModel(await zip.file('model.dcm').async('arraybuffer'), file.name))

                let textureFolder = zip.folder('textures')
                textureFolder.file('texture_order').async('string')
                .then(res => {
                    let layerNames = res.split("\n")
                    Promise.all(layerNames.map((_, i) => textureFolder.file(i + ".png").async('blob')))
                    .then(textures => Promise.all(textures.map((texture, index) => {
                        let img = document.createElement("img")
                        img.src = URL.createObjectURL(texture)
                        
                        return new Promise(resolve => img.onload = () => {
                            img.onload = null
                            this.texturePart.createTextureElement(layerNames[index], img)
                            resolve()
                        })
                    })))
                    .then(() => this.pth.textureManager.refresh())
                })

                let animationFolder = zip.folder('animations')
                animationFolder.file('animation_order').async('string')
                .then(res => {
                    let animationNames = res.split("\n")
                    Promise.all(animationNames.map((_, i) => animationFolder.file(i + ".dca").async('arraybuffer')))
                    .then(animations => animations.forEach((animation, index) => 
                        this.animationPart.createAndInitiateNewAnimationTab(animationNames[index], animation)
                    ))
                })
            })
        })
    }

    initiateEntry(project) {
        let model = project.model

        let cloned = this.emptyModelEntry.clone()
        cloned
            .attr('select-list-entry', project.id)
            .removeClass('empty-column')
            .insertBefore(this.emptyModelEntry)    
        
        cloned.find('.download-model-file').click(() => DCMModel.writeModel(model).downloadAsFile(model.fileName + ".dcm"))
        cloned.find('.download-project-file').click(() => {
            let zip = new JSZip()

            zip.file('model.dcm', DCMModel.writeModel(model).getAsBlob())

            let textures = [...project.textureManager.textures].reverse()
            let texFolder = zip.folder('textures')
            texFolder.file('texture_order', textures.map(data => data.name).join("\n"))
            textures.forEach((data, index) => texFolder.file(index + ".png", data.img.src.substring(data.img.src.indexOf(',')), { base64: true }))

            let animations = project.animationTabHandler.allTabs
            let animFolder = zip.folder('animations')
            animFolder.file('animation_order', animations.map(data => data.name).join("\n"))
            animations.forEach((data, index) => {
                animFolder.file(index + ".dca", DCALoader.exportAnimation(data.handler).getAsBlob())
                animFolder.file(index + "-metadata.json", JSON.stringify( { keyframeInfo: this.cleanKeyframeInfo(data.handler.keyframeInfo) } ))
            })

            zip.generateAsync( { type:"blob" } )
            .then(content => downloadBlob(model.fileName + ".zip", content))

        })

        this.projectSelectList.addElement(cloned)

        doubleClickToEdit(cloned.find('.model-name-container'), name => model.fileName = name, model.fileName)
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