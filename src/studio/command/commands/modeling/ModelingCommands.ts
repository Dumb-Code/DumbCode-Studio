import { DCMModel } from './../../../formats/model/DcmModel';
import { CommandRoot } from './../../CommandRoot';
import ArrayCommands from './ArrayCommands';

export const createModelingCommandRoot = (model: DCMModel) => {
  const root = new CommandRoot(model)

  root.addCommand(ArrayCommands)

  return root
}