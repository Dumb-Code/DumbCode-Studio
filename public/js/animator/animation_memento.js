/**
 * Animation memento is the captured animation state. Everything in `this.data` will be tracked,
 * and can be traversed to, resulting in undo/redo.
 */
export class AnimationMemento {
    constructor(studio, tabData) {
        this.data = {}
        //Map the keyframes
        this.data.keyframes = tabData.handler.keyframes.map(kf => { return {
            layer: kf.layer, startTime: kf.startTime, duration: kf.duration,
            rotationMap: this.mapToObj(kf.rotationMap),
            rotationPointMap: this.mapToObj(kf.rotationPointMap),
            progressionPoints: kf.progressionPoints.map(p => { return { ...p } }),
            selected: kf === tabData.handler.selectedKeyFrame
        }})

        let cloneData = d => {
            if(d === null) {
                return null
            }
            return { ...d }
        }
        //Map the looped data
        this.data.loopData = cloneData(tabData.handler.loopData)

        //The reconstruct method to reconstruct the memento to the studio.
        this.reconstruct = () => {
            tabData.handler.keyframes = []
            let selectedKeyframe = undefined
            this.data.keyframes.forEach(kfData => {
                let kf = tabData.handler.createKeyframe()
                kf.layer = kfData.layer
                kf.startTime = kfData.startTime
                kf.duration = kfData.duration
                kf.rotationMap = this.objToMap(kfData.rotationMap)
                kf.rotationPointMap = this.objToMap(kfData.rotationPointMap)
                kf.progressionPoints = kfData.progressionPoints.map(p => { return { ...p } })
                if(kfData.selected === true) {
                    selectedKeyframe = kf
                }
            })

            tabData.handler.loopData = cloneData(this.data.loopData)

            studio.selectKeyframe(selectedKeyframe)
            studio.keyframeManager.reframeKeyframes()
            studio.cubeDisplayValues.updateLoopedElements()
            studio.progressionCanvas.redrawProgressionCanvas()
            tabData.handler.updateLoopKeyframe()
        }
    }

    /**
     * Writes the cube map to the object.
     * @param {Map<string, number[]} map The cube map to write to to obj
     * @param {any} obj The obj to write to
     */
    mapToObj(map, obj = {}) {
        map.forEach((value, key) => obj[key] = value.slice())
        return obj
    }

    /**
     * Reads the cube map from the object
     * @param {any} obj The obj to read from
     * @param {Map<string, number[]} map The map to write to
     */
    objToMap(obj, map = new Map()) {
        Object.keys(obj).forEach(k => map.set(k, obj[k].slice()))
        return map
    }
}