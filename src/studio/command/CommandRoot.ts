import DcProject from '../formats/project/DcProject';
import { LO } from '../util/ListenableObject';
import { DCMCube } from './../formats/model/DcmModel';
import { HistoryActionTypes } from './../undoredo/UndoRedoHandler';
import { EnumOrEmptyArgument } from './Argument';
import { Command, CommandContext, CommandValues } from './Command';
import { CommandBuilder } from './CommandBuilder';
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
    textfreindlyValue?: string;
    error?: CommandParseError;
  }[];
  flags: string[];
  unparsed?: string
}


type CommandParseHistoryEntry = {
  data: CommandParsedData,
  unparsed: string
}

export class CommandRoot {

  readonly commands: Command[] = []

  readonly activeCommand = new LO<Command | null>(null)

  readonly currentInput = new LO("")

  readonly avaliableCommands = new LO<readonly string[]>([])

  readonly currentFlags = new LO<readonly string[]>([])
  readonly currentArgumentMap = new LO<Record<string, ParsedArgument>>({})

  readonly lastCommandErrorOutput = new LO<string>("")

  readonly commandBuilder = new LO<CommandBuilder | null>(null)

  readonly onFrameCallback = new LO<null | (() => void)>(null)

  readonly previousCommands = new LO<readonly CommandParseHistoryEntry[]>([])
  readonly logHistory = new LO<readonly { type?: "command" | "error", message: string, times?: number }[]>([])

  constructor(private readonly project: DcProject) {
    this.currentInput.addListener(s => this.onInputChanged(s))
  }

  addHelpCommand() {
    this._addCommand(new Command("help", "Get help for commands", {
      "command": EnumOrEmptyArgument("The command to get help on (Optional)", ...this.commands.map(c => c.name), "help")
    }, context => {
      if (!context.dummy) {
        const command = context.getArgument("command")
        if (command === null) {
          this.commands.forEach(c => context.logToConsole(`${c.formatToString()}: ${c.description}`))
        } else {
          const found = this.commands.find(c => c.name === command)
          if (!found) {
            throw new CommandRunError("Unable to find command of type " + command)
          }
          context.logToConsole(found.formatToString() + " " + found.description)
          found.formatFlags().forEach(f => context.logToConsole(`[-${f.name}]: ${f.desc}`))
          found.formatArgumentsDescription().forEach(a => context.logToConsole(`<${a.name}>: ${a.desc}`))

        }
      }
      return undefined
    }))
  }

  onKeyTyped(s: string) {
    this.currentInput.value = s
    if (this.commandBuilder.value !== null) {
      this.commandBuilder.value.updateTyped(s)
      return
    }
  }

  onInputChanged(s = this.currentInput.value) {
    this.lastCommandErrorOutput.value = ""

    const avaliable: string[] = []
    this.commands
      .filter(c => c.name.toLowerCase().startsWith(s.toLowerCase()))
      .forEach(c => avaliable.push(c.formatToString()))

    this.commands.flatMap(c => c.builders)
      .filter(b => b.name.toLowerCase().startsWith(s.toLowerCase()))
      .forEach(c => avaliable.push(c.name))

    this.avaliableCommands.value = s === "" ? [] : avaliable

    const splitSpace = s.split(" ")
    const cmd = this._findCommandAndArgs(splitStr(s))
    if (splitSpace.length > 1 && !(cmd instanceof CommandParseError)) {
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
        }), {})
      }
      const result = this.runCommand(cmd, true)
      this.onFrameCallback.value = result ?? null
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

  exitBuilder() {
    this.commandBuilder.value = null
  }

  runInput() {
    const inputText = this.currentInput.value
    this.currentInput.value = ""

    if (this.commandBuilder.value !== null) {
      this.commandBuilder.value.commitTyped()
      return
    }
    const split = splitStr(inputText)
    if (split !== null) {
      const builder = this.commands
        .flatMap(command => command.builders.map(builder => ({ command, builder })))
        .find(b => b.builder.name.toLowerCase() === split[0])
      if (builder) {
        const { flags, flagEndIndex } = this._findFlags(split)
        if (flagEndIndex !== split.length) {
          this.lastCommandErrorOutput.value = `Don't know how to interpret '${split.slice(flagEndIndex).join(" ")}'`
        }
        this.commandBuilder.value = builder.command.createBuilder(this, builder.builder, flags)
        return
      }
    }


    this.runCommand(this._findCommandAndArgs(split), false)

  }

  runCommand(data: CommandParsedData | CommandParseError | string, dummy: boolean) {
    this.project.model.undoRedoHandler.startBatchActions()
    let commandForOutput: string | null = null
    try {
      if (typeof data === "string") {
        data = this._findCommandAndArgs(splitStr(data))
      }
      if (data instanceof CommandParseError) {
        throw new CommandRunError(data.message)
      }

      const pd = data
      if (!dummy) {
        const unparsed = data.unparsed ?? (
          pd.command.name +
          pd.flags.map(f => ` -${f}`).join("") +
          pd.args.map(a => " " + pd.command.unParseArgument(a)).join("")
        )
        this.previousCommands.value = this.previousCommands.value.concat({ data: pd, unparsed })
        this.logMessage(unparsed, "command")
      }

      const { command, args, flags } = pd

      commandForOutput = command.name

      const context: CommandContext<CommandValues<any>> = {
        hasFlag: f => flags.includes(f),
        getArgument: arg => {
          const found = args.find(a => a.name === arg)
          if (!found) {
            throw new CommandRunError("Unable to find argument '" + String(arg) + "'")
          }
          if (found.error) {
            throw new CommandRunError("Error in parsing argument '" + String(arg) + "': '" + found.error.message + "'")
          }
          return found.value
        },
        getModel: () => this.project.model,
        getCubes: (allowEmpty = false) => {
          const cubes = this.project.selectedCubeManager.selected.value
            .map(c => this.project.model.identifierCubeMap.get(c))
            .filter((t): t is DCMCube => t !== undefined)
          if (!allowEmpty && cubes.length === 0) {
            throw new CommandRunError("No cubes were selected")
          }
          return cubes
        },
        logToConsole: message => !dummy && this.logMessage(message),
        dummy,
      }

      return command.runCommand(context)
    } catch (e) {
      if (e instanceof CommandRunError) {
        if (!dummy) {
          this.lastCommandErrorOutput.value = e.message
          this.logMessage(e.message, "error")
        }
        return null
      }
      throw e
    } finally {
      this.project.model.undoRedoHandler.endBatchActions("Command " + (commandForOutput ?? "???"), HistoryActionTypes.Command)
    }

  }

  logMessage(message: string, type?: "command" | "error", times?: number) {
    const history = this.logHistory.value
    if (history.length !== 0) {
      const last = history[history.length - 1]
      if (last.message === message && last.type === type) {
        last.times = (last.times ?? 1) + 1
        this.logHistory.value = [...history]
        return
      }
    }

    this.logHistory.value = history.concat({ message, type, times })
  }

  _findCommandAndArgs(split: string[] | null): CommandParsedData | CommandParseError {
    if (split === null) {
      return new CommandParseError("No command given")
    }
    const command = this.commands.find(c => c.name.toLocaleLowerCase() === split[0].toLowerCase())
    if (command === undefined) {
      return new CommandParseError(`Unable to find command '${split[0]}'`)
    }

    const { flags, flagEndIndex } = this._findFlags(split)

    const commandReader = new CommandInput(split.slice(flagEndIndex))
    const args = command.parseArguments(commandReader)
    return {
      command, args, flags
    }
  }

  _findFlags(split: string[], flagStartIndex = 1) {
    const flags: string[] = []
    let flagEndIndex = flagStartIndex
    for (; split[flagEndIndex]?.startsWith("-"); flagEndIndex++) {
      flags.push(split[flagEndIndex].substring(1))
    }
    return { flags, flagEndIndex }
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