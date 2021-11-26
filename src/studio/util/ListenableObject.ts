import { useEffect, useState } from 'react';
import { SectionHandle, UndoRedoSection } from './../undoredo/UndoRedoHandler';

type FieldsFor<DataType, FieldType> = { [K in keyof DataType]: DataType[K] extends FieldType ? K : never }[keyof DataType]

type Listener<T> = (
  newValue: T,
  oldValue: T,
  naughtyModifyValue: (t: T) => void
) => void

export class LO<T> {
  public internalValue: T
  constructor(
    private _value: T,
    defaultCallback?: Listener<T>,
    private listners: Set<Listener<T>> = new Set(),
  ) {
    if (defaultCallback) {
      this.listners.add(defaultCallback)
    }
    this.internalValue = _value;
  }

  get value() {
    return this._value
  }

  set value(value: T) {
    let newValue = value
    this.internalValue = value
    if (value !== this._value) {
      //We need to clone the listeners, as they can be changed while being called
      //Otherwise more than one listner will mean a infinate virtually untraceable loop
      Array.from(this.listners).forEach(l => l(value, this._value, val => newValue = val))
    }
    this._value = newValue
  }

  addListener = (func: Listener<T>) => {
    this.listners.add(func)
  }

  addAndRunListener = (func: Listener<T>) => {
    func(this.value, this.value, () => new Error("Invalid setter called on passive function call"))
    this.listners.add(func)
  }

  removeListener = (func: Listener<T>) => {
    this.listners.delete(func)
  }

  applyToSection
    <
      S extends UndoRedoSection,
      P extends FieldsFor<S['data'], T> & string
    >
    (section: SectionHandle<any, S>, property_name: P) {
    let isModifying = false
    section.modifyFirst(property_name, this.value, value => {
      isModifying = true
      this.value = value
      isModifying = false
    })
    this.addListener((value, oldValue) => section.modify(property_name, value, oldValue))
    return this
  }

  applyMappedToSection
    <
      S extends UndoRedoSection,
      M,
      P extends FieldsFor<S['data'], M> & string
    >
    (section: SectionHandle<any, S>, mapper: (val: T) => M, reverseMapper: (val: M) => T, property_name: P) {
    let isModifying = false
    section.modifyFirst(property_name, mapper(this.value), value => {
      isModifying = true
      this.value = reverseMapper(value)
      isModifying = false
    })
    this.addListener((value, oldValue) => section.modify(property_name, mapper(value), mapper(oldValue)))
    return this
  }
}

export const useListenableObjectNullable = <T>(obj: LO<T> | undefined): [T | undefined, (val: T) => void] => {
  const [state, setState] = useState<T | undefined>(() => obj?.internalValue)
  useEffect(() => {
    if (obj === undefined) {
      setState(undefined)
      return
    }
    if (state !== obj.internalValue) {
      setState(obj.internalValue)
    }
    obj.addListener(setState)
    return () => obj.removeListener(setState)
  }, [state, setState, obj])
  return [state, val => {
    if (obj !== undefined) {
      obj.value = val
    }
  }]
}


export const useListenableObject = <T>(obj: LO<T>, debug = false): [T, (val: T) => void] => {
  const [state, setState] = useState(() => obj.internalValue)
  useEffect(() => {
    if (state !== obj.internalValue) {
      setState(obj.internalValue)
    }
    obj.addListener(setState)
    return () => obj.removeListener(setState)
  }, [state, setState, obj])
  return [state, val => obj.value = val]
}


//Is readonly
export const useListenableMap = <K, V>(obj: LOMap<K, V>): Map<K, V> => {
  const [state, setState] = useState<Map<K, V>>(() => new Map(obj))
  useEffect(() => {
    if (state !== obj) {
      setState(obj)
    }
    const listener = () => setState(new Map(obj))
    obj.addGlobalListener(listener)
    return () => {
      obj.removeGlobalListener(listener)
    }
  }, [state, setState, obj])
  return state
}

export class LOMap<K, V> extends Map<K, V> {
  constructor(
    private listners: Map<K, Set<((newValue: V | undefined, oldValue: V | undefined) => void)>> = new Map(),
    private globalListeners = new Set<() => void>()
  ) {
    super()
  }

  clear() {
    this.forEach((v, k) => {
      const get = this.listners.get(k)
      if (get !== undefined) {
        get.forEach(l => l(undefined, v))
      }
      this.globalListeners.forEach(l => l())
    })
    super.clear()
  }

  delete(key: K) {
    const get = this.listners.get(key)
    if (get !== undefined) {
      get.forEach(l => l(undefined, this.get(key) ?? undefined))
    }
    this.globalListeners.forEach(l => l())
    return super.delete(key);
  }

  set(key: K, value: V) {
    const old = this.get(key)
    super.set(key, value)
    const get = this.listners.get(key)
    if (get !== undefined) {
      get.forEach(l => l(value, old))
    }
    this.globalListeners.forEach(l => l())
    return this
  }

  addGlobalListener = (func: () => void) => this.globalListeners.add(func)
  removeGlobalListener = (func: () => void) => this.globalListeners.delete(func)

  addListener(key: K, func: (newValue: V | undefined, oldValue: V | undefined) => void) {
    const arr = this.listners.get(key) ?? new Set()
    arr.add(func)
    this.listners.set(key, arr)
  }

  removeListener(key: K, func: (newValue: V | undefined, oldValue: V | undefined) => void) {
    const arr = this.listners.get(key)
    if (arr !== undefined) {
      arr.delete(func)
    }
  }
}


export const useListenableObjectInMap = <K, V>(obj: LOMap<K, V>, key: K): [V | undefined, (val: V) => void] => {
  const [state, setState] = useState(obj.get(key))
  useEffect(() => {
    const v = obj.get(key)
    if (state !== v) {
      setState(v)
    }
    obj.addListener(key, setState)
    return () => obj.removeListener(key, setState)
  }, [state, setState, obj, key])
  return [state, val => obj.set(key, val)]
}

export const useListenableObjectInMapNullable = <K, V>(obj?: LOMap<K, V>, key?: K): [V | undefined, (val: V) => void] => {
  const [state, setState] = useState(obj !== undefined && key !== undefined ? obj.get(key) : undefined)
  useEffect(() => {
    if (obj === undefined || key === undefined) {
      setState(undefined)
      return
    }
    const v = obj.get(key)
    if (state !== v) {
      setState(v)
    }
    obj.addListener(key, setState)
    return () => obj.removeListener(key, setState)
  }, [state, setState, obj, key])
  return [state, val => {
    if (obj !== undefined && key !== undefined) {
      obj.set(key, val)
    }
  }]
}