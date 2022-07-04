import { Matrix4 } from 'three';
import { NumArray } from '../util/NumArray';
import { DCMCube, DCMModel } from './../formats/model/DcmModel';
const matrix = new Matrix4()

export type CubeClipboardType = {
  name: string,
  dimension: NumArray<3>,
  offset: NumArray<3>,
  textureOffset: NumArray<2>,
  textureMirrored: boolean
  cubeGrow: NumArray<3>,

  position: NumArray<3>,
  rotation: NumArray<3>,

  worldMatrix: NumArray<16>,

  children: CubeClipboardType[]

  pastedAsWorld?: boolean,
}

export const writeCubesForClipboard = (model: DCMModel, cubes: readonly DCMCube[], copyAllChildren: boolean): CubeClipboardType[] => {
  if (cubes.length === 0) {
    return []
  }
  model.resetVisuals()

  //Say we have:
  //A
  //--B
  //  --C
  //
  //And only A and C are copied, we'd now have:
  //A
  //--C
  //
  //Unless copyAllChildren is true, then we have A,B,C as defined first

  const writeCubeOrChildren = (cube: DCMCube, mustCopy: boolean): CubeClipboardType[] => {
    if (cubes.includes(cube) || mustCopy) {
      const worldMatrix = matrix.copy(cube.cubeGroup.matrixWorld)
      return [{
        name: cube.name.value,
        dimension: cube.dimension.value,
        offset: cube.offset.value,
        textureOffset: cube.textureOffset.value,
        textureMirrored: cube.textureMirrored.value,
        cubeGrow: cube.cubeGrow.value,

        position: cube.position.value,
        rotation: cube.rotation.value,

        worldMatrix: worldMatrix.toArray(),

        children: cube.children.value.flatMap(child => writeCubeOrChildren(child, copyAllChildren))
      }]
    } else {
      return cube.children.value.flatMap(child => writeCubeOrChildren(child, false))
    }
  }


  return model.children.value.flatMap(cube => writeCubeOrChildren(cube, false))
}

export const readCubesForClipboard = (model: DCMModel, cubes: readonly CubeClipboardType[]): DCMCube[] => {
  const readCube = (cube: CubeClipboardType, root: boolean): DCMCube => {
    const parsed = new DCMCube(
      cube.name, cube.dimension, cube.position, cube.offset, cube.rotation, cube.textureOffset, cube.textureMirrored,
      cube.cubeGrow, cube.children.map(cube => readCube(cube, false)), model, undefined, false
    )

    if (root) {
      parsed.pastedWorldMatrix = cube.worldMatrix
      parsed.hasBeenPastedNeedsPlacement = true
      parsed.cubeMesh.visible = false
    }

    return parsed
  }
  return cubes.map(cube => readCube(cube, true))
}