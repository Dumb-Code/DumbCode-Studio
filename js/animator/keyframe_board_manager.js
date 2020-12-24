import { PlayState } from "../animations.js"
import { onElementDrag, doubleClickToEdit } from "../util.js"

const secondsPerSection = 0.05
const defaultSectionWidth = 20
const resolution = 10

export class KeyframeBoardManager {
    
    constructor(studio, keyframeBoard, sliders) {
        this.getHandler = () => studio.pth.animationTabs.active
        this.selectKeyframe = keyframe => studio.selectKeyframe(keyframe)
        this.openKeyframeSetings = data => studio.keyframeSettings.open(data, () => {
            if(data.definedMode !== true) {
                this.getHandler().removeDefinedLayers(data.id)
            }
        })
        this.playstate = new PlayState()
        this.elementDoms = new Map()

        this.updateKeyframeSelected = () => studio.cubeDisplayValues.updateKeyframeSelected()

        this.layerConatiner = keyframeBoard.find('.keyframe-board-columns')
        this.emptyLayer = keyframeBoard.find('.empty-keyframe')

        this.scrubbingPlaybackMarker = false
        this.playbackMarker = keyframeBoard.find('.keyframe-playback-marker')
        onElementDrag(this.playbackMarker.get(0), () => this.scrubbingPlaybackMarker = true, (_dx, _dy, _info, x) => {
            let marker = x - 257;

            let conatainerWidth = this.eventPointBoard.width()

            if(marker < 0) {
                marker = 0
            }
            if(marker > conatainerWidth) {
                marker = conatainerWidth
            }
            
            this.playstate.ticks = (marker + this.scroll) / this.pixelsPerSecond
        }, () => this.scrubbingPlaybackMarker = false)

        sliders
        .mousedown(() => this.scrubbingPlaybackMarker = true)
        .mouseup(() => this.scrubbingPlaybackMarker = false)
        
        this.editingPoint = null
        this.emptyPoint = keyframeBoard.find('.empty-event-point')
        this.eventPointBoard = keyframeBoard.find('.event-points-board')
        this.eventPointBoard.click(e => {
            let handler = this.getHandler()
            if(e.target !== this.eventPointBoard.get(0) || handler === null) {
                return
            }
            let left = this.eventPointBoard.offset().left
            let time = (e.clientX - left + this.scroll) / this.pixelsPerSecond

            let newPoint = { time, data: [] }

            this.editEventPoint(newPoint)
            handler.events.push(newPoint)

            this.updateEventPoints()
        
        })

        this.emptyLayer.find('.kf-layer-add').click(() => {
            let info = this.getLayerInfo()
            if(info !== null) {
                let layer = info.length
                this.getLayerDom(layer)
                this.getHandler()?.ensureLayer(layer)

                this.reframeKeyframes()
            }
        })

        this.scroll = 0

        this.updateLables()

        this.waitAndSetEventModal()
    }

    get pixelsPerSecond() {
        let handler = this.getHandler()
        if(handler._pixelsPerSecond === undefined) {
            handler._pixelsPerSecond = defaultSectionWidth / secondsPerSection
        }
        return handler._pixelsPerSecond
    }

    addSectionWidth(multiplier = 1, mouseX = 0) {
        let handler = this.getHandler()
        if(handler !== null) {
            let width
            if(handler._sectionWidth === undefined) {
                width = defaultSectionWidth * multiplier
            } else {
                width = handler._sectionWidth * multiplier
            }

            let hw = this.eventPointBoard.width() / 2
            let newPixelsPerSecond = width / secondsPerSection


            this.scroll = (hw+mouseX)*newPixelsPerSecond/this.pixelsPerSecond - hw
            if(this.scroll < 0) {
                this.scroll = 0
            }

            handler._sectionWidth = width
            handler._pixelsPerSecond = newPixelsPerSecond

            this.getLayerInfo().forEach(layer => {
                this.getLayerDom(layer.id).find('.keyframe-container')
                    .css('background', 
                    `repeating-linear-gradient(90deg, 
                        #363636  0px,
                        #363636  ${width}px,
                        #4A4A4A  ${width}px,
                        #4A4A4A  ${2*width}px)`)
                    .css('background-size', `${2*width}px`)
            })
            this.reframeKeyframes()
        }
    }

    editEventPoint(point) {
        this.editingPoint = point

        this.eventPointList.html('') //clear
        point.data.forEach(d => this.createEventListEntry(d))

        openModal('animator/eventpoint')
    }

    createEventListEntry(data) {
        let dom = this.emptyEventEntry.clone()
        dom.removeClass('empty-entry')
        dom.find('.edit-type').val(data.type).on('input', e => data.type = e.target.value)
        dom.find('.edit-data').val(data.data).on('input', e => data.data = e.target.value)
        this.eventPointList.append(dom)

        dom.find('.delete-event').click(() => {
            dom.detach()
            this.editingPoint.data = this.editingPoint.data.filter(d => d !== data)
        })
    }

    async waitAndSetEventModal() {
        let dom = $(await getModal('animator/eventpoint'))
        this.emptyEventEntry = dom.find('.empty-entry')
        this.eventPointList = dom.find('.event-point-list')

        dom.find('.add-event').click(() => {
            let data = { type:"", data:"" }
            this.editingPoint.data.push(data)
            this.createEventListEntry(data)
        })
        dom.find('.remove-event').click(() => {
            let evts = this.getHandler().events
            evts.splice(evts.indexOf(this.editingPoint), 1)     
            this.updateEventPoints()
        })
    }

    reframeKeyframes(reframeFramePosition = true) {
        if(reframeFramePosition === true) {
            this.ensureFramePosition()
        }
        let handler = this.getHandler();
        [...this.elementDoms.values()].forEach(d => d.detach())

        let info = this.getLayerInfo()

        if(handler != null && info !== null) {
            handler.keyframes.forEach(kf => this.getLayerDom(kf.layer))
            info.forEach(layer => {
                let dom = this.getLayerDom(layer.id)
                this.layerConatiner.append(dom)
                dom.find('.keyframe-container').css('background-position-x', -this.scroll + 'px').html('') //Clear children
                dom.find('.layer-name .dbl-text').text(layer.name)
            })
            handler.keyframes.forEach(kf => {
                this.updateKeyFrame(kf, handler)
                this.getLayerDom(kf.layer).find('.keyframe-container').append(kf.element)
            })
        }
        this.updateEventPoints()
    }

    updateEventPoints() {
        this.eventPointBoard.html('')
        this.getHandler()?.events?.forEach(evt => {
            if(evt.element === undefined) {
                evt.element = this.emptyPoint.clone()[0]
                evt.element.classList.remove('empty-event-point')
                onElementDrag(evt.element, () => evt.time, (dx, _, time) => {
                    evt.time = time + (dx / this.pixelsPerSecond )
                    this.updateEventPoints()
                }, max => {
                    if(max < 2) {
                        this.editEventPoint(evt)
                    }
                })
            }
            evt.element.style.left = (evt.time * this.pixelsPerSecond) - this.scroll - 8 + "px"
            this.eventPointBoard.append(evt.element)
        })
    }

    updateKeyFrame(kf) {
        if(kf.element === undefined) {
            kf.element = this.createKeyFrameElement(kf)
        }
        
        let selected = this.getHandler().selectedKeyFrame === kf
        let lightnessMain = selected ? 25 : 70 
        let lightnessPointer = selected ? 10 : 50 

        let color = (kf.layer * 64) % 360
        kf.element.style.backgroundColor = `hsl(${color}, 100%, ${lightnessMain}%)`
        kf.element._keyframePointer.style.backgroundColor = `hsl(${color}, 100%, ${lightnessPointer}%)`

        let left = kf.startTime * this.pixelsPerSecond
        kf.element.style.width = kf.duration * this.pixelsPerSecond + "px"
        kf.element.style.left = left - this.scroll + "px"
    }

    createKeyFrameElement(kf) {
        let element = document.createElement('div')
        element.classList.add('keyframe')

        onElementDrag(element, () => kf.startTime, (dx, _dy, startTime, _x, y) => {
            kf.startTime = startTime + ( dx / this.pixelsPerSecond )
            this.updateKeyframeSelected()
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
        }, max => {
            if(max < 2) {
                this.selectKeyframe(this.getHandler().selectedKeyFrame === kf ? undefined : kf)
            } 
        })

        let point = document.createElement('div')
        point.classList.add('keypoint')

        element._keyframePointer = point

        element.appendChild(point)
        return element
    }

    setupSelectedPose() {
        let handler = this.getHandler()
        if(handler !== null) {
            if(handler.selectedKeyFrame && !this.playstate.playing && !this.scrubbingPlaybackMarker) {
                handler.forcedAnimationTicks = handler.selectedKeyFrame.startTime + handler.selectedKeyFrame.duration
                return
            }
        }
        handler.forcedAnimationTicks = null
    }

    getLayerInfo() {
        let handler = this.getHandler()
        if(handler === null) {
            return null
        }
        return handler.keyframeInfo.sort((a, b) => a.id - b.id)
    }

    getLayerDom(layer) {
        let handler = this.getHandler()
        if(handler === null) {
            return null
        }
        if(!this.elementDoms.has(layer)) {
            this.createNewLayer(layer)
        }
        return this.elementDoms.get(layer)
    }

    createNewLayer(layer) {
        let newKF = this.emptyLayer.clone()[0]
        newKF.classList.remove('empty-keyframe')
        let dom = $(newKF)

        this.elementDoms.set(layer, dom)

        let dataGetter = () => this.getHandler()?.ensureLayer(layer)
    
        onElementDrag(dom.find('.keyframe-container').get(0), () => this.scroll, (dx, _, scroll) => {
            this.scroll = Math.max(scroll - dx, 0)
            this.reframeKeyframes()
        })

        doubleClickToEdit(dom.find('.layer-name-container'), v => {
            let data = dataGetter()
            if(data !== null) {
                data.name = v
            }
        }, dataGetter()?.name)

      
        dom.find('.kf-layer-add').click(() => {
            let handler = this.getHandler()
            if(handler === null) {
                return
            }
            let kf = handler.createKeyframe()
            kf.duration = 0.25
            kf.layer = layer
            kf.startTime = this.playstate.ticks
            this.reframeKeyframes()
            this.selectKeyframe(kf)
        })

        let layerVisible = dom.find('.kf-layer-visible')
        layerVisible.click(() => {
            let data = dataGetter()
            if(data === null) {
                return
            }
            data.visible = !data.visible
            layerVisible.find('.icon-symbol').toggleClass('fa-eye', data.visible).toggleClass('fa-eye-slash', !data.visible)
        })

        let layerLocked = dom.find('.kf-layer-lock')
        layerLocked.click(() => {
            let data = dataGetter()
            if(data === null) {
                return
            }
            data.locked = !data.locked
            layerLocked.find('.icon-symbol').toggleClass('fa-lock', data.locked).toggleClass('fa-lock-open', !data.locked)
        })

        let keyContainer = dom.find('.keyframe-container')
        keyContainer.bind('mousewheel DOMMouseScroll', e => {
            let direction = e.originalEvent.wheelDelta
            let amount = 1.1
            if(direction === undefined) { //Firefox >:(
                direction = -e.detail
            }


            this.addSectionWidth(direction < 0 ? 1/amount : amount, e.clientX - 255)
        })

        dom.find('.kf-layer-settings').click(() => this.openKeyframeSetings(dataGetter()))

        this.addSectionWidth()
    }

    ensureFramePosition() {
        let ticks = this.playstate.ticks
        let left = this.scroll / this.pixelsPerSecond

        let conatainerWidth = this.eventPointBoard.width()
        let ticksInContainer = conatainerWidth / this.pixelsPerSecond

        let xpos = 0
        //Not on screen, we need to move screen to fit
        if(this.playstate.playing && (ticks < left || ticks > left + ticksInContainer)) {
            this.scroll = ticks * this.pixelsPerSecond
            this.updateScroll()
        } else {
            xpos = (ticks - left) / ticksInContainer
        }
        
        this.playbackMarker.css('display', xpos < 0 || xpos > 1 ? 'none' : 'unset').css('left', (255 + (xpos * conatainerWidth)) + "px")

        let rounded = Math.round(ticks * 10) / 10;
        this.playbackMarker.attr('data-tooltip', `${rounded} seconds`)
    }

    updateScroll() {
        this.updateLables()
        this.reframeKeyframes(false)
    }

    updateLables() {
        //Update them labels
    }


}