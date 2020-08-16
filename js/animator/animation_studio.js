import { KeyframeManager } from '../keyframe_manager.js'
import { AnimationHandler } from '../animations.js'
import { JavaMethodExporter } from '../java_method_exporter.js'
import { Clock, Group } from '../three.js'
import { Gumball } from './gumball.js'
import { AnimationPanel } from './animation_panel.js'
import { AnimationCubeValues } from './animation_cube_values.js'
import { AnimationTabHandler } from './animation_tabs.js'
import { PanelButtons } from './panel_buttons.js'
import { ProgressionCanvas } from './progression_canvas.js'
import { KeyframeBoardManager } from './keyframe_board_manager.js'

const mainArea = document.getElementById("main-area")

export class AnimationStudio {

    constructor(domElement, raytracer, display, filesPage) {
        this.domElement = domElement
        let dom  = $(domElement)
        this.raytracer = raytracer
        this.group = new Group()

        this.selectedRequired = dom.find('.editor-require-selected')
        this.raytracer.addEventListener('selectchange', () => {
            let isSelected = this.raytracer.selectedSet.size === 1
            this.selectedRequired.prop("disabled", !isSelected).toggleClass("is-active", isSelected)
        })

        this.positionCache = null
        this.rotationCache = null

        this.transformControls = display.createTransformControls()
        this.group.add(this.transformControls)

        this.gumball = new Gumball(dom, this)
        this.animationPanel = new AnimationPanel(dom)
        this.cubeDisplayValues = new AnimationCubeValues(dom, this)
        this.keyframeManager = new KeyframeBoardManager(this, dom.find('.keyframe-board'))
        this.panelButtons = new PanelButtons(dom, this)
        this.display = display
        this.methodExporter = new JavaMethodExporter()
        this.animationTabHandler = new AnimationTabHandler(dom, this, filesPage)
        this.progressionCanvas = new ProgressionCanvas(dom, this)
        this.clock = new Clock()
    }

    setRotation(values, updateDisplay = true, updateSilent = false) {
        let selected = this.raytracer.oneSelected()
        if(selected !== null) {
            if(updateDisplay) {
                if(updateSilent) {
                    this.cubeDisplayValues.rotation.setInternalValue(values)
                } else {
                    this.cubeDisplayValues.rotation.value = values
                }
            }
            this.rotationCache = values

            let handler = this.animationTabHandler.active
            if(handler !== null && handler.selectedKeyFrame !== undefined && !updateSilent &&
                handler.keyframeInfo.filter(l => l.id == handler.selectedKeyFrame.layer).some(l => !l.locked)) {
                    handler.selectedKeyFrame.skip = true
                    this.display.tbl.resetAnimations()
                    handler.forcedAnimationTicks = handler.selectedKeyFrame.startTime + handler.selectedKeyFrame.duration
                    handler.animate(0)
                    let arr = selected.parent.rotation.toArray()
                    handler.selectedKeyFrame.rotationMap.set(selected.tabulaCube.name, values.map((v, i) => v - arr[i]*180/Math.PI))
                    handler.selectedKeyFrame.skip = false
                    handler.forcedAnimationTicks = null
            }
        }
    }

    setPosition(values, updateDisplay = true, updateSilent = false) {
        let selected = this.raytracer.oneSelected()
        if(selected !== null) {
            if(updateDisplay) {
                if(updateSilent) {
                    this.cubeDisplayValues.position.setInternalValue(values)
                } else {
                    this.cubeDisplayValues.position.value = values
                }
            }
            this.positionCache = values

            let handler = this.animationTabHandler.active
            if(handler !== null && handler.selectedKeyFrame !== undefined && !updateSilent &&
                handler.keyframeInfo.filter(l => l.id == handler.selectedKeyFrame.layer).some(l => !l.locked)) {
                    handler.selectedKeyFrame.skip = true
                    this.display.tbl.resetAnimations()
                    handler.forcedAnimationTicks = handler.selectedKeyFrame.startTime + handler.selectedKeyFrame.duration
                    handler.animate(0)
                    let arr = selected.parent.position.toArray()
                    handler.selectedKeyFrame.rotationPointMap.set(selected.tabulaCube.name, values.map((v, i) => v - arr[i]))
                    handler.selectedKeyFrame.skip = false
                    handler.forcedAnimationTicks = null
            }
        }
    }

    selectKeyframe(keyframe) {
        let handler = this.animationTabHandler.active
        let old = handler.selectedKeyFrame
        handler.selectedKeyFrame = keyframe
        if(old !== undefined) {
            this.keyframeManager.updateKeyFrame(old)            
        }
        if(keyframe !== undefined) {
            this.keyframeManager.updateKeyFrame(keyframe)
        }
        this.cubeDisplayValues.updateKeyframeSelected()
    }


    setActive() {
        window.studioWindowResized()
        this.cubeDisplayValues.updateSelected()
        let selected = this.raytracer.oneSelected()
        if(selected !== null) {
            if(this.rotationCache !== null) {
                selected.parent.rotation.set(this.rotationCache[0] * Math.PI / 180, this.rotationCache[1] * Math.PI / 180, this.rotationCache[2] * Math.PI / 180)
                this.rotationCache = null
            }
            if(this.positionCache !== null) {
                selected.parent.position.set(this.positionCache[0], this.positionCache[1], this.positionCache[2])
                this.positionCache = null
            }
        }
        this.display.scene.add(this.group)
        this.transformControls.enableReason('tab')
    }
    
    setUnactive() {
        this.display.scene.remove(this.group)
        this.transformControls.disableReason('tab')
    }


    runFrame() {
        this.display.tbl.resetAnimations()
        this.raytracer.update()

        let delta = this.clock.getDelta()
        if(this.animationTabHandler.isAny()) {
            let handler = this.animationTabHandler.active
            if(handler !== null) {
                this.keyframeManager.ensureFramePosition()
                this.keyframeManager.setupSelectedPose()
                handler.animate(delta)
            }
        }
        

        this.display.render()
        
        let selected = this.raytracer.oneSelected()
        if(selected !== null) {
             let pos = selected.parent.position
             let rot = selected.parent.rotation
             this.setPosition([pos.x, pos.y, pos.z], true, true)
             this.setRotation([rot.x, rot.y, rot.z].map(a => a * 180 / Math.PI), true, true)
        }
    }
    
}

// let activeStudio = undefined

// const container = document.getElementById("editor-container")
// const panel = document.getElementById("editor");
// const canvasContainer = document.getElementById("display-div");
// const progressionCanvas = document.getElementById("progression_canvas")

// window.setupAnimation = async(file, nameElement) => {
//     if(activeStudio !== undefined) {
//         nameElement.classList.toggle("tooltip", true)
//         nameElement.dataset.tooltip = file.name

//         let buffer = new ByteBuffer(await readFile(file, (reader, file) => reader.readAsArrayBuffer(file)))
//         let kfs = activeStudio.animationHandler.readDCAFile(buffer)

//         activeStudio.animationHandler.keyframes = kfs
//         activeStudio.animationHandler.keyframesDirty()

//         //todo: remove all previous elements
//         activeStudio.manager.reframeKeyframes()
//     }
// }

// window.downloadDCA = () => {
//     if(activeStudio !== undefined && activeStudio.animationHandler !== undefined) {
//         let buffer = new ByteBuffer()

//         buffer.writeNumber(2) //version
//         buffer.writeNumber(activeStudio.animationHandler.sortedTimes.length)
    
//         activeStudio.animationHandler.sortedTimes.forEach(kf => {
//             buffer.writeNumber(kf.startTime)
//             buffer.writeNumber(kf.duration)
            
//             writeMap(buffer, kf.fromRotationMap, kf.rotationMap)
//             writeMap(buffer, kf.fromRotationPointMap, kf.rotationPointMap)
        
    
//             buffer.writeNumber(kf.progressionPoints.length)
//             kf.progressionPoints.forEach(p => {
//                 buffer.writeNumber(p.x)
//                 buffer.writeNumber(p.y)
//             })
//         })
    
    
//         let blob = new Blob([buffer.buffer]);
//         let url = window.URL.createObjectURL(blob);
    
//         let a = document.createElement("a");
//         a.href = url;
//         a.download = mainModel.name + ".dca";
//         a.click();
//         window.URL.revokeObjectURL(url);
//     }
// }

// function writeMap(buffer, fromMap, map) {
//     let arr = []
//     map.forEach((entry, cubename) => {
//         if(!array3FuzzyEqual(entry, fromMap.get(cubename))) {
//             arr.push({ cubename, entry })
//         }
//     })
//     buffer.writeNumber(arr.length)
//     arr.forEach(entry => {
//         buffer.writeString(entry.cubename)
//         buffer.writeNumber(entry.entry[0])
//         buffer.writeNumber(entry.entry[1])
//         buffer.writeNumber(entry.entry[2])
//     })
// }

// function array3FuzzyEqual(arr1, arr2) {
//     for(let i = 0; i < 3; ++i) {
//         if(Math.abs(arr1[i] - arr2[i]) > 0.001) {
//             return false
//         }
//     }
//     return true
// }


// window.onAnimationFileChange = async(files) => {
//     if(activeStudio !== undefined) {
//         await activeStudio.animationHandler.onAnimationFileChange(files)
//         //todo: remove all previous elements
//         activeStudio.manager.reframeKeyframes()
//     }
// }

// window.setMappings = elem => {    
//     if(activeStudio !== undefined) {
//         elem.parentNode.querySelector(".is-active").classList.toggle("is-active", false)
//         elem.classList.toggle("is-active", true)
//         activeStudio.methodExporter.mappings = elem.getAttribute("mapping")
//         window.generateJavaMethod()
//     }
// }

// const keyframeCallback = () => {
//     if(activeStudio !== undefined && activeStudio.manager.selectedKeyFrame) {
//         activeStudio.manager.selectedKeyFrame.selectChange(false)
//     }
// }
// const dinosaurCallback = () => {
//     if(activeStudio !== undefined) {
//         activeStudio.raytracer.setSelected(undefined)
//         activeStudio.raytracer.selected = undefined
//         activeStudio.raytracer.selectedMest = undefined
//     }
// }

// container.addEventListener("mousedown", () => window.studioEscapeCallback = () => {
//     if(activeStudio !== undefined) {
//         if(activeStudio.manager.selectedKeyFrame) {
//             keyframeCallback()
//         } else {
//             dinosaurCallback()
//         }
//     }
// })
// canvasContainer.addEventListener("mousedown", () => window.studioEscapeCallback = () => {
//     if(activeStudio !== undefined) {
//         if(activeStudio.raytracer.selected) {
//             dinosaurCallback()
//         } else {
//             keyframeCallback()
//         }
//     }
// })

