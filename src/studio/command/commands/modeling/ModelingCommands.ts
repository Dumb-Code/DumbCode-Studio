import DcProject from '../../../formats/project/DcProject';
import VertexSnapping from '../VertexSnappings';
import { CommandRoot } from './../../CommandRoot';
import ArrayCommands from './ArrayCommands';

export const createModelingCommandRoot = (project: DcProject) => {
  const root = new CommandRoot(project.model)

  root.addCommand(ArrayCommands)
  root.addCommand(VertexSnapping(project.cubePointTracker, project.model))


  return root
}