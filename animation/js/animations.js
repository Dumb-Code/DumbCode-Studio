import { TBLModel } from './tbl_loader.js'
import { readFile } from './displays.js';

export class AnimationHandler {
    
    constructor(tbl, animationMap) {
        this.tbl = tbl
        this.inertia = false
        this.looping = false
        this.animationMap = animationMap

        this.totalTime = 0
        this.keyframes = []
        this.sortedTimes = []
        this.loopKeyframe = false
        this.playstate = new PlayState()

        window.keyframesPressed = (elem) => {
            if(this.playstate.playing) {
                elem.innerHTML = "Play"
            } else {
                elem.innerHTML = "Pause"
            }
            this.playstate.playing = !this.playstate.playing
        }
    }

    async onAnimationFileChange(files) {
        let tblFiles = []
        let infoFile

        for (let i = 0; i < files.length; i++) {
            let file = files.item(i)
            if(file.name.endsWith(".tbl")) {
                tblFiles.push(file)
            }
            if(file.name == "animation.json") {
                infoFile = file
            }
        }

        if(files.length == 0) {
            alert("No poses uploaded")
            return
        }

        let promiseFiles = [...tblFiles.map(file => TBLModel.loadModel(readFile(file), file.name))]
        if(infoFile) {
            promiseFiles.push(readFile(infoFile))
        }

        let result = await Promise.all(promiseFiles)

        let info = infoFile ? JSON.parse(result.pop()) : { base_time: 5 }
        this.loadFromAnimationFiles(result, info)
    }

    async loadFromAnimationFiles(files, meta = { base_time: 5 }) {
        this.keyframes = []

        let baseTime = meta.base_time

        if(files.length > 0 && files[0].fileName !== undefined) {
            files.sort((a, b) => a.fileName.localeCompare(b.fileName))
        }
        
        let startTime = 0;
        for(let pose of files) {
            let keyframe = new KeyFrame(this)

            keyframe.startTime = startTime
            keyframe.duration = baseTime

            pose.cubeMap.forEach(poseCube => {
                keyframe.rotationPointMap.set(poseCube.name, poseCube.rotationPoint)
                keyframe.rotationMap.set(poseCube.name, poseCube.rotation)
            })

            startTime += baseTime; //todo: time overrides ???

            this.keyframes.push(keyframe)

        }
        this.keyframesDirty()
    }

    animate(deltaTime) {
        this.playstate.onFrame(deltaTime)
        
        if(this.looping) {
            let ticks = this.playstate.ticks % this.totalTime
            for(let i = this.sortedTimes.length - 1; i >= 0; i--) {
                if(i == 0) {
                    if(this.playstate.ticks < this.totalTime) {
                        this.sortedTimes[i].animate(ticks)
                    } else {
                        this.loopKeyframe.animate(ticks)
                    }
                } else {
                    this.sortedTimes[i].animate(ticks)
                }
            }
        } else {
            this.playstate.ticks = Math.min(this.playstate.ticks, this.totalTime)
            this.sortedTimes.forEach(kf => kf.animate(this.playstate.ticks))
        }
    }
    
    keyframesDirty() {
        this.keyframes.forEach(kf => kf.setup = false)
        this.sortedTimes = new Array(...this.keyframes).sort((a, b) => a.startTime - b.startTime);

        let lastKF = this.sortedTimes[this.sortedTimes.length - 1]
        this.totalTime = lastKF.startTime + lastKF.duration

        let setupKeyframes = []

        this.tbl.resetAnimations()

        for(let kf of this.sortedTimes) {
            setupKeyframes.forEach(skf => skf.animate(kf.startTime, true))
            kf.doSetup();
            setupKeyframes.push(kf);
        }

        this.setupLoopedKeyframe()

        this.tbl.resetAnimations()

    }

    setupLoopedKeyframe() {
        let copyFrame = this.sortedTimes[0]

        this.loopKeyframe = new KeyFrame(this)
        this.loopKeyframe.startTime = copyFrame.startTime
        this.loopKeyframe.duration = copyFrame.duration
        
        this.tbl.resetAnimations()

        copyFrame.animate(copyFrame.startTime + copyFrame.duration, true)

        for(let [cubename, entry] of this.animationMap.entries()) {
            this.loopKeyframe.rotationMap.set(cubename, [entry.rotation.x, entry.rotation.y, entry.rotation.z].map(r => r * 180/Math.PI))
            this.loopKeyframe.rotationPointMap.set(cubename, entry.position.toArray())
        }

        for(let kf of this.sortedTimes) {
            kf.animate(this.totalTime, true)
        }
        this.loopKeyframe.doSetup()
    }

    createKeyframe() {
        return new KeyFrame(this)
    }
}

class KeyFrame {

    constructor(handler) {
        this.handler = handler

        this.startTime = 0
        this.duration = 0

        this.rotationMap = new Map();
        this.rotationPointMap = new Map();

        this.fromRotationMap = new Map()
        this.fromRotationPointMap = new Map()

        this.setup = false

        this.percentageDone
    }

    doSetup() {
        this.setup = true
        this.fromRotationMap.clear()
        this.fromRotationPointMap.clear()
        for(let [cubename, entry] of this.handler.animationMap.entries()) {
            this.fromRotationMap.set(cubename, [entry.rotation.x, entry.rotation.y, entry.rotation.z].map(r => r * 180/Math.PI))
            this.fromRotationPointMap.set(cubename, entry.position.toArray())
        }
    }

    animate(ticks, settingup = false) {
        if(!this.setup) {
            return
        }
        
        this.percentageDone = (ticks - this.startTime) / this.duration
        if(this.percentageDone < 0) {
            return
        }

        if(this.percentageDone > 1) {
            if(settingup) {
                this.percentageDone = 1
            } else {
                return
            }

        }

        if(!settingup && this.handler.inertia) {
            this.percentageDone = Math.sin((this.percentageDone - 0.5) * Math.PI) / 2 + 0.5
        }

        for(let key of this.handler.animationMap.keys()) {
            let cube = this.handler.animationMap.get(key);

            let irot
            if(this.rotationMap.has(key)) {
                irot = this.interpolate(this.fromRotationMap.get(key), this.rotationMap.get(key))
            } else {
                irot = this.fromRotationMap.get(key)
            }
            cube.rotation.set(irot[0] * Math.PI / 180, irot[1] * Math.PI / 180, irot[2] * Math.PI / 180)

            let ipos
            if(this.rotationPointMap.has(key)) {
                ipos = this.interpolate(this.fromRotationPointMap.get(key), this.rotationPointMap.get(key))
            } else {
                ipos = this.fromRotationPointMap.get(key)
            }
            cube.position.set(ipos[0], ipos[1], ipos[2])
        }
    }

    getPosition(cubename) {
        if(this.rotationPointMap.has(cubename)) {
            return this.rotationPointMap.get(cubename).slice(0)
        } else {
            return this.fromRotationPointMap.get(cubename).slice(0)
        } 
    }

    getRotation(cubename) {
        if(this.rotationMap.has(cubename)) {
            return this.rotationMap.get(cubename).slice(0)
        } else {
            return this.fromRotationMap.get(cubename).slice(0)
        } 
    }

    interpolate(prev, next) {
        let out = new Array(3)
        if(!prev || !next) {
            return out
        }
        out[0] = prev[0] + (next[0] - prev[0]) * this.percentageDone
        out[1] = prev[1] + (next[1] - prev[1]) * this.percentageDone
        out[2] = prev[2] + (next[2] - prev[2]) * this.percentageDone
    
        return out
    }
}

export class PlayState {
    constructor() {
        this.ticks = 0
        this.speed = 1
        this.playing = false
    }
    onFrame(deltaTime) {
        if(this.playing) {
            this.ticks += deltaTime * this.speed * 20 //t-p-s
        }
    }
}


