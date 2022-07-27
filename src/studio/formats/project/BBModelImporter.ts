import { Euler, Quaternion } from "three";
import CubeLocker from "../../util/CubeLocker";
import { DCMCube, DCMModel } from "../model/DcmModel";
import { NumArray } from './../../util/NumArray';
import { BBModelFormat, BoneElement, CubeElement } from "./BBModelExporter";
import DcProject from "./DcProject";

const DECODER = new TextDecoder('utf-8')

const tempEuler = new Euler()
const tempQuat = new Quaternion()
const tempQuat2 = new Quaternion()

export const importBBProject = async (name: string, arrayBuffer: ArrayBuffer): Promise<DcProject> => {
  const json: BBModelFormat = JSON.parse(DECODER.decode(arrayBuffer))
  const model = await importBBModel(json)

  return new DcProject(name, model)
}

const importBBModel = async (data: BBModelFormat): Promise<DCMModel> => {
  const model = new DCMModel()
  model.undoRedoHandler.ignoreActions = true

  model.textureWidth.value = data.resolution.width
  model.textureHeight.value = data.resolution.height

  const handledNames = new Set<string>()

  function convertToCube(elem: CubeElement, parentPos: NumArray, name = elem.name, uuid = elem.uuid, origin: NumArray = [0, 0, 0], rotation = elem.rotation) {
    //Calculate the dimensions
    let dims = calculateCubeDimensions(elem)

    //Calculate the position
    const pos = [
      elem.origin[0] - parentPos[0],
      elem.origin[1] - parentPos[1],
      elem.origin[2] - parentPos[2]
    ] as const

    //Calculate the offset.
    let off = elem.from.map((e, i) => e - elem.origin[i])


    //Calculate the inflate size
    let inf = elem.inflate ?? 0
    //Calculate the grow needed to to get the element from dims to to-from. Divided by 2 as it's in both directions
    let cg = dims.map((e, i) => (elem.to[i] - elem.from[i] - e) / 2)

    //Get a unique cube name by adding a number to the name if it's already used.
    let i = 1
    while (handledNames.has(name)) {
      name = `${elem.name}~${i}`
      i++
    }
    handledNames.add(name)

    return new DCMCube(
      name,
      dims,
      pos,

      //the offset is the position it should be. The cube offset will be moved by -cubeGrow, so we need to account for this.
      //This off + cg
      [off[0] + cg[0], off[1] + cg[1], off[2] + cg[2]],
      rotation ?? [0, 0, 0],
      [0, 0],
      false,
      [cg[0] + inf, cg[1] + inf, cg[2] + inf], //Cube grow value should be the cg + the inflate.
      [],
      model,
      uuid
    )
  }

  const uuid2ElementMap = data.elements.reduce((acc, elem) => acc.set(elem.uuid, elem), new Map<string, CubeElement>())

  //Outliner position is applied, then rotation is applied.
  //Then the children are applied
  //However, the outliner position is always in WORLD space, so we need to subtract the parents
  function consumeOutlier(elem: string | BoneElement, parentPosition: NumArray) {
    if (typeof elem === 'string') {
      const cube = uuid2ElementMap.get(elem)
      if (cube) {
        return convertToCube(cube, parentPosition)
      }
      throw new Error(`Could not find cube with uuid ${elem}`)
    } else {
      if (elem.children.length === 0) {
        return null
      }
      const firstCubeChild = elem.children.find((e): e is string => typeof e === 'string')

      let cube: DCMCube
      let rotation: NumArray = [0, 0, 0]
      if (firstCubeChild === undefined) {
        cube = new DCMCube(elem.name, [0, 0, 0], elem.origin, [0, 0, 0], elem.rotation ?? [0, 0, 0], [0, 0], false, [0, 0, 0], [], model, elem.uuid)
      } else {
        const cubeElement = uuid2ElementMap.get(firstCubeChild)
        if (!cubeElement) {
          throw new Error(`Could not find cube with uuid ${elem}`)
        }

        cube = convertToCube(cubeElement, parentPosition, elem.name, elem.uuid, elem.origin, elem.rotation ?? [0, 0, 0])
        if (cubeElement.rotation) {
          rotation = cubeElement.rotation
        }
      }

      const parentPos = [
        parentPosition[0] + cube.position.value[0],
        parentPosition[1] + cube.position.value[1],
        parentPosition[2] + cube.position.value[2]
      ] as const
      cube.children.value = elem.children.filter(e => e !== firstCubeChild).map((e) => consumeOutlier(e, parentPos)).filter((e): e is DCMCube => e !== null)

      tempQuat.setFromEuler(tempEuler.set(cube.rotation.value[0] * Math.PI / 180, cube.rotation.value[1] * Math.PI / 180, cube.rotation.value[2] * Math.PI / 180, 'ZYX'))
      tempQuat2.setFromEuler(tempEuler.set(rotation[0] * Math.PI / 180, rotation[1] * Math.PI / 180, rotation[2] * Math.PI / 180, 'ZYX'))

      const result = tempQuat.multiply(tempQuat2)
      tempEuler.setFromQuaternion(result, 'ZYX')

      cube.updateMatrixWorld()
      const lockers: CubeLocker[] = cube.children.value.map(c => new CubeLocker(c))
      cube.rotation.value = [
        tempEuler.x * 180 / Math.PI,
        tempEuler.y * 180 / Math.PI,
        tempEuler.z * 180 / Math.PI,
      ]
      cube.updateMatrixWorld()
      lockers.forEach(l => l.reconstruct())

      return cube
    }
  }

  model.children.value = data.outliner.map((elem) => consumeOutlier(elem, [0, 0, 0])).filter((e): e is DCMCube => e !== null)

  model.undoRedoHandler.ignoreActions = false

  return model
}

function calculateCubeDimensions(elem: CubeElement) {
  //First, we try and get the dimensions from the element uv. The reason for this is as follows:
  //The actual size of the element can be adjusted with cube grow. The space it takes up on the texturemap
  //however is tied directly to the dimensions. Here, we search the texturemap uv and get a list of all the 
  //width depth and height of the faces they represent. These w,d,h elements are added to a respective list
  //
  //Once we have the list of w,d,h elements, we get the mode (most common) element. If any of them are unique,
  //We use the default dimensions of getting the to-from of the element.(Note this will give incorrect uv)
  //
  //Element uvs are stored in the following format:
  //North/South: [xFrom, yFrom, xto, yTo]
  //West/East: [zFrom, yFrom, zTo, yTo]
  //Up/Down: [xFrom, zFrom, xTo, zTo]
  //
  //If we go in the order N,S,W,E,U,D: (-1 means not exist)
  //
  //          If we change it to N/W, W/E, U/D:
  //                        ↑
  //x: 0, 0, 0, 0, -1, -1   ->   0,0,-1
  //y: -1, -1, 1, 1, 1, 1   ->   -1,1,1
  //z: 1, 1, -1, -1, 0, 0   ->   1,-1,0

  let directionOrder = ["up", "down", "north", "south", "east", "west"] as const
  let xLocations = [0, 0, -1]
  let yLocations = [-1, 1, 1]
  let zLocations = [1, -1, 0]
  let xPos = []
  let yPos = []
  let zPos = []
  for (let i = 0; i < 6; i++) {
    let c = elem.faces[directionOrder[i]]

    let scale = 1//scaleGetter(c.texture)

    //Get the x location
    let x = xLocations[Math.floor(i / 2)]
    if (x !== -1) {
      //Get the to-from
      xPos.push(Math.round(Math.abs((c.uv[x] - c.uv[2 + x]) * scale)))
    }

    //Get the y location
    let y = yLocations[Math.floor(i / 2)]
    if (y !== -1) {
      //Get the to-from
      yPos.push(Math.round(Math.abs((c.uv[y] - c.uv[2 + y]) * scale)))
    }

    //Get the z location
    let z = zLocations[Math.floor(i / 2)]
    if (z !== -1) {
      //Get the to-from
      zPos.push(Math.round(Math.abs((c.uv[z] - c.uv[2 + z]) * scale)))
    }
  }
  //Gets the mode of an array, or null if there was only unique elements
  function getMode(array: number[]) {
    //Countmap stores how many times an element exists.
    let countMap = new Map<number, number>()
    //Set everything into countmap
    array.forEach(d => countMap.set(d, (countMap.get(d) ?? 0) + 1));
    //Reduce the entries, sorting by value (count)
    //The filter is to prevent 0 dimension values, as all other values are more favorable. 
    let entry = [...countMap.entries()].filter(a => a[0] !== 0).reduce((prev, curr) => prev[1] < curr[1] ? curr : prev, [3, 0])

    //Only return if there is more than 1 element
    if (entry[1] > 1) {
      return entry[0]
    }
    return null
  }

  //Get the x,y,z mode for the arrays.
  let xMode = getMode(xPos)
  let yMode = getMode(yPos)
  let zMode = getMode(zPos)
  if (xMode !== null && yMode !== null && zMode != null) {
    return [xMode, yMode, zMode] as const
  } else {
    //Fallback. Essentially just does ceil(to-from)
    return [
      Math.ceil(elem.to[0] - elem.from[0]),
      Math.ceil(elem.to[1] - elem.from[1]),
      Math.ceil(elem.to[2] - elem.from[2])
    ] as const
  }
}