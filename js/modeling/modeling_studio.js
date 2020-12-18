import { CubeListBoard } from "./cube_list_board.js"
import { DragSelection } from "./drag_selection.js"
import { CubePointTracker } from "./cube_point_tracker.js"
import { Gumball } from "./gumball.js"
import { LockedCubes } from "./locked_cubes.js"
import { CubeValueDisplay } from "./cube_value_display.js"
import { StudioPanels } from "./studio_panels.js"
import { applyCubeStateHighlighting } from "./cube_state_highlighting.js"
import { RotationPointMarkers } from "./rotation_point.markers.js"
import { CubeCreateDelete } from "./cube_create_delete.js"
import { CommandRoot, indexHandler, numberHandler } from "../command_handler.js"
import { EventDispatcher, Group } from "../three.js"
import { CubeCommands } from "./cube_commands.js"
import { ModelerOptions } from "./modeler_options.js"
import { CubeCopyPaste } from "./cube_copy_paste.js"
import { applyAdjustScrollable } from "../util.js"

export class ModelingStudio {

    constructor(domElement, display, raytracer, orbitControls, renameCube, setCamera, pth) {
        this.domElement = domElement
        let dom = $(domElement)
        this.canvasContainer = dom.find(".display-div").get(0)
        this.display = display
        this.pth = pth
        this.raytracer = raytracer

        this.group = new Group()

        this.commandRoot = new CommandRoot(dom, raytracer, pth)

        this.raytracer.addEventListener('selectchange', () => this.selectedChanged())
        this.pth.addEventListener('selectchange', () => this.cubeList.refreshCompleatly())
        this.selectedRequired = dom.find('.editor-require-selected')

        this.transformControls = display.createTransformControls()
        this.group.add(this.transformControls)

        applyCubeStateHighlighting(dom, this)
        
        this.cubeCopyPaste = new CubeCopyPaste(this, this.commandRoot)
        this.cubeCreateDelete = new CubeCreateDelete(dom, this)

        this.rotationPointMarkers = new RotationPointMarkers(this)
        this.lockedCubes = new LockedCubes(this)    
        this.cubeList = new CubeListBoard(dom.find("#cube-list").get(0), raytracer, pth, this.lockedCubes, renameCube)
        this.dragSelection = new DragSelection(this, dom.find('#drag-selection-overlay'), orbitControls)
        this.pointTracker = new CubePointTracker(raytracer, display, this.group)
        this.gumball = new Gumball(dom, this)
        this.cubeValues = new CubeValueDisplay(dom, this, renameCube)
        this.studioPanels = new StudioPanels(dom, 300, 300)
        this.transformControls.addEventListener('objectChange', () => this.runFrame())

        this.modelerOptions = new ModelerOptions(dom, this, setCamera)

        this.cubeCommands = new CubeCommands(this.commandRoot, this, dom)

        this.addEventListener('keydown', e => {
            if(document.activeElement.nodeName == "INPUT") {
                return
            }
            if(e.event.keyCode === 46) {
                if(e.event.ctrlKey) {
                    this.cubeCreateDelete.deleteCubes()
                } else {
                    this.cubeCreateDelete.deleteCubesNoChildren()
                }
            }

            pth.modelMementoTraverser.onKeyDown(e.event)
        })

        applyAdjustScrollable(dom)
    }

    setCamera(camera) {
        this.transformControls.camera = camera
        this.gumball.gumballTransformControls.camera = camera
    }

    runFrame() {
        this.pth.model.resetAnimations()
        this.pointTracker.update()
        this.raytracer.update()
        this.cubeValues.onRender()
        this.cubeCommands.onFrame()
        this.display.render()
        this.dragSelection.onFrame()
        this.pth.modelMementoTraverser.onFrame()
    }

    cubeHierarchyChanged() {
        this.cubeList.refreshCompleatly()
        this.modelerOptions.refreshOptionTexts()
    }

    setActive() {
        window.studioWindowResized()
        this.cubeValues.updateCubeValues()
        this.display.renderTopGroup.add(this.group)
        this.transformControls.enableReason('tab')
        this.dragSelection.onActive()
    }
    
    setUnactive() {
        this.display.renderTopGroup.remove(this.group)
        this.transformControls.disableReason('tab')
        this.dragSelection.onInactive()
        this.pointTracker.disable()
    }

    selectedChanged() {
        this.cubeValues.updateCubeValues()
        this.gumball.selectChange()
        this.rotationPointMarkers.selectChanged()

        let isSelected = this.raytracer.selectedSet.size === 1
        this.selectedRequired.prop("disabled", !isSelected).toggleClass("is-active", isSelected)
    }
}

Object.assign(ModelingStudio.prototype, EventDispatcher.prototype)