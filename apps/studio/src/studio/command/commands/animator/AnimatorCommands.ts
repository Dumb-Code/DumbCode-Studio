import DcProject from '../../../formats/project/DcProject';
import { CommandRoot } from './../../CommandRoot';
import FloorPlaneCommand from './FloorPlaneCommand';
import KeyframeLockedCubeCommand from './KeyframeLockedCubeCommand';
import KeyframeTempParentingCommand from './KeyframeTempParentingCommand';
export const createAnimatorCommandRoot = (project: DcProject) => {
  const root = new CommandRoot(project)

  root.addCommand(KeyframeLockedCubeCommand)
  root.addCommand(KeyframeTempParentingCommand)
  root.addCommand(FloorPlaneCommand)

  return root
}