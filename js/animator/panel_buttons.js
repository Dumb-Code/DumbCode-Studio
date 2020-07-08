export class PanelButtons {
    constructor(dom, studio) {
        dom.find('.button-add-keyframe').click(() => {
            let handler = studio.animationTabHandler.active
            if(handler !== null) {
                let kf = handler.createKeyframe()
                kf.duration = 5
                kf.startTime = studio.keyframeManager.playstate.ticks
                handler.keyframes.push(kf)
                handler.keyframesDirty()
                studio.keyframeManager.reframeKeyframes()
                kf.selectChange(true)
            }
        })

        dom.find('.button-delete-keyframe').click(() => {
            let handler = studio.animationTabHandler.active
            if(handler !== null) {
                let index = handler.keyframes.indexOf(studio.keyframeManager.selectedKeyFrame)
                if(index >= 0) {
                    let keyframe = studio.keyframeManager.selectedKeyFrame
                    handler.keyframes.splice(index, 1)
                    studio.keyframeManager.entryBoard.removeChild(keyframe.element)
                    handler.keyframesDirty()
                
                    keyframe.selectChange(false)
                    studio.keyframeManager.reframeKeyframes()
                }
            }
        })
    }
}