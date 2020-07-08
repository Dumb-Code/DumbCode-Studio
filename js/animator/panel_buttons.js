export class PanelButtons {
    constructor(dom, studio) {
        dom.find('.button-add-keyframe').click(() => {
            let active = studio.animationTabHandler.active
            if(active !== null) {
                let kf = active.animationHandler.createKeyframe()
                kf.duration = 5
                kf.startTime = active.manager.playstate.ticks
                active.animationHandler.keyframes.push(kf)
                active.animationHandler.keyframesDirty()
                active.manager.reframeKeyframes()
                kf.selectChange(true)
            }
        })

        dom.find('.button-delete-keyframe').click(() => {
            let active = studio.animationTabHandler.active
            if(active !== null) {
                let index = active.animationHandler.keyframes.indexOf(active.manager.selectedKeyFrame)
                if(index >= 0) {
                    let keyframe = active.manager.selectedKeyFrame
                    active.animationHandler.keyframes.splice(index, 1)
                    active.manager.entryBoard.removeChild(keyframe.element)
                    active.animationHandler.keyframesDirty()
                
                    keyframe.selectChange(false)
                    active.manager.reframeKeyframes()
                }
            }
            
        })
    }
}