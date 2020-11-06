import { ByteBuffer } from "../../animations.js"
import { runMirrorMath } from "../../modeling/cube_commands.js"
import { MeshLambertMaterial, Vector3 } from "../../three.js"

const rotArr = new Array(3)
const posArr = new Array(3)

let dummyMaterial = new MeshLambertMaterial()

let worldPos = new Vector3(8/16, 12/16, 0)
let worldX = new Vector3(1, 0, 0)
let worldY = new Vector3(0, 1, 0)

export class DCALoader {}

DCALoader.importAnimation = (handler, buffer) => {
    let version = buffer.readNumber()
    if(version < 1) {
        buffer.useOldString = true
    }

    let length = buffer.readNumber()

    handler.keyframes = []

    for(let i = 0; i < length; i++) {
        let kf = handler.createKeyframe()

        kf.startTime = buffer.readNumber()
        kf.duration  = buffer.readNumber()
        if(version >= 4) {
            kf.layer = Math.round(buffer.readNumber())
        }
          

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
            kf.progressionPoints.length = 0
            for(let p = 0; p < ppSize; p++) {
                kf.progressionPoints.push({ required: p<2, x: buffer.readNumber(), y: buffer.readNumber() })
            }
            kf.progressionPoints = kf.progressionPoints.filter(p => p.required || p.x > 0 || p.x < 1)
            kf.resortPointsDirty()
        }
    }

    if(version >= 4) {
        let eventSize = buffer.readNumber()
        for(let e = 0; e < eventSize; e++) {
            let time = buffer.readNumber()
            let data = []
            let dataSize = buffer.readNumber()
            for(let d = 0; d < dataSize; d++) {
                data.push({ type: buffer.readString(), data: buffer.readString() })
            }
            handler.events.push({ time, data })
        }
    }

    DCALoader.repairKeyframes(handler, version, version <= 4)
}

DCALoader.repairKeyframes = (handler, version, shouldFlip = false) => {
    if(version <= 4) {
        let calculationModel = null
        let flippedActualInfo = []
        let absoluteModel = handler.tbl

        if(shouldFlip === true) {
            calculationModel = handler.tbl.cloneModel()
            calculationModel.createModel(dummyMaterial)
            handler.tbl = createMirrorCopyModel(handler.tbl)
        }
        
        let map = handler.tbl.cubeMap

        if(version === 3) {
            handler.keyframes.forEach(kf => {
                kf.rotationMap.forEach((arr, key) => transformArr(arr, map.get(key)?.rotation))
                kf.rotationPointMap.forEach((arr, key) => transformArr(arr, map.get(key)?.rotationPoint))
            })
        }

        let previousRotation = new Map()
        let sorted = [...handler.keyframes].sort((a, b) => a.startTime - b.startTime)
        sorted.forEach((kf, index) => {
            handler.tbl.resetAnimations()
            handler.keyframes.forEach(_kf => _kf.animate(kf.startTime))

            if(version <= 3) {
                let next = sorted[index+1]

                let mod = 1
                if(next !== undefined) {
                    let dist = next.startTime - kf.startTime
                    //Keyframes intersect
                    if(dist < kf.duration) {
                        mod = dist / kf.duration
                        kf.duration = dist
                    }
                }
                kf.rotationMap.forEach((arr, key) => {
                    map.get(key).cubeGroup.rotation.toArray(rotArr)
                    for(let i = 0; i < 3; i++) {
                        arr[i] = (arr[i] - rotArr[i]*180/Math.PI) * mod
                    }
                })
                kf.rotationPointMap.forEach((arr, key) => {
                    map.get(key).cubeGroup.position.toArray(posArr)
                    for(let i = 0; i < 3; i++) {
                        arr[i] = (arr[i] - posArr[i]) * mod
                    }
                })
            }
            
            if(shouldFlip == true) {
                calculationModel.modelCache.updateMatrix()
                calculationModel.modelCache.updateMatrixWorld(true)

                calculationModel.traverseAll(dst => {
                    let src = map.get(dst.name)
                    let pos = src.cubeGroup.position
                    let rot = src.cubeGroup.rotation
                    dst.updatePosition([pos.x, pos.y, pos.z])
                    dst.updateRotation([rot.x, rot.y, rot.z].map(i => i*180/Math.PI))
                    dst.updateOffset([...src.offset])
                })

                calculationModel.modelCache.updateMatrixWorld(true)
                runMirrorMath(worldPos, worldY, null, calculationModel, false)
                runMirrorMath(worldPos, worldX, null, calculationModel, false)
                calculationModel.modelCache.updateMatrixWorld(true)
                
                let data = {
                    rotation: new Map(),
                    position: new Map(),

                    wholeRotationState: new Map()
                }



                calculationModel.cubeMap.forEach((cube, key) => {
                    let rotation = cube.cubeGroup.rotation
                    let rot = [rotation.x, rotation.y, rotation.z].map(i => i*180/Math.PI)

                    if(kf.rotationMap.has(key)) {
                        data.rotation.set(key, rot)
                    }

                    data.wholeRotationState.set(key, rot)
                })

                kf.rotationPointMap.forEach((_, key) => {
                    let position = calculationModel.cubeMap.get(key).cubeGroup.position
                    data.position.set(key, [position.x, position.y, position.z])
                })

                data.layer = kf.layer
                data.startTime = kf.startTime
                data.duration = kf.duration
                data.progressionPoints = kf.progressionPoints

                flippedActualInfo.push(data)                
            }
        })
        handler.tbl = absoluteModel
        if(shouldFlip === true) {
            recreateAndRerunMirrorKeyframes(handler, flippedActualInfo)
        }
    }
}

function recreateAndRerunMirrorKeyframes(handler, flippedActualInfo) {
    handler.keyframes = []
    
    let previousArray = new Map()
    flippedActualInfo.forEach(data => {
        let kf = handler.createKeyframe()

        kf.layer = data.layer
        kf.startTime = data.startTime
        kf.duration = data.duration
        kf.progressionPoints = data.progressionPoints
        kf.rotationMap = data.rotation
        kf.rotationPointMap = data.position

        //Because of the mirror math, sometimes the rotation can change by 360 degrees.
        //The code below is to detect that and fix it.
        data.wholeRotationState.forEach((arr, key) => {
            if(previousArray.has(key)) {
                let prev = previousArray.get(key)
                for(let i = 0; i < 3; i++) {
                    let delta = prev[i] - arr[i]
                    if(Math.abs(delta) > 180) {
                        let newP = arr[i] + Math.sign(delta)*360
                        arr[i] = newP
                        if(kf.rotationMap.has(key)) {
                            kf.rotationMap.get(key)[i] = newP
                        }
                    }
                }
            }
            previousArray.set(key, arr)
        })
    })

    DCALoader.repairKeyframes(handler, 2)
}

function createMirrorCopyModel(modelIn) {
    let model = modelIn.cloneModel()
    model.createModel(dummyMaterial)
    model.modelCache.updateMatrix()
    model.modelCache.updateMatrixWorld(true)


    let allCubes = []
    model.traverseAll(cube => allCubes.push(cube))

    runMirrorMath(worldPos, worldY, allCubes, model, false)
    runMirrorMath(worldPos, worldX, allCubes, model, false)

    model.modelCache.updateMatrix()
    model.modelCache.updateMatrixWorld(true)

    return model
}

function transformArr(arr, subValue) {
    if(subValue === null) {
        return
    }
    for(let i = 0; i < 3; i++) {
        arr[i] = arr[i] + subValue[i]
    }
}

DCALoader.exportAnimation = handler => {
    let buffer = new ByteBuffer()
    buffer.writeNumber(5)
    buffer.writeNumber(handler.keyframes.length)
    
    handler.keyframes.forEach(kf => {
        buffer.writeNumber(kf.startTime)
        buffer.writeNumber(kf.duration)
        buffer.writeNumber(kf.layer)

        buffer.writeNumber(kf.rotationMap.size);
        [...kf.rotationMap.keys()].sort().forEach(name => {
            let entry = kf.rotationMap.get(name)
            buffer.writeString(name)
            buffer.writeNumber(entry[0])
            buffer.writeNumber(entry[1])
            buffer.writeNumber(entry[2])
        })

        buffer.writeNumber(kf.rotationPointMap.size);
        [...kf.rotationPointMap.keys()].sort().forEach(name => {
            let entry = kf.rotationPointMap.get(name)
            buffer.writeString(name)
            buffer.writeNumber(entry[0])
            buffer.writeNumber(entry[1])
            buffer.writeNumber(entry[2])
        })

        buffer.writeNumber(kf.progressionPoints.length);
        [...kf.progressionPoints].sort(p => p.required ? -1 : 1).forEach(p => {
            buffer.writeNumber(p.x)
            buffer.writeNumber(p.y)
        })
    })

    buffer.writeNumber(handler.events.length)
    handler.events.forEach(event => {
        buffer.writeNumber(event.time)
        buffer.writeNumber(event.data.length)
        event.data.forEach(datum => {
            buffer.writeString(datum.type)
            buffer.writeString(datum.data)
        })
    })
    return buffer
}