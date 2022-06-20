import { FormEvent, InputHTMLAttributes, useCallback, useMemo, useState } from "react";

export type ValidatedInputType = {
  readonly value: string;
  readonly valid: boolean;
  readonly setter: (value: string) => void;
}

const ValidatedInput = (props: { input: ValidatedInputType } & InputHTMLAttributes<HTMLInputElement>) => {
  const { input, className, ...otherProps } = props
  return <input
    {...otherProps}
    className={(className ?? "") + (input.valid ? " bg-blue-500" : " bg-red-500")}
    value={input.value}
    onInput={useCallback((e: FormEvent<HTMLInputElement>) => input.setter(e.currentTarget.value ?? ""), [input])}
  />
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