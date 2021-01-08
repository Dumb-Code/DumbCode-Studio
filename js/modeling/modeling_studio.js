import { CubeListBoard } from "./cube_list_board.js"
import { DragSelection } from "./drag_selection.js"
import { CubePointTracker } from "./cube_point_tracker.js"
import { Gumball } from "./gumball.js"
import { LockedCubes } from "./locked_cubes.js"
import { CubeValueDisplay } from "./cube_value_display.js"
import { StudioPanels } from "./studio_panels.js"
import { applyCubeStateHighlighting } from "./cube_state_highlighting.js"
import { RotationPointMarkers } from "./rotation_point_markers.js"
import { CubeCreateDelete } from "./cube_create_delete.js"
import { CommandRoot, indexHandler, numberHandler } from "../command_handler.js"
import { EventDispatcher, Group } from "../libs/three.js"
import { CubeCommands } from "./cube_commands.js"
import { CubeCopyPaste } from "./cube_copy_paste.js"
import { ReferenceImageHandler } from "./reference_image_handler.js"
import { applyAdjustScrollable } from "../util/element_functions.js"

/**
 * Ties all the modeling studio together.
 * Most of the stuff on the modeling page will be handled in here.
 */
export class ModelingStudio {

    constructor(domElement, display, raytracer, orbitControls, renameCube, pth) {
        this.domElement = domElement
        let dom = $(domElement)
        this.display = display
        this.pth = pth
        this.raytracer = raytracer

        this.group = new Group()

        this.commandRoot = new CommandRoot(dom, raytracer, pth)

        //Add the listeners to refresh stuff
        this.raytracer.addEventListener('selectchange', () => this.selectedChanged())
        this.pth.addEventListener('selectchange', () => this.cubeList.refreshCompleatly())
        //Cube selection required stuff
        this.selectedRequired = dom.find('.editor-require-selected')
        this.cubesRequired = dom.find('.editor-require-cubes')
        this.childrenRequired = dom.find('.editor-require-children')

        //Create the transform controls
        this.transformControls = display.createTransformControls()
        this.group.add(this.transformControls)

        //Apply the state highlighting
        applyCubeStateHighlighting(dom, this)
        
        //Create the copy paste + the delte cube
        this.cubeCopyPaste = new CubeCopyPaste(this, this.commandRoot)
        this.cubeCreateDelete = new CubeCreateDelete(dom, this)

        //Create all the parts
        this.rotationPointMarkers = new RotationPointMarkers(this)
        this.lockedCubes = new LockedCubes(this)    
        this.cubeList = new CubeListBoard(dom.find("#cube-list").get(0), raytracer, pth, this.lockedCubes, display.studioOptions, renameCube)
        this.dragSelection = new DragSelection(this, dom.find('#drag-selection-overlay'), orbitControls)
        this.pointTracker = new CubePointTracker(raytracer, display, this.group)
        this.gumball = new Gumball(dom, this)
        this.cubeValues = new CubeValueDisplay(dom, this, renameCube)
        this.studioPanels = new StudioPanels(dom, 300, 300)
        this.transformControls.addEventListener('objectChange', () => this.runFrame())
        this.referenceImageHandler = new ReferenceImageHandler(this, dom)

        this.cubeCommands = new CubeCommands(this.commandRoot, this, dom)


        //Bind keybinds
        this.addEventListener('keydown', e => {
            if(document.activeElement.nodeName == "INPUT") {
                return
            }

            //Delete key pressed
            if(e.event.keyCode === 46) {
                if(e.event.ctrlKey) {
                    this.cubeCreateDelete.deleteCubes()
                } else {
                    this.cubeCreateDelete.deleteCubesNoChildren()
                }
            }

            //Undo/redo stuff
            pth.modelMementoTraverser.onKeyDown(e.event)
        })

        applyAdjustScrollable(dom)
    }

    /**
     * Called per frame when this is active
     */
    runFrame() {
        this.pth.model.resetAnimations()
        this.pointTracker.update()
        this.raytracer.update()
        this.cubeValues.onRender()
        this.cubeCommands.onFrame()
        this.display.render()
        this.dragSelection.onFrame()
        this.pth.modelMementoTraverser.onFrame()
        this.rotationPointMarkers.onFrame()
    }

    /**
     * Called when the model cube hirarchy changes
     */
    cubeHierarchyChanged() {
        this.cubeList.refreshCompleatly()
        this.refreshChildrenSelected()    
    }

    /**
     * Called when the modeling tab is set active
     */
    setActive() {
        window.studioWindowResized()
        this.cubeValues.updateCubeValues()
        this.display.renderTopGroup.add(this.group)
        this.transformControls.enableReason('tab')
        this.dragSelection.onActive()
    }
    
    /**
     * Called when the modeling tab is set unactive
     */
    setUnactive() {
        this.display.renderTopGroup.remove(this.group)
        this.transformControls.disableReason('tab')
        this.dragSelection.onInactive()
        this.pointTracker.disable()
    }

    /**
     * Called when a cube selection changes
     */
    selectedChanged() {
        this.cubeValues.updateCubeValues()
        this.gumball.selectChange()
        this.rotationPointMarkers.selectChanged()

        let isSelected = this.raytracer.selectedSet.size === 1
        this.selectedRequired.prop("disabled", !isSelected).toggleClass("is-active", isSelected)

        let hasCubes = this.raytracer.anySelected()
        this.cubesRequired.prop("disabled", !hasCubes).toggleClass("is-active", hasCubes)

        this.refreshChildrenSelected()
    }

    /**
     * Refreshes the cube dom properties
     */
    refreshChildrenSelected() {
        let hasChildren = false
        this.raytracer.selectedSet.forEach(cube => hasChildren |= cube.tabulaCube.children.length > 0)
        this.childrenRequired.prop("disabled", !hasChildren).toggleClass("is-active", hasChildren)
    }
}

Object.assign(ModelingStudio.prototype, EventDispatcher.prototype)