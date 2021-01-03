import { PlayState } from "../animations.js"
import { onElementDrag, doubleClickToEdit } from "../util.js"

const secondsPerSection = 0.05
const defaultSectionWidth = 20
const resolution = 10

/**
 * Handles the keyframe board manager. 
 * 
 * Note this class is very busy and should probally be split up into seperate classes.
 */
export class KeyframeBoardManager {
    
    constructor(studio, keyframeBoard, playbackRange) {
        //Helper methods
        this.getHandler = () => studio.pth.animationTabs.active
        this.selectKeyframe = keyframe => studio.selectKeyframe(keyframe)
        this.openKeyframeSetings = data => studio.keyframeSettings.open(data, () => {
            //Update the keyframe layer settings
            if(data.definedMode !== true) {
                this.getHandler().removeDefinedLayers(data.id)
            }
        })
        this.updateKeyframeSelected = () => studio.cubeDisplayValues.updateKeyframeSelected()

        //The playstate for the board. @todo remove this as it always gets overriden anyway.
        this.playstate = new PlayState()
        this.elementDoms = new Map()

        //Get the doms for the layer layer container and the keyframe template
        this.layerConatiner = keyframeBoard.find('.keyframe-board-columns')
        this.emptyLayer = keyframeBoard.find('.empty-keyframe')

        //Sets up the srubbing playback marker data. When dragged, the user will be able to see the animation play
        this.scrubbingPlaybackMarker = false
        this.playbackMarker = keyframeBoard.find('.keyframe-playback-marker')
        onElementDrag(this.playbackMarker.get(0), () => this.scrubbingPlaybackMarker = true, (_dx, _dy, _info, x) => {
            let marker = x - 257; //Shouldn't be a constant number and should be based on dom elements.

            let conatainerWidth = this.eventPointBoard.width()

            if(marker < 0) {
                marker = 0
            }
            if(marker > conatainerWidth) {
                marker = conatainerWidth
            }
            
            this.playstate.ticks = (marker + this.scroll) / this.pixelsPerSecond
        }, () => this.scrubbingPlaybackMarker = false)
        //Also applies to the range slider.
        playbackRange
        .mousedown(() => this.scrubbingPlaybackMarker = true)
        .mouseup(() => this.scrubbingPlaybackMarker = false)
        
        //Editing point is the event point being edited.
        this.editingPoint = null

        //The loop data doms. This is the visual elements you can drag to change the start and end time
        this.loopContainer = keyframeBoard.find('.keyframe-loop-conatiner')
        this.loopMiddleLine = keyframeBoard.find('.keyframe-middle')
        //When the start point is dragged, set the start point
        onElementDrag(keyframeBoard.find('.keyframe-loop-start').get(0), () => this.getHandler()?.loopData?.start, (dx, _, start) => {
            if(start === undefined) {
                return
            }
            this.getHandler().loopData.start = start + (dx / this.pixelsPerSecond )
            this.getHandler().updateLoopKeyframe()
            studio.cubeDisplayValues.updateLoopedElements()
            this.updateLoopedElements()
        })
        //When the end point is dragged, set the end point
        onElementDrag(keyframeBoard.find('.keyframe-loop-end').get(0), () => this.getHandler()?.loopData?.end, (dx, _, start) => {
            if(start === undefined) {
                return
            }
            this.getHandler().loopData.end = start + (dx / this.pixelsPerSecond )
            this.getHandler().updateLoopKeyframe()
            studio.cubeDisplayValues.updateLoopedElements()
            this.updateLoopedElements()
        })

        //The event point template
        this.emptyPoint = keyframeBoard.find('.empty-event-point')
        //The event point board. When clicked should create a new event and edit it.
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

        //When the add layer button is clicked, add a new layer.
        //Maybe also add a keyframe too?
        this.emptyLayer.find('.kf-layer-add').click(() => {
            let info = this.getLayerInfo()
            if(info !== null) {
                let layer = info.length
                this.getLayerDom(layer)
                this.getHandler()?.ensureLayer(layer)
                this.reframeKeyframes()
            }
        })

        //Sets the scroll to be 0
        this.scroll = 0

        //Update the default stuff
        this.updateLables()
        this.waitAndSetEventModal()
    }

    /**
     * Gets the pixels per second. This changes depending on the handler selected and how zoomed in it is.
     */
    get pixelsPerSecond() {
        let handler = this.getHandler()
        if(handler._pixelsPerSecond === undefined) {
            handler._pixelsPerSecond = defaultSectionWidth / secondsPerSection
        }
        return handler._pixelsPerSecond
    }

    /**
     * Updates the zoomed amount of the keyframe.
     * @param {number} multiplier 
     * @param {*} mouseX 
     */
    updateZoomIn(multiplier = 1, mouseX = 0) {
        let handler = this.getHandler()
        if(handler !== null) {
            //Get the width of a single section.
            //A section is defined as 0.05s, which by default is 20px.
            let width
            if(handler._sectionWidth === undefined) {
                width = defaultSectionWidth * multiplier
            } else {
                width = handler._sectionWidth * multiplier
            }

            //The amount of pixels per second
            let newPixelsPerSecond = width / secondsPerSection
            
            //Updates the scroll so that the mouseX position is kept constant.
            //Essentially zooms into where the mouse is
            let pixelPoint = this.scroll+mouseX
            let secondsPoint = pixelPoint/this.pixelsPerSecond
            let newPixelPoint = secondsPoint*newPixelsPerSecond
            let changeInPixles = newPixelPoint - pixelPoint

            //Update the scroll and make sure it doesn't go below 0
            this.scroll += changeInPixles
            if(this.scroll < 0) {
                this.scroll = 0
            }

            //Update the handler varibles.
            handler._sectionWidth = width
            handler._pixelsPerSecond = newPixelsPerSecond

            //Update all the layer backgrounds, and reframe the keyframes.
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

    /**
     * Edits the eventpoint data. Opens the modal
     * @param {*} point the eventpoint data to edit
     */
    editEventPoint(point) {
        this.editingPoint = point

        this.eventPointList.html('') //clear
        point.data.forEach(d => this.createEventListEntry(d))

        openModal('animator/eventpoint')
    }

    /**
     * Creates and appends a DOM, binded to the eventpoint data.
     * @param {*} data the data to bind to.
     */
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

    /**
     * Waits and sets the event point modal dom elements.
     */
    async waitAndSetEventModal() {
        let dom = $(await getModal('animator/eventpoint'))
        this.emptyEventEntry = dom.find('.empty-entry')
        this.eventPointList = dom.find('.event-point-list')

        //Create a new event entry
        dom.find('.add-event').click(() => {
            let data = { type:"", data:"" }
            this.editingPoint.data.push(data)
            this.createEventListEntry(data)
        })
        //Delete the event point. Removes all the elements.
        dom.find('.remove-event').click(() => {
            let evts = this.getHandler().events
            evts.splice(evts.indexOf(this.editingPoint), 1)     
            this.updateEventPoints()
        })
    }

    /**
     * Updates all dom elements. This includes
     *  - the keyframe element positions/scale ect
     *  - the looped element data
     *  - the scrubbing scroll bar (if reframeFramePosition is true)
     *  - event point marker positions.
     * @param {boolean} reframeFramePosition Whether to update the frame position too
     */
    reframeKeyframes(reframeFramePosition = true) {
        if(reframeFramePosition === true) {
            this.ensureFramePosition()
        }
        //Update the looped elements
        this.updateLoopedElements()


        let handler = this.getHandler();
        [...this.elementDoms.values()].forEach(d => d.detach())

        let info = this.getLayerInfo()
        if(handler != null && info !== null) {
            //For each keyframe, ensure that there is a layerdom for that keyframe layer id.
            handler.keyframes.forEach(kf => this.getLayerDom(kf.layer))
            info.forEach(layer => {
                //Update the layer name and background position x (affected by the sccroll)
                let dom = this.getLayerDom(layer.id)
                this.layerConatiner.append(dom)
                dom.find('.keyframe-container').css('background-position-x', -this.scroll + 'px').html('') //Clear children
                dom.find('.layer-name .dbl-text').text(layer.name)
            })
            //For every keyframe, append the keyframe dom element to the layer dom.
            handler.keyframes.forEach(kf => {
                this.updateKeyFrame(kf, handler)
                this.getLayerDom(kf.layer).find('.keyframe-container').append(kf.element)
            })
        }
        //Update the eventpoints
        this.updateEventPoints()
    }

    /**
     * Update the looped elements. 
     */
    updateLoopedElements() {
        let handler = this.getHandler()
        if(handler !== null && handler.loopData !== null) {
            this.loopContainer.css('display', '').css('left', handler.loopData.start*this.pixelsPerSecond - this.scroll)
            this.loopMiddleLine.css('width', (handler.loopData.end-handler.loopData.start)*this.pixelsPerSecond)
        } else {
            this.loopContainer.css('display', 'none')
        }
    }

    /**
     * Update the event point dom elements.
     */
    updateEventPoints() {
        //Remove all the non persistant elements, then re-create the elements.
        //@todo in the future, cache the creates elements.
        this.eventPointBoard.children().not('.board-persistent').detach()
        this.getHandler()?.events?.forEach(evt => {
            if(evt.element === undefined) {
                evt.element = this.emptyPoint.clone()[0]
                evt.element.classList.remove('empty-event-point')
                //When dragged, move the element and update it. If when released, the mouse has moved by less than 2px, edit it
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

    /**
     * Update the keyframe dom element. 
     * Updates it's color, left position and width.
     * @param {Keyframe} kf 
     */
    updateKeyFrame(kf) {
        if(kf.element === undefined) {
            kf.element = this.createKeyFrameElement(kf)
        }
        
        let selected = this.getHandler().selectedKeyFrame === kf
        let lightnessMain = selected ? 25 : 70 
        let lightnessPointer = selected ? 10 : 50 

        //@todo: maybe make it so the layer color is defined by the layer.
        let color = (kf.layer * 64) % 360
        kf.element.style.backgroundColor = `hsl(${color}, 100%, ${lightnessMain}%)`
        kf.element._keyframePointer.style.backgroundColor = `hsl(${color}, 100%, ${lightnessPointer}%)`

        let left = kf.startTime * this.pixelsPerSecond
        kf.element.style.width = kf.duration * this.pixelsPerSecond + "px"
        kf.element.style.left = left - this.scroll + "px"
    }

    /**
     * Creates the keyframe element and binds it to the keyframe
     * @param {Keyframe} kf the keyframe to bind to
     */
    createKeyFrameElement(kf) {
        let element = document.createElement('div')
        element.classList.add('keyframe')

        onElementDrag(element, () => kf.startTime, (dx, _dy, startTime, _x, y) => {
            //When the keyframe is dragged, move it horozontally.
            kf.startTime = startTime + ( dx / this.pixelsPerSecond )
            this.updateKeyframeSelected()
            this.updateKeyFrame(kf)

            //If the keyframe is moved vertically, then also update that.
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
            //Toggle selection of the keyframe if the mouse hasn't moved 2px
            if(max < 2) {
                this.selectKeyframe(this.getHandler().selectedKeyFrame === kf ? undefined : kf)
            } 
        })

        //Create the keyframe point element. This is the dot at the right.
        let point = document.createElement('div')
        point.classList.add('keypoint')
        element._keyframePointer = point
        element.appendChild(point)

        return element
    }

    /**
     * Sets the forced animation ticks.
     * Essentially, sets the forced animation ticks to be the end of the selected keyframe if the following is true:
     *  - there is an animation and keyframe selected
     *  - the playstate isn't playing
     *  - scrubbingPlaybackMarker is false, meaning the user isn't scrubbing the playback marker
     */
    setForcedAniamtionTicks() {
        let handler = this.getHandler()
        if(handler !== null && handler.selectedKeyFrame && !this.playstate.playing && !this.scrubbingPlaybackMarker) {
            handler.forcedAnimationTicks = handler.selectedKeyFrame.startTime + handler.selectedKeyFrame.duration
            return
        }
        handler.forcedAnimationTicks = null
    }

    /**
     * Gets the layer info for the selected animation handler, sorted by layer id
     */
    getLayerInfo() {
        let handler = this.getHandler()
        if(handler === null) {
            return null
        }
        return handler.keyframeInfo.sort((a, b) => a.id - b.id)
    }

    /**
     * Gets the layer dom for the selcted layer id. Note this is shared between projects.
     * Returns null if there is no animation selected.
     * @param {number} layer the layer id
     */
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

    /**
     * Creates a new animation layer dom. 
     * @param {number} layer the layer id 
     */
    createNewLayer(layer) {
        //Clone the layer dom and remove the template class
        let newKF = this.emptyLayer.clone()[0]
        newKF.classList.remove('empty-keyframe')
        let dom = $(newKF)

        this.elementDoms.set(layer, dom)

        //Helper method
        let dataGetter = () => this.getHandler()?.ensureLayer(layer)
    
        //When the background is dragged, scroll the board.
        onElementDrag(dom.find('.keyframe-container').get(0), () => this.scroll, (dx, _, scroll) => {
            this.scroll = Math.max(scroll - dx, 0)
            this.reframeKeyframes()
        })

        //Setup the name element to be double clicked to edit.
        doubleClickToEdit(dom.find('.layer-name-container'), v => {
            let data = dataGetter()
            if(data !== null) {
                data.name = v
            }
        }, dataGetter()?.name)

      
        //When the add button is clicked, create a keyframe with width 0.25s
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

        //When the visibility button is toggled, set that in the handler layer info
        let layerVisible = dom.find('.kf-layer-visible')
        layerVisible.click(() => {
            let data = dataGetter()
            if(data === null) {
                return
            }
            data.visible = !data.visible
            layerVisible.find('.icon-symbol').toggleClass('fa-eye', data.visible).toggleClass('fa-eye-slash', !data.visible)
        })

        //When the lock button is toggled, set that in the handler layer info
        let layerLocked = dom.find('.kf-layer-lock')
        layerLocked.click(() => {
            let data = dataGetter()
            if(data === null) {
                return
            }
            data.locked = !data.locked
            layerLocked.find('.icon-symbol').toggleClass('fa-lock', data.locked).toggleClass('fa-lock-open', !data.locked)
        })

        //When the board is scrolled on, zoom in onto the mouse
        let keyContainer = dom.find('.keyframe-container')
        keyContainer.bind('mousewheel DOMMouseScroll', e => {
            let direction = e.originalEvent.wheelDelta
            let amount = 1.1
            if(direction === undefined) { //Firefox >:(
                direction = -e.detail
            }
            this.updateZoomIn(direction < 0 ? 1/amount : amount, e.clientX - keyContainer.offset().left)
            e.preventDefault()
            e.stopPropagation()
        })

        //When the settings button is clicked open the layer settings
        dom.find('.kf-layer-settings').click(() => this.openKeyframeSetings(dataGetter()))

        //Updates the background data and keyframe dom data.
        this.updateZoomIn()
    }

    /**
     * Ensure that the playback marker is in the right position.
     */
    ensureFramePosition() {
        //If there is no animation, then hide it 
        if(this.getHandler() === null) {
            this.playbackMarker.css('display', 'none')
            return
        }

        //If visibleTicks isn't null use that. Otherwise use normal ticks.
        let ticks = this.playstate.visibleTicks !== null ? this.playstate.visibleTicks : this.playstate.ticks
        let left = this.scroll / this.pixelsPerSecond

        let conatainerWidth = this.eventPointBoard.width()
        let ticksInContainer = conatainerWidth / this.pixelsPerSecond

        let xpos
        //If the playstate is playing and the position is outside the screen, we need to update the scroll to be at the playback marker.
        if(this.playstate.playing && (ticks < left || ticks > left + ticksInContainer)) {
            this.scroll = ticks * this.pixelsPerSecond
            this.updateScroll()
            xpos = 0
        } else {
            xpos = (ticks - left) / ticksInContainer
        }
        
        //Update the playback marker position and the tooltip
        this.playbackMarker.css('display', xpos < 0 || xpos > 1 ? 'none' : 'unset').css('left', (255 + (xpos * conatainerWidth)) + "px")
        let rounded = Math.round(ticks * 100) / 100;
        this.playbackMarker.attr('data-tooltip', `${rounded} seconds`)
    }

    /**
     * Called when the scroll is changed.
     */
    updateScroll() {
        this.updateLables()
        this.reframeKeyframes(false)
    }

    /**
     * Update the lables. Still not done
     */
    updateLables() {
        //Update them labels
    }


}