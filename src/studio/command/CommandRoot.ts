import { LO } from '../util/ListenableObject';
import { Command } from './Command';
import { CommandInput } from './CommandInput';
import { CommandParseError } from './CommandParseError';

type ParsedArgument<T = any> = {
  readonly value: T,
  readonly textfreindlyValue: string | null,
  error?: CommandParseError
}

export class CommandRoot {

  readonly commands: Command[] = []

  readonly activeCommand = new LO<Command | null>(null)

  readonly currentInput = new LO("")

  readonly avaliableCommands = new LO<Command[]>([])

  readonly currentArgumentMap = new LO<Record<string, ParsedArgument>>({})

  constructor() {
    this.currentInput.addListener(s => {
      this.avaliableCommands.value = s === "" ? [] : this.commands.filter(c => c.name.toLowerCase().startsWith(s.toLowerCase()))

      const splitSpace = s.split(" ")
      const split = splitStr(s)
      if (split !== null && splitSpace.length > 1) {
        const command = this.activeCommand.value = this.commands.find(c => c.name.toLocaleLowerCase() === split[0].toLowerCase()) ?? null
        if (command !== null) {
          const commandReader = new CommandInput(split.slice(1))
          const commands = command.parseArguments(commandReader)
          this.currentArgumentMap.value = commands.reduce((value, current) => ({
            ...value,
            [current.name]: {
              value: current.value,
              textfreindlyValue: current.textfreindlyValue,
              error: current.error
            }
          }), {} as Record<string, ParsedArgument>)
        }


      } else {
        this.activeCommand.value = null
      }
    })
  }
  _addCommand(command: Command) {
    this.commands.push(command)
  }

  addCommand(func: (addCommand: (command: Command) => void) => void) {
    func(command => this._addCommand(command))
  }

  runInput() {
    this.runCommand(this.currentInput.value)
    this.currentInput.value = ""
  }

  runCommand(value: string) {
    console.log(value)
  }

  onEnter() {

  }
}

/**
 * Helper function to split a string up, with quotation markes included.
 * For example: 'a b c "d e f"' would be ['a', 'b, 'c', 'd e f']
 * @todo: make sure that this doens't inlude the quotation marks
 * @param {string} str the input string
 */
function splitStr(str: string) {
  return str.match(/(?:[^\s"]+|"[^"]*")+/g)
}

// const root = new CommandRoot()