import { JavaMethodExporter } from '../java_method_exporter.js'
import { Clock, EventDispatcher, Group } from '../three.js'
import { Gumball } from './gumball.js'
import { AnimationPanel } from './animation_panel.js'
import { AnimationCubeValues } from './animation_cube_values.js'
import { PanelButtons } from './panel_buttons.js'
import { ProgressionCanvas } from './progression_canvas.js'
import { KeyframeBoardManager } from './keyframe_board_manager.js'
import { applyAdjustScrollable } from '../util.js'
import { KeyframeSettings } from './keyframe_settings.js'
import { DinosaurDisplay } from '../displays.js'
import { Raytracer } from '../raytracer.js'

/**
 * Ties all the animation studio together.
 * Most of the stuff on the animation page will be handled in here.
 */
export class AnimationStudio {

    /**
     * 
     * @param {*} domElement The texture studio jquery dom
     * @param {Raytracer} raytracer the studio raytracer
     * @param {DinosaurDisplay} display the display for the studio
     * @param {*} pth the tab handler for the studio
     */
    constructor(domElement, raytracer, display, pth) {
        this.domElement = domElement
        let dom  = $(domElement)
        this.raytracer = raytracer
        this.pth = pth
    
        //The local used group for the studio. Automatically added/removed when switched to/from
        this.group = new Group()

        //The elements needing cube selection.
        this.selectedRequired = dom.find('.editor-require-selected')
        //Update the selction required property when the selction is changed.
        this.raytracer.addEventListener('selectchange', () => {
            let isSelected = this.raytracer.selectedSet.size === 1
            this.selectedRequired.prop("disabled", !isSelected).toggleClass("is-active", isSelected)
        })

        //Set the reference to the tab container. Needed for the aniamtion tab handler.
        this._tabContainer = dom.find('.tab-container')
        //Add a new tab when the button is clicked.
        dom.find('.tab-add').click(() => pth.animationTabs.initiateNewTab())

        //Create the animation studio local transform controls
        this.transformControls = display.createTransformControls()
        this.group.add(this.transformControls)
        
        //Instantiate all the texture studio stuff.
        //Note that some stuff relies on other stuff, so it being in this order is important.
        this.gumball = new Gumball(dom, this)
        this.animationPanel = new AnimationPanel(dom)
        this.cubeDisplayValues = new AnimationCubeValues(dom, this)
        this.keyframeManager = new KeyframeBoardManager(this, dom.find('.keyframe-board'), dom.find('.input-playback-range'))
        this.keyframeSettings = new KeyframeSettings()
        this.panelButtons = new PanelButtons(dom, this)
        this.display = display
        this.methodExporter = new JavaMethodExporter()
        this.progressionCanvas = new ProgressionCanvas(dom, this)
        this.clock = new Clock()
        
        //When the user uses the scroll wheel on the tab area, we should scroll left and right.
        let tabDragArea = dom.find('.tab-draggable-area')
        tabDragArea.bind('mousewheel DOMMouseScroll', e => {
            let direction = e.originalEvent.wheelDelta
            if(direction === undefined) { //Firefox >:(
                direction = -e.detail
            }
            tabDragArea.scrollLeft(tabDragArea.scrollLeft() + (direction > 0 ? 20 : -20))
            e.preventDefault()
            e.stopPropagation()
        })

        //When the undo and redo button is clicked, cause an undo and redo event.
        dom.find('.button-undo').click(() => {
            if(pth.animationTabs.isAny()) {
                pth.animationTabs.activeData.mementoTraverser.undo()
            }
        })
        dom.find('.button-redo').click(() => {
            if(pth.animationTabs.isAny()) {
                pth.animationTabs.activeData.mementoTraverser.redo()
            }
        })


        this.addEventListener('keydown', e => {
            if(pth.animationTabs.isAny()) {
                pth.animationTabs.activeData.mementoTraverser.onKeyDown(e.event)
            }
            //Delete key is pressed.
            if(e.event.keyCode == 46) {
                this.panelButtons.deleteKeyframe(this)
            }
        })
        
        //Apply the adjustable scrollable handler stuff.
        applyAdjustScrollable(dom)
    }

    /**
     * 
     * @param {number[]} values the values to set as the rotation
     * @param {*} updateDisplay whether to update the dispaly (cube values)
     * @param {*} updateSilent whether to be silent. Should be true when the rotation is not being set by the player. 
     *                         If true, updates the keyframe
     */
    setRotation(values, updateDisplay = true, updateSilent = false) {
        let selected = this.raytracer.oneSelected()
        if(selected !== null) {
            //Update the display if needed. Either silently or not silently.
            if(updateDisplay) {
                if(updateSilent) {
                    this.cubeDisplayValues.rotation.setInternalValue(values, this.cubeDisplayValues.rotation.indexSelected)
                } else {
                    this.cubeDisplayValues.rotation.value = values
                }
            }


            let handler = this.pth.animationTabs.active
            //True when theres an animation handler selected, a keyframe selected, 
            //the update isn't silent and the selcted keyframe layer isn't locked.
            if(handler !== null && handler.selectedKeyFrame !== undefined && !updateSilent &&
                handler.keyframeInfo.filter(l => l.id == handler.selectedKeyFrame.layer).some(l => !l.locked)) {
                    //If the layer mode is defined, then we need to set stuff up for it.
                    //@todo: review if this needs to be here, as `updateDefinedKeyframe` will set the keyframe info into the map anyway
                    handler.ensureDefinedLayers()
                    
                    //Animate the model at the keyframe end position, without the keyframe in place.
                    handler.selectedKeyFrame.skip = true
                    this.pth.model.resetAnimations()
                    handler.forcedAnimationTicks = handler.selectedKeyFrame.startTime + handler.selectedKeyFrame.duration
                    handler.animate(0)

                    //Get the rotation of the cube, and calculate what it would take to get from values to that rottation.
                    //Set that in the keyframe data.
                    let arr = selected.cubeGroup.rotation.toArray()
                    handler.selectedKeyFrame.rotationMap.set(selected.tabulaCube.name, values.map((v, i) => v - arr[i]*180/Math.PI))
                    handler.selectedKeyFrame.skip = false
                    handler.forcedAnimationTicks = null

                    //If the keyframe layer is defined, update it.
                    handler.updateDefinedKeyframe(handler.selectedKeyFrame)
                    handler.fixDefinedLayers(handler.selectedKeyFrame)
            }
        }
    }

    /**
     * 
     * @param {number[]} values the values to set as the poisition
     * @param {*} updateDisplay whether to update the dispaly (cube values)
     * @param {*} updateSilent whether to be silent. Should be true when the poisition is not being set by the player. 
     *                         If true, updates the keyframe
     */
    setPosition(values, updateDisplay = true, updateSilent = false) {
        let selected = this.raytracer.oneSelected()
        if(selected !== null) {
            //Update the display if needed. Either silently or not silently.
            if(updateDisplay) {
                if(updateSilent) {
                    this.cubeDisplayValues.position.setInternalValue(values, this.cubeDisplayValues.position.indexSelected)
                } else {
                    this.cubeDisplayValues.position.value = values
                }
            }

            let handler = this.pth.animationTabs.active
            //True when theres an animation handler selected, a keyframe selected, 
            //the update isn't silent and the selcted keyframe layer isn't locked.
            if(handler !== null && handler.selectedKeyFrame !== undefined && !updateSilent &&
                handler.keyframeInfo.filter(l => l.id == handler.selectedKeyFrame.layer).some(l => !l.locked)) {
                    //If the layer mode is defined, then we need to set stuff up for it.
                    //@todo: review if this needs to be here, as `updateDefinedKeyframe` will set the keyframe info into the map anyway
                    handler.ensureDefinedLayers()

                    //Animate the model at the keyframe end position, without the keyframe in place.
                    handler.selectedKeyFrame.skip = true
                    this.pth.model.resetAnimations()
                    handler.forcedAnimationTicks = handler.selectedKeyFrame.startTime + handler.selectedKeyFrame.duration
                    handler.animate(0)

                    //Get the position of the cube, and calculate what it would take to get from values to that rottation.
                    //Set that in the keyframe data.
                    let arr = selected.cubeGroup.position.toArray()
                    handler.selectedKeyFrame.rotationPointMap.set(selected.tabulaCube.name, values.map((v, i) => v - arr[i]))
                    handler.selectedKeyFrame.skip = false
                    handler.forcedAnimationTicks = null

                    //If the keyframe layer is defined, update it.
                    handler.updateDefinedKeyframe(handler.selectedKeyFrame)
                    handler.fixDefinedLayers(handler.selectedKeyFrame)
            }
        }
    }

    /**
     * 
     * @param {number[]} values the values to set as the cube grow
     * @param {*} updateDisplay whether to update the dispaly (cube values)
     * @param {*} updateSilent whether to be silent. Should be true when the cube grow is not being set by the player. 
     *                         If true, updates the keyframe
     */
    setCubeGrow(values, updateDisplay = true, updateSilent = false) {
        let selected = this.raytracer.oneSelected()
        if(selected !== null) {
            //Update the display if needed. Either silently or not silently.
            if(updateDisplay) {
                if(updateSilent) {
                    this.cubeDisplayValues.cubeGrow.setInternalValue(values, this.cubeDisplayValues.cubeGrow.indexSelected)
                } else {
                    this.cubeDisplayValues.cubeGrow.value = values
                }
            }
            this.positionCache = values

            let handler = this.pth.animationTabs.active
            //True when theres an animation handler selected, a keyframe selected, 
            //the update isn't silent and the selcted keyframe layer isn't locked.
            if(handler !== null && handler.selectedKeyFrame !== undefined && !updateSilent &&
                handler.keyframeInfo.filter(l => l.id == handler.selectedKeyFrame.layer).some(l => !l.locked)) {
                    //If the layer mode is defined, then we need to set stuff up for it.
                    //@todo: review if this needs to be here, as `updateDefinedKeyframe` will set the keyframe info into the map anyway
                    handler.ensureDefinedLayers()

                    //Animate the model at the keyframe end position, without the keyframe in place.
                    handler.selectedKeyFrame.skip = true
                    this.pth.model.resetAnimations()
                    handler.forcedAnimationTicks = handler.selectedKeyFrame.startTime + handler.selectedKeyFrame.duration
                    handler.animate(0)

                    //Get the cube grow of the cube, and calculate what it would take to get from values to that rottation.
                    //Set that in the keyframe data.
                    let arr = selected.parent.position.toArray().map(e => -e)
                    handler.selectedKeyFrame.cubeGrowMap.set(selected.tabulaCube.name, values.map((v, i) => v - arr[i]))
                    handler.selectedKeyFrame.skip = false
                    handler.forcedAnimationTicks = null

                    //If the keyframe layer is defined, update it.
                    handler.updateDefinedKeyframe(handler.selectedKeyFrame)
                    handler.fixDefinedLayers(handler.selectedKeyFrame)
            }
        }
    }

    /**
     * Either selects or unselects a keyframe
     * @param {KeyFrame} keyframe the keyframe to select, or undefined if to unselect
     */
    selectKeyframe(keyframe) {
        let handler = this.pth.animationTabs.active
        let old = handler.selectedKeyFrame
        handler.selectedKeyFrame = keyframe
        if(old !== undefined) {
            this.keyframeManager.updateKeyFrame(old)            
        }
        if(keyframe !== undefined) {
            this.keyframeManager.updateKeyFrame(keyframe)
        }
        this.cubeDisplayValues.updateKeyframeSelected()
        this.progressionCanvas.keyframeSelectChange()
    }

    /**
     * Called when the animation studio is selected.
     */
    setActive() {
        window.studioWindowResized()
        this.cubeDisplayValues.updateSelected()
        this.display.renderTopGroup.add(this.group)
        this.transformControls.enableReason('tab')
        this.progressionCanvas.onSwitchedTo()
    }
    
    /**
     * Called when the animation studio is unselected
     */
    setUnactive() {
        this.display.renderTopGroup.remove(this.group)
        this.transformControls.disableReason('tab')
    }

    /**
     * Called per frame when the animation studio is selected.
     */
    runFrame() {
        this.pth.model.resetAnimations()
        this.raytracer.update()
        this.panelButtons.onFrame()

        //If there is an animation tab selected:
        // - ensure the playback marker position is correct
        // - ensure that if nothing is playing the display shows the selected keyframe at the end of it's animation
        // - animate the animation handler
        // - update the memento traverser (undo/redo)
        let delta = this.clock.getDelta()
        if(this.pth.animationTabs.isAny()) {
            let data = this.pth.animationTabs.activeData
            if(data !== null) {
                this.keyframeManager.ensureFramePosition()
                this.keyframeManager.setForcedAniamtionTicks()
                data.handler.animate(delta)

                data.mementoTraverser.onFrame()
            }
        }

        this.display.render()
        
        //If a cube is selected update the visual displays with the cube's position/rotation/cubegrow values (silently)
        let selected = this.raytracer.oneSelected()
        if(selected !== null) {
             let pos = selected.cubeGroup.position
             let rot = selected.cubeGroup.rotation
             let cubeGrow = selected.parent.position
             this.setPosition([pos.x, pos.y, pos.z], true, true)
             this.setRotation([rot.x, rot.y, rot.z].map(a => a * 180 / Math.PI), true, true)
             this.setCubeGrow([-cubeGrow.x, -cubeGrow.y, -cubeGrow.z], true, true)
        }
    }
    
}

Object.assign(AnimationStudio.prototype, EventDispatcher.prototype)