export async function createGif(animationHandler, fps, progressCallback = undefined) {
    let color = parseInt(document.getElementById("gif_transparent_texture").value.substring(1), 16)
    return new Promise((resolve, reject) => {
        if(animationHandler.sortedTimes.length == 0) {
            reject("No Animation Playing")
            return
        }
    
        let width = window.innerWidth
        let height = window.innerHeight
    
        let gif = new GIF({
            workers: 2,
            quality: 10,
            width: width,
            height: height,
            workerScript: "./js/gif.worker.js",
            transparent: color
        });
    
        let dummyRenderer = new WebGLRenderer({
            alpha:true
        });
    
        dummyRenderer.setClearColor(color, 0);
        dummyRenderer.setSize( width, height );
    
        let dummyScene = createScene()
        dummyScene.background = new Color(color)
        dummyScene.add(display.tbl.modelCache)
    

        let dummyCamera = display.camera.clone()
        updateCamera(dummyCamera, width, height)

        display.tbl.resetAnimations()
        
        let delay = 1 / fps

        let start = 0
        let end = animationHandler.totalTime

        if(animationHandler.looping) {
            let kf = animationHandler.loopKeyframe
            start += kf.startTime + kf.duration
            end += kf.startTime + kf.duration
        }

        let manager = animationHandler.manager
        let ticks = manager.playstate.ticks
    
        manager.playstate.ticks = start
        manager.playstate.playing = true

        setTimeout(() => {
            while(manager.playstate.ticks < end) {
                animationHandler.animate(delay)
                dummyRenderer.render( dummyScene, dummyCamera )
                gif.addFrame(dummyRenderer.domElement, {copy: true, delay: delay * 1000})
            }

            manager.playstate.playing = false
            manager.playstate.ticks = ticks
            display.scene.add(display.tbl.modelCache)
            
            gif.on("finished", resolve);
            if(progressCallback) {
                gif.on("progress", progressCallback)
            }
            gif.render();
        }, 0)
    })
}

window.downloadGif = async(elem) => {
    if(activeStudio !== undefined) {
        elem.classList.toggle("is-loading", true)
        elem.parentNode.classList.toggle("tooltip", true)
    
        elem.parentNode.dataset.tooltip = "Recording..."
        
        let fps = [...document.getElementsByClassName('fps-radio')].find(elem => elem.checked).getAttribute('fps');
        let blob = await createGif(fps, p => {
            elem.parentNode.dataset.tooltip = Math.round(p * 100) + "%"
        })
    
        if(blob) {
            let url = URL.createObjectURL(blob)
            let a = document.createElement("a");
            a.href = url;
            a.download = "dinosaur.gif" //todo: name from model?
            document.body.appendChild(a);
            a.click() 
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url); 
            }, 100)
        }
    
        elem.parentNode.classList.toggle("tooltip", false)
        elem.classList.toggle('is-loading', false)   
    }
}