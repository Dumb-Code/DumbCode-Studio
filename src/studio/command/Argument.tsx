import { ReactNode } from 'react';
import { CommandInput } from './CommandInput';
import { CommandParseError } from './CommandParseError';
export class ArgumentHandler<T> {
  private constructor(
    readonly freindlyText: ReactNode | ((errorData: any, isParsed: boolean) => ReactNode),
    readonly valueFreindlyText: (value: T) => string,
    readonly inputParser: (input: CommandInput) => T,
    readonly toStringFunc: (val: T) => string,
  ) { }

  public static simpleArgument<T>(freindlyText: ReactNode | ((errorData: any, isParsed: boolean) => ReactNode), func: (input: string) => T, toString = (val: T) => String(val), valueFreindlyText = toString) {
    return new ArgumentHandler(freindlyText, valueFreindlyText, input => func(input.getInput()), toString)
  }

  public static complexArgument<T>(freindlyText: ReactNode | ((errorData: any, isParsed: boolean) => ReactNode), func: (input: CommandInput) => T, toString: (val: T) => string, valueFreindlyText = toString) {
    return new ArgumentHandler(freindlyText, valueFreindlyText, func, toString)
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
export const StringArgument = () => ArgumentHandler.simpleArgument("string", s => s)
export const EnumArgument = <T extends string>(...values: readonly T[]) => ArgumentHandler.simpleArgument(`[${values}]`, s => values[_indexOf(values, s as T)])
export const IndexArgument = (string: string) => ArgumentHandler.simpleArgument(`[${Array.from(string)}]`, s => _indexOf(string, s), i => string.charAt(i))
export const IndiciesArgument = (string: string) => ArgumentHandler.simpleArgument(`[${Array.from(string)}]+`, s => [...s.split('')].map(s => _indexOf(string, s)), is => is.map(i => string.charAt(i)).join(''))
export const BooleanArgument = () => ArgumentHandler.simpleArgument("boolean", s => {
  switch (s) {
    case 'true': return true
    case 'false': return false
    default:
      throw new CommandParseError(`${s} does not exist in [true, false]`)
  }
})
export const NumberArgument = (integer: boolean) => ArgumentHandler.simpleArgument(integer ? "whole number" : "number", s => _parseNum(s, integer))

export const AxisArgument = (axis: string, integer = false) => ArgumentHandler.complexArgument(
  (data, isParsed) => {
    let axisArr: number[] | null = null
    let axisDone: number | null = null
    if (Array.isArray(data)) {
      axisArr = data
    } else {
      axisArr = data?.axisValues ?? null
      axisDone = data?.axisDone ?? null
    }

    let className = ""
    if (!isParsed && (axisArr === null || axisArr.length === 0)) {
      className = "font-bold text-red-500"
    } else if (isParsed || axisDone !== null) {
      className = "text-green-500"
    }

    const ax = axisDone ?? 0

    return (
      <>
        <span className={className}>{axis}</span>
        {" "}
        {axisArr !== null && axisArr.map((a, i) => {
          let className = ""
          if (i >= ax) {
            className = "text-red-500"
            if (i === ax) {
              className = className + " font-bold"
            }
          } else {
            className = "text-green-500"
          }
          return (
            <span
              key={i}
              className={className}
            >
              [{integer ? "whole number" : "number"} {axis[a]}]{" "}
            </span>
          )
        }
        )}
      </>
    )
  },
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
  axisValues => axisValues.map(a => axis[a.axis]).join("") + axisValues.map(a => ' ' + a.value).join(""),
  axisValues => axisValues.map(av => `${axis[av.axis]}=${av.value}`).join(", ")
)