import { TBLModel } from './tbl_loader.js'
import { readFile } from './displays.js';

export class AnimationHandler {
    
    constructor(tbl, animationMap) {
        this.tbl = tbl
        this.inertia = false
        this.animationMap = animationMap

        this.keyframes = []
        this.sortedTimes = []
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


        return (async() => {
        
            let promiseFiles = [...tblFiles.map(file => TBLModel.loadModel(readFile(file), file.name))]
            if(infoFile) {
                promiseFiles.push(readFile(infoFile))
            }

            let result = await Promise.all(promiseFiles)

            let info = infoFile ? JSON.parse(result.pop()) : {base_time: 5}
            let baseTime = info.base_time

            result.sort((a, b) => a.fileName.localeCompare(b.fileName))
            
            let startTime = 0;
            for(let pose of result) {
                let keyframe = new KeyFrame(this)

                keyframe.startTime = startTime
                keyframe.duration = baseTime

                pose.cubeMap.forEach(poseCube => {
                    let mainCube = this.tbl.cubeMap.get(poseCube.name)
                    if(!this.arrEqual(poseCube.rotationPoint, mainCube.rotationPoint)) {
                        keyframe.rotationPointMap.set(poseCube.name, poseCube.rotationPoint)
                    }
                    if(!this.arrEqual(poseCube.rotation, mainCube.rotation)) {
                        keyframe.rotationMap.set(poseCube.name, poseCube.rotation)
                    }
                })

                startTime += baseTime; //todo: time overrides ???

                this.keyframes.push(keyframe)

            }
            this.keyframesDirty()
            return ""
        })()
    }

    arrEqual(arr1, arr2) {
        return arr1[0] == arr2[0] && arr1[1] == arr2[1] && arr1[2] == arr2[2]
    }

    animate(deltaTime) {
        this.playstate.onFrame(deltaTime)

        this.sortedTimes.forEach(kf => kf.animate(this.playstate.ticks))
    }
    keyframesDirty() {
        this.keyframes.forEach(kf => kf.setup = false)
        this.sortedTimes = new Array(...this.keyframes).sort((a, b) => a.startTime - b.startTime);
        let setupKeyframes = []

        this.tbl.resetAnimations()

        for(let kf of this.sortedTimes) {
            setupKeyframes.forEach(skf => skf.animate(kf.startTime, true))
            kf.doSetup();
            setupKeyframes.push(kf);
        }
        this.tbl.resetAnimations()
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

        if(this.handler.inertia) {
            this.percentageDone = Math.sin((this.percentageDone - 0.5) * Math.PI) / 2 + 0.5
        }

        for(let key of this.handler.animationMap.keys()) {
            let cube = this.handler.animationMap.get(key);

            let irot
            if(this.rotationMap.has(key)) {
                irot = this.interpolate(this.fromRotationMap.get(key), this.rotationMap.get(key))
                cube.rotation.set(irot[0] * Math.PI / 180, irot[1] * Math.PI / 180, irot[2] * Math.PI / 180)
            } else {
                // irot = this.fromRotationMap.get(key)
            }

            let ipos
            if(this.rotationPointMap.has(key)) {
                ipos = this.interpolate(this.fromRotationPointMap.get(key), this.rotationPointMap.get(key))
                cube.position.set(ipos[0], ipos[1], ipos[2])
            } else {
                // ipos = this.fromRotationPointMap.get(key)
            }
        }
    }

    getPosition(cubename) {
        if(this.rotationPointMap.has(cubename)) {
            return this.rotationPointMap.get(cubename)
        } else {
            return this.fromRotationPointMap.get(cubename)
        } 
    }

    getRotation(cubename) {
        if(this.rotationMap.has(cubename)) {
            return this.rotationMap.get(cubename)
        } else {
            return this.fromRotationMap.get(cubename)
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


