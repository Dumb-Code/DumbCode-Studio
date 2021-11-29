import { Command } from './Command';
export class CommandRoot {

  addCommand(command: Command<any, any, any>) {

  }


  onInputTyped(value: string) {

  }

  onEnter() {

  }
}

const root = new CommandRoot()