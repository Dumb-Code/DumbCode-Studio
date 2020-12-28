import { DCALoader } from "../animation/dca_loader.js"
import { DCMModel } from "../model/dcm_loader.js"
import { AsyncProgressCounter } from "../../util.js"

export class RemoteProject {
    constructor(pth, modelingPart, texturePart, animationPart, name, gitinter) {
        this.pth = pth
        this.modelingPart = modelingPart
        this.texturePart = texturePart
        this.animationPart = animationPart
        this.gitinter = gitinter
        this.name = name
        this.project = null
    }

    setupFromFile(file) {
        this.remoteFile = this.parseRemoteFile(atob(file.content), file.name)
        this.newCreated = false
        return this.remoteFile
    }

    setupFromNew(model, animations, textures, syncCallback) {
        this.newCreated = true
        this._syncCallback = syncCallback
        this.remoteFile = this._createRemoteFile(model, textures, animations)
    }

    initiateEmptyData(animationData, textureData) {
        let model = new DCMModel()
        model.fileName = this.name  
        this.project = this.pth.createNewProject(model)
        this.project._element.find('.github-sync').css('display','').children().click(() => {
            this._syncCallback()
            this._syncCallback = null
            this.syncProject(animationData, textureData)
        })
    }


    async beginRunningRequests(animationData, textureData, updateCallback) {
        if(this.newCreated === true) {
            this.initiateEmptyData(animationData, textureData)
            return
        }
        let modelLocation = this.remoteFile.model 
        let name = modelLocation.substring(modelLocation.lastIndexOf('/') + 1)
        let model = await this.request(modelLocation).then(r => DCMModel.loadModel(this.toArrayBuffer(r), name))
        updateCallback()
        this.project = this.pth.createNewProject(model)
        this.project._element.find('.github-sync').css('display','').children().click(() => this.syncProject(animationData, textureData))

        if(animationData) {
            this.request(animationData.location)
            .then(files => {
                updateCallback()
                let amount = files.length
                let count = 0
                files.filter(file => file.type === "file" && file.name.endsWith('.dca')).forEach(file => 
                    this.request(file.path)
                    .then(r => {
                        updateCallback(++count / amount)
                        this.animationPart.createAndInitiateNewAnimationTab(file.name.substring(0, file.name.lastIndexOf('.')), this.toArrayBuffer(r))
                    })
                )
            })
            .catch(e => console.warn(e))
        } else {
            updateCallback(2)
        }

        if(textureData) {
            let amount = textureData.suffixLocations.length
            let count = 0
            Promise.all(textureData.suffixLocations.map(suffix => 
                this.request(`${textureData.location}/${suffix}.png`).then(async(data) => {
                    let img = document.createElement("img")
                    img.src = 'data:image/png;base64,' + data.content.replaceAll('\n', '')
                    await new Promise(resolve => img.onload = resolve)
                    img.onload = null
                    updateCallback(++count / amount)
                    return { suffix, img }
                }).catch(e => console.warn(e))
            ))
            .then(datas => {
                datas.reverse().forEach(p => this.texturePart.createTextureElement(p.suffix, p.img))
                this.pth.textureManager.refresh()
                closeModal()
            })
        } else {
            updateCallback()
        }

        if(this.remoteFile.referenceImages.length !== 0) {
            let amount = this.remoteFile.referenceImages.length
            let count = 0
            let loc = this.remoteFile.additionalData('reference_image')
            this.remoteFile.referenceImages.forEach(image => 
                this.request(`${loc}/${image.name}.png`)
                .then(async(imgData) => {
                    let img = document.createElement("img")
                    img.src = 'data:image/png;base64,' + imgData.content.replaceAll('\n', '')
                    await new Promise(resolve => img.onload = resolve)
                    img.onload = null
                    updateCallback(++count / amount)
                    let data = await this.modelingPart.addReferenceImage(img, image.name)
                    data.mesh.position.set(image.pos[0], image.pos[1], image.pos[2])
                    data.mesh.rotation.set(image.rot[0], image.rot[1], image.rot[2])
                    data.mesh.scale.set(image.scale[0], image.scale[1], image.scale[2])
                    data.setOpacity(image.opacity)
                    data.canSelect = image.canSelect
                })
                .catch(e => console.warn(e)))
        } else {
            updateCallback()
        }

    }
    
    toArrayBuffer(response) {
        return Uint8Array.from(atob(response.content), c => c.charCodeAt(0)).buffer
    }

    request(url) {
        return this.gitinter.request(url)
    }

    parseRemoteFile(content) {
        let lines = content.split("\n")
        
        let version = null
        let model = null
        let textureFolders = []
        let animationFolders = []
        let referenceImages = []

        let readingTexture = null
        let readingRefImage = false

        lines.forEach(line => {
            if(line.startsWith('#') || line === "") {
                return
            }
            if(line.startsWith('version ')) {
                version = line.substring(8)
            } else if(line.startsWith('model ')) {
                model = line.substring(6)
            } else if(line.startsWith('texture')) {
                readingTexture = this.parseNamedLocation(line, 7)
                readingTexture.suffixLocations = []
            } else if(line.startsWith('animation')) {
                animationFolders.push(this.parseNamedLocation(line, 9))
            } else if(line === "reference_image_files") {
                readingRefImage = true
            } else if(line === "end") {
                if(readingRefImage === true) {
                    readingRefImage = false
                } else if(readingTexture !== null) {
                    textureFolders.push(readingTexture)
                    readingTexture = null
                } else {
                    console.warn(`Recieved end command when no texture was started for '${this.name}'`)
                }
            } else if(readingTexture !== null) {
                readingTexture.suffixLocations.push(line)
            } else if(readingRefImage === true) {
                let split = line.split(" ") //px py pz rx ry rz sx sy sz o sel <name>
                if(split.length < 12) {
                    console.warn(`Don't know how to process reference image line ${line}`)
                } else {
                    let pos, rot, scale, opacity, canSelect, name
                    try {
                        pos = [parseFloat(split.shift()), parseFloat(split.shift()), parseFloat(split.shift())]
                        rot = [parseFloat(split.shift()), parseFloat(split.shift()), parseFloat(split.shift())]
                        scale = [parseFloat(split.shift()), parseFloat(split.shift()), parseFloat(split.shift())]
                        opacity = parseFloat(split.shift())
                        canSelect = split.shift() == "t"
                        name = split.join(' ')
                    } catch(e) {
                        console.warn("Unable to proess reference image line " + line, e)
                    }
                    referenceImages.push( { pos, rot, scale, opacity, canSelect, name } )
                }
            } else {
                console.warn(`Don't know how to process '${line}' for '${this.name}'`)
            }
        })

        if(version === null) {
            console.error(`Version not specified for '${this.name}'`)
            return
        }
        if(model === null) {
            console.error(`Model not specified for '${this.name}'`)
            return
        }

        return this._createRemoteFile(model, textureFolders, animationFolders, referenceImages)
    }

    _createRemoteFile(model, textureFolders, animationFolders, referenceImages = []) {
        this.ensureValidData(textureFolders)
        return { 
            model, textureFolders, animationFolders, referenceImages,
            additionalData: (...names) => `studio_remotes/data/${this.name}/${names.join('/')}`
        }
    }

    ensureValidData(textureFolders = this.remoteFile.textureFolders) {
        textureFolders.forEach(tf => {
            if(!tf.suffixLocations) {
                tf.suffixLocations = []
            }
        })
    }

    parseNamedLocation(line, dataLength) {
        let l = line.substring(dataLength)
        if(l.startsWith(':')) {
            let spaceIndex = l.indexOf(' ')
            let name = l.substring(1, spaceIndex)
            let location = l.substring(spaceIndex + 1)
            return { name, location }
        } else if(l.startsWith(' ')) {
            return { location: l.substring(1) }
        }
    }

    async syncRemoteFileOnly(message, logArea) {
        let data = this.remoteFile
        let commiter = this.gitinter.commiter()
        let progress = new AsyncProgressCounter(1, 5, 'Writing Files', (s, c) => logArea.text(s + ' ' + Math.round(c * 100) + '%'))
        commiter.addFile(`studio_remotes/${this.name}.remote`, this.writeRemoteFile())
        return commiter.submit(
            message,
            v => progress.updateProgress(0, v),
            state => progress.globalState(state)
        )
    }


    syncProject(animationData, textureData) {
        let project = this.project
        openModal("project/upload").then(d => this.logArea = d.find('.log-area'))
        lockModalUserClose()
        let progress = new AsyncProgressCounter(1, 7, 'Writing Files', (s, c) => this.logArea?this.logArea.text(s + ' ' + Math.round(c * 100) + '%'):0)
        let data = this.remoteFile
        if(!data.model.endsWith('.dcm')) {
            data.model = data.model.substring(0, data.model.lastIndexOf('.')) + '.dcm'
        }
        let commiter = this.gitinter.commiter()
        commiter.addFile(`studio_remotes/${this.name}.remote`, this.writeRemoteFile(textureData))
        commiter.addFile(data.model, DCMModel.writeModel(project.model).getAsBase64(), true)
        progress.updateProgress()
        if(animationData) {
            commiter.removeRedundentFiles(animationData.location, f => f.endsWith('.dca'))
            project.animationTabHandler.allTabs.forEach(tab =>
                commiter.addFile(`${animationData.location}/${tab.name}.dca`, DCALoader.exportAnimation(tab.handler).getAsBase64(), true)
            )
        }
        if(textureData) {
            commiter.removeRedundentFiles(textureData.location, f => f.endsWith('.png'))
            project.textureManager.textures.forEach(data => {
                commiter.addFile(`${textureData.location}/${data.name}.png`, data.img.src.substring(data.img.src.indexOf(',')+1), true)
            })
        }
        if(project.referenceImages.length !== 0) {
            let loc = data.additionalData('reference_image')
            commiter.removeRedundentFiles(loc, f => f.endsWith('.png'))
            project.referenceImages.forEach(data => {
                commiter.addFile(`${loc}/${data.name}.png`, data.img.src.substring(data.img.src.indexOf(',')+1), true)
            })
        }
        progress.updateProgress()
        return commiter.submit(
            prompt("Commit Message: (Commits can take a minute or 2 to process)"),
            v => progress.updateProgress(0, v),
            state => progress.globalState(state)
        ).then(closeModal)
    }

    writeRemoteFile(textureData) {
        let data = this.remoteFile
        let project = this.project

        let lines = [`version 1.0`, `model ${data.model}`]

        console.log(data.textureFolders)

        data.textureFolders.forEach(folder => {
            lines.push('')
            let prefix = folder.name ? `texture:${folder.name}` : `texture`
            lines.push(`${prefix} ${folder.location}`)
            if(folder === textureData) {
                project.textureManager.textures.forEach(texture => lines.push(texture.name))
            } else {
                folder.suffixLocations.forEach(texture => lines.push(texture))
            }
            lines.push('end')
        })
        data.animationFolders.forEach(folder => {
            lines.push('')
            let prefix = folder.name ? `animation:${folder.name}` : `animation`
            lines.push(`${prefix} ${folder.location}`)
        })
        
        if((project === null ? this.remoteFile.referenceImages : project.referenceImages).length !== 0) {
            lines.push('')
            lines.push('reference_image_files')
            if(project === null) {
                this.remoteFile.referenceImages.forEach(ref => {
                    let arr = []
                    arr.push(...ref.pos)
                    arr.push(...ref.rot)
                    arr.push(...ref.scale)
                    arr.push(ref.pos.opacity)
                    arr.push(ref.pos.canSelect)
                    arr.push(ref.pos.name)
                    lines.push(arr.join(' '))
                })
            } else {
                project.referenceImages.forEach(e => {
                    lines.push([ 
                        e.mesh.position.x, e.mesh.position.y, e.mesh.position.z, 
                        e.mesh.rotation.x, e.mesh.rotation.y, e.mesh.rotation.z,
                        e.mesh.scale.x, e.mesh.scale.y, e.mesh.scale.z,
                        e.opacity,
                        e.canSelect ? 't' : 'f',
                        e.name
                    ].join(' '))
                })
            }
            
            lines.push("end")
        }

        confirm(lines)

        return lines.join("\n")
    }
}