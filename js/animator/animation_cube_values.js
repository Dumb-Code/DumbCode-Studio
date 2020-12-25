import { LinkedElement, ToggleableElement } from "../util.js"

export class AnimationCubeValues {

    constructor(dom, studio) {
        this.raytracer = studio.raytracer
        this.pth = studio.pth
        this.keyframeSelectionRequired = dom.find('.editor-require-keyframe')
        this.cubeSelectionRequired = dom.find('.editor-require-selection')
        this.getActiveKeyframe = () => studio.pth.animationTabs.isAny() ? studio.pth.animationTabs.active.selectedKeyFrame : undefined
        this.activeKeyframeFunc = cons => {
            let keyframe = this.getActiveKeyframe()
            if((keyframe || null) !== null) {
                cons(keyframe)
            }
            studio.keyframeManager.updateKeyFrame(keyframe)
        }
        this.position = new LinkedElement(dom.find('.animation-input-position')).onchange(e => studio.setPosition(e.value, false))
        this.rotation = new LinkedElement(dom.find('.animation-input-rotation')).withsliders(dom.find('.animation-input-rotation-slider')).onchange(e => studio.setRotation(e.value, false))
        this.cubeGrow = new LinkedElement(dom.find('.animation-input-cube-grow')).onchange(e => studio.setCubeGrow(e.value, false))
      
        this.frameTime = new LinkedElement(dom.find('.input-frame-start'), false).onchange(e => this.activeKeyframeFunc(kf => kf.startTime = e.value)).absNumber()
        this.frameLength = new LinkedElement(dom.find('.input-frame-length'), false).onchange(e => this.activeKeyframeFunc(kf => kf.duration = e.value)).absNumber()
        
        this.animationLoop = new LinkedElement(dom.find('.keyframe-loop'), false, false, true).onchange(e => {
            let handler = studio.pth.animationTabs.active
            if(handler !== null) {
                handler.hasLoopData = e.value
                if(e.value) {
                    handler.loopData = { 
                        start: handler.minTime,
                        end: handler.totalTime,
                        duration: 0.5
                     }

                    this.animationLoopStart.setInternalValue(handler.loopData.start)
                    this.animationLoopEnd.setInternalValue(handler.loopData.end)
                    this.animationLoopTime.setInternalValue(handler.loopData.duration)
                } else {
                    handler.loopData = null

                    this.animationLoopStart.setInternalValue(undefined)
                    this.animationLoopEnd.setInternalValue(undefined)
                    this.animationLoopTime.setInternalValue(undefined)
                }
                studio.keyframeManager.updateLoopedElements()
            }
        })
        this.animationLoop.setInternalValue(false)
        this.animationLoopStart = new LinkedElement(dom.find('.keyframe-loop-start'), false).onchange(e => {
            let handler = studio.pth.animationTabs.active
            if(handler !== null) {
                handler.loopData.start = e.value
                studio.keyframeManager.updateLoopedElements()
            }
        }).absNumber()
        this.animationLoopEnd = new LinkedElement(dom.find('.keyframe-loop-end'), false).onchange(e => {
            let handler = studio.pth.animationTabs.active
            if(handler !== null) {
                handler.loopData.end = e.value
                studio.keyframeManager.updateLoopedElements()
            }
        }).absNumber()
        this.animationLoopTime = new LinkedElement(dom.find('.keyframe-loop-time'), false).onchange(e => {
            let handler = studio.pth.animationTabs.active
            if(handler !== null) {
                handler.loopData.duration = e.value
            }
        }).absNumber()
        this.raytracer.addEventListener('selectchange', () => this.updateSelected())
    }

    updateLoopedElements() {
        let handler = this.pth.animationTabs.active

        let isLooping = false
        if(handler !== null) {
            isLooping = handler.loopData !== null
        }
        this.animationLoop.setInternalValue(isLooping)

        if(isLooping) {
            this.animationLoopStart.setInternalValue(handler.loopData.start)
            this.animationLoopEnd.setInternalValue(handler.loopData.end)
            this.animationLoopTime.setInternalValue(handler.loopData.duration)
        } else {
            this.animationLoopStart.setInternalValue(undefined)
            this.animationLoopEnd.setInternalValue(undefined)
            this.animationLoopTime.setInternalValue(undefined)
        }
    }

    updateKeyframeSelected() {
        let keyframe = this.getActiveKeyframe()

        this.frameTime.setInternalValue(keyframe ? keyframe.startTime : undefined)
        this.frameLength.setInternalValue(keyframe ? keyframe.duration : undefined)

        let isSelected = keyframe !== undefined
        this.keyframeSelectionRequired.prop("disabled", !isSelected).toggleClass("is-active", isSelected)
    
        this.updateSelected()
    }

    updateSelected() {
        let selected = this.raytracer.oneSelected()

        if(selected === null || this.getActiveKeyframe() === undefined) {
            this.position.setInternalValue(undefined)
            this.rotation.setInternalValue(undefined)
            this.cubeGrow.setInternalValue(undefined)
        }

        let isSelected = this.raytracer.selectedSet.size === 1
        this.cubeSelectionRequired.prop("disabled", !isSelected).toggleClass("is-active", isSelected)
    }

}