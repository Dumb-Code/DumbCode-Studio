import { JavaMethodExporter } from '../java_method_exporter.js'
import { Clock, EventDispatcher, Group } from '../three.js'
import { Gumball } from './gumball.js'
import { AnimationPanel } from './animation_panel.js'
import { AnimationCubeValues } from './animation_cube_values.js'
import { AnimationTabHandler } from './animation_tabs.js'
import { PanelButtons } from './panel_buttons.js'
import { ProgressionCanvas } from './progression_canvas.js'
import { KeyframeBoardManager } from './keyframe_board_manager.js'
import { applyAdjustScrollable } from '../util.js'
import { KeyframeSettings } from './keyframe_settings.js'

const mainArea = document.getElementById("main-area")

export class AnimationStudio {

    constructor(domElement, raytracer, display, pth) {
        this.domElement = domElement
        let dom  = $(domElement)
        this.raytracer = raytracer
        this.pth = pth
    
        this.group = new Group()

        this.selectedRequired = dom.find('.editor-require-selected')
        this.raytracer.addEventListener('selectchange', () => {
            let isSelected = this.raytracer.selectedSet.size === 1
            this.selectedRequired.prop("disabled", !isSelected).toggleClass("is-active", isSelected)
        })

        this._tabContainer = dom.find('.tab-container')
        dom.find('.tab-add').click(() => pth.animationTabs.initiateNewTab())

        this.transformControls = display.createTransformControls()
        this.group.add(this.transformControls)

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

        this.tabDragArea = dom.find('.tab-draggable-area')
        this.tabDragArea.bind('mousewheel DOMMouseScroll', e => {
            let direction = e.originalEvent.wheelDelta
            if(direction === undefined) { //Firefox >:(
                direction = -e.detail
            }
            this.tabDragArea.scrollLeft(this.tabDragArea.scrollLeft() + (direction > 0 ? 20 : -20))
            e.preventDefault()
            e.stopPropagation()
        })

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
            if(e.event.keyCode == 46) {
                this.panelButtons.deleteKeyframe(this)
            }
        })
        
        applyAdjustScrollable(dom)
    }

    setRotation(values, updateDisplay = true, updateSilent = false) {
        let selected = this.raytracer.oneSelected()
        if(selected !== null) {
            if(updateDisplay) {
                if(updateSilent) {
                    this.cubeDisplayValues.rotation.setInternalValue(values, this.cubeDisplayValues.rotation.indexSelected)
                } else {
                    this.cubeDisplayValues.rotation.value = values
                }
            }

            let handler = this.pth.animationTabs.active
            if(handler !== null && handler.selectedKeyFrame !== undefined && !updateSilent &&
                handler.keyframeInfo.filter(l => l.id == handler.selectedKeyFrame.layer).some(l => !l.locked)) {
                    handler.ensureDefinedLayers()
                    handler.selectedKeyFrame.skip = true
                    this.pth.model.resetAnimations()
                    handler.forcedAnimationTicks = handler.selectedKeyFrame.startTime + handler.selectedKeyFrame.duration
                    handler.animate(0)
                    let arr = selected.parent.rotation.toArray()
                    handler.selectedKeyFrame.rotationMap.set(selected.tabulaCube.name, values.map((v, i) => v - arr[i]*180/Math.PI))
                    handler.selectedKeyFrame.skip = false
                    handler.forcedAnimationTicks = null

                    handler.updateDefinedKeyframe(handler.selectedKeyFrame)
                    handler.fixDefinedLayers(handler.selectedKeyFrame)
            }
        }
    }

    setPosition(values, updateDisplay = true, updateSilent = false) {
        let selected = this.raytracer.oneSelected()
        if(selected !== null) {
            if(updateDisplay) {
                if(updateSilent) {
                    this.cubeDisplayValues.position.setInternalValue(values, this.cubeDisplayValues.position.indexSelected)
                } else {
                    this.cubeDisplayValues.position.value = values
                }
            }

            let handler = this.pth.animationTabs.active
            if(handler !== null && handler.selectedKeyFrame !== undefined && !updateSilent &&
                handler.keyframeInfo.filter(l => l.id == handler.selectedKeyFrame.layer).some(l => !l.locked)) {
                    handler.ensureDefinedLayers()
                    handler.selectedKeyFrame.skip = true
                    this.pth.model.resetAnimations()
                    handler.forcedAnimationTicks = handler.selectedKeyFrame.startTime + handler.selectedKeyFrame.duration
                    handler.animate(0)
                    let arr = selected.parent.position.toArray()
                    handler.selectedKeyFrame.rotationPointMap.set(selected.tabulaCube.name, values.map((v, i) => v - arr[i]))
                    handler.selectedKeyFrame.skip = false
                    handler.forcedAnimationTicks = null

                    handler.updateDefinedKeyframe(handler.selectedKeyFrame)
                    handler.fixDefinedLayers(handler.selectedKeyFrame)
            }
        }
    }

    setCubeGrow(values, updateDisplay = true, updateSilent = false) {
        let selected = this.raytracer.oneSelected()
        if(selected !== null) {
            if(updateDisplay) {
                if(updateSilent) {
                    this.cubeDisplayValues.cubeGrow.setInternalValue(values, this.cubeDisplayValues.cubeGrow.indexSelected)
                } else {
                    this.cubeDisplayValues.cubeGrow.value = values
                }
            }
            this.positionCache = values

            let handler = this.pth.animationTabs.active
            if(handler !== null && handler.selectedKeyFrame !== undefined && !updateSilent &&
                handler.keyframeInfo.filter(l => l.id == handler.selectedKeyFrame.layer).some(l => !l.locked)) {
                    handler.ensureDefinedLayers()
                    handler.selectedKeyFrame.skip = true
                    this.pth.model.resetAnimations()
                    handler.forcedAnimationTicks = handler.selectedKeyFrame.startTime + handler.selectedKeyFrame.duration
                    handler.animate(0)
                    let arr = selected.scale.toArray().map((e, i) => (e-selected.tabulaCube.dimension[i]) / 2)
                    handler.selectedKeyFrame.cubeGrowMap.set(selected.tabulaCube.name, values.map((v, i) => v - arr[i]))
                    handler.selectedKeyFrame.skip = false
                    handler.forcedAnimationTicks = null

                    handler.updateDefinedKeyframe(handler.selectedKeyFrame)
                    handler.fixDefinedLayers(handler.selectedKeyFrame)
            }
        }
    }

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

    setActive() {
        window.studioWindowResized()
        this.cubeDisplayValues.updateSelected()
        let selected = this.raytracer.oneSelected()
        if(selected !== null) {
            // if(this.rotationCache !== null) {
            //     selected.parent.rotation.set(this.rotationCache[0] * Math.PI / 180, this.rotationCache[1] * Math.PI / 180, this.rotationCache[2] * Math.PI / 180)
            //     this.rotationCache = null
            // }
            // if(this.positionCache !== null) {
            //     selected.parent.position.set(this.positionCache[0], this.positionCache[1], this.positionCache[2])
            //     this.positionCache = null
            // }
        }
        this.display.renderTopGroup.add(this.group)
        this.transformControls.enableReason('tab')
        this.progressionCanvas.onSwitchedTo()
    }
    
    setUnactive() {
        this.display.renderTopGroup.remove(this.group)
        this.transformControls.disableReason('tab')
    }

    runFrame() {
        this.pth.model.resetAnimations()
        this.raytracer.update()
        this.panelButtons.onFrame()

        let delta = this.clock.getDelta()
        if(this.pth.animationTabs.isAny()) {
            let data = this.pth.animationTabs.activeData
            if(data !== null) {
                this.keyframeManager.ensureFramePosition()
                this.keyframeManager.setupSelectedPose()
                data.handler.animate(delta)

                data.mementoTraverser.onFrame()
            }
        }

        this.display.render()
        
        let selected = this.raytracer.oneSelected()
        if(selected !== null) {
             let pos = selected.parent.position
             let rot = selected.parent.rotation
             let cubeGrow = selected.scale.toArray().map((e, i) => (e-selected.tabulaCube.dimension[i]) / 2)
             this.setPosition([pos.x, pos.y, pos.z], true, true)
             this.setRotation([rot.x, rot.y, rot.z].map(a => a * 180 / Math.PI), true, true)
             this.setCubeGrow(cubeGrow, true, true)
        }
    }
    
}

Object.assign(AnimationStudio.prototype, EventDispatcher.prototype)