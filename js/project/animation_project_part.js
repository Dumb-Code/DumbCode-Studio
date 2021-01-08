import { readFile } from "../displays.js"
import { ByteBuffer } from "../animations.js"
import { doubleClickToEdit, fileUploadBox, getAndDeleteFiles } from "../util/element_functions.js"
import { GifExporter } from "./gif_export.js"
import { DCMModel } from "../formats/model/dcm_model.js"
import { ModelListAnimationLoader } from "../formats/animation/model_list_animation.js"
import { DCALoader } from "../formats/animation/dca_loader.js"
import { DCMLoader } from "../formats/model/dcm_loader.js"

/**
 * The files part for the animation page.
 */
export class AnimationProjectPart {

    constructor(dom, animatorGetter, pth) {
        this.animatorGetter = animatorGetter
        this.pth = pth
        //The gif exporter
        this.gifExporter = new GifExporter(animatorGetter)
        this.emptyAnimationList = dom.find('.animation-list-entry.empty-column')
        dom.find('.new-animation-button').click(() => this.createNewAnimationTab())

        //Uploads a list of files as textures
        let uploadTextureFile = files => {
            [...files].forEach(async(file) => 
                this.createAndInitiateNewAnimationTab(file.name.substring(0, file.name.length - 4), await readFile(file))
            )
        }

        dom.find('#animation-file-input').on('input', e => uploadTextureFile(getAndDeleteFiles(e)))
        fileUploadBox(dom.find('.animation-drop-area'), files => uploadTextureFile(files))

        //Upload from .tbl files
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
                let promiseFiles = [...tblFiles.map(file => DCMLoader.loadModel(readFile(file), file.name))]
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

    /**
     * Creates a new animation tab from a .dca file.
     * @param {string} name tab name
     * @param {ArrayBuffer} arraybuffer the animation data 
     */
    createAndInitiateNewAnimationTab(name, arraybuffer) {
        let tab = this.createNewAnimationTab(name)
        if(tab) {
            let buffer = new ByteBuffer(arraybuffer)
            DCALoader.importAnimation(tab.handler, buffer)
            this.onAnimationTabAdded(tab)
        }
        return tab
    }

    /**
     * Called when a new animation tab is added
     * @param {*} tab the animation tab
     */
    onAnimationTabAdded(tab) {
        tab.handler.keyframes.forEach(kf =>  {
            tab.handler.ensureLayer(kf.layer)
            tab.handler.updateLoopKeyframe()
        })
        this.animatorGetter().keyframeManager.reframeKeyframes()
        this.animatorGetter().cubeDisplayValues.updateLoopedElements()
    }

    /**
     * Toggles an animation tab
     * @param {*} tab the animation tab to toggle
     */
    toggleTabOpened(tab) {
        tab._toggleDom.toggleClass('is-activated')
    }

    /**
     * Creates a new animation tab. Creates the dom elements
     * @param {*} name the tabs name
     */
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

        //Link all the dom buttons.
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

    /**
     * Called when a project changes. Used to refresh the animation entries
     */
    refreshAnimationList() {
        this.emptyAnimationList.siblings().not('.animation-layer-topbar').detach()
        if(this.pth.anySelected()) {
            this.pth.animationTabs.allTabs.forEach(tab => tab._clonedDom.insertBefore(this.emptyAnimationList))
            this.pth.animationTabs.refreshTabs()
        }
    }

}