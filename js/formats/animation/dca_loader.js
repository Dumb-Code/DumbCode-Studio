import { ByteBuffer } from "../../animations.js"

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

    repairKeyframes(handler, version)
}

DCALoader.repairKeyframes = (handler, version) => {
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
                map.get(key)?.cubeGroup.rotation.toArray(rotArr)
                for(let i = 0; i < 3; i++) {
                    arr[i] = (arr[i] - rotArr[i]*180/Math.PI) * mod
                }
            })
            kf.rotationPointMap.forEach((arr, key) => {
                map.get(key)?.cubeGroup.position.toArray(posArr)
                for(let i = 0; i < 3; i++) {
                    arr[i] = (arr[i] - posArr[i]) * mod
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
    buffer.writeNumber(4)
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