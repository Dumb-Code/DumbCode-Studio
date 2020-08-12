import { readFile } from "./displays.js"
import { ByteBuffer } from "./animations.js"

export class FilesPage { 

    constructor(dom, modellingGetter, animatorGetter) {
        this.animatorGetter = animatorGetter
        this.empty = dom.find('.animation-list-entry.empty-column')
        dom.find('.new-animation-button').click(() => this.createNewAnimationTab())

        dom.find('#animation-file-input').on('input', e => {
            [...e.target.files].filter(f => f.name.endsWith('.dca')).forEach(async(file) => {
                let tab = this.createNewAnimationTab(file.name.substring(0, file.name.length - 4))
                let animator = this.animatorGetter()
                if(tab) {
                    let buffer = new ByteBuffer(await readFile(file, (reader, file) => reader.readAsArrayBuffer(file)))
                    tab.handler.keyframes = tab.handler.readDCAFile(buffer)
                    console.log(tab.handler.keyframes)
                    tab.handler.keyframes.forEach(kf => tab.handler.createLayerInfo(kf.layer))
                    animator.keyframeManager.reframeKeyframes()
                }
            })
        })        
    }

    createNewAnimationTab(name) {
        let animator = this.animatorGetter()
        if(animator) {
            let tab = animator.animationTabHandler.createNewTab()
            let element = tab.element

            let cloned = this.empty.clone()
            cloned.removeClass('empty-column')
            cloned.insertBefore(this.empty)
            
            let dom = $(cloned)
            let animationNameContainer = dom.find('.animation-name-container')
            let animationName = dom.find('.animation-name')
            let animationNameEdit = dom.find('.animation-name-edit')


            if(name === undefined || name === null) {
                name = tab.name
            } else {
                tab.name = name
            }

            animationName.text(tab.name)
            element.innerText = tab.name

            animationNameContainer.dblclick(() => {
                animationNameContainer.addClass('is-editing')
                animationNameEdit.val(tab.name)
                animationNameEdit.select()
            })
            animationNameEdit
                .on('input', e => {
                    tab.name = e.target.value
                    element.innerText = tab.name
                    animationName.text(tab.name)
                })
                .focusout(() => animationNameContainer.removeClass('is-editing'))
                .keyup(e => {
                    if(e.key === "Enter") {
                        animationNameContainer.removeClass('is-editing')
                    }
                })

            let handler = tab.handler
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
                buffer.downloadAsFile(tab.name + ".dca")
            })
            return tab
        }
    }

    runFrame() {

    }

    setActive() {
        
    }

    setUnactive() {
        
    }
}