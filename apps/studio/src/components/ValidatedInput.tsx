import { SVGCheck, SVGCross } from "@dumbcode/shared/icons";
import { FormEvent, InputHTMLAttributes, useCallback, useMemo, useState } from "react";

export type ValidatedInputType = {
  readonly value: string;
  readonly valid: boolean;
  readonly setter: (value: string) => void;
}

const ValidatedInput = (props: { input: ValidatedInputType } & InputHTMLAttributes<HTMLInputElement>) => {
  const { input, className, ...otherProps } = props
  return (
    <div>
      <input
        {...otherProps}
        className={(className ?? "") + " px-2 py-1 " + (input.valid || " ring-2 ring-red-600")}
        value={input.value}
        onInput={useCallback((e: FormEvent<HTMLInputElement>) => input.setter(e.currentTarget.value ?? ""), [input])}
      />
      {
        input.valid ?
          <div className="relative">
            <div className="absolute right-1 -top-7">
              <SVGCheck className="m-0.5 p-0.5 w-5 h-5 bg-green-600 rounded-full" />
            </div>
          </div> :
          <div className="relative">
            <div className="absolute right-1 -top-7">
              <SVGCross className="m-0.5 p-0.5 w-5 h-5 bg-red-600 rounded-full" />
            </div>
          </div>
      }
    </div>
  )
}

export const useValidatedInput = (validator: (value: string) => boolean, defaultValue = ""): ValidatedInputType => {
  const [value, setValue] = useState(defaultValue)
  const [valid, setIsValid] = useState(validator(defaultValue))
  const setter = useCallback((value: string) => {
    setValue(value)
    setIsValid(validator(value))
  }, [validator])
  return useMemo(() => ({ value, valid, setter }), [value, valid, setter])
}

export default ValidatedInput