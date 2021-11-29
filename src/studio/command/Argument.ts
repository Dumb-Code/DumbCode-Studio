import { CommandInput } from './CommandInput';
export class ArgumentHandler<T> {
  private constructor(
    readonly inputParser: (input: CommandInput) => T,
  ) { }

  public static simpleArgument<T>(func: (input: string) => T) {
    return new ArgumentHandler(input => func(input.getInput()))
  }

  public static complexArgument<T>(func: (input: CommandInput) => T) {
    return new ArgumentHandler(func)
  }
}

const _indexOf = <T>(values: { indexOf: (v: T) => number }, s: T) => {
  let idx = values.indexOf(s)
  if (idx == -1) {
    throw new Error(`${s} does not exist in [${values}]`)
  }
  return idx
}
const _parseNum = (string: string, integer = false) => {
  if (integer === true && string.indexOf('.') !== -1) {
    throw new Error(`${string} is not a whole number`)
  }
  const num = +string
  if (isNaN(num)) {
    throw new Error(`${string} is not a valid number`)
  }
  return num;
}
export const StringArgument = () => ArgumentHandler.simpleArgument(s => s)
export const EnumArgument = <T extends string>(...values: readonly T[]) => ArgumentHandler.simpleArgument(s => values[_indexOf(values, s as T)])
export const IndexArgument = (string: string) => ArgumentHandler.simpleArgument(s => _indexOf(string, s))
export const IndiciesArgument = (string: string) => ArgumentHandler.simpleArgument(s => [...s.split('')].map(s => _indexOf(string, s)))
export const BooleanArgument = () => ArgumentHandler.simpleArgument(s => {
  switch (s) {
    case 'true': return true
    case 'false': return false
    default:
      throw new Error(`${s} does not exist in [true, false]`)
  }
})
export const NumberArgument = (integer: boolean) => ArgumentHandler.simpleArgument(s => _parseNum(s, integer))

export const AxisArgument = (axis: string, integer = false) => ArgumentHandler.complexArgument(input => {
  const axisValues = Array.from(input.getInput()).map(s => _indexOf(axis, s))
  if (input.inputsLeft() > axisValues.length) {
    throw new Error(`${axisValues.length} axis provided, but only ${input.inputsLeft()} values provided.`);
  }
  return axisValues.map(a => ({ axis: a, value: _parseNum(input.getInput(), integer) }))
})