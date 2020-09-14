export class PanelButtons {
    constructor(dom, studio) {
        this.pth = studio.pth
        dom.find('.button-delete-keyframe').click(() => {
            let handler = studio.pth.animationTabs.active
            if(handler !== null && handler.selectedKeyFrame !== undefined) {
                let index = handler.keyframes.indexOf(handler.selectedKeyFrame)
                if(index >= 0) {
                    handler.keyframes.splice(index, 1)
            
                    studio.selectKeyframe(undefined)
                    studio.keyframeManager.reframeKeyframes()
                }
            }
        })

        let playstateRoot = dom.find('.toggle-timeline-playstate')
        let updatePlaystate = () => {
            let playing = studio.keyframeManager.playstate.playing === true
            playstateRoot.find('.play-pause-symbol').toggleClass('fa-pause', playing).toggleClass('fa-play', !playing)
        }


        dom.find('.button-restart-time').click(() => {
            studio.keyframeManager.playstate.ticks = 0
            studio.keyframeManager.playstate.playing = true
            updatePlaystate()
        })
        dom.find('.button-reset-time').click(() => {
            studio.keyframeManager.playstate.ticks = 0
            studio.keyframeManager.playstate.playing = false
            updatePlaystate()
        })

        playstateRoot.click(() => {
            let playing = studio.keyframeManager.playstate.playing === true
            studio.keyframeManager.playstate.playing = !playing
            updatePlaystate()
        })

        this.inputPlaybackRange = dom.find('.input-playback-range')
        this.inputPlaybackRange.on('input', e => {
            let value = e.target.value
            this.inputPlaybackRange.parent().attr('data-tooltip', `Ticks: ${value}`)
            studio.keyframeManager.playstate.ticks = parseFloat(value)
        })

        let startTimeField = dom.find('.input-keyframe-starttime')

        startTimeField.on('input', e => {
            let value = Math.max(Number(e.target.value), 0)
            let handler = studio.pth.animationTabs.active

            if(handler !== null && !isNaN(value) && handler.selectedKeyFrame !== undefined) {
                handler.selectedKeyFrame.startTime = value
                studio.keyframeManager.updateKeyFrame(handler.selectedKeyFrame)
            }
        })


        dom.find('.input-keyframe-duration').on('input', e => {
            let value = Math.max(Number(e.target.value), 0)
            let handler = studio.pth.animationTabs.active
            
            if(handler !== null && !isNaN(value) && handler.selectedKeyFrame !== undefined) {
                let diff = value - handler.selectedKeyFrame.duration
                handler.selectedKeyFrame.duration = value
                handler.selectedKeyFrame.startTime -= diff
                startTimeField.val(handler.selectedKeyFrame.startTime)
                studio.keyframeManager.updateKeyFrame(handler.selectedKeyFrame)
            }
        })
    }

    onFrame() {
        let active = this.pth.animationTabs.active
        this.inputPlaybackRange.attr('max', active.totalTime).val(active.playstate.ticks)
    }
}