import { LinkedElement } from "../util.js"

export class AnimationCubeValues {

    constructor(dom, studio) {
        this.raytracer = studio.raytracer
        this.keyframeSelectionRequired = dom.find('.editor-require-keyframe')
        this.cubeSelectionRequired = dom.find('.editor-require-selection')
        this.getActiveKeyframe = () => studio.animationTabHandler.isAny() ? studio.animationTabHandler.active.selectedKeyFrame : null
        this.activeKeyframeFunc = cons => {
            let keyframe = this.getActiveKeyframe()
            if((keyframe || null) !== null) {
                cons(keyframe)
            }
            studio.keyframeManager.updateKeyFrame(keyframe)
        }
        this.position = new LinkedElement(dom.find('.animation-input-position')).onchange(e => studio.setPosition(e.value, false))
        this.rotation = new LinkedElement(dom.find('.animation-input-rotation')).withsliders(dom.find('.animation-input-rotation-slider')).onchange(e => studio.setRotation(e.value, false))

        this.frameTime = new LinkedElement(dom.find('.input-frame-start'), false).onchange(e => this.activeKeyframeFunc(kf => kf.startTime = e.value))
        this.frameLength = new LinkedElement(dom.find('.input-frame-length'), false).onchange(e => this.activeKeyframeFunc(kf => kf.duration = e.value))

        this.raytracer.addEventListener('selectchange', () => this.updateSelected())
    }

    updateKeyframeSelected() {
        let keyframe = this.getActiveKeyframe()

        this.frameTime.setInternalValue(keyframe ? keyframe.startTime : undefined)
        this.frameLength.setInternalValue(keyframe ? keyframe.duration : undefined)

        let isSelected = keyframe !== undefined
        this.keyframeSelectionRequired.prop("disabled", !isSelected).toggleClass("is-active", isSelected)
    }

    updateSelected() {
        let selected = this.raytracer.oneSelected()

        if(selected === null && this.getActiveKeyframe() === null) {
            this.position.setInternalValue(undefined)
            this.rotation.setInternalValue(undefined)
        }

        let isSelected = this.raytracer.selectedSet.size === 1
        this.keyframeSelectionRequired.prop("disabled", !isSelected).toggleClass("is-active", isSelected)
    }

}