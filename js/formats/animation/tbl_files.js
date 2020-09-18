export class TBLFilesLoader {}

TBLFilesLoader.readFromTblFiles = (handler, files, meta = { base_time: 5 }) => {
    handler.keyframes = []

    let baseTime = meta.base_time

    if(files.length > 0 && files[0].fileName !== undefined) {
        files.sort((a, b) => a.fileName.localeCompare(b.fileName))
    }
    
    let startTime = 0;
    for(let pose of files) {
        let keyframe = handler.createKeyframe()

        keyframe.startTime = startTime
        keyframe.duration = baseTime

        pose.cubeMap.forEach(poseCube => {
            keyframe.rotationPointMap.set(poseCube.name, poseCube.rotationPoint)
            keyframe.rotationMap.set(poseCube.name, poseCube.rotation)
        })

        startTime += baseTime; //todo: time overrides ???

        handler.keyframes.push(keyframe)
    }
    handler.repairKeyframes(2)
    return handler.keyframes
}