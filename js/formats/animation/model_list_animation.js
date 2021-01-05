import { AnimationHandler } from "../../animations.js";
import { DCALoader } from "./dca_loader.js";

export class ModelListAnimationLoader {}

/**
 * 
 * @param {AnimationHandler} handler the animation handler to write to 
 * @param {[]} files list of models to use. Will be sorted with model.fileName 
 * @param {*} meta the animation meta
 */
ModelListAnimationLoader.readFromModelFiles = (handler, files, meta = { base_time: 5 }) => {
    handler.keyframes = []
    
    let baseTime = meta.base_time
    if(files.length > 0 && files[0].fileName !== undefined) {
        files.sort((a, b) => a.fileName.localeCompare(b.fileName))
    }
    let startTime = 0;
    //Go over all the files and add it as a keyframe
    for(let pose of files) {
        let keyframe = handler.createKeyframe()

        keyframe.startTime = startTime
        keyframe.duration = baseTime

        pose.cubeMap.forEach(poseCube => {
            keyframe.rotationPointMap.set(poseCube.name, poseCube.rotationPoint)
            keyframe.rotationMap.set(poseCube.name, poseCube.rotation)
        })

        startTime += keyframe.duration
    }

    //Repair the keyframes
    DCALoader.repairKeyframes(handler, 2, true)
    return handler.keyframes
}