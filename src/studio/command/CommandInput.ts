export class CommandInput {
  constructor(
    readonly array: string[]
  ) { }

  inputsLeft() {
    return this.array.length
  }

  getInput() {
    const value = this.array.shift()
    if (value === undefined) {
      throw new Error("Tried to get value from empty input");
    }
    return value
  }
}