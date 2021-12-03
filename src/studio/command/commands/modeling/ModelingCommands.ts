import { CommandRoot } from './../../CommandRoot';
import ArrayCommands from './ArrayCommands';

export const createModelingCommandRoot = () => {
  const root = new CommandRoot()

  root.addCommand(ArrayCommands)

  return root
}