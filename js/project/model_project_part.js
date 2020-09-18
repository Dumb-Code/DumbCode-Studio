import { ByteBuffer } from "../animations.js"
import { readFile } from "../displays.js"
import { DCALoader } from "../formats/animation/dca_loader.js"
import { DCMModel } from "../formats/model/dcm_loader.js"
import { DcProject } from "../formats/project/dc_project.js"
import { RemoteProject } from "../formats/project/remote_project.js"
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

        getModal('project/github').then(e => {
            let dom = $(e)
            let token = dom.find('.access-token')
            let owner = dom.find('.repo-owner')
            let name = dom.find('.repo-name')
            let branch = dom.find('.repo-branch')
            let logArea = dom.find('.log-area')
            dom.submit(() => {
                new RemoteProject(this.pth, this.texturePart, this.animationPart, token.val(), owner.val(), name.val(), branch.val(), logArea)
                return false
            })
        })

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
                                this.texturePart.createTextureElement(layerNames[index], img)
                                resolve()
                            })
                        })))
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
                            this.animationPart.onAnimationTabAdded(tab)
                            
                    }))
                    })
                }
            })
        })
    }

    initiateEntry(project) {
        let model = project.model

        let cloned = this.emptyModelEntry.clone()
        project._element = cloned
        cloned
            .attr('select-list-entry', project.id)
            .removeClass('empty-column')
            .insertBefore(this.emptyModelEntry)    
        
        cloned.find('.download-model-file').click(() => DCMModel.writeModel(model).downloadAsFile(model.fileName + ".dcm"))
        cloned.find('.download-project-file').click(() => {
            let zip = new JSZip()

            zip.file('model.dcm', DCMModel.writeModel(model).getAsBlob())

            let textures = [...project.textureManager.textures].reverse()
            if(textures.length !== 0) {
                let texFolder = zip.folder('textures')
                texFolder.file('texture_names', textures.map(data => data.name).join("\n"))
                textures.forEach((data, index) => texFolder.file(index + ".png", data.img.src.substring(data.img.src.indexOf(',')), { base64: true }))
            }

            let animations = project.animationTabHandler.allTabs
            if(animations.length !== 0) {
                let animFolder = zip.folder('animations')
                animFolder.file('animation_names', animations.map(data => data.name).join("\n"))
                animations.forEach((data, index) => {
                    animFolder.file(index + ".dca", DCALoader.exportAnimation(data.handler).getAsBlob())
                    animFolder.file(index + ".json", JSON.stringify( { keyframeInfo: this.cleanKeyframeInfo(data.handler.keyframeInfo) } ))
                })
            }

            zip.generateAsync( { type:"blob" } )
            .then(content => downloadBlob(model.fileName + ".dcproj", content))

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