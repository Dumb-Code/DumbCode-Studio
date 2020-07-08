import { KeyframeManger } from '../keyframe_manager.js'
import { AnimationHandler } from '../animations.js'
import { JavaMethodExporter } from '../java_method_exporter.js'
import { Clock } from '../three.js'
import { Gumball } from './gumball.js'
import { AnimationPanel } from './animation_panel.js'
import { AnimationCubeValues } from './animation_cube_values.js'
import { AnimationTabHandler } from './animation_tabs.js'
import { PanelButtons } from './panel_buttons.js'

const mainArea = document.getElementById("main-area")

export class AnimationStudio {

    constructor(domElement, raytracer, display) {
        this.domElement = domElement
        let dom  = $(domElement)
        this.raytracer = raytracer

        this.selectedRequired = dom.find('.editor-require-selected')
        this.raytracer.addEventListener('selectchange', () => {
            let isSelected = this.raytracer.selectedSet.size === 1
            this.selectedRequired.prop("disabled", !isSelected).toggleClass("is-active", isSelected)
        })

        this.positionCache = null
        this.rotationCache = null

        this.transformControls = display.createTransformControls()
        this.gumball = new Gumball(dom, this)
        this.animationPanel = new AnimationPanel(dom)
        this.panelButtons = new PanelButtons(dom, this)
        this.cubeDisplayValues = new AnimationCubeValues(dom, this)
        this.display = display
        this.methodExporter = new JavaMethodExporter()
        this.animationTabHandler = new AnimationTabHandler(dom, this)

        this.clock = new Clock()
    }

    setRotation(values, updateDisplay = true) {
        let selected = this.raytracer.oneSelected()
        if(selected !== null) {
            if(updateDisplay) {
                this.cubeDisplayValues.rotation.value = values
            }
            this.rotationCache = values
            selected.parent.rotation.set(values[0] * Math.PI / 180, values[1] * Math.PI / 180, values[2] * Math.PI / 180)

            let active = this.animationTabHandler.active
            if(active !== null) {
                active.manager.selectedKeyFrame.rotationMap.set(selected.tabulaCube.name, values)
                active.animationHandler.keyframesDirty()
            }
        }
    }

    setPosition(values, updateDisplay = true) {
        let selected = this.raytracer.oneSelected()
        if(selected !== null) {
            if(updateDisplay) {
                this.cubeDisplayValues.position.value = values
            }
            this.positionCache = values
            selected.parent.position.set(values[0], values[1], values[2])

            let active = this.animationTabHandler.active
            if(active !== null) {
                active.manager.selectedKeyFrame.rotationPointMap.set(selected.tabulaCube.name, values)
                active.animationHandler.keyframesDirty()
            }
        }
    }



    setActive() {
        window.studioWindowResized()
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
    }

    runFrame() {
        this.raytracer.update()

        let active = this.animationTabHandler.active
        if(active !== null) {
            active.manager.ensureFramePosition()
            active.animationHandler.animate(this.clock.getDelta())
            active.manager.setupSelectedPose()
        }


        this.display.render()
        
        // if(this.raytracer.selected && this.animationHandler.playstate.playing) {
        //     let pos = this.raytracer.selected.parent.position
        //     let rot = this.raytracer.selected.parent.rotation
        //     this.setPosition([pos.x, pos.y, pos.z], true)
        //     this.setRotation([rot.x, rot.y, rot.z].map(a => a * 180 / Math.PI), true)
        // }
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

// window.setSpeed = valueIn => {
//     if(activeStudio !== undefined) {
//         let value = Math.round(Math.pow(2, valueIn) * 100) / 100
//         document.getElementById("playback-speed").innerHTML = value
//         activeStudio.manager.playstate.speed = value
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

// window.resetKeyFrames = () => {
//     if(activeStudio !== undefined) {
//         activeStudio.manager.playstate.ticks = 0
//         activeStudio.display.tbl.resetAnimations()
//     }
    
// }

// document.addEventListener("mouseup", () => {
//     document.removeEventListener("mousemove", resize, false)
//     document.body.className = undefined
// }, false);

// window.addEventListener( 'resize', () => setHeights(), false );

// function resize(e) {
//     let range = window.innerHeight + canvasContainer.offsetTop
//     let height = range - (e.y) + activeStudio.clickY

//     let panelHeight = Math.min(Math.max(height, 100), 500)
//     setHeights(panelHeight)
// }

// function setHeights(height) {
//     if(activeStudio !== undefined) {
//         if(height == undefined) {
//             height = activeStudio.panelHeight
//         } else {
//             activeStudio.panelHeight = height
//         }
//         panel.style.height = activeStudio.panelHeight + "px";
//         canvasContainer.style.height = (window.innerHeight - activeStudio.panelHeight) + "px"
//         window.studioWindowResized()
//     }
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



// let ctx = progressionCanvas.getContext("2d");
// let radius = 7.5

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

// container.addEventListener("mousedown", e => {
//     if(activeStudio !== undefined) {
//         if (e.offsetY < 0) {
//             activeStudio.clickY = 15 + e.offsetY
//             document.addEventListener("mousemove", resize, false);
//             document.body.className = "disable-select"
//         }
//     }
// }, false);

// window.deleteKeyframe = () => {
//     if(activeStudio !== undefined && activeStudio.manager.selectedKeyFrame) {
//         let index = activeStudio.animationHandler.keyframes.indexOf(activeStudio.manager.selectedKeyFrame)
//         if(index >= 0) {
//             let keyframe = activeStudio.manager.selectedKeyFrame

//             activeStudio.animationHandler.keyframes.splice(index, 1)
//             activeStudio.manager.entryBoard.removeChild(keyframe.element)
//             activeStudio.animationHandler.keyframesDirty()
            
//             keyframe.selectChange(false)
//             activeStudio.manager.reframeKeyframes()
//         }
//     }
// }

// window.addKeyframe = () => {
//     if(activeStudio !== undefined && activeStudio.animationHandler) {

//         let kf = activeStudio.animationHandler.createKeyframe()

//         kf.duration = 5
//         kf.startTime = activeStudio.manager.playstate.ticks

//         activeStudio.animationHandler.keyframes.push(kf)
//         activeStudio.animationHandler.keyframesDirty()
    
//         activeStudio.manager.reframeKeyframes()
    
//         kf.selectChange(true)

//     }
// }

// window.setStartTime = value => {
//     value = Number(value)
//     if(activeStudio !== undefined) {
//         let manager = activeStudio.manager
//         if(manager.selectedKeyFrame) {
//             manager.selectedKeyFrame.startTime = value
//             activeStudio.animationHandler.keyframesDirty()
//             manager.updateKeyFrame(manager.selectedKeyFrame)
//         }
//     }
// }

// window.setDuration = value => {
//     value = Number(value)
//     if(activeStudio !== undefined) {
//         let manager = activeStudio.manager
//         if(manager.selectedKeyFrame) {
//             let diff = value - manager.selectedKeyFrame.duration
//             manager.selectedKeyFrame.duration = value
//             manager.selectedKeyFrame.startTime -= diff
//             activeStudio.animationHandler.keyframesDirty()
//             manager.updateKeyFrame(manager.selectedKeyFrame)
//         }
//     }
// }

// progressionCanvas.onmousedown = e => {
//     if(activeStudio !== undefined) {
//         let manager = activeStudio.manager
//         if(manager.selectedKeyFrame !== undefined) {
//             let points = manager.selectedKeyFrame.progressionPoints
    
//             let width = progressionCanvas.width
//             let height = progressionCanvas.height
    
//             let clickedOn = points.find(p => !p.required && Math.pow(width*p.x-e.offsetX, 2) + Math.pow(height*p.y-e.offsetY, 2) <= 3*radius*radius) //The 3 is just for comedic effect.
    
//             if(clickedOn !== undefined) {
//                 clickedOn.startX = clickedOn.x
//                 clickedOn.startY = clickedOn.y
//                 activeStudio.selectedPoint = clickedOn
//             } else {
//                 let newPoint = { x: e.offsetX / width, y: e.offsetY / height }
//                 points.push( newPoint )
//                 manager.selectedKeyFrame.resortPointsDirty()
//                 activeStudio.selectedPoint = newPoint
//             }
    
//             redrawProgressionCanvas()
//         }
//     }
// }

// progressionCanvas.onmousemove = e => {
//     if(activeStudio !== undefined) {
//         let manager = activeStudio.manager
//         let selectedPoint = activeStudio.selectedPoint
//         if(selectedPoint !== undefined) {
//             selectedPoint.x = e.offsetX / progressionCanvas.width
//             selectedPoint.y = e.offsetY / progressionCanvas.height
//             redrawProgressionCanvas()
//             manager.selectedKeyFrame.resortPointsDirty()
//         }
//     }
// }

// progressionCanvas.onmouseup = () => {
//     if(activeStudio !== undefined) {
//         let manager = activeStudio.manager
//         let selectedPoint = activeStudio.selectedPoint
//         let width = progressionCanvas.width
//         let height = progressionCanvas.height

//         if(selectedPoint !== undefined) {
//             if(selectedPoint.startX !== undefined && selectedPoint.startY !== undefined) {
//                 let distX = width*(selectedPoint.startX - selectedPoint.x)
//                 let distY = height*(selectedPoint.startY - selectedPoint.y)
//                 if(distX*distX + distY*distY < radius*radius*3) {
//                     manager.selectedKeyFrame.progressionPoints = manager.selectedKeyFrame.progressionPoints.filter(p => p !== selectedPoint)
//                     manager.selectedKeyFrame.resortPointsDirty()
//                 }
//             }
//             activeStudio.selectedPoint = undefined
//             redrawProgressionCanvas()
//         }
//     }
// }

// window.redrawProgressionCanvas = () => {
//     if(activeStudio !== undefined) {
//         if(manager.selectedKeyFrame !== undefined) {
//             let width = progressionCanvas.width
//             let height = progressionCanvas.height
        
//             ctx.clearRect(0, 0, width, height);
//             ctx.strokeStyle = "#363636";
//             let points = manager.selectedKeyFrame.progressionPoints
        
//             for(let i = 0; i < points.length; i++) {
//                 let point = points[i]
//                 let next = points[i+1]
        
//                 ctx.beginPath();
//                 ctx.arc(point.x * width, point.y * height, radius, 0, 2 * Math.PI);
        
//                 if(next !== undefined) {
//                     ctx.moveTo(point.x * width, point.y * height);
//                     ctx.lineTo(next.x * width, next.y * height);
//                 }
        
//                 ctx.stroke();
//             }
//         }
//     }
// }