import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import InputSlider from "react-input-slider"
import { Color } from "three"
import Checkbox from "../components/Checkbox"
import { SVGDownload } from "../components/Icons"
import { DisplayModeDropup, RenderModeDropup, TextureGroupDropup } from "../components/InfoBar"
import NumericInput from "../components/NumericInput"
import { RawCanvas } from "../components/StudioCanvas"
import { ButtonWithTooltip } from "../components/Tooltips"
import { useStudio } from "../contexts/StudioContext"
import DcaAnimation from "../studio/formats/animations/DcaAnimation"
import { exportAnimationAsGif } from "../studio/formats/animations/DcaGifExporter"
import { downloadBlob } from "../studio/util/FileTypes"
import AnimatorScrubBar from "../views/animator/components/AnimatorScrubBar"
import { OpenedDialogBox } from "./DialogBoxes"

const ExportAnimationAsGifDialogBox = ({ animation }: { animation: DcaAnimation }) => {
  const studio = useStudio()
  const { scene, onTopScene, renderer, setSize, getSelectedProject, onFrameListeners, grid, box } = studio
  const project = getSelectedProject()
  const [width, setWidth] = useState(renderer.domElement.width)
  const [height, setHeight] = useState(renderer.domElement.height)
  const [fps, setFPS] = useState(15)
  const [backgroundColour, setBackgroundColour] = useState("#000000")
  const [useTranslucentBackground, setUseTranslucentBackground] = useState(false)
  const [framesRendered, setFramesRendered] = useState(0)
  const [processed, setProcessed] = useState(0)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultBlobString, setResultBlobString] = useState<string | null>(null)

  const isExporting = useRef(false)

  const displayMax = 500;

  const clampedWidth = width < height ? displayMax * width / height : displayMax
  const clampedHeight = width < height ? displayMax : displayMax * height / width

  useEffect(() => {
    const gridVisible = grid.visible
    const boxVisible = box.visible

    grid.visible = false
    box.visible = false

    const defaultParent = project.model.modelGroup.parent!

    scene.remove(project.group)
    onTopScene.remove(project.overlayGroup)
    scene.add(project.model.modelGroup)

    project.model.traverseAll(cube => cube.updateMaterials({ selected: false, hovering: false }))
    return () => {
      scene.remove(project.model.modelGroup)
      scene.add(project.group)
      onTopScene.add(project.overlayGroup)
      defaultParent.add(project.model.modelGroup)

      project.model.traverseAll(cube => cube.updateMaterials({}))
      grid.visible = gridVisible
      box.visible = boxVisible
    }
  }, [project, grid, box, scene, onTopScene])

  useEffect(() => {
    const onFrame = (deltaTime: number) => {
      if (isExporting.current) {
        return
      }
      project.model.resetVisuals()
      animation.animate(deltaTime)
    }
    onFrameListeners.add(onFrame)
    return () => {
      onFrameListeners.delete(onFrame)
    }
  }, [project, onFrameListeners, animation])

  useEffect(() => {
    setSize(width, height)
    renderer.domElement.style.width = `${clampedWidth}px`
    renderer.domElement.style.height = `${clampedHeight}px`
  }, [width, height, clampedWidth, clampedHeight, renderer, setSize])

  //Swap out the scene backgrounds for null, and then set them back when we're done
  useEffect(() => {
    const sceneBackground = scene.background
    const onTopSceneBackground = onTopScene.background
    scene.background = useTranslucentBackground ? null : new Color(backgroundColour)
    onTopScene.background = null

    renderer.setClearColor(useTranslucentBackground ? backgroundColour : 0, 0)
    return () => {
      renderer.setClearColor(0, 0)
      scene.background = sceneBackground
      onTopScene.background = onTopSceneBackground
    }
  }, [renderer, scene, onTopScene, backgroundColour, useTranslucentBackground])

  const beginRender = useCallback(async () => {
    isExporting.current = true
    setFramesRendered(0)
    setProcessed(0)
    setResultBlob(null)
    setResultBlobString(null)
    const blob = await exportAnimationAsGif(animation, studio, fps, useTranslucentBackground ? backgroundColour : null, setProcessed, setFramesRendered)
    setResultBlob(blob)
    setResultBlobString(URL.createObjectURL(blob))
    isExporting.current = false
  }, [animation, studio, fps, backgroundColour, useTranslucentBackground, setProcessed, setFramesRendered])

  return (
    <OpenedDialogBox width="1000px" height="800px" title={`Gif Export (${animation.name.value})`}>
      <div className="flex flex-row items-center w-full h-full">
        <div className="w-full flex flex-col h-full py-10 pl-5">
          <div>
            Width:
            <InputSlider x={width} onChange={v => setWidth(v.x)} xmin={5} xmax={3000} />
            {width}px
          </div>
          <div>
            Height:
            <InputSlider x={height} onChange={v => setHeight(v.x)} xmin={5} xmax={3000} />
            {height}px
          </div>
          <div>
            FPS:
            <NumericInput value={fps} onChange={setFPS} isPositiveInteger min={5} max={60} />
            {height}px
          </div>
          <div>
            Background Colour:
            <input type="color" onChange={e => setBackgroundColour(e.currentTarget.value)} />
            <Checkbox setValue={setUseTranslucentBackground} value={useTranslucentBackground} extraText="Use As Translucent" />
          </div>
          {/* Note that for the modes below, we don't need to use the same element as the info bar 
            We only *need* to have the Render Mode and Texture Group, both of which are very easy to implement, 
            requireing no logic (see the components)

            I don't think a dropup box works best here, it should be a selection row:
            Display Mode: Perspective | Orthographic
            Texture Group: Default | Male | Female
          */}
          <div>
            Display Mode:
            <DisplayModeDropup />
          </div>
          <div>
            Render Mode:
            <RenderModeDropup />
          </div>
          <div>
            Texture Group:
            <TextureGroupDropup />
          </div>
          {resultBlob !== null && resultBlobString !== null &&
            <div className="flex flex-row flex-grow w-full">
              <div className="relative rounded flex-grow h-full ">
                <Image className="w-full h-full" src={resultBlobString} alt="Profile" width="100%" height="100%" layout="responsive" objectFit="contain" />
              </div>
              <div className="flex items-center">
                <ButtonWithTooltip
                  className="dark:bg-gray-800 bg-gray-300 dark:hover:bg-gray-900 hover:bg-gray-400 rounded pr-1 pl-2 py-0.5 my-0.5 mr-1 h-fit"
                  tooltip={`Download ${animation.name.value}.gif`}
                  onClick={() => downloadBlob(`${animation.name.value}.gif`, resultBlob)}
                >
                  <SVGDownload className="h-6 w-4 mr-1" />
                </ButtonWithTooltip>
              </div>
            </div>
          }
        </div>
        <div className="w-full pl-12 flex flex-col justify-center items-center m-5">
          Preview (Moveable):
          <div
            className="flex justify-center items-center"
            style={{
              width: `${displayMax}px`,
              height: `${displayMax}px`,
            }}>
            <div
              className="flex justify-center items-center "
              style={{
                width: `${clampedWidth}px`,
                height: `${clampedHeight}px`,
              }}
            >
              <div className="w-full h-full relative">
                <RawCanvas
                  className="w-full h-full"
                  autoChangeSize={false}
                />
                <div className="absolute top-0 bottom-0 -left-2 w-px bg-white flex items-center">
                  <div className="-translate-x-full pr-1">
                    {height}px
                  </div>
                </div>
                <div className="absolute left-0 -bottom-2 right-0 h-px bg-white flex justify-center">
                  {width}px
                </div>
              </div>
            </div>
          </div>
          <div className="w-full mt-16">
            <AnimatorScrubBar animation={animation} />
          </div>
          <button onClick={beginRender}>Render</button>
          <div>
            Frames Rendered: {Math.round(framesRendered * 100)}%
          </div>
          <div>
            Processed: {Math.round(processed * 100)}%
          </div>
        </div>
      </div>
    </OpenedDialogBox >
  )
}

export default ExportAnimationAsGifDialogBox