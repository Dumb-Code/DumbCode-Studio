import { TBLModel } from './tbl_loader.js'
import { Vector3 } from './three.js';

export class AnimationHandler {

    tbl;
    inertia;
    animationMap;
    defaultAnimationMap = new Map();
    keyframes = new Map() //time, [kf]
    playstate = new PlayState()

    constructor(tbl, animationMap) {
        this.tbl = tbl
        this.inertia = false
        this.animationMap = animationMap

        for(let [name, cube] of this.animationMap.entries()) {
            this.defaultAnimationMap.set(name, {rot: cube.rotation, pos: cube.position})
        }

        window.playKeyframes = () => {
            this.playstate.ticks = 0
        }
    }

    onAnimationFileChange(files) {
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

        
        (async() => {
        
            let promiseFiles = tblFiles.map(file => TBLModel.loadModel(readFile(file), file.name))
            let result = await Promise.all([...promiseFiles, readFile(infoFile)])

            let info = JSON.parse(result.pop())
            let baseTime = info.base_time

            result.sort((a, b) => a.fileName.localeCompare(b.fileName))

            let startTime = 0;
            for(let pose of result) {
                startTime += baseTime; //todo: time overrides ???
                let keyframe = new KeyFrame(this.animationMap, this.defaultAnimationMap)

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

                computeIfAbsent(this.keyframes, startTime, ()=>[]).push(keyframe)
            }
            this.reset()
            this.keyframesDirty()
        })()
    }

    arrEqual(arr1, arr2) {
        return arr1[0] == arr2[0] && arr1[1] == arr2[1] && arr1[2] == arr2[2]
    }

    reset() {
        this.playstate.ticks = 0;
    }

    animate(deltaTime) {
        this.playstate.onFrame(deltaTime)

        this.defaultAnimationMap.forEach((data, name) => {
            let cube = this.animationMap.get(name)
            
            cube.position.set(data.pos.x, data.pos.y, data.pos.z)
            cube.rotation.set(data.rot.x, data.rot.y, data.rot.z)
        })

        for(let kflist of this.keyframes.values()) {
            kflist.forEach(kf => kf.animate(this.playstate.ticks))
        }
    }

    keyframesDirty() {
        for(let kflist of this.keyframes.values()) {
            kflist.forEach(kf => kf.setup = false)
        }

        let sortedTimes = new Array(...this.keyframes.keys()).sort();

        let setupKeyframes = []
        for(let time of sortedTimes) {
            let kflist = this.keyframes.get(time)
            setupKeyframes.forEach(skf => skf.animate(time))
            kflist.forEach(kf => {
                kf.doSetup();
                setupKeyframes.push(kf);
            })
        }
    }
}

class KeyFrame {
    startTime = 0; 
    duration = 0;
    rotationMap = new Map();
    rotationPointMap = new Map();

    fromRotationMap = new Map()
    fromRotationPointMap = new Map()

    setup = false

    constructor(animationMap, defaultAnimationMap) {
        this.animationMap = animationMap
        this.defaultAnimationMap = defaultAnimationMap
    }

    doSetup() {
        this.setup = true
        for(let [cubename, entry] of this.animationMap.entries()) {
            this.fromRotationMap.set(cubename, [entry.rotation.x, entry.rotation.y, entry.rotation.z].map(r => r * 180/Math.PI))
            this.fromRotationPointMap.set(cubename, entry.position.toArray())
        }
    }

    animate(ticks) {
        if(!this.setup) {
            return
        }
        
        let percentageDone = (ticks - this.startTime) / this.duration
        if(percentageDone < 0) {
            return
        }
        if(percentageDone > 1) {
            percentageDone = 1
        }

        //TODO: only set axis if there is something to set. IE check with main model
        for(let [cubename, rotation] of this.rotationMap.entries()) {
            let data = this.defaultAnimationMap.get(cubename)
            let cube = this.animationMap.get(cubename);
            let irot = this.interpolate(this.fromRotationMap.get(cubename), rotation, percentageDone)

            cube.rotation.x += irot[0] * Math.PI / 180 - data.rot.x
            cube.rotation.y += irot[1] * Math.PI / 180 - data.rot.y
            cube.rotation.z += irot[2] * Math.PI / 180 - data.rot.z
        }

        for(let [cubename, position] of this.rotationPointMap.entries()) {
            let data = this.defaultAnimationMap.get(cubename)
            let cube = this.animationMap.get(cubename);
            let ipos = this.interpolate(this.fromRotationPointMap.get(cubename), position, percentageDone)

            cube.position.x += ipos[0] - data.pos.x
            cube.position.y += ipos[1] - data.pos.y
            cube.position.z += ipos[2] - data.pos.z

        }   
    }

    interpolate(prev, next, alpha) {
        let out = new Array(3)
        if(!prev || !next) {
            return out
        }
        out[0] = prev[0] + (next[0] - prev[0]) * alpha
        out[1] = prev[1] + (next[1] - prev[1]) * alpha
        out[2] = prev[2] + (next[2] - prev[2]) * alpha
    
        return out
    }
}

class PlayState {
    ticks;
    onFrame(deltaTime) {
        this.ticks += deltaTime * 10    //t-p-s
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



