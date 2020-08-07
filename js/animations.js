import { TBLModel } from './tbl_loader.js'
import { readFile } from './displays.js';

export class AnimationHandler {
    
    constructor(tbl) {
        this.tbl = tbl
        this.inertia = false
        this.looping = false

        this.totalTime = 0
        this.keyframes = []
        this.sortedTimes = []
        this.loopKeyframe = false
        this.events = []
        this.playstate = new PlayState()
    }

    renameCube(oldName, newName) {
        this.keyframes.forEach(kf => kf.renameCube(oldName, newName))
        if(this.loopKeyframe) {
            this.loopKeyframe.renameCube(oldName, newName)
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
        this.keyframes = this.readFromAnimationFiles(result, info)
        this.keyframesDirty()
    }

    readFromAnimationFiles(files, meta = { base_time: 5 }) {
        let keyframes = []

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
                let posArr = this.tbl.cubeMap.get(poseCube.name).rotationPoint
                let rotArr = this.tbl.cubeMap.get(poseCube.name).rotation
                keyframe.rotationPointMap.set(poseCube.name, poseCube.rotationPoint.map((item, index) => item - posArr[index]))
                keyframe.rotationMap.set(poseCube.name, poseCube.rotation.map((item, index) => item - rotArr[index]))
            })

            startTime += baseTime; //todo: time overrides ???

            keyframes.push(keyframe)

        }
        return keyframes
    }

    readDCAFile(buffer) {
        let version = buffer.readNumber()

        if(version < 1) {
            buffer.useOldString = true
        }

        let length = buffer.readNumber()

        let keyframes = []

        for(let i = 0; i < length; i++) {
            let kf = this.createKeyframe()

            kf.startTime = buffer.readNumber()
            kf.duration  = buffer.readNumber()

            let rotSize = buffer.readNumber()
            for(let r = 0; r < rotSize; r++) {
                kf.rotationMap.set(buffer.readString(), [buffer.readNumber(), buffer.readNumber(), buffer.readNumber()])
            }

            let posSize = buffer.readNumber()
            for(let p = 0; p < posSize; p++) {
                kf.rotationPointMap.set(buffer.readString(), [buffer.readNumber(), buffer.readNumber(), buffer.readNumber()])
            }

            if(version >= 2) {
                let ppSize = buffer.readNumber()
                for(let p = 0; p < ppSize; p++) {
                    kf.progressionPoints.push({ x: buffer.readNumber(), y: buffer.readNumber() })
                }
                kf.resortPointsDirty()
            }
            this.repairKeyframe(kf, version)

            keyframes.push(kf)
        }
        return keyframes
    }

    repairKeyframe(kf, version) {
        if(version < 3) {
            //transform from absolute to relative by subtracting the base tbl model
            let map = this.tbl.cubeMap

            kf.rotationMap.forEach((arr, key) => this.transformArr(arr, (item, index) => item - map.get(key).rotation[index]))
            kf.rotationPointMap.forEach((arr, key) => this.transformArr(arr, (item, index) => item - map.get(key).rotationPoint[index]))
        }
    }

    transformArr(arr, func) {
        for(let i = 0; i < arr.length; i++) {
            arr[i] = func(arr[i], i)
        }
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
            this.sortedTimes.forEach(kf => kf.animate(this.playstate.ticks))
        }
    }
    
    keyframesDirty() {
        if(this.keyframes.length === 0) {
            this.sortedTimes.length = 0
            this.totalTime = 0
            this.loopKeyframe = false
            this.tbl.resetAnimations()
            return
        }
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

        this.loopKeyframe.putValuesIntoMap(false)

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

        this.layerId = 0

        this.startTime = 0
        this.duration = 0

        this.rotationMap = new Map();
        this.rotationPointMap = new Map();

        this.fromRotationMap = new Map()
        this.fromRotationPointMap = new Map()

        this.progressionPoints = [{required: true, x: 0, y: 1}, {required: true, x: 1, y: 0}]

        this.setup = false

        this.percentageDone
    }

    doSetup() {
        this.setup = true
        this.fromRotationMap.clear()
        this.fromRotationPointMap.clear()
        this.putValuesIntoMap(true)
    }

    renameCube(oldName, newName) {
        this.renameCubeMap(oldName, newName, this.rotationMap)
        this.renameCubeMap(oldName, newName, this.rotationPointMap)
        this.renameCubeMap(oldName, newName, this.fromRotationMap)
        this.renameCubeMap(oldName, newName, this.fromRotationPointMap)
    }

    renameCubeMap(oldName, newName, map) {
        map.set(newName, map.get(oldName))
        map.delete(oldName)
    }


    putValuesIntoMap(from) {
        let rotation = from ? this.fromRotationMap : this.rotationMap
        let position = from ? this.fromRotationPointMap : this.rotationPointMap

        this.handler.tbl.cubeMap.forEach((cube, cubename) => {
            let entry = cube.cubeGroup
            rotation.set(cubename, [entry.rotation.x, entry.rotation.y, entry.rotation.z].map(r => r * 180/Math.PI).map((e, i) => e - cube.rotation[i]))
            position.set(cubename, entry.position.toArray().map((e, i) => e - cube.rotationPoint[i]))
        })

    }

    getProgressionValue(basePercentage) {
        for(let i = 0; i < this.progressionPoints.length - 1; i++) {
            let point = this.progressionPoints[i]
            let next = this.progressionPoints[i + 1]

            if(basePercentage > point.x && basePercentage < next.x) {
                let interpolateBetweenAmount = (basePercentage - point.x) / (next.x - point.x)
                return 1 - (point.y + (next.y - point.y) * interpolateBetweenAmount)
            }
        }
        return basePercentage //Shouldn't happen. There should always be at least the first and last progression point
    }

    animate(ticks, settingup = false) {
        if(!this.setup) {
            return
        }
        
        this.percentageDone = this.getProgressionValue((ticks - this.startTime) / this.duration)
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
            // this.percentageDone = Math.sin((this.percentageDone - 0.5) * Math.PI) / 2 + 0.5
        }

        this.handler.tbl.cubeMap.forEach((tabulaCube, key) => {
            let cube = tabulaCube.cubeGroup

            let baseRot = tabulaCube.rotation
            let irot
            if(this.rotationMap.has(key)) {
                irot = this.interpolate(this.fromRotationMap.get(key), this.rotationMap.get(key))
            } else {
                irot = this.fromRotationMap.get(key)
            }
            cube.rotation.set((baseRot[0] + irot[0]) * Math.PI / 180, (baseRot[1] + irot[1]) * Math.PI / 180, (baseRot[2] + irot[2]) * Math.PI / 180)

            let basePos = tabulaCube.rotationPoint
            let ipos
            if(this.rotationPointMap.has(key)) {
                ipos = this.interpolate(this.fromRotationPointMap.get(key), this.rotationPointMap.get(key))
            } else {
                ipos = this.fromRotationPointMap.get(key)
            }
            cube.position.set(basePos[0] + ipos[0], basePos[1] + ipos[1], basePos[2] + ipos[2])
        })
    }

    cloneKeyframe() {
        let kf = new KeyFrame(this.handler)
        kf.startTime = this.startTime
        kf.duration = this.duration

        kf.rotationMap = new Map(this.rotationMap)
        kf.rotationPointMap = new Map(this.rotationPointMap)

        kf.progressionPoints = [...this.progressionPoints]

        return kf
    }

    resortPointsDirty() {
        this.progressionPoints = this.progressionPoints.sort((p1, p2) => p1.x - p2.x)
    }

    getPosition(cubename) {
        let cube = this.handler.tbl.cubeMap.get(cubename)
        let pos
        if(this.rotationPointMap.has(cubename)) {
            pos = this.rotationPointMap.get(cubename).slice(0)
        } else {
            pos = this.fromRotationPointMap.get(cubename).slice(0)
        } 
        return pos.map((v, i) => v + cube.rotationPoint[i])
    }

    getRotation(cubename) {
        let cube = this.handler.tbl.cubeMap.get(cubename)
        let rot
        if(this.rotationMap.has(cubename)) {
            rot = this.rotationMap.get(cubename).slice(0)
        } else {
            rot = this.fromRotationMap.get(cubename).slice(0)
        } 
        return rot.map((v, i) => v + cube.rotation[i])
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

export class ByteBuffer {
    constructor(buffer = new ArrayBuffer(0)) {
        this.offset = 0
        this.buffer = buffer
        this.useOldString = false
    }

    _addBuffer(buffer) {
        let tmp = new Uint8Array(this.buffer.byteLength + buffer.byteLength)
        tmp.set(new Uint8Array(this.buffer), 0)
        tmp.set(new Uint8Array(buffer), this.buffer.byteLength)
        this.buffer = tmp.buffer
    }

    writeNumber(num) {
        let buffer = new ArrayBuffer(4)
        let veiw = new DataView(buffer)
        veiw.setFloat32(0, num)
        this._addBuffer(buffer)
    }

    writeString(str) {
        let arr = new TextEncoder().encode(str).buffer

        //write the length
        let buffer = new ArrayBuffer(2)
        let veiw = new DataView(buffer)
        veiw.setInt16(0, arr.byteLength)
        this._addBuffer(buffer)

        this._addBuffer(arr)
    }

    readNumber() {
        let veiw = new DataView(this.buffer)
        let num = veiw.getFloat32(this.offset)
        this.offset += 4
        return num
    }

    readString() {
        //read the length
        let length
        if(this.useOldString) {
            length = this.readNumber()
        } else {
            let veiw = new DataView(this.buffer)
            length = veiw.getInt16(this.offset)
            this.offset += 2
        }

        this.offset += length
        return new TextDecoder().decode(this.buffer.slice(this.offset - length, this.offset))
    }
}


