import { PlayState } from "../animations.js"
import { onElementDrag } from "../util.js"

const sectionWidth = 20
const ticksPerSection = 1 
const pixelsPerTick = sectionWidth / ticksPerSection
const resolution = 10

export class KeyframeBoardManager {

    
    constructor(studio, keyframeBoard) {
        this.getHandler = () => studio.animationTabHandler.active
        this.playstate = new PlayState()
        this.elementDoms = new Map()

        this.layerConatiner = keyframeBoard.find('.keyframe-board-columns')
        this.emptyLayer = keyframeBoard.find('.empty-keyframe')

        this.playbackMarker = keyframeBoard.find('.keyframe-playback-marker')

        this.emptyPoint = keyframeBoard.find('.empty-event-point')
        this.eventPointBoard = keyframeBoard.find('.event-points-board')
        this.eventPointBoard.click(e => {
            let left = this.eventPointBoard.offset().left
            let time = (e.clientX - left + this.scroll) / pixelsPerTick

            let handler = this.getHandler()
            let newPoint = { time, data: [] }

            handler.events.push(newPoint)

            this.updateEventPoints()
        
        })

        this.emptyLayer.find('.kf-layer-add').click(() => {
            let info = this.getLayerInfo()
            if(info !== null) {
                this.getLayerDom(info.length)
            }
        })

        this.scroll = 0

        this.updateLables()
    }

    reframeKeyframes() {
        this.ensureFramePosition()
        let handler = this.getHandler();
        [...this.elementDoms.values()].forEach(d => d.detach())

        let info = this.getLayerInfo()

        if(handler != null && info !== null) {
            info.forEach(layer => {
                let dom = this.getLayerDom(layer.id)
                this.layerConatiner.append(dom)
                dom.find('.keyframe-container').css('background-position-x', -this.scroll + 'px').html('') //Clear children
                dom.find('.layer-text').text(layer.name)
            })
            handler.keyframes.forEach(kf => {
                this.updateKeyFrame(kf, handler)
                this.getLayerDom(kf.layer).find('.keyframe-container').append(kf.element)
            })
        }
        this.updateEventPoints()
    }

    //TODO: make an event modal that allows you to add events in a type:data format
    updateEventPoints() {
        this.eventPointBoard.html('')
        this.getHandler().events.forEach(evt => {
            if(evt.element === undefined) {
                evt.element = this.emptyPoint.clone()[0]
                evt.element.classList.remove('empty-event-point')
                onElementDrag(evt.element, () => evt.time, (dx, _, time) => {
                    evt.time = time + (dx / pixelsPerTick )
                    this.updateEventPoints()
                }, max => {
                    if(max < 2) {
                        let evts = this.getHandler().events
                        evts.splice(evts.indexOf(evt), 1)                        
                        this.updateEventPoints()
                    }
                })
            }
            evt.element.style.left = (evt.time * pixelsPerTick) - this.scroll - 8 + "px"
            this.eventPointBoard.append(evt.element)
        })
    }

    updateKeyFrame(kf) {
        if(kf.element === undefined) {
            kf.element = this.createKeyFrameElement(kf)
        }

        let color = (kf.layer * 64) % 360
        kf.element.style.backgroundColor = `hsl(${color}, 100%, 70%)`
        kf.element._keyframePointer.style.backgroundColor = `hsl(${color}, 100%, 50%)`

        let left = kf.startTime * pixelsPerTick
        kf.element.style.width = kf.duration * pixelsPerTick + "px"
        kf.element.style.left = left - this.scroll + "px"
    }

    createKeyFrameElement(kf) {
        let element = document.createElement('div')
        element.classList.add('keyframe')

        onElementDrag(element, () => kf.startTime, (dx, _dy, startTime, x, y) => {
            kf.startTime = startTime + ( dx / pixelsPerTick )
            this.updateKeyFrame(kf)

            let info = this.getLayerInfo()
            if(info !== null) {
                info.forEach(layer => {
                    let dom = this.getLayerDom(layer.id).get(0)
                    let rect = dom.getBoundingClientRect()

                    if(y >= rect.top && y <= rect.bottom && kf.layer !== layer.id) {
                        kf.layer = layer.id
                        this.reframeKeyframes()
                    }
                })
            }

        })

        let point = document.createElement('div')
        point.classList.add('keypoint')

        element._keyframePointer = point

        element.appendChild(point)
        return element
    }

    setupSelectedPose() {

    }

    getLayerInfo() {
        let handler = this.getHandler()
        if(handler === null) {
            return null
        }
        if(handler.keyframeInfo === undefined) {
            handler.keyframeInfo = []
        }
        return handler.keyframeInfo.sort((a, b) => a.id - b.id)
    }

    getLayerDom(layer) {
        let handler = this.getHandler()
        if(handler === null) {
            return null
        }
        if(!this.elementDoms.has(layer)) {
            this.createNewLayer(handler, layer)
        }
        return this.elementDoms.get(layer)
    }

    createNewLayer(handler, layer) {
        let newKF = this.emptyLayer.clone()[0]
        newKF.classList.remove('empty-keyframe')
        let dom = $(newKF)

        let info = this.getLayerInfo()
        if(info === null) {
            return
        }
        if(info.some(l => l.id == layer)) {
            console.warn("Tried to create a layer that already existed: " + layer)
            return
        }

        this.elementDoms.set(layer, dom)

        let data = { 
            id: layer, 
            name: `Layer ${layer}` 
        }
        info.push(data)
    
        onElementDrag(dom.find('.keyframe-container').get(0), () => this.scroll, (dx, _, scroll) => {
            this.scroll = Math.max(scroll - dx, 0)
            this.reframeKeyframes()
        })

        let layerText = dom.find('.layer-text-edit')

        dom.find('.layer-name').dblclick(() => {
            newKF.classList.add('is-editing')
            layerText.val(data.name)
            layerText.select()
        })
        layerText
            .on('input', e => {
                data.name = e.target.value
                dom.find('.layer-text').text(data.name)
            })
            .focusout(() => newKF.classList.remove('is-editing'))
            .keyup(e => {
                if(e.key === "Enter") {
                    newKF.classList.remove('is-editing')
                }
            })

        dom.find('.kf-layer-add').click(() => {
            let kf = handler.createKeyframe()
            kf.duration = 5
            kf.layer = layer
            kf.startTime = this.playstate.ticks
            handler.keyframes.push(kf)
            handler.keyframesDirty()
            this.reframeKeyframes()
            // kf.selectChange(true)
        })

        this.reframeKeyframes()

    }

    ensureFramePosition() {

    }

    updateLables() {
        //Update them labels
    }


}