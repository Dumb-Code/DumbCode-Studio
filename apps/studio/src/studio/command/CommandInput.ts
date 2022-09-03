import { CommandParseError } from './CommandParseError';
export class CommandInput {
  constructor(
    readonly array: string[]
  ) { }

  inputsLeft() {
    return this.array.length
  }

  getInput(errorData?: any) {
    const value = this.array.shift()
    if (value === undefined) {
      throw new CommandParseError("Tried to get value from empty input", errorData);
    }
    return value
  }
}