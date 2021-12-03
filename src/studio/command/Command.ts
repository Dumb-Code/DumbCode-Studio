import { ArgumentHandler } from './Argument';
import { CommandInput } from './CommandInput';
import { CommandParseError } from './CommandParseError';
export class Command<
  M extends {
    [P: string]: ArgumentHandler<any>
  } = any,
  T extends {
    [P in keyof M]: M[P] extends ArgumentHandler<infer V> ? V : never
  } = any,
  B extends keyof M = any
  > {

  private readonly builders: { name: string, previousArguments: Omit<T, B> }[] = []

  constructor(
    public readonly name: string,       //The name of this command
    public readonly description: string,//Description of this command
    private readonly argumentMap: M,     //The map of argument name -> argument handler
    private readonly builderArgument?: B //The argument that the builder runs on
  ) {
  }

  addCommandBuilder(name: string, previousArguments: Omit<T, B>): this {
    this.builders.push({ name, previousArguments })
    return this
  }

  formatToString() {
    return this.name + Object.keys(this.argumentMap).map(k => ` <${k}>`).join("")
  }

  formatArguments() {
    return Object.keys(this.argumentMap).map(arg => {
      const map = this.argumentMap[arg]
      return {
        name: arg,
        desc: map.freindlyText
      }
    })
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

