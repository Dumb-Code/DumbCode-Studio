import { ByteBuffer } from "../../animations.js"
import { LinkedElement } from "../../util.js"

const rotArr = new Array(3)
const posArr = new Array(3)

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

        if(version >= 7) {
            let cgSize = buffer.readNumber()
            for(let c = 0; c < cgSize; c++) {
                kf.cubeGrowMap.set(buffer.readString(), [buffer.readNumber(), buffer.readNumber(), buffer.readNumber()])
            }
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
    DCALoader.repairKeyframes(handler, version)
}

DCALoader.repairKeyframes = (handler, version, alreadyFlipped = false) => {
    if(version <= 3) {        
        let map = handler.tbl.cubeMap
        if(version === 3) {
            handler.keyframes.forEach(kf => {
                kf.rotationMap.forEach((arr, key) => transformArr(arr, map.get(key)?.rotation))
                kf.rotationPointMap.forEach((arr, key) => transformArr(arr, map.get(key)?.rotationPoint))
            })
        }

        let sorted = [...handler.keyframes].sort((a, b) => a.startTime - b.startTime)
        sorted.forEach((kf, index) => {
            handler.tbl.resetAnimations()
            handler.keyframes.forEach(_kf => _kf.animate(kf.startTime))

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
        })
    }

    //Root cubes will have the move direction flipped.
    if(version <= 4 && alreadyFlipped !== true) {
        handler.tbl.children.forEach(root => {
            handler.keyframes.forEach(keyframe => {
                if(keyframe.rotationPointMap.has(root.name)) {
                    let arr = keyframe.rotationPointMap.get(root.name)
                    arr[0] = -arr[0]
                    arr[1] = -arr[1]
                }
            })
        })
    }

    //Cubes need to be changed to do the shortest rotation path
    if(version <= 5) {
        handler.keyframes.forEach(keyframe => {
            keyframe.rotationMap.forEach(arr => {
                for(let i = 0; i < 3; i++) {
                    while(Math.abs(arr[i]) > 180) {
                        arr[i] -= 360*Math.sign(arr[i])
                    }
                }
            })
        })
    }
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
    //0 - initial version
    //    (14 JUL 2019) [80ac6a28eef5e8c89ad9b44e787df1881d968b7f]
    //
    //1 - changed string handling to work with java's DataInputStream
    //    (26 JUL 2019) [7bfe16e78df47b07670097969565f272cc58c68a]
    //
    //2 - added progression points
    //    (15 NOV 2019) [a79a5701ecbc0049a0fea5628cddd44b47813230]
    //
    //3 - changed keyframe data to be "relative" (basically minus what the cube default value is on importing and plus it on exporting)
    //    (11 MAY 2020) [23f1414541c54b14a73645dde18d3b8a8dd03608]
    //
    //4 - added keyframe layers
    //    (12 AUG 2020) [00d31e0d2d3241610e7f6b13d8fe41ca2f62dee1]
    //
    //5 - flips the animation to comply with the new world space. Having 5 marks the animation as flipped.
    //    (6 NOV 2020) [3c3ed3c82e90ccf649d6b981736136e175e441b0] -> [072d0d795c6ba79ba8b61a5cd79483fe1a69f76b]
    //
    //6 - removes -180,180 limit. Having 6 marks the animation as "minimized", where the shorted rotation path is taken
    //    (11 DEC 2020) [308f68e34066ee87a72b19af6dd9ad0ace6a3509]
    //
    //7 - added cube grow as a changeable element the keyframe.
    //    (21 DEC 2020) [785d7c5b60b36a9cbe3b68d1d80b12ebdd3c1153]
    buffer.writeNumber(7)
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

        buffer.writeNumber(kf.cubeGrowMap.size);
        [...kf.cubeGrowMap.keys()].sort().forEach(name => {
            let entry = kf.cubeGrowMap.get(name)
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