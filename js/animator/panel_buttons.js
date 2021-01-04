import { ToggleableElement } from "../util.js"
import { AnimationStudio } from "./animation_studio.js"

/**
 * The panel buttons for the animation studio.
 * This includes:
 *  - Delete keyframe button
 *  - Toggle timeline looping (infinity symbol)
 *  - Pause/Play button
 *  - Restart Time 
 *  - Reset time
 *  - Playback range slider
 */
export class PanelButtons {
    constructor(dom, studio) {
        this.pth = studio.pth
        
        //Setup the delete keyframe button
        dom.find('.button-delete-keyframe').click(() => this.deleteKeyframe(studio))

        //Setup the timeline looping button. The behaviour for this is as follows:
        //When an animation starts playing, if the an animation is loopable (has loop data),
        //then turn this on. Then, when clicked (to turn off), set tab.finishLooping to be true
        let looped = new ToggleableElement(dom.find('.toggle-timeline-looping')).onchange(e => {
            let tab = this.pth.animationTabs.active
            if(tab !== null) {
                tab.finishLooping = !e.value
            }
        }).addPredicate(v => !v || studio.keyframeManager.playstate.playing)

        //The root for the pause/play button. Updates the pause-play symbol for when it's being played.
        let playstateRoot = dom.find('.toggle-timeline-playstate')
        let updatePlaystate = () => {
            let playing = studio.keyframeManager.playstate.playing === true
            playstateRoot.find('.play-pause-symbol').toggleClass('fa-pause', playing).toggleClass('fa-play', !playing)
        }

        //When the pauseplay button is clicked, toggle it.
        //If is now playing, make sure `looped.value` is set to true if there is loop data,
        //Otherwise set it to be false
        playstateRoot.click(() => {
            let playing = studio.keyframeManager.playstate.playing === true
            studio.keyframeManager.playstate.playing = !playing
            let tab = this.pth.animationTabs.active
            if(!playing && tab !== null && tab.loopData !== null) {
                looped.value = true
            } else {
                looped.value = false
            }
            updatePlaystate()
        })

        //When the restart button is clicked, reset the ticks, 
        //set playing to be true and set `looped` to be true if the handler has looped data
        dom.find('.button-restart-time').click(() => {
            studio.keyframeManager.playstate.ticks = 0
            studio.keyframeManager.playstate.playing = true
            let tab = this.pth.animationTabs.active
            if(tab !== null && tab.loopData !== null) {
                looped.value = true
            }
            updatePlaystate()
        })

        //When the reset button is clicked, reset the ticks, 
        //set playing to be false, and set looped to be false.
        dom.find('.button-reset-time').click(() => {
            studio.keyframeManager.playstate.ticks = 0
            studio.keyframeManager.playstate.playing = false
            looped.value = false
            updatePlaystate()
        })

        //The input range slider. Allows the user to slide the slider between the start and end of the animation.
        this.inputPlaybackRange = dom.find('.input-playback-range')
        this.inputPlaybackRange.on('input', e => {
            let value = e.target.value
            let rounded = Math.round(value * 100) / 100
            this.inputPlaybackRange.parent().attr('data-tooltip', `${rounded}s`)
            studio.keyframeManager.playstate.ticks = parseFloat(value)
        })

    }

    /**
     * Called per frame. Updates the playback range with the playstate ticks
     */
    onFrame() {
        let active = this.pth.animationTabs.active
        if(active == null) {
            return  
        }
        //Updat the slider with the ticks. If visibleTicks isn't null use that. Otherwise use normal ticks.
        let ticks = active.playstate.visibleTicks !== null ? active.playstate.visibleTicks : active.playstate.ticks
        this.inputPlaybackRange.attr('min', active.minTime).attr('max', active.totalTime).val(ticks)
    }

    /**
     * Deletes the keyframe from the studio
     * @param {AnimationStudio} studio 
     */
    deleteKeyframe(studio) {
        let handler = studio.pth.animationTabs.active
        if(handler !== null && handler.selectedKeyFrame !== undefined) {
            let index = handler.keyframes.indexOf(handler.selectedKeyFrame)
            if(index >= 0) {
                //Remove the keyframe at that index, toggle the keyframe selection and reframe the keyframes.
                handler.keyframes.splice(index, 1) 
                studio.selectKeyframe(undefined)
                studio.keyframeManager.reframeKeyframes()
            }
        }
    }
}