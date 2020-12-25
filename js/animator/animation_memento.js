export class AnimationMemento {
    constructor(studio, tabData) {
        this.data = {}
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

        this.data.loopData = cloneData(tabData.handler.loopData)

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

    mapToObj(map, obj = {}) {
        map.forEach((value, key) => obj[key] = value.slice())
        return obj
    }

    objToMap(obj, map = new Map()) {
        Object.keys(obj).forEach(k => map.set(k, obj[k].slice()))
        return map
    }
}