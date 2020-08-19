import { KeyframeManager } from '../keyframe_manager.js'
import { AnimationHandler } from '../animations.js'
import { JavaMethodExporter } from '../java_method_exporter.js'
import { Clock, Group } from '../three.js'
import { Gumball } from './gumball.js'
import { AnimationPanel } from './animation_panel.js'
import { AnimationCubeValues } from './animation_cube_values.js'
import { AnimationTabHandler } from './animation_tabs.js'
import { PanelButtons } from './panel_buttons.js'
import { ProgressionCanvas } from './progression_canvas.js'
import { KeyframeBoardManager } from './keyframe_board_manager.js'

const mainArea = document.getElementById("main-area")

export class AnimationStudio {

    constructor(domElement, raytracer, display, filesPage) {
        this.domElement = domElement
        let dom  = $(domElement)
        this.raytracer = raytracer
        this.group = new Group()

        this.selectedRequired = dom.find('.editor-require-selected')
        this.raytracer.addEventListener('selectchange', () => {
            let isSelected = this.raytracer.selectedSet.size === 1
            this.selectedRequired.prop("disabled", !isSelected).toggleClass("is-active", isSelected)
        })

        this.positionCache = null
        this.rotationCache = null

        this.transformControls = display.createTransformControls()
        this.group.add(this.transformControls)

        this.gumball = new Gumball(dom, this)
        this.animationPanel = new AnimationPanel(dom)
        this.cubeDisplayValues = new AnimationCubeValues(dom, this)
        this.keyframeManager = new KeyframeBoardManager(this, dom.find('.keyframe-board'))
        this.panelButtons = new PanelButtons(dom, this)
        this.display = display
        this.methodExporter = new JavaMethodExporter()
        this.animationTabHandler = new AnimationTabHandler(dom, this, filesPage)
        this.progressionCanvas = new ProgressionCanvas(dom, this)
        this.clock = new Clock()
    }

    setRotation(values, updateDisplay = true, updateSilent = false) {
        let selected = this.raytracer.oneSelected()
        if(selected !== null) {
            if(updateDisplay) {
                if(updateSilent) {
                    this.cubeDisplayValues.rotation.setInternalValue(values)
                } else {
                    this.cubeDisplayValues.rotation.value = values
                }
            }
            this.rotationCache = values

            let handler = this.animationTabHandler.active
            if(handler !== null && handler.selectedKeyFrame !== undefined && !updateSilent &&
                handler.keyframeInfo.filter(l => l.id == handler.selectedKeyFrame.layer).some(l => !l.locked)) {
                    handler.selectedKeyFrame.skip = true
                    this.display.tbl.resetAnimations()
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
                    this.cubeDisplayValues.position.setInternalValue(values)
                } else {
                    this.cubeDisplayValues.position.value = values
                }
            }
            this.positionCache = values

            let handler = this.animationTabHandler.active
            if(handler !== null && handler.selectedKeyFrame !== undefined && !updateSilent &&
                handler.keyframeInfo.filter(l => l.id == handler.selectedKeyFrame.layer).some(l => !l.locked)) {
                    handler.selectedKeyFrame.skip = true
                    this.display.tbl.resetAnimations()
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
        let handler = this.animationTabHandler.active
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
        this.display.tbl.resetAnimations()
        this.raytracer.update()

        let delta = this.clock.getDelta()
        if(this.animationTabHandler.isAny()) {
            let handler = this.animationTabHandler.active
            if(handler !== null) {
                this.keyframeManager.ensureFramePosition()
                this.keyframeManager.setupSelectedPose()
                handler.animate(delta)
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