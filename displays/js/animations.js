import { TBLModel } from './tbl_loader.js'

export class AnimationHandler {

    tbl;
    inertia;
    animationMap;
    keyframes = []
    sortedTimes = [] // a list of `keyframes` sorted by start time
    playstate = new PlayState()

    constructor(tbl, animationMap) {
        this.tbl = tbl
        this.inertia = false
        this.animationMap = animationMap

        window.keyframesPressed = (elem) => {
            if(this.playstate.playing) {
                elem.innerHTML = "Play"
            } else {
                elem.innerHTML = "Pause"
            }
            this.playstate.playing = !this.playstate.playing
        }


        window.resetKeyFrames = () => {
            this.reset()
        }

        window.setSpeed = value => {
            this.playstate.speed = value
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

        //todo: our own alert system
        if(!infoFile) {
            alert("Need an animation.json file") //todo: maybe just infer the animation  timeings?
            return
        }
        if(files.length == 0) {
            alert("No poses uploaded")
            return
        }


        const readFile = file => {
            return new Promise((resolve, reject) => {
                let reader = new FileReader()
                reader.onload = event => resolve(event.target.result)
                reader.onerror = error => reject(error)
                reader.readAsBinaryString(file)
              })
        }

        
        return (async() => {
        
            let promiseFiles = tblFiles.map(file => TBLModel.loadModel(readFile(file), file.name))
            let result = await Promise.all([...promiseFiles, readFile(infoFile)])

            let info = JSON.parse(result.pop())
            let baseTime = info.base_time

            result.sort((a, b) => a.fileName.localeCompare(b.fileName))
            
            let startTime = 0;
            let f =0
            for(let pose of result) {
                let keyframe = new KeyFrame(this)

                keyframe.startTime = startTime
                // if(f == 1) keyframe.startTime -= 1
                keyframe.duration = baseTime
                f+=1

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
            this.reset()
            return ""
        })()
    }

    arrEqual(arr1, arr2) {
        return arr1[0] == arr2[0] && arr1[1] == arr2[1] && arr1[2] == arr2[2]
    }

    reset() {
        this.playstate.ticks = 0;
        this.tbl.resetAnimations()
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
            setupKeyframes.forEach(skf => skf.animate(kf.startTime))
            kf.doSetup();
            setupKeyframes.push(kf);
        }
        this.tbl.resetAnimations()
    }
}

class KeyFrame {
    handler

    startTime = 0; 
    duration = 0;
    rotationMap = new Map();
    rotationPointMap = new Map();

    fromRotationMap = new Map()
    fromRotationPointMap = new Map()

    setup = false

    percentageDone

    constructor(handler) {
        this.handler = handler
    }

    doSetup() {
        this.setup = true
        for(let [cubename, entry] of this.handler.animationMap.entries()) {
            this.fromRotationMap.set(cubename, [entry.rotation.x, entry.rotation.y, entry.rotation.z].map(r => r * 180/Math.PI))
            this.fromRotationPointMap.set(cubename, entry.position.toArray())
        }
    }

    animate(ticks) {
        if(!this.setup) {
            return
        }
        
        this.percentageDone = (ticks - this.startTime) / this.duration
        if(this.percentageDone < 0 || this.percentageDone > 1) {
            return
        }

 
        if(this.handler.inertia) {
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

class PlayState {
    ticks = 0;
    speed = 1;
    playing = false;
    onFrame(deltaTime) {
        if(this.playing) {
            this.ticks += deltaTime * this.speed * 20 //t-p-s
        }
    }
}

function computeIfAbsent(map, key, valueFunc) {
    let value = map.get(key);
    if (value !== undefined)
      return value;
  
    let newValue = valueFunc(value);
    if (newValue !== undefined)
    map.set(key, newValue);
  
    return newValue;
  }



