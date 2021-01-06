import { WebGLRenderer, Color, Clock } from "../libs/three.js";
import { createScene, updateCamera } from "../editor.js"
import { downloadBlob } from "../util/element_functions.js";

const dummyRenderer = new WebGLRenderer({
    antialias: true, 
    alpha:true
});
const gifFramesPerFrame = 3
const clock = new Clock()

export class GifExporter {
    constructor(animationStudioGetter) {
        this.animationStudioGetter = animationStudioGetter
        this.openedOnce = false
    }
    
    async onOpenModal(handler, name) {
        let animationStudio = this.animationStudioGetter()
        if(!animationStudio === undefined) {
            return
        }
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

    async createGif(display, handler, fps, color, width, height, recordingProcess, processProcess) {
        return new Promise(resolve => {
            let gif = new GIF({
                workers: 2,
                quality: 10,
                width: width,
                height: height,
                workerScript: "./js/gif.worker.js",
                transparent: color
            });
    
         
            dummyRenderer.setClearColor(color, 0);
            dummyRenderer.setSize( width, height );
        
            let dummyScene = createScene()
            dummyScene.background = new Color(color)
            dummyScene.add(handler.tbl.modelCache)
        
            let dummyCamera = display.camera.clone()
            updateCamera(dummyCamera, width, height)
                    
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

    
            let gifFrame = () => {
                for(let i = 0; i < gifFramesPerFrame && handler.playstate.ticks <= end; i++) {
                    handler.tbl.resetAnimations()
                    handler.animate(delay)
                    dummyRenderer.render( dummyScene, dummyCamera )
                    gif.addFrame(dummyRenderer.domElement, { copy: true, delay: delay * 1000 })
                    recordingProcess.onUpdate(handler.playstate.ticks / end)
                }
                if(handler.playstate.ticks <= end) {
                    requestAnimationFrame(gifFrame)
                } else {
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

class ProcessTimeElement {
    constructor(element, text) {
        this.element = element
        this.text = text
        this.timeStart = 0
    }

    restart() {
        this.timeStart = clock.getElapsedTime()
    }

    onUpdate(value) {
        let timeDone = clock.getElapsedTime() - this.timeStart

        let timeleft = Math.round(timeDone * (1-value) / value)

        let timestr
        if(timeleft > 60) {
            timestr = `${Math.floor(timeleft / 60)}m ${timeleft % 60}s`
        } else {
            timestr = `${timeleft}s`
        }

        this.element.text(`${this.text}: ${Math.round(value*100)}% ${timestr}`)
    }
}