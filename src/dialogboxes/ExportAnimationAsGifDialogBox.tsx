import { useEffect, useState } from "react"
import InputSlider from "react-input-slider"
import { DisplayModeDropup, RenderModeDropup, TextureGroupDropup } from "../components/InfoBar"
import { RawCanvas } from "../components/StudioCanvas"
import { useStudio } from "../contexts/StudioContext"
import DcaAnimation from "../studio/formats/animations/DcaAnimation"
import AnimatorScrubBar from "../views/animator/components/AnimatorScrubBar"
import { OpenedDialogBox } from "./DialogBoxes"

const ExportAnimationAsGifDialogBox = ({ animation }: { animation: DcaAnimation }) => {
  const { renderer, setSize, getSelectedProject, onFrameListeners, grid, box } = useStudio()
  const project = getSelectedProject()
  const [width, setWidth] = useState(renderer.domElement.width)
  const [height, setHeight] = useState(renderer.domElement.height)

  const displayMax = 500;

  const clampedWidth = width < height ? displayMax * width / height : displayMax
  const clampedHeight = width < height ? displayMax : displayMax * height / width

  useEffect(() => {
    const gridVisible = grid.visible
    const boxVisible = box.visible

    grid.visible = false
    box.visible = false

    const defaultParent = project.model.modelGroup.parent!
    project.model.modelGroup.removeFromParent()

    const visibleCache = new Map<string, boolean>()
    project.group.traverseVisible(o => {
      visibleCache.set(o.uuid, o.visible)
      o.visible = false
    })

    project.group.add(project.model.modelGroup)
    project.group.visible = true

    project.model.traverseAll(cube => cube.updateMaterials({ selected: false, hovering: false }))
    return () => {
      project.model.modelGroup.removeFromParent()
      defaultParent.add(project.model.modelGroup)

      project.model.traverseAll(cube => cube.updateMaterials({}))

      project.group.traverse(o => {
        if (visibleCache.has(o.uuid)) {
          o.visible = visibleCache.get(o.uuid)!
        }
      })

      grid.visible = gridVisible
      box.visible = boxVisible
    }
  }, [project, grid, box])

  useEffect(() => {
    const onFrame = (deltaTime: number) => {
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

  return (
    <OpenedDialogBox width="1000px" height="800px" title={`Gif Export (${animation.name.value})`}>
      <div className="flex flex-row items-center w-full h-full">
        <div className="w-full flex flex-col">
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
        </div>
        <div className="w-full flex flex-col justify-center items-center m-5">
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
        </div>
      </div>
    </OpenedDialogBox >
  )
}

export default ExportAnimationAsGifDialogBox