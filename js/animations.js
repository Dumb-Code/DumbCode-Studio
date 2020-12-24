import { readFile } from "./displays.js"

export class AnimationHandler {
    
    constructor(tbl) {
        this.tbl = tbl
        this.looping = false

        this.forcedAnimationTicks = null
        this.keyframes = []
        this.loopKeyframe = false
        this.events = []
        this.keyframeInfo = []
        this.definedKeyframeInfo = new Map()
        this.playstate = new PlayState()
    }

    get totalTime() {
        return this.keyframes.map(kf => kf.startTime + kf.duration).reduce((a,b) => Math.max(a,b), 0)
    }

    get minTime() {
        return this.keyframes.map(kf => kf.startTime).reduce((a,b) => Math.min(a,b), Infinity)
    }

    renameCube(oldName, newName) {
        this.keyframes.forEach(kf => kf.renameCube(oldName, newName))
        if(this.loopKeyframe) {
            this.loopKeyframe.renameCube(oldName, newName)
        }
    }

    animate(deltaTime) {
        this.playstate.onFrame(deltaTime)

        let visibleFrames = this.keyframeInfo.filter(i => i.visible).map(i => i.id)

        let ticks = this.forcedAnimationTicks === null ? this.playstate.ticks : this.forcedAnimationTicks
        if(this.looping) {
            //todo: looping
        } else {
            this.keyframes.filter(kf => visibleFrames.includes(kf.layer)).forEach(kf => kf.animate(ticks))
        }
    }

    createKeyframe() {
        let kf = new KeyFrame(this)
        this.keyframes.push(kf)
        return kf
    }

    createLayerInfo(id) {
        let data = { 
            id, 
            visible: true,
            locked: false,
            name: `Layer ${id}`,
            definedMode: false,
        }
        this.keyframeInfo.push(data)
        return data
    }

    ensureLayer(id) {
        if(!this.keyframeInfo.some(layer => layer.id === id)) {
            return this.createLayerInfo(id)
        }
        return this.keyframeInfo.find(layer => layer.id === id)
    }

    removeDefinedLayers(id) {
        this.keyframes.filter(kf => kf.layer == id).forEach(kf => this.definedKeyframeInfo.delete(kf))
    }

    ensureDefinedLayers() {
        this.keyframes
        .filter(kf => this.ensureLayer(kf.layer).definedMode === true)
        .filter(kf => !this.definedKeyframeInfo.has(kf))
        .forEach(kf => this.updateDefinedKeyframe(kf))
    }

    updateDefinedKeyframe(keyframe) {
        if(this.ensureLayer(keyframe.layer).definedMode !== true) {
            return
        }
        this.tbl.resetAnimations()
        this.forcedAnimationTicks = keyframe.startTime + keyframe.duration
        this.animate(0)
        this.forcedAnimationTicks = null
        let data = { rot:{}, pos:{}, cg: {} }
        this.tbl.cubeMap.forEach((cube, name) => {
            data.rot[name] = cube.cubeGroup.rotation.toArray()
            data.pos[name] = cube.cubeGroup.position.toArray()
            data.cg[name] =  cube.cubeMesh.scale.toArray().map((e, i) => (e-cube.dimension[i]) / 2)
        })
        this.definedKeyframeInfo.set(keyframe, data)
    }

    fixDefinedLayers(keyframe) {
        if(this.ensureLayer(keyframe.layer).definedMode !== true) {
            return
        }
        let layerKfs = this.keyframes.filter(kf => kf.layer === keyframe.layer && kf !== keyframe)
        
        let toEditKeyframes = []
        //Get the keyframe whose end position is either during the keyframe,
        //Or is the first after the keyframe is finished
        let minimumLayerEndValue = Infinity
        let minimumKeyframe = null
        layerKfs.forEach(kf => {
            let endTime = kf.startTime + kf.duration

            if(endTime > keyframe.startTime && endTime < keyframe.startTime + keyframe.duration) {
                toEditKeyframes.push(kf)
            } else {
                let deltaEndTime = endTime - keyframe.startTime-keyframe.duration
                if(deltaEndTime > 0 && deltaEndTime < minimumLayerEndValue) {
                    minimumLayerEndValue = deltaEndTime
                    minimumKeyframe = kf
                }
            }
        })

        if(minimumKeyframe != null) {
            toEditKeyframes.push(minimumKeyframe)
        }

        toEditKeyframes.sort(kf => kf.startTime + kf.duration).forEach(kf => {
            let targetMap = this.definedKeyframeInfo.get(kf)
            this.tbl.resetAnimations()
            this.forcedAnimationTicks = kf.startTime + kf.duration
            this.animate(0)
            this.forcedAnimationTicks = null

            this.tbl.cubeMap.forEach((cube, name) => {
                let tRot = targetMap.rot[name]
                let rot = cube.cubeGroup.rotation.toArray()
                if(tRot[0] !== rot[0] || tRot[1] !== rot[1] || tRot[2] !== rot[2]) {
                    let delta = [tRot[0]-rot[0], tRot[1]-rot[1], tRot[2]-rot[2]].map(v => v*180/Math.PI)
                    //map plus : target - current
                    if(kf.rotationMap.has(name)) {
                        kf.rotationMap.set(name, kf.rotationMap.get(name).map((v, i) => v + delta[i]))
                    } else {
                        kf.rotationMap.set(name, delta)
                    }
                    
                }

                let tPos = targetMap.pos[name]
                let pos = cube.cubeGroup.position.toArray()
                if(tPos[0] !== pos[0] || tPos[1] !== pos[1] || tPos[2] !== pos[2]) {
                    let delta = [tPos[0]-pos[0], tPos[1]-pos[1], tPos[2]-pos[2]]
                    //map plus : target - current
                    if(kf.rotationPointMap.has(name)) {
                        kf.rotationPointMap.set(name, kf.rotationPointMap.get(name).map((v, i) => v + delta[i]))
                    } else {
                        kf.rotationPointMap.set(name, delta)
                    } 
                }

                let tCg = targetMap.cg[name]
                let cg = cube.cubeMesh.scale.toArray().map((e, i) => (e-cube.dimension[i]) / 2)
                if(tCg[0] !== cg[0] || tCg[1] !== cg[1] || tCg[2] !== cg[2]) {
                    let delta = [tCg[0]-cg[0], tCg[1]-cg[1], tCg[2]-cg[2]]
                    //map plus : target - current
                    if(kf.cubeGrowMap.has(name)) {
                        kf.cubeGrowMap.set(name, kf.cubeGrowMap.get(name).map((v, i) => v + delta[i]))
                    } else {
                        kf.cubeGrowMap.set(name, delta)
                    } 
                }
            })

        })
    }
}

class KeyFrame {

    constructor(handler) {
        this.handler = handler

        this.layer = 0

        this.startTime = 0
        this.duration = 0

        this.rotationMap = new Map();
        this.rotationPointMap = new Map();
        this.cubeGrowMap = new Map();

        this.progressionPoints = [{required: true, x: 0, y: 1}, {required: true, x: 1, y: 0}]
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
        if(this.skip) {
            return
        }
        if(percentageDone < 0) {
            return
        }

        if(percentageDone > 1) {
            percentageDone = 1
        }


        this.rotationMap.forEach((values, key) => {
            let cube = this.handler.tbl.cubeMap.get(key)?.cubeGroup
            if(cube) {
                let m = percentageDone*Math.PI/180
                cube.rotation.set(cube.rotation.x + values[0]*m, cube.rotation.y + values[1]*m, cube.rotation.z + values[2]*m)
            }
        })

        this.rotationPointMap.forEach((values, key) => {
            let cube = this.handler.tbl.cubeMap.get(key)?.cubeGroup
            if(cube) {
                cube.position.set(cube.position.x + values[0]*percentageDone, cube.position.y + values[1]*percentageDone, cube.position.z + values[2]*percentageDone)
            }
        })

        this.cubeGrowMap.forEach((values, key) => {
            let cube = this.handler.tbl.cubeMap.get(key)?.cubeMesh
            if(cube) {
                cube.position.set(cube.position.x - values[0]*percentageDone, cube.position.y - values[1]*percentageDone, cube.position.z - values[2]*percentageDone)
                cube.scale.set(cube.scale.x + 2*values[0]*percentageDone, cube.scale.y + 2*values[1]*percentageDone, cube.scale.z + 2*values[2]*percentageDone)

                if(cube.scale.x === 0) {
                    cube.scale.x = 0.00001
                }
                if(cube.scale.y === 0) {
                    cube.scale.y = 0.00001
                }
                if(cube.scale.z === 0) {
                    cube.scale.z = 0.00001
                }
            }
        })
    }

    cloneKeyframe() {
        let kf = new KeyFrame(this.handler)
        kf.startTime = this.startTime
        kf.duration = this.duration

        kf.rotationMap = new Map(this.rotationMap)
        kf.rotationPointMap = new Map(this.rotationPointMap)

        kf.progressionPoints = this.progressionPoints.map(p => { return {...p} })

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
            this.ticks += deltaTime * this.speed
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

    writeBool(bool) {
        let buffer = new ArrayBuffer(1)
        let view = new DataView(buffer)
        view.setInt8(0, bool ? 1 : 0)
        this._addBuffer(buffer)
    }

    readNumber() {
        let veiw = new DataView(this.buffer)
        let num = veiw.getFloat32(this.offset)
        this.offset += 4
        return num
    }

    readInteger() {
        return Math.round(this.readNumber())
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

    readBool() {
        let veiw = new DataView(this.buffer)
        let bool = veiw.getInt8(this.offset) === 1 ? true : false
        this.offset += 1
        return bool
    }

    getAsBlob() {
        return new Blob([this.buffer])
    }

    getAsBase64() {
        return btoa(String.fromCharCode(...new Uint8Array(this.buffer)))
    }

    downloadAsFile(name) {
        let blob = new Blob([this.buffer]);
        let url = window.URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.click();
        window.URL.revokeObjectURL(url);
    }
}


