import { PlayState } from "../animations.js"
import { onElementDrag } from "../util.js"

const sectionWidth = 20
const ticksPerSection = 1 
const pixelsPerTick = sectionWidth / ticksPerSection
const resolution = 10

//todo: generate color based of ID
const colors = [
    ['#5096f2', '#0081e3'],
    ['#78e673', '#34de2c'],
    ['#fae37d', '#ffcc24'],
    ['#ed7261', '#cc422f']
]

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
                onElementDrag(evt.element, () => evt.time, (dx, time) => {
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
            evt.element.style.left = (evt.time * pixelsPerTick) - this.scroll + "px"
            this.eventPointBoard.append(evt.element)
        })
    }

    updateKeyFrame(kf) {
        if(kf.element === undefined) {
            kf.element = this.createKeyFrameElement(kf)
        }

        let left = kf.startTime * pixelsPerTick
        kf.element.style.width = kf.duration * pixelsPerTick + "px"
        kf.element.style.left = left - this.scroll + "px"
    }

    createKeyFrameElement(kf) {
        let color = colors[Math.min(Math.max(0 || kf.layer, 0), colors.length)]
        let element = document.createElement('div')
        element.classList.add('keyframe')
        element.style.backgroundColor = color[0]

        onElementDrag(element, () => kf.startTime, (dx, startTime) => {
            kf.startTime = startTime + ( dx / pixelsPerTick )
            this.updateKeyFrame(kf)
        })

        let point = document.createElement('div')
        point.classList.add('keypoint')
        point.style.backgroundColor = color[1]

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

        let info = this.getLayerInfo()
        if(info === null) {
            return
        }
        if(info.some(l => l.id == layer)) {
            console.warn("Tried to create a layer that already existed: " + layer)
            return
        }

        this.elementDoms.set(layer, $(newKF))

        info.push( { 
            id: layer, 
            name: `Layer ${layer}` 
        } )
    
        onElementDrag($(newKF).find('.keyframe-container').get(0), () => this.scroll, (dx, scroll) => {
            this.scroll = Math.max(scroll - dx, 0)
            this.reframeKeyframes()
        })

        $(newKF).find('.kf-layer-add').click(() => {
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