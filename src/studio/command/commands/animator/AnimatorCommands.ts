import DcProject from '../../../formats/project/DcProject';
import { CommandRoot } from './../../CommandRoot';
import KeyframeLockedCubeCommand from './KeyframeLockedCubeCommand';
export const createAnimatorCommandRoot = (project: DcProject) => {
  const root = new CommandRoot(project)

  root.addCommand(KeyframeLockedCubeCommand)

  return root
}