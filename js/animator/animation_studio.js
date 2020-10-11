import { JavaMethodExporter } from '../java_method_exporter.js'
import { Clock, EventDispatcher, Group } from '../three.js'
import { Gumball } from './gumball.js'
import { AnimationPanel } from './animation_panel.js'
import { AnimationCubeValues } from './animation_cube_values.js'
import { AnimationTabHandler } from './animation_tabs.js'
import { PanelButtons } from './panel_buttons.js'
import { ProgressionCanvas } from './progression_canvas.js'
import { KeyframeBoardManager } from './keyframe_board_manager.js'

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

        this.positionCache = null
        this.rotationCache = null

        this._tabContainer = dom.find('.tab-container')
        dom.find('.tab-add').click(() => pth.getSelected().animationTab.initiateNewTab())

        this.transformControls = display.createTransformControls()
        this.group.add(this.transformControls)

        this.gumball = new Gumball(dom, this)
        this.animationPanel = new AnimationPanel(dom)
        this.cubeDisplayValues = new AnimationCubeValues(dom, this)
        this.keyframeManager = new KeyframeBoardManager(this, dom.find('.keyframe-board'))
        this.panelButtons = new PanelButtons(dom, this)
        this.display = display
        this.methodExporter = new JavaMethodExporter()
        this.progressionCanvas = new ProgressionCanvas(dom, this)
        this.clock = new Clock()

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
        })
    }

    setCamera(camera) {
        this.transformControls.camera = camera
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
            this.rotationCache = values

            let handler = this.pth.animationTabs.active
            if(handler !== null && handler.selectedKeyFrame !== undefined && !updateSilent &&
                handler.keyframeInfo.filter(l => l.id == handler.selectedKeyFrame.layer).some(l => !l.locked)) {
                    handler.selectedKeyFrame.skip = true
                    this.pth.model.resetAnimations()
                    handler.forcedAnimationTicks = handler.selectedKeyFrame.startTime + handler.selectedKeyFrame.duration
                    handler.animate(0)
                    let arr = selected.parent.rotation.toArray()
                    handler.selectedKeyFrame.rotationMap.set(selected.tabulaCube.name, values.map((v, i) => v - arr[i]*180/Math.PI))
                    handler.selectedKeyFrame.skip = false
                    handler.forcedAnimationTicks = null
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
            this.positionCache = values

            let handler = this.pth.animationTabs.active
            if(handler !== null && handler.selectedKeyFrame !== undefined && !updateSilent &&
                handler.keyframeInfo.filter(l => l.id == handler.selectedKeyFrame.layer).some(l => !l.locked)) {
                    handler.selectedKeyFrame.skip = true
                    this.pth.model.resetAnimations()
                    handler.forcedAnimationTicks = handler.selectedKeyFrame.startTime + handler.selectedKeyFrame.duration
                    handler.animate(0)
                    let arr = selected.parent.position.toArray()
                    handler.selectedKeyFrame.rotationPointMap.set(selected.tabulaCube.name, values.map((v, i) => v - arr[i]))
                    handler.selectedKeyFrame.skip = false
                    handler.forcedAnimationTicks = null
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
    }


    setActive() {
        window.studioWindowResized()
        this.cubeDisplayValues.updateSelected()
        let selected = this.raytracer.oneSelected()
        if(selected !== null) {
            if(this.rotationCache !== null) {
                selected.parent.rotation.set(this.rotationCache[0] * Math.PI / 180, this.rotationCache[1] * Math.PI / 180, this.rotationCache[2] * Math.PI / 180)
                this.rotationCache = null
            }
            if(this.positionCache !== null) {
                selected.parent.position.set(this.positionCache[0], this.positionCache[1], this.positionCache[2])
                this.positionCache = null
            }
        }
        this.display.scene.add(this.group)
        this.transformControls.enableReason('tab')
    }
    
    setUnactive() {
        this.display.scene.remove(this.group)
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
             this.setPosition([pos.x, pos.y, pos.z], true, true)
             this.setRotation([rot.x, rot.y, rot.z].map(a => a * 180 / Math.PI), true, true)
        }
    }
    
}

Object.assign(AnimationStudio.prototype, EventDispatcher.prototype)