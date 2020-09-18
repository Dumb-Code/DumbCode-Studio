import { GithubCommiter } from "../../github_commiter.js"
import { DCALoader } from "../animation/dca_loader.js"
import { DCMModel } from "../model/dcm_loader.js"
import { readFile } from "../../displays.js"
import { AsyncProgressCounter } from "../../util.js"

let intilized = false

let animationComboBox
let animationArea

let textureComboBox
let textureArea

let currentName = null

export class RemoteProject {
    constructor(pth, texturePart, animationPart, token, repoOwner, repoName, branch, logArea) {
        this.pth = pth
        this.texturePart = texturePart
        this.animationPart = animationPart
        this.token = token
        this.repo = `${repoOwner}/${repoName}`
        this.branch = branch
        this.logArea = logArea

        if(intilized !== true) {
            intilized = true
            getModal("project/decision").then(e => {
                let dom = $(e)
                animationComboBox = dom.find('.animation-choice-select')
                animationArea = dom.find('.animation-selection')
    
                textureComboBox = dom.find('.texture-choice-select')
                textureArea = dom.find('.texture-selection')
                this.logArea = this.logArea.add(dom.find('.log-area'))
                this.prepareRequestData()
            })
            getModal("project/upload").then(e => this.logArea = this.logArea.add($(e).find('.log-area')))      
        } else {
            this.prepareRequestData()
        }
    }

    prepareRequestData() {
        this.request(`studio_remotes`).then(files => {
            let allFiles = files.filter(file => file.type == "file" && file.name.endsWith('.remote'))
            let progress = new AsyncProgressCounter(allFiles.length, 8, 'Preparing...', (s, c) => this.logArea.text(s + ' ' + Math.round(c * 100) + '%'))
            allFiles.forEach((file, n) => {
                progress.updateProgress(n)
                let name = file.name.substring(0, file.name.lastIndexOf('.'))
                this.request(file.path).then(f => {
                    progress.updateProgress(n)
                    let data = this.parseRemoteFile(atob(f.content), name)
                    progress.updateProgress(n)

                    let animationDecision = data.animationFolders.length > 1
                    let textureDecision = data.textureFolders.length > 1

                    if(animationDecision || textureDecision) {
                        animationArea.css('display', animationDecision ? '' : 'none')
                        textureArea.css('display', textureDecision ? '' : 'none')
        
                        if(animationDecision) {
                            animationComboBox.html('')
                            data.animationFolders.forEach(f => {
                                if(!f.name) {
                                    console.warn(`Attempted choice of animations, but was given an unnamed entry '${f.location}'`)
                                }
                                let element = document.createElement("option")
                                element.innerHTML = f.name
                                animationComboBox.append(element)
                            })
                        }

                        if(textureDecision) {
                            textureComboBox.html('')
                            data.textureFolders.forEach(f => {
                                if(!f.name) {
                                    console.warn(`Attempted choice of textures, but was given an unnamed entry '${f.location}'`)
                                }
                                let element = document.createElement("option")
                                element.innerHTML = f.name
                                textureComboBox.append(element)
                            })
                        }

                        currentName = name
                        openModal('project/decision').then(e => {
                            progress.updateProgress(n)
                            if(currentName !== name) {
                                return
                            }
                            currentName = null
                            e.find('.model-name-span').text(name)
                            e.find('.choice-made-button').one('click', () => {
                                let decidedAnimation = animationDecision ? data.animationFolders.find(f => f.name == animationComboBox.val()) : data.animationFolders[0]
                                let decidedTexture = textureDecision ? data.textureFolders.find(f => f.name == textureComboBox.val()) : data.textureFolders[0]
                                this.beginRunningRequests(file.path, data, decidedAnimation, decidedTexture, v => progress.updateProgress(n, v))
                            })
                        })
                    } else {
                        progress.updateProgress(n)
                        this.beginRunningRequests(file.path, data, data.animationFolders[0], data.textureFolders[0], v => progress.updateProgress(n, v))
                    }
                })
            })
        })
    }

    async beginRunningRequests(path, data, animationData, textureData, updateCallback) {
        let modelLocation = data.model 
        let name = modelLocation.substring(modelLocation.lastIndexOf('/') + 1)
        let model = await this.request(modelLocation).then(r => DCMModel.loadModel(this.toArrayBuffer(r), name))
        updateCallback()
        let project = this.pth.createNewProject(model)

        project._element.find('.github-sync').css('display','').children().click(() => this.syncProject(project, path, data, animationData, textureData))

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
        } else {
            updateCallback(2)
        }

        if(textureData) {
            let amount = textureData.suffixLocations.length
            let count = 0
            let allTextures = textureData.suffixLocations.map(suffix => this.request(`${textureData.location}/${suffix}.png`).then(r => {
                let img = document.createElement("img")
                img.src = 'data:image/png;base64,' + r.content
                return new Promise(resolve => img.onload = () => {
                    img.onload = null
                    resolve(() => {
                        updateCallback(++count / amount)
                        this.texturePart.createTextureElement(suffix, img)
                    })
                })
            }))
            Promise.all(allTextures).then(res => res.reverse().forEach(r => r())).then(() => this.pth.textureManager.refresh()).then(closeModal)
        } else {
            updateCallback()
        }
    }
    
    toArrayBuffer(response) {
        return Uint8Array.from(atob(response.content), c => c.charCodeAt(0)).buffer
    }

    request(url) {
        return fetch(`https://api.github.com/repos/${this.repo}/contents/${url}${this.branch?`?ref=${this.branch}`:''}`, { headers: { Authorization: `token ${this.token}` } }).then(response => response.json())
    }

    parseRemoteFile(content, name) {
        let lines = content.split("\n")
        
        let version = null
        let model = null
        let textureFolders = []
        let animationFolders = []
        
        let readingTexture = null

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
            } else if(line === "end") {
                if(readingTexture !== null) {
                    textureFolders.push(readingTexture)
                    readingTexture = null
                } else {
                    console.warn(`Recieved end command when no texture was started for '${name}'`)
                }
            } else if(readingTexture !== null) {
                readingTexture.suffixLocations.push(line)
            } else {
                console.warn(`Don't know how to process '${line}' for '${name}'`)
            }
        })

        if(version === null) {
            console.error(`Version not specified for '${name}'`)
            return
        }
        if(model === null) {
            console.error(`Model not specified for '${name}'`)
            return
        }

        return { model, textureFolders, animationFolders }
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


    syncProject(project, path, data, animationData, textureData) {
        openModal("project/upload")
        lockModalUserClose()
        let progress = new AsyncProgressCounter(1, 7, 'Writing Files', (s, c) => this.logArea.text(s + ' ' + Math.round(c * 100) + '%'))

        if(!data.model.endsWith('.dcm')) {
            data.model = data.model.substring(0, data.model.lastIndexOf('.')) + '.dcm'
        }
        let commiter = new GithubCommiter(this.token, this.repo, this.branch)
        commiter.addFile(path, this.writeRemoteFile(project, data, textureData))
        commiter.addFile(data.model, DCMModel.writeModel(project.model).getAsBase64(), true)
        progress.updateProgress()
        if(animationData) {
            commiter.removeRedundentFiles(animationData.location)
            project.animationTabHandler.allTabs.forEach(tab =>
                commiter.addFile(`${animationData.location}/${tab.name}.dca`, DCALoader.exportAnimation(tab.handler).getAsBase64(), true)
            )
        }
        if(textureData) {
            commiter.removeRedundentFiles(textureData.location)
            project.textureManager.textures.forEach(data => 
                commiter.addFile(`${textureData.location}/${data.name}.png`, data.img.src.substring(data.img.src.indexOf(',')), true)
            )
        }
        progress.updateProgress()
        return commiter.submit(
            prompt("Commit Message: (Commits can take a minute or 2 to process)"),
            v => progress.updateProgress(0, v),
            state => progress.globalState(state)
        ).then(closeModal)
    }

    writeRemoteFile(project, data, textureData) {
        let lines = [`version 1.0`, `model ${data.model}`]

        data.textureFolders.forEach(folder => {
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
            let prefix = folder.name ? `animation:${folder.name}` : `animation`
            lines.push(`${prefix} ${folder.location}`)
        })

        return lines.join("\n")
    }
}