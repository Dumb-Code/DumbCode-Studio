import { useEffect, useState } from 'react';
import { v4 } from 'uuid';
export class LO<T> {
  constructor(
    private _value: T,
    private listners: Set<((newValue: T, oldValue: T) => void)> = new Set(),
    public identifier = v4()
  ) {}

  get value() {
    return this._value
  }

  set value(value: T) {
    this.listners.forEach(l => l(value, this._value))
    this._value = value
  }

  addListener = (func: (newValue: T, oldValue: T) => void) => {
    this.listners.add(func)
  }

  removeListener = (func: (newValue: T, oldValue: T) => void) => {
    this.listners.delete(func)
  }
}

export const useListenableObject = <T>(obj: LO<T>): [T, (val: T) => void] => {
  const [state, setState] = useState(obj.value)
  useEffect(() => {
    if(state !== obj.value) {
      setState(obj.value)
    }
    obj.addListener(setState)
    return () => obj.removeListener(setState)
  }, [state, setState, obj])
  return [ state, (val: T) => obj.value = val]
}
