import DcProject from '../../../formats/project/DcProject';
import { CommandRoot } from './../../CommandRoot';
import ArrayCommands from './ArrayCommands';
import ReferenceImageCommand from './ReferenceImageCommand';
import VertexSnapping from './VertexSnappings';

export const createModelingCommandRoot = (project: DcProject) => {
  const root = new CommandRoot(project)

  root.addCommand(ArrayCommands)
  root.addCommand(VertexSnapping(project))
  root.addCommand(ReferenceImageCommand)

  return root
}