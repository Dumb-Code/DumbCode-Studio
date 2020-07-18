export class PanelButtons {
    constructor(dom, studio) {
        // dom.find('.button-add-keyframe').click(() => {
        //     let handler = studio.animationTabHandler.active
        //     if(handler !== null) {
        //         let kf = handler.createKeyframe()
        //         kf.duration = 5
        //         kf.startTime = studio.keyframeManager.playstate.ticks
        //         handler.keyframes.push(kf)
        //         handler.keyframesDirty()
        //         studio.keyframeManager.reframeKeyframes()
        //         kf.selectChange(true)
        //     }
        // })

        dom.find('.button-delete-keyframe').click(() => {
            let handler = studio.animationTabHandler.active
            if(handler !== null && handler.selectedKeyFrame !== undefined) {
                let index = handler.keyframes.indexOf(handler.selectedKeyFrame)
                if(index >= 0) {
                    let keyframe = handler.selectedKeyFrame
                    handler.keyframes.splice(index, 1)
                    studio.keyframeManager.entryBoard.removeChild(keyframe.element)
                    handler.keyframesDirty()
                
                    keyframe.selectChange(false)
                    studio.keyframeManager.reframeKeyframes()
                }
            }
        })

        dom.find('.button-reset-keyframes').click(() => {
            studio.keyframeManager.playstate.ticks = 0
            studio.display.tbl.resetAnimations()
        })

        dom.find('.button-pause-play').click(e => {
            if(studio.keyframeManager.playstate.playing === true) {
                e.target.innerHTML = "Play"
            } else {
                e.target.innerHTML = "Pause"
            }
            studio.keyframeManager.playstate.playing = !studio.keyframeManager.playstate.playing
        })

        let speedText = dom.find('#playback-speed')
        dom.find('.input-playback-speed').on('input', e => {
            let value = Math.round(Math.pow(2, e.target.value) * 100) / 100
            speedText.text(value)
            studio.keyframeManager.playstate.speed = value
        })

        
        let startTimeField = dom.find('.input-keyframe-starttime')

        startTimeField.on('input', e => {
            let value = Math.max(Number(e.target.value), 0)
            let handler = studio.animationTabHandler.active

            if(handler !== null && !isNaN(value) && handler.selectedKeyFrame !== undefined) {
                handler.selectedKeyFrame.startTime = value
                handler.keyframesDirty()
                studio.keyframeManager.updateKeyFrame(handler.selectedKeyFrame)
            }
        })


        dom.find('.input-keyframe-duration').on('input', e => {
            let value = Math.max(Number(e.target.value), 0)
            let handler = studio.animationTabHandler.active
            
            if(handler !== null && !isNaN(value) && handler.selectedKeyFrame !== undefined) {
                let diff = value - handler.selectedKeyFrame.duration
                handler.selectedKeyFrame.duration = value
                handler.selectedKeyFrame.startTime -= diff
                startTimeField.val(handler.selectedKeyFrame.startTime)
                handler.keyframesDirty()
                studio.keyframeManager.updateKeyFrame(handler.selectedKeyFrame)
            }
        })
    }
}