import { DCMCube } from './DcmModel';
//TODO: explain why this is (8/16, 12/16, 0)
//As the x and y axis are flipped, and the tbl origins are differnet to the studio origins,
//we need to flip around a point inbetween the x axis and the y axis 
// x: 8/16 (not sure -- investigate)

import JSZip from "jszip";
import { Vector3 } from "three";
import { runInvertMath } from '../../math/InvertMath';
import { runMirrorMath } from '../../math/MirrorMath';
import { DCMModel } from "./DcmModel";

// y: 12/16 as the tbl origin is at 24/16
export let worldPos = new Vector3(8 / 16, 12 / 16, 0)
export let worldX = new Vector3(1, 0, 0)
export let worldY = new Vector3(0, 1, 0)

/**
 * Reads and converts a .tbl model to a DCMModel
 * @param {ArrayBuffer} data the arraybuffer containging the data
 * @returns {DCMModel} a converted model
 */
export async function readTblFile(data: ArrayBuffer): Promise<[DCMModel, string, number]> {
  let model = new DCMModel()

  model.undoRedoHandler.ignoreActions = true

  let zip = await JSZip.loadAsync(data)
  const file = zip.file("model.json")
  if (file === null) {
    throw new Error("No model.json file found in .tbl file")
  }
  let json = JSON.parse(await file.async("string"))

  if (json.projVersion == 4) {
    parseV4Tbl(model, json)
  } else if (json.projVersion >= 5) {
    parseV5Tbl(model, json)
  } else {
    console.error("Don't know how to convert tbl with version " + json.projVersion)
  }

  //We need to run the mirroring and invert math, to do that we need three.js stuff, 
  //and for that we need to pass a dummy material.
  model.modelGroup.updateMatrixWorld(true)

  runMirrorMath(worldPos, worldX, null, model)
  runMirrorMath(worldPos, worldY, null, model)
  runInvertMath(model, null)

  model.undoRedoHandler.ignoreActions = false
  return [model, "tbl", json.projVersion]
}

type V4TBLCube = {
  name: string
  dimensions: [number, number, number]
  position: [number, number, number]
  offset: [number, number, number]
  rotation: [number, number, number]
  txOffset: [number, number]
  txMirror: boolean
  mcScale: number
  cubeGrow?: [number, number, number]
  children: V4TBLCube[]
}

type V4TBLCubeGroup = {
  cubes: V4TBLCube[]
  cubeGroups: V4TBLCubeGroup[]
}

type V4TBL = {
  authorName: string
  textureWidth: number
  textureHeight: number
} & V4TBLCubeGroup

function parseV4Tbl(model: DCMModel, json: V4TBL) {
  //Transferable properties
  model.author.value = json.authorName
  model.textureWidth.value = json.textureWidth
  model.textureHeight.value = json.textureHeight

  let readCube = (json: V4TBLCube) => {
    let children: DCMCube[] = []
    json.children.forEach(child => { children.push(readCube(child)) })

    //Allow for .tbl files to have a cubeGrow element. For some reason this is here even tho
    //.tbl never supported this. Keeping it in. (maybe due to the fact we have our own .tbl format)
    let cubeGrow = json.cubeGrow
    if (cubeGrow === undefined) {
      cubeGrow = [json.mcScale, json.mcScale, json.mcScale]
    }

    return new DCMCube(json.name, json.dimensions, json.position, json.offset, json.rotation, json.txOffset, json.txMirror, cubeGrow, children, model)
  }

  //Navigates a group. Groups just get pushed onto as roots.
  //The root json is counted as a group, as it has the same properties that we look at (cubes, cubeGroups)
  let navigateGroup = (group: V4TBLCubeGroup) => {
    model.children.value = model.children.value.concat(group.cubes.map(cube => readCube(cube)))
    group.cubeGroups.forEach(g => navigateGroup(g))
  }
  navigateGroup(json)
}

type V5TBLBox = {
  name: string

  dimX: number
  dimY: number
  dimZ: number

  posX: number
  posY: number
  posZ: number

  expandX: number
  expandY: number
  expandZ: number
}

type V5TBLPart = {
  name: string

  boxes: V5TBLBox[]
  children: V5TBLPart[]

  rotPX: number
  rotPY: number
  rotPZ: number

  rotAX: number
  rotAY: number
  rotAZ: number

  texOffX: number
  texOffY: number

  mirror: boolean
}

type V5TBL = {
  author: string
  texWidth: number
  texHeight: number
  parts: V5TBLPart[]
}

function parseV5Tbl(model: DCMModel, json: V5TBL) {
  //Transferable properties
  model.author.value = json.author
  model.textureWidth.value = json.texWidth
  model.textureHeight.value = json.texHeight

  let readPartToCubes = (json: V5TBLPart) => {
    let name = json.boxes.length === 1 ? json.name : undefined
    let cubes = json.boxes.map(b => readCube(json, b, name))
    if (cubes.length === 0) {
      console.warn("TODO: move point with matrix when no box route")
      return []
    }
    cubes[0].children.value = json.children.flatMap(readPartToCubes)
    return cubes
  }
  let readCube = (part: V5TBLPart, json: V5TBLBox, name = part.name) => {
    return new DCMCube(
      name,
      [json.dimX, json.dimY, json.dimZ],
      [part.rotPX, part.rotPY, part.rotPZ],
      [json.posX, json.posY, json.posZ],
      [part.rotAX, part.rotAY, part.rotAZ],
      [part.texOffX, part.texOffY],
      part.mirror,
      [json.expandX, json.expandY, json.expandZ],
      [],
      model
    )
  }
  model.children.value = json.parts.flatMap(readPartToCubes)
}


