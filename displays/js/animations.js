import { TBLModel } from './tbl_loader.js'

export class AnimationHandler {

    //inertia
    //animationMap
    //increments

    //compoundTime

    //poseIndex
    //currentIncrement
    //previousIncrement


    constructor(animationMap) {
        this.inertia = false

        this.animationMap = animationMap
        this.increments = []
        this.compoundTime = 0
        this.poseIndex = 0
    }

    onAnimationFileChange(files) {


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

        //todo: our own alert system
        if(!infoFile) {
            alert("Need an animation.json file") //todo: maybe just infer the animation  timeings?
            return
        }
        if(files.length == 0) {
            alert("No poses uploaded")
            return
        }


        this.currentIncrement = null
        this.previousIncrement = null
        this.poseIndex = 0
        this.compoundTime = 0


        const readFile = file => {
            return new Promise((resolve, reject) => {
                let reader = new FileReader()
                reader.onload = event => resolve(event.target.result)
                reader.onerror = error => reject(error)
                reader.readAsBinaryString(file)
              })
        }

        
        const loadFiles = async() => {
        
            let promiseFiles = tblFiles.map(file => TBLModel.loadModel(readFile(file), file.name))
            let result = await Promise.all([...promiseFiles, readFile(infoFile)])

            let info = JSON.parse(result.pop())
            let baseTime = info.base_time / 20

            result.sort((a, b) => a.fileName.localeCompare(b.fileName))
            this.increments = result.map(model => new ModelIncrement(model.cubeMap, baseTime))

            this.currentIncrement = this.increments[0]
            this.incrementPose()

        }

        loadFiles()
    }


    animate(deltaTime) {
        if(!this.currentIncrement) {
            return
        }
        this.compoundTime += deltaTime
        let percentageDone = this.compoundTime / this.currentIncrement.time
        if(percentageDone > 1) {
            this.incrementPose()
            percentageDone = 0
        }

        if(this.inertia) {
            percentageDone = Math.sin(Math.PI * (percentageDone - 0.5)) * 0.5 + 0.5
        }

        for(let [name, entry] of this.animationMap.entries()) {

            let rotation = this.interpolate(this.previousIncrement.rotationMap.get(name), this.currentIncrement.rotationMap.get(name), percentageDone)
            entry.rotation.set(rotation[0] * Math.PI / 180, rotation[1] * Math.PI / 180, rotation[2] * Math.PI / 180)

            let rotationPoint = this.interpolate(this.previousIncrement.rotationPointMap.get(name), this.currentIncrement.rotationPointMap.get(name), percentageDone)
            entry.position.set(rotationPoint[0], rotationPoint[1], rotationPoint[2])

        }
    }

    interpolate(prev, next, alpha) {
        let out = new Array(3)

        out[0] = prev[0] + (next[0] - prev[0]) * alpha
        out[1] = prev[1] + (next[1] - prev[1]) * alpha
        out[2] = prev[2] + (next[2] - prev[2]) * alpha

        return out
    }

    incrementPose() {
        this.compoundTime = 0

        this.poseIndex += 1
        if(this.poseIndex >= this.increments.length) {
            this.poseIndex = 0
        }

        this.previousIncrement = this.currentIncrement
        this.currentIncrement = this.increments[this.poseIndex]

    }
}

class ModelIncrement {

    //time
    //rotationMap
    //rotationPointMap

    constructor(poseMap, time) {

        this.time = time
        this.rotationMap = new Map()
        this.rotationPointMap = new Map()

        for(let [name, cube] of poseMap.entries()) {
            this.rotationMap.set( name, cube.rotation )
            this.rotationPointMap.set( name, cube.rotationPoint )
        }
    }

    //add up delta time calls, then just do simple interpolation

}
