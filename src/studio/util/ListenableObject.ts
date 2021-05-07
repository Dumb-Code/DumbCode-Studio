import { useEffect, useState } from 'react';
import { ReinhardToneMapping } from 'three';
export class LO<T> {
  constructor(
    private _value: T,
    private listners: Set<((newValue: T, oldValue: T) => void)> = new Set()
  ) {}

  get value() {
    return this._value
  }

  set value(value: T) {
    this._value = value
    this.listners.forEach(l => l(value, this._value))
  }

  addListener = (func: (newValue: T, oldValue: T) => void) => {
    this.listners.add(func)
  }

  removeListener = (func: (newValue: T, oldValue: T) => void) => {
    this.listners.delete(func)
  }
}

export const useListenableObject = <T>(obj: LO<T>) => {
  const [state, setState] = useState(obj.value)
  useEffect(() => {
    obj.addListener(setState)
    return () => obj.removeListener(setState)
  }, [obj])
  
  return state
}
