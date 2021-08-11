/**
 * Handles the aniamtions. Instead of being in the root, this should be moved to the animation/ folder
 */
export class AnimationHandler {
    
    constructor(tbl) {
        this.tbl = tbl
        this.tbl.addEventListener("hierarchyChanged", () => this.updateLoopKeyframe())

        this.finishLooping = false
        this.finishLoopingMarker = false
        this.looping = true

        this.forcedAnimationTicks = null
        this.keyframes = []
        this.loopKeyframe = new KeyFrame(this)

        this.loopData = null
        
        this.events = []
        this.keyframeInfo = []
        this.ikaCubes = [] //Inverse kinematic anchor cubes
        this.definedKeyframeInfo = new Map() //TODO: make this work with animation mementos
        this.playstate = new PlayState()
    }

    /**
     * Get the total time. This is the time that the last keyframe ends
     */
    get totalTime() {
        return this.keyframes.map(kf => kf.startTime + kf.duration).reduce((a,b) => Math.max(a,b), 0)
    }

    /**
     * Gets the minimum time. This is the time where the first keyframe starts
     */
    get minTime() {
        let ret = this.keyframes.map(kf => kf.startTime).reduce((a,b) => Math.min(a,b), Infinity)
        if(ret == Infinity) {
            return 0 //Don't be infinity
        }
        return ret
    }

    /**
     * Called when a cube is renamed.
     * @param {string} oldName the old cube name
     * @param {string} newName the new cube name
     */
    renameCube(oldName, newName) {
        this.keyframes.forEach(kf => kf.renameCube(oldName, newName))
        this.loopKeyframe.renameCube(oldName, newName)

        if(this.ikaCubes.includes(oldName)) {
            this.ikaCubes.splice(this.ikaCubes.indexOf(oldName), 1, newName)
        }
    }

    /**
     * Animates the handler
     * @param {number} deltaTime The time since the last frame
     */
    animate(deltaTime) {
        let previousTicks = this.playstate.ticks
        this.playstate.onFrame(deltaTime)

        let visibleFrames = this.keyframeInfo.filter(i => i.visible).map(i => i.id)

        let ticks = this.forcedAnimationTicks === null ? this.playstate.ticks : this.forcedAnimationTicks
        
        //If the playstate is playing, and we don't ahve animation ticks
        if(this.playstate.playing && this.forcedAnimationTicks === null) {
            //If the finished marker is false, and this is looping and has looping data, and the ticks are larger than the start of the looping part:
            if(!this.finishLoopingMarker && this.looping && this.loopData !== null && ticks > this.loopData.start) {

                //If the ticks are after the looping end + the looping duration, then set the ticks back.
                if(ticks >= this.loopData.end+this.loopData.duration) {
                    ticks = this.loopData.start + ticks - (this.loopData.end+this.loopData.duration)
                    this.playstate.ticks = ticks
                }

                //TODO: if a layer is invisible, then the looping animation will look wrong. 
                // To fix this, have a looped keyframe for every layer (eh)
                // OR, call updateLoopKeyframe every time the visiblity is changed

                //If the ticks are larger than the end, then we animate the looping keyframe, and all the other keyframes at the end position
                if(ticks >= this.loopData.end) {
                    if(previousTicks < this.loopData.end && this.finishLooping) {
                        this.finishLoopingMarker = true
                        this.playstate.visibleTicks = null
                    } else {
                        let p = (ticks-this.loopData.end) / this.loopData.duration
                        this.playstate.visibleTicks = this.loopData.end + (this.loopData.start-this.loopData.end)*p
                        this.loopKeyframe.animate(ticks - this.loopData.end)
                        ticks = this.loopData.end
                    }
                    
                } else {
                    this.playstate.visibleTicks = null
                }
            }

            //If not finished looping but the finished looping marker is true, set it to false
            if(!this.finishLooping && this.finishLoopingMarker) {
                this.finishLoopingMarker = false
            }
        }

        //Animate all the visible keyframes
        this.keyframes.filter(kf => visibleFrames.includes(kf.layer)).forEach(kf => kf.animate(ticks))

    }

    /**
     * Updates the looping keyframe 
     */
    updateLoopKeyframe() {
        if(this.loopData === null) {
            return
        }
        this.loopKeyframe.rotationMap.clear()
        this.loopKeyframe.rotationPointMap.clear()
        this.loopKeyframe.cubeGrowMap.clear()

        let forceTicks = this.forcedAnimationTicks

        let loops = this.looping
        this.looping = false

        //Animate at the start of the loop
        this.forcedAnimationTicks = this.loopData.start
        this.tbl.resetAnimations()
        this.animate(0)
        let dataStart = this.captureData()

        //Animate at the end of the loop
        this.forcedAnimationTicks = this.loopData.end
        this.tbl.resetAnimations()
        this.animate(0)
        let dataEnd = this.captureData()

        //Subtract the arrays. Figure out what it takes to go from end to start
        let subArrays = (arr1, arr2) => {
            let arr = []
            for(let i = 0; i < 3; i++) {
                arr.push(arr1[i] - arr2[i])
            }
            return arr
        }
        this.tbl.cubeMap.forEach((_, name) => {
            this.loopKeyframe.rotationMap.set(name, subArrays(dataStart.rot[name], dataEnd.rot[name]))
            this.loopKeyframe.rotationPointMap.set(name, subArrays(dataStart.pos[name], dataEnd.pos[name]))
            this.loopKeyframe.cubeGrowMap.set(name, subArrays(dataStart.cg[name], dataEnd.cg[name]))
        })

        this.loopKeyframe.duration = this.loopData.duration

        this.forcedAnimationTicks = forceTicks
        this.looping = loops
    }

    /**
     * Creates a new keyframe and adds it to the keyframe list 
     */
    createKeyframe() {
        let kf = new KeyFrame(this)
        this.keyframes.push(kf)
        return kf
    }

    /**
     * Creates new layer info with a spefic id
     * @param {number} id the keyframe id
     */
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

    /**
     * Gets a spefic layer id, or creates one if there isn't one
     * @param {number} id the id to get
     */
    ensureLayer(id) {
        if(!this.keyframeInfo.some(layer => layer.id === id)) {
            return this.createLayerInfo(id)
        }
        return this.keyframeInfo.find(layer => layer.id === id)
    }

    /**
     * Removes the layer's keyframes from the defined info list.
     * @param {*} id the id to remove 
     */
    removeDefinedLayers(id) {
        this.keyframes.filter(kf => kf.layer == id).forEach(kf => this.definedKeyframeInfo.delete(kf))
    }

    /**
     * Ensures the defined layers are updated.
     */
    ensureDefinedLayers() {
        this.keyframes
        .filter(kf => this.ensureLayer(kf.layer).definedMode === true)
        .filter(kf => !this.definedKeyframeInfo.has(kf))
        .forEach(kf => this.updateDefinedKeyframe(kf))
    }

    /**
     * Updates the defined layer for the keyframe. Essentially captures the data at the end of the keyframe
     * @param {Keyframe} keyframe the keyframe
     */
    updateDefinedKeyframe(keyframe) {
        if(this.ensureLayer(keyframe.layer).definedMode !== true) {
            return
        }
        this.tbl.resetAnimations()
        this.forcedAnimationTicks = keyframe.startTime + keyframe.duration
        this.animate(0)
        this.forcedAnimationTicks = null
        
        this.definedKeyframeInfo.set(keyframe, this.captureData())
    }

    /**
     * Captures the current state of the model into an object
     */
    captureData() {
        let data = { rot:{}, pos:{}, cg: {} }
        this.tbl.cubeMap.forEach((cube, name) => {
            data.rot[name] = cube.cubeGroup.rotation.toArray()
            data.pos[name] = cube.cubeGroup.position.toArray()
            data.cg[name] = cube.cubeGrowGroup.position.toArray()
        })
        return data
    }

    /**
     * Fixes the defined layers. Used to ensure the end of a keyframe stays consistent
     * @param {Keyframe} keyframe the keyframe
     */
    fixDefinedLayers(keyframe, includeSelf = false) {
        if(this.ensureLayer(keyframe.layer).definedMode !== true) {
            return
        }
        let layerKfs = this.keyframes.filter(kf => kf.layer === keyframe.layer && kf !== keyframe)
        
        let toEditKeyframes = []
        if(includeSelf) {
            toEditKeyframes.push(keyframe)
        }

        //Get the keyframe whose end position is either during the keyframe,
        //Or is the first after the keyframe is finished
        let minimumLayerEndValue = Infinity
        let minimumKeyframe = null
        layerKfs.forEach(kf => {
            let endTime = kf.startTime + kf.duration

            if(
                (endTime > keyframe.startTime && endTime < keyframe.startTime + keyframe.duration) ||
                (endTime > keyframe.previousStartTime && endTime < keyframe.previousStartTime + keyframe.previousDuration)
            ) {
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

        keyframe.previousStartTime = keyframe.startTime
        keyframe.previousDuration = keyframe.duration

        //Iterate over all the keyframes to edit.
        //Ensure that the end of the keyframe stays consistent, even when the keyframe before it changes
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
                let cg = cube.cubeGrowGroup.position.toArray()
                if(tCg[0] !== cg[0] || tCg[1] !== cg[1] || tCg[2] !== cg[2]) {
                    //The reason it's cg-tCg instead of tCg-cg, is that cubeGrowGroup.position is -1* the actual cube grow
                    let delta = [cg[0]-tCg[0], cg[1]-tCg[1], cg[2]-tCg[2]]
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

/**
 * Keyframe class. Stores infomation about the keyframe
 */
class KeyFrame {

    constructor(handler) {
        this.handler = handler

        this.layer = 0

        this.startTime = 0
        this.duration = 0

        this.previousStartTime = 0
        this.previousDuration = 0

        this.rotationMap = new Map();
        this.rotationPointMap = new Map();
        this.cubeGrowMap = new Map();

        this.progressionPoints = [{required: true, x: 0, y: 1}, {required: true, x: 1, y: 0}]
    }
    
    /**
     * Renames a cube
     * @param {string} oldName old name
     * @param {string} newName new name
     */
    renameCube(oldName, newName) {
        this.renameCubeMap(oldName, newName, this.rotationMap)
        this.renameCubeMap(oldName, newName, this.rotationPointMap)
    }

    /**
     * Renames the entries in a map
     * @param {string} oldName old name
     * @param {string} newName new name
     * @param {Map} map the map to rename
     */
    renameCubeMap(oldName, newName, map) {
        map.set(newName, map.get(oldName))
        map.delete(oldName)
    }

    /**
     * Gets the value on the progression point graph used for the keyframe. 
     * Progression points need to be sorted. To sort progression points, call `resortPointsDirty`
     * @param {number} basePercentage 0 being the start of the keyframe, 1 being the end
     */
    getProgressionValue(basePercentage) {
        if(basePercentage)
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

    /**
     * Animates the keyframe at a spefic time
     * @param {number} animationTicks the time to animate at
     */
    animate(animationTicks) {
        //If below 0, then don't even bother animating
        let ticks = (animationTicks - this.startTime) / this.duration
        if(ticks <= 0 || this.skip) {
            return
        }
        //Clamp at 1
        if(ticks > 1) {
            ticks = 1
        }
        this.animatePercentage(this.getProgressionValue(ticks))
    }

    /**
     * Animates the keyframe at a spefic time
     * @param {number} percentageDone the time 0-1 of this keyframe being compleated
     */
    animatePercentage(percentageDone) {
        //Animate the rotation
        this.rotationMap.forEach((values, key) => {
            let cube = this.handler.tbl.cubeMap.get(key)?.cubeGroup
            if(cube) {
                let m = percentageDone*Math.PI/180
                cube.rotation.set(cube.rotation.x + values[0]*m, cube.rotation.y + values[1]*m, cube.rotation.z + values[2]*m)
            }
        })

        //Animate the position
        this.rotationPointMap.forEach((values, key) => {
            let cube = this.handler.tbl.cubeMap.get(key)?.cubeGroup
            if(cube) {
                cube.position.set(cube.position.x + values[0]*percentageDone, cube.position.y + values[1]*percentageDone, cube.position.z + values[2]*percentageDone)
            }
        })

        //Animate the cube grow
        this.cubeGrowMap.forEach((values, key) => {
            let cube = this.handler.tbl.cubeMap.get(key)
            if(cube) {
                let cm = cube.cubeMesh
                let cgg = cube.cubeGrowGroup

                cgg.position.set(cgg.position.x - values[0]*percentageDone, cgg.position.y - values[1]*percentageDone, cgg.position.z - values[2]*percentageDone)
                cm.scale.set(cm.scale.x + 2*values[0]*percentageDone, cm.scale.y + 2*values[1]*percentageDone, cm.scale.z + 2*values[2]*percentageDone)

                //0 scale fucks up some three.js stuff, we need to account for that
                if(cm.scale.x === 0) {
                    cm.scale.x = 0.00001
                }
                if(cm.scale.y === 0) {
                    cm.scale.y = 0.00001
                }
                if(cm.scale.z === 0) {
                    cm.scale.z = 0.00001
                }
            }
        })
    }

    /**
     * Clones this keyframe.
     */
    cloneKeyframe(fullCopy = true) {
        let kf = new KeyFrame(this.handler)
        kf.startTime = this.startTime
        kf.duration = this.duration
        kf.layer = this.layer

        if(fullCopy === true) {
            kf.rotationMap = new Map(this.rotationMap)
            kf.rotationPointMap = new Map(this.rotationPointMap)
            kf.cubeGrowMap = new Map(this.cubeGrowMap)
    
            kf.progressionPoints = this.progressionPoints.map(p => { return {...p} })
        }
        

        return kf
    }

    /**
     * Sorts the progresion point by x coordinate
     */
    resortPointsDirty() {
        this.progressionPoints = this.progressionPoints.sort((p1, p2) => p1.x - p2.x)
    }
}

/**
 * The playstate. Holds information about the time of the animation, and the speed
 */
export class PlayState {
    constructor() {
        this.ticks = 0
        this.visibleTicks = null
        this.speed = 1
        this.playing = false
    }
    onFrame(deltaTime) {
        if(this.playing) {
            this.ticks += deltaTime * this.speed
        }
    }
}

/**
 * ByteBuffer is an io thing used to read/write to and from files.
 * This should not be here, it's only here as it used to only be used with .dca, which was handled here
 * Move ASAP
 * 
 * Also this can most likey be rewritten. It's one of the oldest pieces of code.
 */
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


