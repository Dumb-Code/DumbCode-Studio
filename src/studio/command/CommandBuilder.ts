import { LO } from "../util/ListenableObject";
import { ArgumentHandler } from "./Argument";
import { Command, CommandValues } from "./Command";
import { CommandParseError } from './CommandParseError';
import { CommandRoot } from './CommandRoot';
import { CommandRunError } from "./CommandRunError";

export class CommandBuilder<
  M extends {
    [P: string]: ArgumentHandler<any>
  } = any
  > {

  readonly commandBuilderText = new LO<string | null>(null)
  readonly commandBuilderValueText = new LO<string | null>(null)
  readonly commandBuilderError = new LO<string | null>(null)

  private argumentsLeft: (keyof M)[]
  private readonly definedArguments: Partial<CommandValues<M>>
  private currentArgument: keyof M

  private currentNextInputResolver: null | (() => void) = null
  private currentOnTypeParser: null | ((value: string) => any) = null

  readonly onFrameCallback = new LO<null | (() => void)>(null)

  constructor(
    private readonly root: CommandRoot,
    private readonly command: Command,
    private readonly flags: string[],
    private readonly argumentMap: M,
    definedArguments: Partial<CommandValues<M>>,
  ) {
    this.definedArguments = { ...definedArguments }
    const defined = Object.keys(definedArguments)
    this.argumentsLeft = Object.keys(this.argumentMap).filter(a => !defined.includes(a))
    this.currentArgument = this.argumentsLeft[0]
    this.nextArgument()
  }

  private nextArgument() {
    const nextArg = this.argumentsLeft.shift()

    if (nextArg === undefined) {
      try {
        this.attemptRun(false)
      } catch (e) {
        if (!(e instanceof CommandRunError)) {
          throw e
        }
      }
      this.root.commandBuilder.value = null
    } else {
      this.currentArgument = nextArg
      this.argumentMap[this.currentArgument].buildCommand(this.nextInput.bind(this)).then(() => this.nextArgument())
    }
  }

  attemptRun(dummy: boolean) {
    const args = Object.keys(this.argumentMap).map(key => {
      const arg = this.definedArguments[key]
      if (arg === undefined) {
        throw new Error("Unhandled argument " + key);
      }
      return {
        name: key,
        value: arg,
      }
    })
    return this.root.runCommand({
      command: this.command,
      flags: this.flags,
      args,
    }, dummy)
  }

  updateTyped(currentTyped: string) {
    if (this.currentOnTypeParser) {
      try {
        this.definedArguments[this.currentArgument] = this.currentOnTypeParser(currentTyped)
        this.commandBuilderValueText.value = this.argumentMap[this.currentArgument].valueFreindlyText(this.definedArguments[this.currentArgument])
      } catch (e) {
        if (e instanceof CommandParseError) {
          this.commandBuilderError.value = e.message
          return
        }
        throw e
      }
      this.dummyRun()
      this.commandBuilderError.value = ""
    }
  }

  dummyRun() {
    try {
      const result = this.attemptRun(true)
      this.onFrameCallback.value = result ?? null
    } catch (e) {
      this.onFrameCallback.value = null
      if (!(e instanceof CommandRunError)) {
        throw e
      }
    }

  }

  commitTyped() {
    if (this.currentNextInputResolver) {
      this.currentNextInputResolver()
      this.currentOnTypeParser = null
      this.currentNextInputResolver = null
      this.onFrameCallback.value = null
    }
  }

  nextInput(text: string, onTyped: (value: string) => any) {
    this.commandBuilderText.value = text
    this.currentOnTypeParser = onTyped
    return new Promise<void>((resolve) => {
      this.currentNextInputResolver = resolve
    })
  }

}