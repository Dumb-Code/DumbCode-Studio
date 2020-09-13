import { readFile } from "../displays.js"
import { ByteBuffer } from "../animations.js"
import { TBLModel } from "../tbl_loader.js"
import { doubleClickToEdit } from "../util.js"
import { GifExporter } from "./gif_export.js"
import { DCMModel } from "../model_format/dcm_loader.js"

export class AnimationProjectPart {

    constructor(dom, animatorGetter) {
        this.animatorGetter = animatorGetter
        this.gifExporter = new GifExporter(animatorGetter)
        this.emptyAnimationList = dom.find('.animation-list-entry.empty-column')
        dom.find('.new-animation-button').click(() => this.createNewAnimationTab())
        dom.find('#animation-file-input').on('input', e => {
            [...e.target.files].forEach(async(file) => {
                let tab = this.createNewAnimationTab(file.name.substring(0, file.name.length - 4))
                let animator = this.animatorGetter()
                if(tab) {
                    let buffer = new ByteBuffer(await readFile(file))
                    tab.handler.readDCAFile(buffer)
                    tab.handler.keyframes.forEach(kf => tab.handler.createLayerInfo(kf.layer))
                    animator.keyframeManager.reframeKeyframes()
                }
            })
        })

        dom.find('#animation-tbl-files').on('input', async(e) => {
            let files = [...e.target.files]
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

                tab.handler.readFromTblFiles(result, info)
                tab.handler.keyframes.forEach(kf => tab.handler.createLayerInfo(kf.layer))
                animator.keyframeManager.reframeKeyframes()
            }
        })
    }

    createNewAnimationTab(name) {
        let animator = this.animatorGetter()
        if(animator) {
            let tab = animator.animationTabHandler.createNewTab()
            let element = tab.element

            let cloned = this.emptyAnimationList.clone()
            cloned.removeClass('empty-column')
            cloned.insertBefore(this.emptyAnimationList)
            
            let dom = $(cloned)

            if(name === undefined || name === null) {
                name = tab.name
            } else {
                tab.name = name
            }

            element.innerText = tab.name

            doubleClickToEdit(dom.find('.animation-name'), name => {
                tab.name = name
                element.innerText = name
            }, name)

            let handler = tab.handler
            dom.find('.download-animation-gif').click(() => this.gifExporter.onOpenModal(handler, tab.name))
            dom.find('.download-animation-file').click(() => {
                let buffer = new ByteBuffer()
                buffer.writeNumber(4)
                buffer.writeNumber(handler.keyframes.length)
                
                handler.keyframes.forEach(kf => {
                    buffer.writeNumber(kf.startTime)
                    buffer.writeNumber(kf.duration)
                    buffer.writeNumber(kf.layer)

                    buffer.writeNumber(kf.rotationMap.size)
                    kf.rotationMap.forEach((entry, name) => {
                        buffer.writeString(name)
                        buffer.writeNumber(entry[0])
                        buffer.writeNumber(entry[1])
                        buffer.writeNumber(entry[2])
                    })

                    buffer.writeNumber(kf.rotationPointMap.size)
                    kf.rotationPointMap.forEach((entry, name) => {
                        buffer.writeString(name)
                        buffer.writeNumber(entry[0])
                        buffer.writeNumber(entry[1])
                        buffer.writeNumber(entry[2])
                    })

                    buffer.writeNumber(kf.progressionPoints.length)
                    kf.progressionPoints.forEach(p => {
                        buffer.writeNumber(p.x)
                        buffer.writeNumber(p.y)
                    })
                })

                buffer.writeNumber(handler.events.length)
                handler.events.forEach(event => {
                    buffer.writeNumber(event.time)
                    buffer.writeNumber(event.data.length)
                    event.data.forEach(datum => {
                        buffer.writeString(datum.type)
                        buffer.writeString(datum.data)
                    })
                })
                buffer.downloadAsFile(tab.name + ".dca")
            })
            return tab
        }
    }

    //https://stackoverflow.com/a/1917041
    sharedStart(array){
        var A= array.concat().sort(), 
        a1= A[0], a2= A[A.length-1], L= a1.length, i= 0;
        while(i<L && a1.charAt(i)=== a2.charAt(i)) i++;
        return a1.substring(0, i);
    }

}