import { CubeListBoard } from "./cube_list_board.js"
import { DragSelection } from "./drag_selection.js"
import { CubePointTracker } from "./cube_point_tracker.js"
import { Gumball } from "./gumball.js"
import { LockedCubes } from "./locked_cubes.js"
import { CubeValueDisplay } from "./cube_value_display.js"
import { StudioPanels } from "./studio_panels.js"
import { applyCubeStateHighlighting } from "./cube_state_highlighting.js"
import { RotationPointMarkers } from "./rotation_point.markers.js"
import { applyCubeAddingDeleting } from "./cube_create_delete.js"
import { CommandRoot, indexHandler, numberHandler } from "../command_handler.js"
import { Group } from "../three.js"

export class ModelingStudio {

    constructor(domElement, display, raytracer, orbitControls, renameCube, setTexture) {
        this.domElement = domElement
        let dom = $(domElement)
        this.canvasContainer = dom.find("#display-div").get(0)
        this.display = display
        this.raytracer = raytracer

        this.group = new Group()

        this.commandRoot = new CommandRoot(dom)

        this.raytracer.addEventListener('selectchange', () => this.selectedChanged())
        this.selectedRequired = dom.find('.editor-require-selected')

        this.transformControls = display.createTransformControls()
        this.group.add(this.transformControls)

        applyCubeStateHighlighting(dom, this)
        applyCubeAddingDeleting(dom, this)

        this.rotationPointMarkers = new RotationPointMarkers(this)
        this.lockedCubes = new LockedCubes(this)    
        this.cubeList = new CubeListBoard(dom.find("#cube-list").get(0), raytracer, display.tbl, this.lockedCubes)
        this.dragSelection = new DragSelection(this, dom.find('#drag-selection-overlay'), orbitControls)
        this.pointTracker = new CubePointTracker(raytracer, display, this.group)
        this.gumball = new Gumball(dom, this)
        this.cubeValues = new CubeValueDisplay(dom, this, renameCube)
        this.studioPanels = new StudioPanels(dom, 300, 300)
        this.transformControls.addEventListener('objectChange', () => this.runFrame())
    }

    runFrame() {
        this.pointTracker.update()
        this.raytracer.update()
        this.display.tbl.resetAnimations()
        this.cubeValues.onRender()
        this.display.render()
        this.dragSelection.onFrame()
    }

    cubeHierarchyChanged() {
        this.cubeList.refreshCompleatly()
    }

    setActive() {
        window.studioWindowResized()
        this.cubeValues.updateCubeValues()
        this.display.scene.add(this.group)
        this.transformControls.enableReason('tab')
        this.dragSelection.onActive()
    }
    
    setUnactive() {
        this.display.scene.remove(this.group)
        this.transformControls.disableReason('tab')
        this.dragSelection.onInactive()
    }

    selectedChanged() {
        this.cubeValues.updateCubeValues()
        this.gumball.selectChange()
        this.rotationPointMarkers.selectChanged()

        let isSelected = this.raytracer.selectedSet.size === 1
        this.selectedRequired.prop("disabled", !isSelected).toggleClass("is-active", isSelected)
    }
}