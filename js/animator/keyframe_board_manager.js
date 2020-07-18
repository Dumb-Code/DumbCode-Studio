import { PlayState } from "../animations.js"

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
                dom.find('.keyframe-container').html('') //Clear children
            })
            handler.keyframes.forEach(kf => {
                this.updateKeyFrame(kf, handler)
                this.getLayerDom(kf.layer).find('.keyframe-container').append(kf.element)
            })
        }
        
    }

    updateKeyFrame(kf) {
        if(kf.element === undefined) {
            console.log(colors[Math.min(Math.max(0 || kf.layer, 0), colors.length)])
            let color = colors[Math.min(Math.max(0 || kf.layer, 0), colors.length)]
            //<div class="keyframe"><div class="keypoint"></div></div>
            kf.element = document.createElement('div')
            kf.element.classList.add('keyframe')
            kf.element.style.backgroundColor = color[0]

            let point = document.createElement('div')
            point.classList.add('keypoint')
            point.style.backgroundColor = color[1]

            kf.element.appendChild(point)
        }

        let left = kf.startTime * pixelsPerTick
        kf.element.style.width = kf.duration * pixelsPerTick + "px"
        kf.element.style.left = left - this.scroll + "px"
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