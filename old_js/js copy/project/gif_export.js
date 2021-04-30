import { WebGLRenderer, Color, Clock } from "../libs/three.js";
import { createScene, updateCamera } from "../editor.js"
import { downloadBlob } from "../util/element_functions.js";
import { AnimationHandler } from "../animations.js";
import { DinosaurDisplay } from "../displays.js";

//TODO: don't use the dummy renderer
const dummyRenderer = new WebGLRenderer({
    antialias: true, 
    alpha:true
});
const gifFramesPerFrame = 3
const clock = new Clock()

/**
 * Handles the gif exporting.
 */
export class GifExporter {
    constructor(animationStudioGetter) {
        this.animationStudioGetter = animationStudioGetter
        this.openedOnce = false
    }
    
    /**
     * Opens the gif export modal
     * @param {AnimationHandler} handler the animation handler
     * @param {string} name the name of the animation 
     */
    async onOpenModal(handler, name) {
        let animationStudio = this.animationStudioGetter()
        if(!animationStudio === undefined) {
            return
        }
        //Open the modal, and set the elements if needed.
        //TODO: currently this is broken. If you export an animation, then swich animatinos and try to export,
        //it will do the first one again.
        let modal = await openModal('files/gif_export')
        if(this.openedOnce !== true) {

            let stage = modal.find('.gif-generate-stage')
            stage.text('Not Started')

            let recordingProcess = new ProcessTimeElement(stage, "Recording")
            let processProcess = new ProcessTimeElement(stage, "Processing")

            let widthDom = modal.find('.gif-width')
            let heightDom = modal.find('.gif-height')

            let lockedAspectRatio = null

            modal.find('#checkbox-lock-aspect-ratio').on('input', e => lockedAspectRatio = e.target.checked === true ? widthDom.val() / heightDom.val() : null)

            widthDom.on('input', () => {
                if(lockedAspectRatio !== null) {
                    heightDom.val(Math.round(widthDom.val() / lockedAspectRatio))
                }
            }) 

            heightDom.on('input', () => {
                if(lockedAspectRatio !== null) {
                    widthDom.val(Math.round(heightDom.val() * lockedAspectRatio))
                }
            }) 

            modal.find('.gif-set-to-screen-height').click(() => {
                widthDom.val(window.innerWidth)
                heightDom.val(window.innerHeight)
                if(lockedAspectRatio !== null) {
                    lockedAspectRatio = window.innerWidth / window.innerHeight
                }
            })

            //TODO: make it not use handler, as once set it's always going to export the same one
            modal.find('.generate-gif-button').click(async() => {
                recordingProcess.restart()
                processProcess.restart()
                let fps = modal.find('.gif-fps').val()
                let color = parseInt(modal.find('.gif-transparent-texture').val().substring(1), 16)
                this.createGif(animationStudio.display, handler, fps, color, widthDom.val(), heightDom.val(), recordingProcess, processProcess)
                .then(blob => {
                    stage.text('Done')
                    downloadBlob(name + ".gif", blob)
                })
                
            })

            this.openedOnce = true
        }
    }

    /**
     * Creates the gif. Returns a Promise<Blob>
     * @param {DinosaurDisplay} display the display
     * @param {AnimationHandler} handler the animation handler
     * @param {number} fps the fps to use
     * @param {number} color the color of the background
     * @param {number} width the gif width
     * @param {number} height the gif height, 
     * @param {ProcessTimeElement} recordingProcess the recording process callback
     * @param {ProcessTimeElement} processProcess the processing process callback
     */
    async createGif(display, handler, fps, color, width, height, recordingProcess, processProcess) {
        return new Promise(resolve => {
            //Create the new gif.
            let gif = new GIF({
                workers: 2,
                quality: 10, //Configurable?
                width: width,
                height: height,
                workerScript: "./js/libs/gif.worker.js",
                transparent: color //optional?
            });
    
        
            //Init the dummy renderer and create the scene and camera
            dummyRenderer.setClearColor(color, 0);
            dummyRenderer.setSize( width, height );
        
            let dummyScene = createScene()
            dummyScene.background = new Color(color)
            dummyScene.add(handler.tbl.modelCache)
        
            let dummyCamera = display.camera.clone()
            updateCamera(dummyCamera, width, height)
                    
            //The delay per frame
            let delay = 1 / fps
    
            let start = 0
            let end = handler.totalTime
    
            // if(animationHandler.looping) {
            //     let kf = animationHandler.loopKeyframe
            //     start += kf.startTime + kf.duration
            //     end += kf.startTime + kf.duration
            // }
    
            let ticks = handler.playstate.ticks
            let forcedTicks = handler.forcedAnimationTicks
        
            handler.playstate.ticks = start
            handler.playstate.playing = true
            handler.forcedAnimationTicks = null

            //Called once per frame. Maybe instead of this we can do setTimeout?
            let gifFrame = () => {
                //Loop over the gif frames
                for(let i = 0; i < gifFramesPerFrame && handler.playstate.ticks <= end; i++) {
                    //Reset the model and animate it, with the change being delay
                    handler.tbl.resetAnimations()
                    handler.animate(delay)

                    //Render the scene
                    dummyRenderer.render( dummyScene, dummyCamera )

                    //Add it as a frame
                    gif.addFrame(dummyRenderer.domElement, { copy: true, delay: delay * 1000 })

                    //Update the recording process callback
                    recordingProcess.onUpdate(handler.playstate.ticks / end)
                }
                //If hasn't ended
                if(handler.playstate.ticks <= end) {
                    requestAnimationFrame(gifFrame)
                } else {

                    //Reset everything, and start processing the gif.
                    handler.playstate.playing = false
                    handler.playstate.ticks = ticks
                    handler.forcedAnimationTicks = forcedTicks
                    display.scene.add(handler.tbl.modelCache)
                    
                    gif.on("progress", v => processProcess.onUpdate(v))
                    gif.on("finished", blob => resolve(blob))
                    gif.render();
                }
            }
            gifFrame()
        })
    }
}

/**
 * Used to estimate how much time is left on a task
 */
class ProcessTimeElement {
    constructor(element, text) {
        this.element = element
        this.text = text
        this.timeStart = 0
    }

    /**
     * Restart the internal clock
     */
    restart() {
        this.timeStart = clock.getElapsedTime()
    }

    /**
     * Called to update the element text.
     * @param {*} value a number between 0 and 1, pertaining on how much is done.
     */
    onUpdate(value) {
        //The time elapsed
        let timeDone = clock.getElapsedTime() - this.timeStart

        //Assuming value increases linearly:
        //
        //value = timeDone / totalTime
        //totalTime = timeDone / value
        //timeLeft = totalTime - timeDone
        //timeLeft = (timeDone / value) - timeDone
        //timeLeft = timeDone * (1/value - 1)
        //timeLeft = timeDone * (1-value) / value
        //
        let timeleft = Math.round(timeDone * (1-value) / value)

        //Get the timestring. If theres minutes then display them, otherwise just display seconds.
        let timestr
        if(timeleft > 60) {
            timestr = `${Math.floor(timeleft / 60)}m ${timeleft % 60}s`
        } else {
            timestr = `${timeleft}s`
        }

        this.element.text(`${this.text}: ${Math.round(value*100)}% ${timestr}`)
    }
}