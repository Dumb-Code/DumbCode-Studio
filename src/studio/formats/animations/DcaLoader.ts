import { LO } from './../../util/ListenableObject';
import { DCMModel, DCMCube } from './../model/DcmModel';
import DcaAnimation, { DcaKeyframe, ProgressionPoint } from './DcaAnimation';
import { StudioBuffer } from './../../util/StudioBuffer';
import DcProject from '../DcProject';
import { LOMap } from '../../util/ListenableObject';

const compilerWarningsRemove = (_: any) => { }


export const loadDCAAnimation = (project: DcProject, name: string, buffer: StudioBuffer) => {

  const animation = new DcaAnimation(project, name)

  const version = buffer.readNumber()
  //In version 1 we use a differnet type of string handling
  if (version < 1) {
    buffer.useOldString = true
  }

  //Read the loop data
  if (version >= 9 && buffer.readBool()) {
    animation.keyframeData.start.value = buffer.readNumber()
    animation.keyframeData.end.value = buffer.readNumber()
    animation.keyframeData.duration.value = buffer.readNumber()
    animation.keyframeData.exits.value = true
  }
  //Read the keyframes
  const keyframes: DcaKeyframe[] = []
  let length = buffer.readNumber()
  for (let i = 0; i < length; i++) {
    let kf = new DcaKeyframe(project)
    keyframes.push(kf)

    kf.startTime.value = buffer.readNumber()
    kf.duration.value = buffer.readNumber()
    if (version >= 4) {
      kf.layerId = buffer.readInteger()
    }

    let rotSize = buffer.readNumber()
    for (let r = 0; r < rotSize; r++) {
      kf.rotation.set(buffer.readString(), [buffer.readNumber(), buffer.readNumber(), buffer.readNumber()])
    }

    let posSize = buffer.readNumber()
    for (let p = 0; p < posSize; p++) {
      kf.position.set(buffer.readString(), [buffer.readNumber(), buffer.readNumber(), buffer.readNumber()])
    }

    if (version >= 7) {
      let cgSize = buffer.readNumber()
      for (let c = 0; c < cgSize; c++) {
        kf.cubeGrow.set(buffer.readString(), [buffer.readNumber(), buffer.readNumber(), buffer.readNumber()])
      }
    }

    if (version >= 2) {
      let ppSize = buffer.readNumber()
      const arr: ProgressionPoint[] = []
      for (let p = 0; p < ppSize; p++) {
        arr.push({ required: p < 2, x: buffer.readNumber(), y: buffer.readNumber() })
      }
      kf.progressionPoints.value = arr
      // kf.resortPointsDirty()
    }
  }

  //Read the events
  if (version >= 4) {
    let eventSize = buffer.readNumber()
    for (let e = 0; e < eventSize; e++) {
      let time = buffer.readNumber()
      let data = []
      let dataSize = buffer.readNumber()
      for (let d = 0; d < dataSize; d++) {
        const event = { type: buffer.readString(), data: buffer.readString() } //TODO
        compilerWarningsRemove(event)
      }
      compilerWarningsRemove([time, data])
      // handler.events.push({ time, data })
    }
  }

  repairKeyframes(project.model, version, keyframes, false)

  animation.keyframes.value = keyframes

  return animation
}

export const repairKeyframes = (model: DCMModel, version: number, keyframes: DcaKeyframe[], alreadyFlipped = false) => {
  //If the keyframe version is <= 3, then the keyframe data is a list of points for the animation to follow.
  //The following code is to convert that list of points into a list of changes.
  if (version <= 3) {
    const map = model.cubeMap
    //At version 3, we have the keyframe data being subtracted from the default.
    if (version === 3) {
      keyframes.forEach(kf => {
        //Function to mutate array to array+subvalue
        function transformMap(
          partMap: LOMap<string, readonly [number, number, number]>,
          func: (c: DCMCube) => LO<readonly [number, number, number]>
        ) {
          partMap.forEach((value, key) => {
            const s = map.get(key)
            if (s === undefined || s.size === 0) {
              return
            }
            //Just get the first cube. There should be only one anyway.
            //Maybe log if theres more than 1?
            const val = func(Array.from(s)[0]).value
            partMap.set(key, [
              value[0] + val[0],
              value[1] + val[1],
              value[2] + val[2]
            ])
          })
        }

        transformMap(kf.rotation, cube => cube.rotation)
        transformMap(kf.position, cube => cube.position)
      })
    }

    //Sort the keyframes, and animate at the start time
    let sorted = [...keyframes].sort((a, b) => a.startTime.value - b.startTime.value)
    sorted.forEach((kf, index) => {
      model.resetVisuals()
      keyframes.forEach(_kf => _kf.animate(kf.startTime.value))

      //If the next keyframe start time is before this end point, then it'll get cut off.
      //The following code is to account to that and change `step` to be between 0-1 to where it gets cut off. 
      let step = 1
      let next = sorted[index + 1]
      if (next !== undefined) {
        let dist = next.startTime.value - kf.startTime.value
        //Keyframes intersect
        if (dist < kf.duration.value) {
          kf.duration.value = dist
        }
      }

      //The kf data maps currently hold where the cube should be.
      //If we then where the cube is when it's animated, we can caluclate
      //how much it should have to move.
      kf.rotation.forEach((arr, key) => {
        //Just get the first cube. There should be only one anyway.
        //Maybe log if theres more than 1?
        const set = map.get(key)
        if (set !== undefined && set.size !== 0) {
          const rot = Array.from(set)[0].cubeGroup?.rotation
          if (rot !== undefined) {
            kf.rotation.set(key, [
              (arr[0] - rot.x * 180 / Math.PI) * step,
              (arr[1] - rot.y * 180 / Math.PI) * step,
              (arr[2] - rot.z * 180 / Math.PI) * step,
            ])
          }
        }
      })

      kf.position.forEach((arr, key) => {
        //Just get the first cube. There should be only one anyway.
        //Maybe log if theres more than 1?
        const set = map.get(key)
        if (set !== undefined && set.size !== 0) {
          const pos = Array.from(set)[0].cubeGroup?.position
          if (pos !== undefined) {
            kf.position.set(key, [
              (arr[0] - pos.x) * step,
              (arr[1] - pos.y) * step,
              (arr[2] - pos.z) * step,
            ])
          }
        }
      })
    })
  }

  //Root cubes will have the move direction flipped.
  if (version <= 4 && alreadyFlipped !== true) {
    model.children.value.forEach(root => {
      keyframes.forEach(keyframe => {
        const arr = keyframe.position.get(root.name.value)
        if (arr !== undefined) {
          keyframe.position.set(root.name.value, [-arr[0], -arr[1], arr[2]])
        }
      })
    })
  }

  //Cubes need to be changed to do the shortest rotation path
  if (version <= 5) {
    keyframes.forEach(keyframe => {
      keyframe.rotation.forEach((arr, key) => {
        keyframe.rotation.set(key, [
          arr[0] - 360 * Math.sign(arr[0]),
          arr[1] - 360 * Math.sign(arr[0]),
          arr[2] - 360 * Math.sign(arr[0])
        ])
      })
    })
  }

  //Time needs to be changed from 20tps to 1tps
  if (version <= 7) {
    keyframes.forEach(keyframe => {
      keyframe.startTime.value /= 20
      keyframe.duration.value /= 20
    })

    // handler.events.forEach(event => event.time /= 20)
  }

  //Invert the animations. Positions have already been flipped in v4
  if (version <= 9 && alreadyFlipped !== true) {
    keyframes.forEach(keyframe => {
      keyframe.rotation.forEach((arr, name) => {
        keyframe.rotation.set(name, [-arr[0], -arr[1], arr[2]])
      })
    })
  }
}