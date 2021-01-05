import { AnimationHandler, ByteBuffer } from "../../animations.js"

const rotArr = new Array(3)
const posArr = new Array(3)

export class DCALoader {}

/**
 * Loads the aniamtions from a file.
 * Note that there is no "dca class", instead we write to an animaion handler.
 * 
 * This requires the buffer to be in the correct format. 
 * 
 * @param {AnimationHandler} handler the handler to write to
 * @param {ByteBuffer} buffer the file buffer to read from
 */
DCALoader.importAnimation = (handler, buffer) => {
    let version = buffer.readNumber()
    //In version 1 we use a differnet type of string handling
    if(version < 1) {
        buffer.useOldString = true
    }

    //Read the loop data
    if(version >= 9 && buffer.readBool()) {
        handler.loopData = {
            start: buffer.readNumber(),
            end: buffer.readNumber(),
            duration: buffer.readNumber()
        }
    } else {
        handler.loopData = null
    }

    //Read the keyframes
    handler.keyframes = []
    let length = buffer.readNumber()
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

    //Read the events
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

    //Repair the keyframes. 
    DCALoader.repairKeyframes(handler, version)
}

/**
 * 
 * @param {AnimationHandler} handler the animation handler to write to
 * @param {number} version the dca version 
 * @param {*} alreadyFlipped whether the animation is already flipped. While usually tied to the version,
 *                           if the animation is imported with model files then it will already be flipped
 */
DCALoader.repairKeyframes = (handler, version, alreadyFlipped = false) => {
    //If the keyframe version is <= 3, then the keyframe data is a list of points for the animation to follow.
    //The following code is to convert that list of points into a list of changes.
    if(version <= 3) {        
        let map = handler.tbl.cubeMap
        //At version 3, we have the keyframe data being subtracted from the default.
        if(version === 3) {
            handler.keyframes.forEach(kf => {
                //Function to mutate array to array+subvalue
                function transformArr(arr, subValue) {
                    if(subValue === null) {
                        return
                    }
                    for(let i = 0; i < 3; i++) {
                        arr[i] = arr[i] + subValue[i]
                    }
                }
                
                kf.rotationMap.forEach((arr, key) => transformArr(arr, map.get(key)?.rotation))
                kf.rotationPointMap.forEach((arr, key) => transformArr(arr, map.get(key)?.rotationPoint))
            })
        }

        //Sort the keyframes, and animate at the start time
        let sorted = [...handler.keyframes].sort((a, b) => a.startTime - b.startTime)
        sorted.forEach((kf, index) => {
            handler.tbl.resetAnimations()
            handler.keyframes.forEach(_kf => _kf.animate(kf.startTime))

            //If the next keyframe start time is before this end point, then it'll get cut off.
            //The following code is to account to that and change `step` to be between 0-1 to where it gets cut off. 
            let step = 1
            let next = sorted[index+1]
            if(next !== undefined) {
                let dist = next.startTime - kf.startTime
                //Keyframes intersect
                if(dist < kf.duration) {
                    mod = dist / kf.duration
                    kf.duration = dist
                }
            }

            //The kf data maps currently hold where the cube should be.
            //If we then where the cube is when it's animated, we can caluclate
            //how much it should have to move.
            kf.rotationMap.forEach((arr, key) => {
                map.get(key).cubeGroup.rotation.toArray(rotArr)
                for(let i = 0; i < 3; i++) {
                    arr[i] = (arr[i] - rotArr[i]*180/Math.PI) * step
                }
            })
            kf.rotationPointMap.forEach((arr, key) => {
                map.get(key).cubeGroup.position.toArray(posArr)
                for(let i = 0; i < 3; i++) {
                    arr[i] = (arr[i] - posArr[i]) * step
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

    //Time needs to be changed from 20tps to 1tps
    if(version <= 7) {
        handler.keyframes.forEach(keyframe => {
            keyframe.startTime /= 20
            keyframe.duration /= 20
        })

        handler.events.forEach(event => event.time /= 20)
    }

    //Invert the animations. Positions have already been flipped in v4
    if(version <= 9 && alreadyFlipped !== true) {
        handler.keyframes.forEach(keyframe => {
            keyframe.rotationMap.forEach(vals => {
                vals[0] = -vals[0]
                vals[1] = -vals[1]
            })
        })
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
    //    (06 NOV 2020) [3c3ed3c82e90ccf649d6b981736136e175e441b0] -> [072d0d795c6ba79ba8b61a5cd79483fe1a69f76b]
    //
    //6 - removes -180,180 limit. Having 6 marks the animation as "minimized", where the shorted rotation path is taken
    //    (11 DEC 2020) [308f68e34066ee87a72b19af6dd9ad0ace6a3509]
    //
    //7 - added cube grow as a changeable element the keyframe.
    //    (21 DEC 2020) [785d7c5b60b36a9cbe3b68d1d80b12ebdd3c1153]
    //
    //8 - tweaked time to be from 20 tps to 1 tps. Having 8 marks the animation as being in seconds instead of minecraft ticks.
    //    (24 DEC 2020) [d39636d0440d7b330af7cf218f0d69472a8e44fe]
    //
    //9 - added looping data to the keyframe header. 
    //    (25 DEC 2020) [2e91d338dd41ee035b2538d06cc2f4c571aac93c]
    //
    //10 - fixed issue with invertex xy axis. Having 10 marks the animation as inverted
    //     (27 DEC 2020) [ba91a6db089353646b976c1fabb251910640db62]
    //
    buffer.writeNumber(10)

    //Write the loop data
    if(handler.loopData !== null) {
        buffer.writeBool(true)
        buffer.writeNumber(handler.loopData.start)
        buffer.writeNumber(handler.loopData.end)
        buffer.writeNumber(handler.loopData.duration)
    } else {
        buffer.writeBool(false)
    }


    //Write the keyframes
    buffer.writeNumber(handler.keyframes.length)
    handler.keyframes.forEach(kf => {
        buffer.writeNumber(kf.startTime)
        buffer.writeNumber(kf.duration)
        buffer.writeNumber(kf.layer)

        //Write the rotation data
        buffer.writeNumber(kf.rotationMap.size);
        [...kf.rotationMap.keys()].sort().forEach(name => {
            let entry = kf.rotationMap.get(name)
            buffer.writeString(name)
            buffer.writeNumber(entry[0])
            buffer.writeNumber(entry[1])
            buffer.writeNumber(entry[2])
        })

        //Write the position data
        buffer.writeNumber(kf.rotationPointMap.size);
        [...kf.rotationPointMap.keys()].sort().forEach(name => {
            let entry = kf.rotationPointMap.get(name)
            buffer.writeString(name)
            buffer.writeNumber(entry[0])
            buffer.writeNumber(entry[1])
            buffer.writeNumber(entry[2])
        })

        //Write the cube grow data
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

    //Write the events
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