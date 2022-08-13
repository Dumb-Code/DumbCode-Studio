import { test } from "@jest/globals";
import { readFile } from 'fs/promises';
import { loadUnknownAnimation } from "../../src/studio/formats/animations/DCALoader";
import { loadModelUnknown } from "../../src/studio/formats/model/DCMLoader";
import DcProject from "../../src/studio/formats/project/DcProject";


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

test("That v0 animations work", async () => {
  const { project, animation } = await loadFile("v00")
})