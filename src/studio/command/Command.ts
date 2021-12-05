import { DCMCube, DCMModel } from './../formats/model/DcmModel';
import { ArgumentHandler } from './Argument';
import { CommandInput } from './CommandInput';
import { CommandParseError } from './CommandParseError';

type CommandValues<M> = {
  [P in keyof M]: M[P] extends ArgumentHandler<infer V> ? V : never
}

export class Command<
  M extends {
    [P: string]: ArgumentHandler<any>
  } = any,
  B extends keyof M = any
  > {


  private readonly builders: { name: string, previousArguments: Omit<CommandValues<M>, B> }[] = []

  constructor(
    public readonly name: string,         //The name of this command
    public readonly description: string,  //Description of this command
    private readonly argumentMap: M,      //The map of argument name -> argument handler
    public readonly runCommand: (context: CommandContext<CommandValues<M>>) => (() => void) | undefined, //Return a previw of the command that will run every frame. This is only used when context#dummy is true
    private readonly builderArgument?: B, //The argument that the builder runs on
    public readonly flags: Record<string, string> = {}, //The descriptions of the flags
  ) {
  }

  addCommandBuilder(name: string, previousArguments: Omit<CommandValues<M>, B>): this {
    this.builders.push({ name, previousArguments })
    return this
  }

  formatToString() {
    return this.name + Object.keys(this.flags).map(f => ` [-${f}]`) + Object.keys(this.argumentMap).map(k => ` <${k}>`).join("")
  }

  formatArguments() {
    return Object.keys(this.argumentMap).map(arg => ({
      name: arg,
      desc: this.argumentMap[arg].freindlyText
    }))
  }

  formatFlags() {
    return Object.keys(this.flags).map(key => ({
      name: key,
      desc: this.flags[key]
    }))
  }

  parseArguments(input: CommandInput) {
    const returnValue: { name: string, value: any | null, textfreindlyValue: string | null, error?: CommandParseError }[] = []
    for (let arg in this.argumentMap) {
      if (input.inputsLeft() < 0) {
        break
      }
      const map = this.argumentMap[arg]
      let value = null
      let error: undefined | CommandParseError = undefined
      try {
        value = map.inputParser(input)
      } catch (e: any) {
        if (e instanceof CommandParseError) {
          error = e
        } else {
          throw e
        }
      }
      returnValue.push({
        name: arg,
        textfreindlyValue: value === null ? null : map.valueFreindlyText(value),
        value,
        error
      })
      if (error !== undefined) {
        break
      }
    }
    return returnValue
  }
}

type CommandContext<M extends Record<string, any>> = {
  readonly getModel: () => DCMModel,
  readonly getCubes: (allowEmpty?: boolean) => DCMCube[],
  readonly getArgument: <S extends keyof M>(argument: S) => M[S],
  readonly hasFlag: (flag: string) => boolean,
  readonly dummy: boolean,
}