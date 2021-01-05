import { readFile } from "../displays.js"
import { ByteBuffer } from "../animations.js"
import { doubleClickToEdit, fileUploadBox, getAndDeleteFiles } from "../util/element_functions.js"
import { GifExporter } from "./gif_export.js"
import { DCMModel } from "../formats/model/dcm_loader.js"
import { ModelListAnimationLoader } from "../formats/animation/model_list_animation.js"
import { DCALoader } from "../formats/animation/dca_loader.js"

export class AnimationProjectPart {

    constructor(dom, animatorGetter, pth) {
        this.animatorGetter = animatorGetter
        this.pth = pth
        this.gifExporter = new GifExporter(animatorGetter)
        this.emptyAnimationList = dom.find('.animation-list-entry.empty-column')
        dom.find('.new-animation-button').click(() => this.createNewAnimationTab())

        let uploadTextureFile = files => {
            [...files].forEach(async(file) => 
                this.createAndInitiateNewAnimationTab(file.name.substring(0, file.name.length - 4), await readFile(file))
            )
        }

        dom.find('#animation-file-input').on('input', e => uploadTextureFile(getAndDeleteFiles(e)))
        fileUploadBox(dom.find('.animation-drop-area'), files => uploadTextureFile(files))

        dom.find('#animation-tbl-files').on('input', async(e) => {
            let files = [...getAndDeleteFiles(e)]
            let name = this.sharedStart(files.map(f => f.name))

            if(name.endsWith('_')) {
                name = name.substring(0, name.length - 1)
            } else if(name.length === 0) {
                name = files[0].name
                name = name.substring(0, name.length - 4)
            }

            let tblFiles = []
            let infoFile

            files.forEach(file => {
                if(file.name.endsWith(".dcm") || file.name.endsWith(".tbl")) {
                    tblFiles.push(file)
                }
                if(file.name == "animation.json") {
                    infoFile = file
                }
            })
        
            if(files.length == 0) {
                alert("No poses uploaded")
                return
            }
           
            let tab = this.createNewAnimationTab(name)
            let animator = this.animatorGetter()
            if(tab) {
                let promiseFiles = [...tblFiles.map(file => DCMModel.loadModel(readFile(file), file.name))]
                if(infoFile) {
                    promiseFiles.push(readFile(infoFile))
                }
        
                let result = await Promise.all(promiseFiles)
        
                let info = infoFile ? JSON.parse(result.pop()) : { base_time: 5 }

                ModelListAnimationLoader.readFromModelFiles(tab.handler, result, info)
                this.onAnimationTabAdded(tab)
            }
        })

        pth.addEventListener('selectchange', () => this.refreshAnimationList())
    }

    createAndInitiateNewAnimationTab(name, arraybuffer) {
        let tab = this.createNewAnimationTab(name)
        if(tab) {
            let buffer = new ByteBuffer(arraybuffer)
            DCALoader.importAnimation(tab.handler, buffer)
            this.onAnimationTabAdded(tab)
        }
        return tab
    }

    onAnimationTabAdded(tab) {
        tab.handler.keyframes.forEach(kf =>  {
            tab.handler.ensureLayer(kf.layer)
            tab.handler.updateLoopKeyframe()
        })
        this.animatorGetter().keyframeManager.reframeKeyframes()
        this.animatorGetter().cubeDisplayValues.updateLoopedElements()
    }

    toggleTabOpened(tab) {
        tab._toggleDom.toggleClass('is-activated')
    }

    createNewAnimationTab(name) {
        let tab = this.pth.animationTabs.createNewTab()
        let textElement = tab.textElement

        let cloned = this.emptyAnimationList.clone()
        cloned.removeClass('empty-column')
        cloned.insertBefore(this.emptyAnimationList)
        
        let dom = $(cloned)
        tab._clonedDom = dom

        if(name === undefined || name === null) {
            name = tab.name
        } else {
            tab.name = name
        }

        textElement.innerText = tab.name

        doubleClickToEdit(dom.find('.animation-name'), name => {
            tab.name = name
            textElement.innerText = name
        }, name)

        let handler = tab.handler
        dom.find('.download-animation-gif').click(e => {
            this.gifExporter.onOpenModal(handler, tab.name)
            e.stopPropagation()
        })
        dom.find('.download-animation-file').click(e => {
            DCALoader.exportAnimation(handler).downloadAsFile(tab.name + ".dca")
            e.stopPropagation()
        })
        dom.find('.delete-animation-button').click(e => {
            this.pth.animationTabs.deleteAnimation(tab)
            cloned.remove()
            e.stopPropagation()
        })
        tab._toggleDom = dom.find('.toggle-animation')
        tab._toggleDom.click(() => tab.toggleOpened())
        return tab
    }

    //https://stackoverflow.com/a/1917041
    sharedStart(array){
        var A= array.concat().sort(), 
        a1= A[0], a2= A[A.length-1], L= a1.length, i= 0;
        while(i<L && a1.charAt(i)=== a2.charAt(i)) i++;
        return a1.substring(0, i);
    }

    refreshAnimationList() {
        this.emptyAnimationList.siblings().not('.animation-layer-topbar').detach()
        if(this.pth.anySelected()) {
            this.pth.animationTabs.allTabs.forEach(tab => tab._clonedDom.insertBefore(this.emptyAnimationList))
            this.pth.animationTabs.refreshTabs()
        }
    }

}