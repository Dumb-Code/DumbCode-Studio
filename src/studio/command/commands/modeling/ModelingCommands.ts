import DcProject from '../../../formats/project/DcProject';
import { CommandRoot } from './../../CommandRoot';
import ArrayCommands from './ArrayCommands';
import ReferenceImageCommand from './ReferenceImageCommand';
import VertexSnapping from './VertexSnappings';

export const createModelingCommandRoot = (project: DcProject) => {
  const root = new CommandRoot(project.model)

  root.addCommand(ArrayCommands)
  root.addCommand(VertexSnapping(project.cubePointTracker, project.model))
  root.addCommand(ReferenceImageCommand)

  return root
}