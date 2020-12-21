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
        this.cubeGrow = new LinkedElement(dom.find('.animation-input-cube-grow')).onchange(e => studio.setCubeGrow(e.value, false, false, e.idx))
        this.cubeGrowLocked = new ToggleableElement(dom.find('.animation-cube-grow-lock'), 'is-locked')
        .addPredicate(() => this.raytracer.oneSelected() !== null)
        .onchange(() => {
            let selected = this.raytracer.oneSelected()
            if(this.cubeGrowLocked.value === true) {
                studio.pth.unlockedAnimationCubes.delete(selected.tabulaCube.name)
                
            } else {
                studio.pth.unlockedAnimationCubes.add(selected.tabulaCube.name)
            }
            if(this.cubeGrowLocked.value === true && this.cubeGrow.value !== undefined) {
                let values = this.cubeGrow.value
                let val = (values[0]+values[1]+values[2]) / 3
                values[0] = val
                values[1] = val
                values[2] = val
                this.cubeGrow.value = values
            }
        })
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
    
        this.updateSelected()
    }

    updateSelected() {
        let selected = this.raytracer.oneSelected()

        if(selected !== null) {
            this.cubeGrowLocked.value = !this.pth.unlockedAnimationCubes.has(selected.tabulaCube.name)
        } else {
            this.cubeGrowLocked.setInternalValue(true)
        }

        if(selected === null || this.getActiveKeyframe() === undefined) {
            this.position.setInternalValue(undefined)
            this.rotation.setInternalValue(undefined)
            this.cubeGrow.setInternalValue(undefined)
        }

        let isSelected = this.raytracer.selectedSet.size === 1
        this.keyframeSelectionRequired.prop("disabled", !isSelected).toggleClass("is-active", isSelected)
    }

}