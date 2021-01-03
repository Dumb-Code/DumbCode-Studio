import { LinkedElement, ToggleableElement } from "../util.js"

/**
 * Holds all the information about the data displayed on the top right panel.
 * This includes:
 *  - Looping data
 *  - The keyframe start and end time
 *  - Cube Position/Rotation/CubeGrow values
 */
export class AnimationCubeValues {

    /**
     * @param {} dom The jquery dom element for the animation tab
     * @param {*} studio the aniamtion studio
     */
    constructor(dom, studio) {
        this.raytracer = studio.raytracer
        this.pth = studio.pth
        //The elements that require a keyframe selected to be active
        this.keyframeSelectionRequired = dom.find('.editor-require-keyframe')
        //The elements that require a cube selected to be active. Maybe this can be moved to a whole studio wide thing?
        this.cubeSelectionRequired = dom.find('.editor-require-selection')

        //Helper methods to get and mutate the selected keyfra,e
        this.getActiveKeyframe = () => studio.pth.animationTabs.isAny() ? studio.pth.animationTabs.active.selectedKeyFrame : undefined
        this.activeKeyframeFunc = cons => {
            let keyframe = this.getActiveKeyframe()
            if((keyframe || null) !== null) {
                cons(keyframe)
            }
            studio.keyframeManager.updateKeyFrame(keyframe)
        }

        //Create the position, rotation and cube grow elements
        this.position = new LinkedElement(dom.find('.animation-input-position')).onchange(e => studio.setPosition(e.value, false))
        this.rotation = new LinkedElement(dom.find('.animation-input-rotation')).withsliders(dom.find('.animation-input-rotation-slider')).onchange(e => studio.setRotation(e.value, false))
        this.cubeGrow = new LinkedElement(dom.find('.animation-input-cube-grow')).onchange(e => studio.setCubeGrow(e.value, false))
      
        //Create the keyframe start time and duration elements
        this.frameTime = new LinkedElement(dom.find('.input-frame-start'), false).onchange(e => this.activeKeyframeFunc(kf => kf.startTime = e.value)).absNumber()
        this.frameLength = new LinkedElement(dom.find('.input-frame-length'), false).onchange(e => this.activeKeyframeFunc(kf => kf.duration = e.value)).absNumber()
        
        //Create the animation loop checkbox element
        this.animationLoop = new LinkedElement(dom.find('.keyframe-loop'), false, false, true).onchange(e => {
            let handler = studio.pth.animationTabs.active
            if(handler !== null) {
                handler.hasLoopData = e.value
                //if the handler should have loop data, set it to the current whole animation duration, else wipe it.
                //Maybe in the future we don't have to wipe it?
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
                handler.updateLoopKeyframe()
            }
        })
        this.animationLoop.setInternalValue(false)
        //Create the animation loop start, end and duration elements.
        this.animationLoopStart = new LinkedElement(dom.find('.keyframe-loop-start'), false).onchange(e => {
            let handler = studio.pth.animationTabs.active
            if(handler !== null) {
                handler.loopData.start = e.value
                handler.updateLoopKeyframe()
                studio.keyframeManager.updateLoopedElements()
            }
        }).absNumber()
        this.animationLoopEnd = new LinkedElement(dom.find('.keyframe-loop-end'), false).onchange(e => {
            let handler = studio.pth.animationTabs.active
            if(handler !== null) {
                handler.loopData.end = e.value
                handler.updateLoopKeyframe()
                studio.keyframeManager.updateLoopedElements()
            }
        }).absNumber()
        this.animationLoopTime = new LinkedElement(dom.find('.keyframe-loop-time'), false).onchange(e => {
            let handler = studio.pth.animationTabs.active
            if(handler !== null) {
                handler.loopData.duration = e.value
                handler.updateLoopKeyframe()
            }
        }).absNumber()
        this.raytracer.addEventListener('selectchange', () => this.updateSelected())
    }

    /**
     * Updates the loop start, end and duration elements.
     */
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

    /**
     * Updates the keyframe elements. This includes updating the keyframe start and duration times, 
     * While also updating the keyframe selection required elements
     */
    updateKeyframeSelected() {
        let keyframe = this.getActiveKeyframe()

        this.frameTime.setInternalValue(keyframe ? keyframe.startTime : undefined)
        this.frameLength.setInternalValue(keyframe ? keyframe.duration : undefined)

        let isSelected = keyframe !== undefined
        this.keyframeSelectionRequired.prop("disabled", !isSelected).toggleClass("is-active", isSelected)
    
        this.updateSelected()
    }

    /**
     * Updates the cube selected elements. This includes updating the position/rotation/cubegrow elements,
     * while also updating the cube selected required elements.
     */
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