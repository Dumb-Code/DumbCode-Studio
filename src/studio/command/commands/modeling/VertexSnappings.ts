import { Matrix4, Quaternion, Vector3 } from 'three';
import { DCMCube } from '../../../formats/model/DcmModel';
import DcProject from '../../../formats/project/DcProject';
import { HistoryActionTypes } from '../../../undoredo/UndoRedoHandler';
import CubeLocker from "../../../util/CubeLocker";
import { Command } from "../../Command";
import { CommandRunError } from '../../CommandRunError';

const worldPosVector = new Vector3()
const tempCubePos = new Vector3()
const tempCubeQuat = new Quaternion()
const tempCubeScale = new Vector3()
const tempResultMatrix = new Matrix4()

const VertexSnapping = (project: DcProject) => (addCommand: (command: Command) => void) => {
  let active = false

  const pointTracker = project.cubePointTracker
  const cubeManager = project.selectedCubeManager
  const lockedCubes = project.lockedCubes

  //When the raytracer is clicked, if command is active and nothing is clicked, disable it and consume the event.
  //This occurs when you click on nothing while the vertex snapping is enabled.
  cubeManager.listeners.add(() => {
    if (active && cubeManager.mouseOverMesh === undefined) {
      active = false
      pointTracker.disable()
      return true
    }
    return false
  })

  //When the selction changes while the command is active, if there isn't any selcted disable the command.
  cubeManager.selected.addListener(v => {
    if (active && v.length === 0) {
      active = false
      pointTracker.disable()
    }
  })

  addCommand(new Command("snap", "Vertex Snapping", {}, context => {
    if (context.dummy) {
      return
    }

    const rp = context.hasFlag("rp")
    const cubeLockers: CubeLocker[] = []

    //Phase 2 is the second part of the command, where the user clicks on a point to use
    //as the target point to move to. 
    //The reason this is a seperate function, as if the flag 'rp' is active, then the first point
    //will already be set (being the rotation point), and we only need to choice a target point.
    //Thus phase2 is active immediatly.
    let phase2 = (cube: DCMCube) => {
      //Enable the point tracker with a redish color
      pointTracker.enable(p => {
        active = false
        //World difference of the two points. -1 as it should be (p.position - worldPosVector), but we don't want to mutate p.position
        let worldDiff = worldPosVector.sub(p).multiplyScalar(-1)

        //Decompose the matrix and, add the position, then recompose the matrix.
        cube.cubeGroup.matrixWorld.decompose(tempCubePos, tempCubeQuat, tempCubeScale)
        tempResultMatrix.compose(tempCubePos.add(worldDiff), tempCubeQuat, tempCubeScale)

        if (rp) {
          //If the rotation point, then reconstruct the matrix to the cube, and reconstruct the lockers.
          CubeLocker.reconstructLocker(cube, 0, tempResultMatrix)
          cube.cubeGroup.updateMatrixWorld()
          cubeLockers.forEach(l => l.reconstruct())
        } else {
          //Else, create the locked cubes cache, move the cube and reconstruct the cache.
          lockedCubes.createLockedCubesCache()
          CubeLocker.reconstructLocker(cube, 0, tempResultMatrix)
          lockedCubes.reconstructLockedCubes()
        }

        //Deselect everything and click on the original cube.
        cube.selected.value = true

        project.model.undoRedoHandler.endBatchActions(`Vertex Snap Command`, HistoryActionTypes.Command)
      }, 0x662141)
    }

    //Make sure worldPosVector has the target position before phase2 is called.
    //If rp, we just need to find a target point
    if (rp) {
      const cubes = context.getCubes()
      if (cubes.length !== 1) {
        throw new CommandRunError("Can only snap one cube.")
      }
      const cube = cubes[0]
      //The rp flag means moving the roation point. That means the offset and children
      //should stay the world same, so we need to create the cube lockers.
      cubeLockers.push(new CubeLocker(cube, 1))
      cube.children.value.forEach(child => cubeLockers.push(new CubeLocker(child, 0)))
      cube.cubeGroup.getWorldPosition(worldPosVector)

      cube.model.undoRedoHandler.startBatchActions()
      phase2(cube)
    } else {
      //Enable the point tracker to get the source point to move.
      pointTracker.enable((p, _, c) => {
        c.model.undoRedoHandler.startBatchActions()

        project.model.identifierCubeMap.forEach(v => {
          if (v.selected.value) {
            v.selected.value = false
          }
        })
        worldPosVector.copy(p)
        phase2(c)
      }, undefined, undefined)
    }

    return undefined
  }, {
    "rp": "Use the cubes rotation point as the first point to move"
  }))
}

export default VertexSnapping