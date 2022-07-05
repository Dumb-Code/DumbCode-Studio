import GIF from "gif.js";
import { StudioContext } from './../../../contexts/StudioContext';
import DcaAnimation from "./DcaAnimation";

const numberOfFramesToExportPerFrame = 10

export const exportAnimationAsGif = async (
  animation: DcaAnimation, context: StudioContext, fps: number, transparent: string | null,
  onProgress: (prog: number) => void, setFramesRendered: (prog: number) => void
) => {
  const { project } = animation
  const { model } = project

  const canvas = context.renderer.domElement

  context.renderer.autoClear = true

  const gif = new GIF({
    workers: 2,
    quality: 10,
    width: canvas.width,
    height: canvas.height,
    workerScript: "/gif/gif.worker.js",
    transparent
  })

  //Render all the frames, at ${numberOfFramesToExportPerFrame} fps
  //This is to stop the rendering being blocked?
  await new Promise((resolve) => {
    let time = 0;
    const onFrame = () => {
      for (let iter = 0; iter < numberOfFramesToExportPerFrame; iter++) {
        time += 1 / fps
        if (time > animation.maxTime.value) {
          setFramesRendered(1)
          resolve(null)
          return
        }

        model.resetVisuals()
        animation.animateAt(time)

        context.renderer.clear()
        context.renderSingleFrame()

        gif.addFrame(canvas, { copy: true, delay: 1000 / fps })
      }

      setFramesRendered(time / animation.maxTime.value)

      requestAnimationFrame(onFrame)
    }
    onFrame()
  })

  context.renderer.autoClear = false

  return new Promise<Blob>((resolve, reject) => {
    gif.on('finished', blob => resolve(blob))
    gif.on("progress", onProgress)
    gif.on("abort", () => reject("Aborted?"))
    gif.render()
  })
}
