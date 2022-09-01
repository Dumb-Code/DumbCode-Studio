import { ReactNode } from 'react';
import AxisArgumentFreindlyText from '../../components/AxisArgumentFreindlyText';
import { CommandInput } from './CommandInput';
import { CommandParseError } from './CommandParseError';

type BuildCommandCallback<T> = (nextInput: (text: string, onTyped: (value: string) => T) => Promise<void>) => Promise<void>

export class ArgumentHandler<T> {
  private constructor(
    readonly description: string,
    readonly freindlyText: ReactNode | ((val: { errorData: any, isParsed: boolean }) => JSX.Element),
    readonly valueFreindlyText: (value: T) => string,
    readonly inputParser: (input: CommandInput) => T,
    readonly toStringFunc: (val: T) => string,
    readonly buildCommand: BuildCommandCallback<T>,
  ) { }

  public static simpleArgument<T>(description: string, freindlyText: ReactNode | ((val: { errorData: any, isParsed: boolean }) => JSX.Element), func: (input: string) => T, toString = (val: T) => String(val), valueFreindlyText = toString) {
    return new ArgumentHandler(description, freindlyText, valueFreindlyText, input => func(input.getInput()), toString, async (nextInput) => await nextInput("Enter Value", func))
  }

  public static simpleEmptyArgument<T>(description: string, freindlyText: ReactNode | ((val: { errorData: any, isParsed: boolean }) => JSX.Element), func: (input: string) => T, toString = (val: T | null) => String(val ?? ""), valueFreindlyText = toString) {
    return new ArgumentHandler<T | null>(description, freindlyText, valueFreindlyText, input => input.inputsLeft() > 0 ? func(input.getInput()) : null, toString, async (nextInput) => await nextInput("Enter Value", func))
  }

  public static complexArgument<T>(description: string, freindlyText: ReactNode | ((val: { errorData: any, isParsed: boolean }) => JSX.Element), func: (input: CommandInput) => T, buildCommand: BuildCommandCallback<T>, toString: (val: T) => string, valueFreindlyText = toString) {
    return new ArgumentHandler(description, freindlyText, valueFreindlyText, func, toString, buildCommand)
  }
}

const _indexOf = <T,>(values: { indexOf: (v: T) => number }, s: T, extraData?: any) => {
  let idx = values.indexOf(s)
  if (idx === -1) {
    throw new CommandParseError(`${s} does not exist in [${values}]`, extraData)
  }
  return idx
}
const _parseNum = (string: string, integer = false, extraData?: any) => {
  if (integer === true && string.indexOf('.') !== -1) {
    throw new CommandParseError(`${string} is not a whole number`, extraData)
  }
  const num = +string
  if (isNaN(num)) {
    throw new CommandParseError(`${string} is not a valid number`, extraData)
  }
  return num;
}


export const StringOrEmptyArgument = (description: string) => ArgumentHandler.simpleEmptyArgument(description, "string?", s => s)
export const StringArgument = (description: string) => ArgumentHandler.simpleArgument(description, "string", s => s)
export const EnumArgument = <T extends string>(description: string, ...values: readonly T[]) => ArgumentHandler.simpleArgument(description, `[${values}]`, s => values[_indexOf(values, s as T)])
export const EnumOrEmptyArgument = <T extends string>(description: string, ...values: readonly T[]) => ArgumentHandler.simpleEmptyArgument(description, `[${values}]?`, s => values[_indexOf(values, s as T)])
export const IndexArgument = (description: string, string: string) => ArgumentHandler.simpleArgument(description, `[${Array.from(string)}]`, s => _indexOf(string, s), i => string.charAt(i))
export const IndiciesArgument = (description: string, string: string) => ArgumentHandler.simpleArgument(description, `[${Array.from(string)}]+`, s => [...s.split('')].map(s => _indexOf(string, s)), is => is.map(i => string.charAt(i)).join(''))
export const BooleanArgument = (description: string) => ArgumentHandler.simpleArgument(description, "boolean", s => {
  switch (s) {
    case 'true': return true
    case 'false': return false
    default:
      throw new CommandParseError(`${s} does not exist in [true, false]`)
  }
})
export const NumberArgument = (description: string, integer: boolean) => ArgumentHandler.simpleArgument(description, integer ? "whole number" : "number", s => _parseNum(s, integer))

type AxisType = {
  axis: number;
  value: number;
}
export const AxisArgument = (description: string, axis: string, integer = false) => ArgumentHandler.complexArgument<AxisType[]>(
  description,
  AxisArgumentFreindlyText(axis, integer),
  input => {
    const createExtraData = (axisValues: number[], axisDone: number) => ({ axisValues, axisDone })
    const axisValues = Array.from(input.getInput([])).map(s => _indexOf(axis, s, createExtraData([], input.inputsLeft())))
    if (input.inputsLeft() < axisValues.length) {
      throw new CommandParseError(`Missing value for axis ${axisValues.slice(input.inputsLeft()).map(v => axis[v]).join()}`, createExtraData(axisValues, input.inputsLeft()));
    }
    let axisDone = 0
    return axisValues.map(a => {
      const data = createExtraData(axisValues, axisDone)
      const value = { axis: a, value: _parseNum(input.getInput(data), integer, data) }
      axisDone++;
      return value
    })
  },
  async (nextInput) => {
    const array: (number | null)[] = Array(axis.length).fill(null)
    for (let index = 0; index < array.length; index++) {
      const axisName = axis.charAt(index)
      await nextInput(`Enter Value for axis: ${axisName}`, value => {
        if (value === "") {
          array[index] = null
        } else {
          array[index] = _parseNum(value, integer)
        }
        return array
          .map((value, axis) => ({ axis, value }))
          .filter(({ value }) => value !== null) as AxisType[]
      })
    }
  },
  axisValues => axisValues.map(a => axis[a.axis]).join("") + axisValues.map(a => ' ' + a.value).join(""), //toString
  axisValues => axisValues.map(av => `${axis[av.axis]}=${av.value}`).join(", ") //valueFreindly
)