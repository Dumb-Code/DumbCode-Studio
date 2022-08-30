import { useEffect, useRef } from "react"
import InfoBar from "../../components/InfoBar"
import StudioCanvas from "../../components/StudioCanvas"
import { useStudio } from "../../contexts/StudioContext"
import StudioGridRaw from "../../studio/griddividers/components/StudioGrid"
import StudioGridArea from "../../studio/griddividers/components/StudioGridArea"
import DividerArea from "../../studio/griddividers/DividerArea"
import GridArea from "../../studio/griddividers/GridArea"
import GridSchema from "../../studio/griddividers/GridSchema"
import { useListenableObject } from "../../studio/listenableobject/ListenableObject"
import { useObjectUnderMouse } from "../../studio/selections/ObjectClickedHook"
import { ShowcaseLight } from "../../studio/showcase/ShowcaseLight"
import ShowcaseView from "../../studio/showcase/ShowcaseView"
import AnimatorGumballPropertiesBar from "../animator/components/AnimatorGumballPropertiesBar"
import ShowcaseEffects from "./components/ShowcaseEffects"
import ShowcaseSidebar from "./components/ShowcaseSidebar"
import ShowcaseViewBar from "./components/ShowcaseViewBar"
import { useShowcaseGumball } from "./logic/ShowcaseGumballHook"

const effects = GridArea.area("effects")
const canvas = GridArea.area("canvas")
const sidebar = GridArea.area("sidebar")
const tabs = GridArea.area("tabs")
const gumball = GridArea.area("gumball")
const info = GridArea.area("info")


const schema = GridSchema.createSchema(
  GridArea.join(
    [effects, canvas, sidebar],
    [effects, tabs, sidebar],
    [effects, gumball, sidebar],
    [effects, info, sidebar]
  ),
  DividerArea.from(
    [DividerArea.moveable(200, 600, effects, "right", 300), 'auto', DividerArea.moveable(200, 600, sidebar, "left", 300)],
    ['auto', DividerArea.moveable(100, 300, tabs, "top", 130), 30, 28]
  )
)

const Showcase = () => {
  const { scene, lightGroup, itemsGroup, getSelectedProject, onPostFrameListeners, renderer, controls, getCamera } = useStudio()
  const project = getSelectedProject()

  const [allViews, setViews] = useListenableObject(project.showcaseProperties.views)
  const [view] = useListenableObject(project.showcaseProperties.selectedView)

  useObjectUnderMouse()
  useShowcaseGumball()

  //TODO: get three context and listen on orbit controls for a change, then update the view's camera position and target
  //Also, in the view add a listener to update the orbit controls when view#position/target changes 

  const hasCameraAlreadyUpdated = useRef(false)

  useEffect(() => {

    const updateSelectedLight = (light: ShowcaseLight | null, oldLight: ShowcaseLight | null) => {
      if (oldLight) {
        scene.remove(oldLight.cameraHelper)
      }
      if (light) {
        scene.add(light.cameraHelper)
      }
    }

    const updatePosition = (position = view.cameraPosition.value) => {
      if (hasCameraAlreadyUpdated.current) {
        return
      }
      const camera = getCamera()
      camera.position.set(position[0], position[1], position[2])
      controls.update()
    }
    const updateTarget = (target = view.cameraTarget.value) => {
      if (hasCameraAlreadyUpdated.current) {
        return
      }
      controls.target.set(target[0], target[1], target[2])
      controls.update()
    }

    const onControlsStart = () => view.undoRedoHandler.startBatchActions()
    const onControlsChange = () => {
      const camera = getCamera()
      hasCameraAlreadyUpdated.current = true
      view.cameraPosition.value = [camera.position.x, camera.position.y, camera.position.z]
      view.cameraTarget.value = [controls.target.x, controls.target.y, controls.target.z]
      hasCameraAlreadyUpdated.current = false
    }

    let moveTimeout: NodeJS.Timeout | null = null
    const onControlsEnd = () => {
      //We need to batch the movement of the camera, as stuff like scrolling is done at each individual mouse event
      if (moveTimeout !== null) {
        clearTimeout(moveTimeout)
      }
      moveTimeout = setTimeout(() => view.undoRedoHandler.endBatchActions("Camera moved"), 200)
    }

    controls.addEventListener('start', onControlsStart)
    controls.addEventListener('change', onControlsChange)
    controls.addEventListener('end', onControlsEnd)
    view.cameraPosition.addAndRunListener(updatePosition)
    view.cameraTarget.addAndRunListener(updateTarget)
    view.selectedLight.addAndRunListener(updateSelectedLight)
    return () => {
      controls.removeEventListener('start', onControlsStart)
      controls.removeEventListener('change', onControlsChange)
      controls.removeEventListener('end', onControlsEnd)
      view.cameraPosition.removeListener(updatePosition)
      view.cameraTarget.removeListener(updateTarget)
      view.selectedLight.removeListener(updateSelectedLight)
      if (view.selectedLight.value) {
        scene.remove(view.selectedLight.value.cameraHelper)
      }
    }


  }, [view, getCamera, controls, scene])

  useEffect(() => {
    scene.remove(lightGroup)
    scene.remove(itemsGroup)
    scene.add(project.showcaseProperties.group)
    renderer.shadowMap.enabled = true
    const onFrame = () => {
      view.renderForGumball()
    }
    onPostFrameListeners.add(onFrame)

    return () => {
      scene.add(lightGroup)
      scene.add(itemsGroup)
      scene.remove(project.showcaseProperties.group)
      renderer.shadowMap.enabled = false

      onPostFrameListeners.delete(onFrame)
    }
  }, [view, scene, lightGroup, itemsGroup, project, renderer, onPostFrameListeners])

  const newView = () => {
    const view = new ShowcaseView(project.showcaseProperties)
    setViews([...allViews, view])
  }

  return (
    <StudioGridRaw
      key={project.identifier}
      schema={schema}
    >

      <StudioGridArea area={tabs}>
        <ShowcaseViewBar
          all={allViews}
          selected={project.showcaseProperties.selectedView as any /** More annoying casting. TODO: look at fixing this */}
          createNew={newView}
        />
      </StudioGridArea>

      <StudioGridArea area={effects}>
        <ShowcaseEffects />
      </StudioGridArea>

      <StudioGridArea area={canvas}>
        <ShowcaseCanvas width={1920} height={1080} />
      </StudioGridArea>

      <StudioGridArea area={info}>
        <InfoBar undoRedo={view.undoRedoHandler} />
      </StudioGridArea>

      <StudioGridArea area={gumball}>
        <AnimatorGumballPropertiesBar consumer={view} />
      </StudioGridArea>

      <StudioGridArea area={sidebar}>
        <ShowcaseSidebar />
      </StudioGridArea>

    </StudioGridRaw >
  )
}

const ShowcaseCanvas = ({ height, width }: { height: number, width: number }) => {
  return (
    <div className="h-full w-full relative bg-black">
      <div className="max-h-full w-full absolute top-1/2 -translate-y-1/2" style={{ aspectRatio: `${width / height}` }}>
        <div className="h-full max-w-full absolute left-1/2 -translate-x-1/2" style={{ aspectRatio: `${width / height}` }}>
          <StudioCanvas />
        </div>
      </div>
    </div>
  )
}

export default Showcase;