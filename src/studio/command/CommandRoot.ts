import { LO } from '../util/ListenableObject';
import { DCMCube, DCMModel } from './../formats/model/DcmModel';
import { Command } from './Command';
import { CommandInput } from './CommandInput';
import { CommandParseError } from './CommandParseError';
import { CommandRunError } from './CommandRunError';

export type ParsedArgument<T = any> = {
  readonly value: T,
  readonly textfreindlyValue: string | null,
  error?: CommandParseError
}

type CommandParsedData = {
  command: Command;
  args: {
    name: string;
    value: any;
    textfreindlyValue: string | null;
    error?: CommandParseError | undefined;
  }[];
  flags: string[];
}

export class CommandRoot {

  readonly commands: Command[] = []

  readonly activeCommand = new LO<Command | null>(null)

  readonly currentInput = new LO("")

  readonly avaliableCommands = new LO<Command[]>([])

  readonly currentFlags = new LO<readonly string[]>([])
  readonly currentArgumentMap = new LO<Record<string, ParsedArgument>>({})

  readonly lastCommandErrorOutput = new LO<string>("")

  readonly onFrameCallback = new LO<null | (() => void)>(null)

  constructor(private readonly model: DCMModel) {
    this.currentInput.addListener(s => this.onInputChanged(s))
  }

  onInputChanged(s = this.currentInput.value) {
    this.lastCommandErrorOutput.value = ""
    this.avaliableCommands.value = s === "" ? [] : this.commands.filter(c => c.name.toLowerCase().startsWith(s.toLowerCase()))

    const splitSpace = s.split(" ")
    const cmd = this._findCommandAndArgs(s)
    if (splitSpace.length > 1 && cmd !== null) {
      const { command, args, flags } = cmd
      this.activeCommand.value = command
      if (command !== null) {
        this.currentFlags.value = flags
        this.currentArgumentMap.value = args.reduce((value, current) => ({
          ...value,
          [current.name]: {
            value: current.value,
            textfreindlyValue: current.textfreindlyValue,
            error: current.error
          }
        }), {} as Record<string, ParsedArgument>)
      }
      try {
        const result = this.runCommand(cmd, true)
        this.onFrameCallback.value = result ?? null
      } catch (e) {
        this.onFrameCallback.value = null
        if (!(e instanceof CommandRunError)) {
          throw e
        }
      }
    } else {
      this.activeCommand.value = null
      this.currentFlags.value = []
      this.currentArgumentMap.value = {}
      this.onFrameCallback.value = null
    }
  }

  _addCommand(command: Command) {
    this.commands.push(command)
  }

  addCommand(func: (addCommand: (command: Command) => void) => void) {
    func(command => this._addCommand(command))
  }

  runInput() {
    const inputText = this.currentInput.value
    this.currentInput.value = ""
    try {
      this.runCommand(this._findCommandAndArgs(inputText), false)
    } catch (e) {
      if (e instanceof CommandRunError) {
        this.lastCommandErrorOutput.value = e.message
      } else {
        throw e
      }
    }
  }

  runCommand(parsedData: CommandParsedData | null, dummy: boolean) {
    if (parsedData === null) {
      return
    }
    const { command, args, flags } = parsedData
    return command.runCommand({
      hasFlag: f => flags.includes(f),
      getArgument: arg => {
        const found = args.find(a => a.name === arg)
        if (!found) {
          throw new CommandRunError("Unable to find argument '" + arg + "'")
        }
        if (found.error) {
          throw new CommandRunError("Error in parsing argument '" + arg + "': '" + found.error.message + "'")
        }
        return found.value
      },
      getModel: () => this.model,
      getCubes: (allowEmpty = false) => {
        const cubes = this.model.selectedCubeManager.selected.value
          .map(c => this.model.identifierCubeMap.get(c))
          .filter((t): t is DCMCube => t !== undefined)
        if (!allowEmpty && cubes.length === 0) {
          throw new CommandRunError("No cubes were selected")
        }
        return cubes
      },
      dummy,
    })

  }

  _findCommandAndArgs(value: string): CommandParsedData | null {
    const split = splitStr(value)
    if (split === null) {
      return null
    }
    const command = this.commands.find(c => c.name.toLocaleLowerCase() === split[0].toLowerCase())
    if (command === undefined) {
      return null
    }

    const flags: string[] = []
    let flagEndIndex = 1
    for (; split[flagEndIndex]?.startsWith("-"); flagEndIndex++) {
      flags.push(split[flagEndIndex].substring(1))
    }

    const commandReader = new CommandInput(split.slice(flagEndIndex))
    const args = command.parseArguments(commandReader)
    return {
      command, args, flags
    }
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