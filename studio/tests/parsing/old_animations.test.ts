import { readFile } from 'fs/promises';
import { loadUnknownAnimation } from "../../src/studio/formats/animations/DCALoader";
import { loadModelUnknown } from "../../src/studio/formats/model/DCMLoader";
import DcProject from "../../src/studio/formats/project/DcProject";
import DcaAnimation, { ProgressionPoint } from './../../src/studio/formats/animations/DcaAnimation';
import { NumArray } from './../../src/studio/util/NumArray';


const FILE_PREFIX = "tests/parsing/old_animations";
const TEST_PROJECT_NAME_PREFIX = 'test_project_old_animations_'

const loadFile = async (name: string) => {
  const str = `${TEST_PROJECT_NAME_PREFIX}${name}`

  //Load the model
  const modelFile = await readFile(`${FILE_PREFIX}/model.tbl`)
  const model = await loadModelUnknown(modelFile.buffer, `model.tbl`)

  //Instansiate the project
  const project = new DcProject(str, model)

  //Load the animation
  const animationFile = await readFile(`${FILE_PREFIX}/${name}.dca`)
  const animation = await loadUnknownAnimation(project, str, animationFile.buffer)

  return { project, animation }
}

type AssertMap = { [key: string]: NumArray }

const assertKeyframe = (
  animation: DcaAnimation, startTime: number, duration: number,
  position: AssertMap, rotation: AssertMap,
  progressionPoints?: ProgressionPoint[], cubeGrow?: AssertMap,
) => {
  expect(animation.keyframes.value.length).toBe(1)
  const keyframe = animation.keyframes.value[0]
  expect(keyframe).toBeDefined()
  expect(keyframe.startTime.value).toBe(startTime)
  expect(keyframe.duration.value).toBe(duration)

  for (const [map, assert, name] of [
    [keyframe.position, position, "position"],
    [keyframe.rotation, rotation, "rotation"],
    [keyframe.cubeGrow, cubeGrow, "cubeGrow"],
  ] as const) {
    expect(assert === undefined).toBe(map.size === 0)
    if (assert !== undefined) {
      map.forEach((value, key) => {
        const assertion = assert[key]
        expect(assertion, `Expect ${name} ${key} to exist`).toBeDefined()
        for (let i = 0; i < 3; i++) {
          expect(value[i], `Expect ${name} ${key} at ${i}`).toBeCloseTo(assertion[i])
        }
      })
    }
  }

  if (progressionPoints !== undefined) {
    expect(keyframe.progressionPoints.value.length).toBe(progressionPoints.length)
    for (let i = 0; i < progressionPoints.length; i++) {
      const point = keyframe.progressionPoints.value[i]
      expect(point).toBeDefined()
      expect(point.x).toBeCloseTo(progressionPoints[i].x)
      expect(point.y).toBeCloseTo(progressionPoints[i].y)
    }
  }
}

const basePosition: AssertMap = {
  'hips': [-0, -14, 0],
  'legMiddleRight': [0, 0.38, 7.3],
  'legUpperRight': [-0, -11.4, 0],
  'legMiddleLeft': [0, 0, 7.3],
  'legUpperLeft': [-0, -11.4, 0],
}

const baseRotation: AssertMap = {
  'armRight1': [-25.87, 0, 0],
  'armLeft1': [-25.87, 0, 0],
  'tail4': [-7.2, 0, 0],
  'Tail3': [-3.6, 0, 0],
  'tail2': [10.8, 0, 0],
  'tail1': [7.2, 0, 0],
  'hips': [-3.6, 0, 0],
  'footRight': [-39.17, 0, 0],
  'legLowerRight': [73.43, 0, 0],
  'legMiddleRight': [-91, 0, 0],
  'legUpperRight': [56.74, 0, 0],
  'footLeft': [-39.17, 0, 0],
  'legLowerLeft': [73.43, 0, 0],
  'legMiddleLeft': [-91, 0, 0],
  'legUpperLeft': [56.74, 0, 0],
}

test("That v0 animations work", async () => {
  const { animation } = await loadFile("v00")
  assertKeyframe(animation, 0, 0.25, basePosition, baseRotation)
})

test("That v1 animations work", async () => {
  const { animation } = await loadFile("v01")
  assertKeyframe(animation, 0, 0.25, basePosition, baseRotation)
})

const progressionPoints: ProgressionPoint[] = [
  { required: true, x: 0, y: 1 },
  { required: false, x: 0.14, y: 0.11 },
  { required: false, x: 0.31, y: 0.86 },
  { required: false, x: 0.55, y: 0.12 },
  { required: false, x: 0.7, y: 0.8 },
  { required: true, x: 1, y: 0 }
]

test("That v2 animations work", async () => {
  const { animation } = await loadFile("v02")
  assertKeyframe(animation, 0, 0.25, basePosition, baseRotation, progressionPoints)
})

test("That v3 animations work", async () => {
  const { animation } = await loadFile("v03")
  assertKeyframe(animation, 0, 0.25, basePosition, baseRotation, progressionPoints)
})

test("That v4 animations work", async () => {
  const { animation } = await loadFile("v04")
  assertKeyframe(animation, 0, 0.25, basePosition, baseRotation, progressionPoints)
})

const extraTailRotation: AssertMap = {
  ...baseRotation,
  'tail1': [7.2, -40, 0],
  'tail2': [10.8, -0, 0],
  'tail4': [-7.2, -0, 0],
}

test("That v5 animations work", async () => {
  const { animation } = await loadFile("v05")
  assertKeyframe(animation, 0, 1, basePosition, extraTailRotation, progressionPoints)
})

const extraExtendedTailRotation: AssertMap = {
  ...extraTailRotation,
  'tail1': [7.2, -400, 0],
}

test("That v6 animations work", async () => {
  const { animation } = await loadFile("v06")
  assertKeyframe(animation, 0, 1, basePosition, extraExtendedTailRotation, progressionPoints)
})

const cubeGrow: AssertMap = {
  'chest': [5, 5, 5],
}
test("That v7 animations work", async () => {
  const { animation } = await loadFile("v07")
  assertKeyframe(animation, 0, 1, basePosition, extraExtendedTailRotation, progressionPoints, cubeGrow)
})

test("That v8 animations work", async () => {
  const { animation } = await loadFile("v08")
  assertKeyframe(animation, 0, 1, basePosition, extraExtendedTailRotation, progressionPoints, cubeGrow)
})

test("That v9 animations work", async () => {
  const { animation } = await loadFile("v09")
  assertKeyframe(animation, 0, 1, basePosition, extraExtendedTailRotation, progressionPoints, cubeGrow)
})

test("That v10 animations work", async () => {
  const { animation } = await loadFile("v10")
  assertKeyframe(animation, 0, 1, basePosition, extraExtendedTailRotation, progressionPoints, cubeGrow)
})