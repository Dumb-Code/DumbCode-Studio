import { TBLModel } from './tbl_loader.js'
import { readFile } from './displays.js';

export class AnimationHandler {
    
    constructor(tbl) {
        this.tbl = tbl
        this.inertia = false
        this.looping = false

        this.totalTime = 0
        this.keyframes = []
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
            //todo: looping
        } else {
            this.keyframes.forEach(kf => kf.animate(this.playstate.ticks))
        }
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

        this.progressionPoints = [{required: true, x: 0, y: 1}, {required: true, x: 1, y: 0}]

        this.setup = false
    }

    renameCube(oldName, newName) {
        this.renameCubeMap(oldName, newName, this.rotationMap)
        this.renameCubeMap(oldName, newName, this.rotationPointMap)
    }

    renameCubeMap(oldName, newName, map) {
        map.set(newName, map.get(oldName))
        map.delete(oldName)
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

    animate(ticks) {
        this.animatePercentage(this.getProgressionValue((ticks - this.startTime) / this.duration))
    }

    animatePercentage(percentageDone) {
        if(percentageDone < 0) {
            return
        }

        if(percentageDone > 1) {
            percentageDone = 1
        }

        this.rotationMap.forEach((values, key) => {
            let cube = this.handler.tbl.cubeMap.get(key).cubeGroup
            let m = percentageDone*Math.PI/180
            cube.rotation.set(cube.rotation.x + values[0]*m, cube.rotation.y + values[1]*m, cube.rotation.z + values[2]*m)
        })

        this.rotationPointMap.forEach((values, key) => {
            let cube = this.handler.tbl.cubeMap.get(key).cubeGroup
            cube.position.set(cube.position.x + values[0]*percentageDone, cube.position.y + values[1]*percentageDone, cube.position.z + values[2]*percentageDone)
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


