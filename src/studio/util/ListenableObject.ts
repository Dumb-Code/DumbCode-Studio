/* eslint-disable react-hooks/exhaustive-deps */ // -- we want to use exhaustive deps (or do we)
import { DependencyList, useCallback, useEffect, useState } from 'react';
import { HistoryActionType, SectionHandle, UndoRedoSection } from './../undoredo/UndoRedoHandler';

type FieldsFor<DataType, FieldType> = { [K in keyof DataType]: DataType[K] extends FieldType ? K : never }[keyof DataType]

function _getOrRun<T, R>(value: T | undefined, data: R | ((val: T | undefined) => R)): R {
  if (typeof data === "function") {
    const fn = data as (val: T | undefined) => R
    return fn(value)
  }
  return data
}


type Listener<T> = (
  newValue: T,
  oldValue: T
) => void

type ModifiableListener<T> = (
  newValue: T,
  oldValue: T,
  naughtyModifyValue: (t: T) => void
) => void

export class LO<T> {
  public internalValue: T
  constructor(
    private _value: T,
    defaultCallback?: Listener<T>,
    private preModifyListener: Set<ModifiableListener<T>> = new Set(),
    private listners: Set<Listener<T>> = new Set(),
    private postListeners: Set<Listener<T>> = new Set(),
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
    Array.from(this.preModifyListener).forEach(l => l(value, this._value, val => newValue = val))
    this.internalValue = newValue
    if (value !== this._value) {
      //We need to clone the listeners, as they can be changed while being called
      //Otherwise more than one listner will mean a infinate virtually untraceable loop
      Array.from(this.listners).forEach(l => l(value, this._value))
    }
    this._value = newValue
    Array.from(this.postListeners).forEach(l => l(value, this._value))
  }

  addPreModifyListener = (func: ModifiableListener<T>) => {
    this.preModifyListener.add(func)
  }


  addListener = (func: Listener<T>) => {
    this.listners.add(func)
  }

  addPostListener = (func: Listener<T>) => {
    this.postListeners.add(func)
  }

  addAndRunListener = (func: Listener<T>) => {
    func(this.value, this.value)
    this.listners.add(func)
  }

  removeListener = (func: Listener<T>) => {
    this.listners.delete(func)
  }
  removePostListener = (func: Listener<T>) => {
    this.postListeners.delete(func)
  }

  applyToSection
    <
      S extends UndoRedoSection,
      P extends FieldsFor<S['data'], T> & string
    >
    (section: SectionHandle<any, S>, property_name: P, silent = false, reason?: string | ((val: T | undefined) => string), action?: HistoryActionType | ((val: T | undefined) => HistoryActionType)) {
    let isModifying = false
    section.modifyFirst(property_name, this.value, value => {
      isModifying = true
      this.value = value
      isModifying = false
    })
    this.addListener((value, oldValue) => !isModifying && section.modify(property_name, value, oldValue, silent, _getOrRun(value, reason), _getOrRun(value, action)))
    return this
  }

  applyMappedToSection
    <
      S extends UndoRedoSection,
      M,
      P extends FieldsFor<S['data'], M> & string
    >
    (section: SectionHandle<any, S>, mapper: (val: T) => M, reverseMapper: (val: M) => T, property_name: P, silent = false, reason?: string | ((val: T | undefined) => string), action?: HistoryActionType | ((val: T | undefined) => HistoryActionType)) {
    let isModifying = false
    section.modifyFirst(property_name, mapper(this.value), value => {
      isModifying = true
      this.value = reverseMapper(value)
      isModifying = false
    })
    this.addListener((value, oldValue) => !isModifying && section.modify(property_name, mapper(value), mapper(oldValue), silent, _getOrRun(value, reason), _getOrRun(value, action)))
    return this
  }
}

export const useListenableObjectNullable = <T>(obj: LO<T> | undefined, deps: DependencyList = []): [T | undefined, (val: T) => void] => {
  const [state, setState] = useState<T | undefined>(() => obj?.internalValue)
  useEffect(() => {
    if (obj === undefined) {
      setState(undefined)
      return
    }
    if (state !== obj.internalValue) {
      setState(() => obj.internalValue)
    }
    const listener = (t: T) => setState(() => t)
    obj.addListener(listener)
    return () => obj.removeListener(listener)
  }, [state, setState, obj, ...deps])
  return [
    state,
    useCallback(val => {
      if (obj !== undefined) {
        obj.value = val
      }
    }, [obj, ...deps])
  ]
}


export const useListenableObject = <T>(obj: LO<T>, deps: DependencyList = []): [T, (val: T) => void] => {
  const [state, setState] = useState(() => obj.internalValue)
  useEffect(() => {
    if (state !== obj.internalValue) {
      setState(() => obj.internalValue)
    }
    const listener = (t: T) => setState(() => t)
    obj.addListener(listener)
    return () => obj.removeListener(listener)
  }, [state, setState, obj, ...deps])
  return [state, useCallback(val => obj.value = val, [obj, ...deps])]
}

const isMapEqual = <K, V>(map1: Map<K, V>, map2: Map<K, V>) => {
  if (map1.size !== map2.size) {
    return
  }
  let equal = true
  map1.forEach((value, key) => equal = equal || (map2.has(key) && map2.get(key) === value))
  return equal
}
//Is readonly
export const useListenableMap = <K, V>(obj: LOMap<K, V>, deps: DependencyList = []): Map<K, V> => {
  const [state, setState] = useState<Map<K, V>>(() => new Map(obj))
  useEffect(() => {
    if (!isMapEqual(state, obj)) {
      setState(new Map(obj))
    }
    const listener = () => setState(new Map(obj))
    obj.addGlobalListener(listener)
    return () => {
      obj.removeGlobalListener(listener)
    }
  }, [state, setState, obj, ...deps])
  return state
}

type MapChangedKeys<K, V> = {
  key: K
  value: V | undefined
  oldValue: V | undefined
}

export class LOMap<K, V> extends Map<K, V> {
  constructor(
    defaultMap?: Map<K, V>,
    defaultCallback?: () => void,
    private listners: Map<K, Set<(newValue: V | undefined, oldValue: V | undefined) => void>> = new Map(),
    private globalListeners = new Set<(changedKeys: MapChangedKeys<K, V>[]) => void>()
  ) {
    super(defaultMap ?? null)
    if (defaultCallback) {
      this.globalListeners.add(defaultCallback)
    }
  }

  putAllSilently(map: Map<K, V>) {
    map.forEach((value, key) => super.set(key, value))
  }

  clear() {
    const changedKeys: MapChangedKeys<K, V>[] = []
    this.forEach((oldValue, key) => {
      changedKeys.push({ key, oldValue, value: undefined })
    })

    this.forEach((v, k) => {
      const get = this.listners.get(k)
      if (get !== undefined) {
        get.forEach(l => l(undefined, v))
      }
    })
    super.clear()
    Array.from(this.globalListeners).forEach(l => l(changedKeys))
  }

  delete(key: K) {
    const oldValues = this.get(key) ?? undefined
    const listeners = this.listners.get(key)
    if (listeners !== undefined) {
      listeners.forEach(l => l(undefined, oldValues))
    }
    const ret = super.delete(key);
    Array.from(this.globalListeners).forEach(l => l([{ key, oldValue: oldValues, value: undefined }]))
    return ret
  }

  set(key: K, value: V) {
    const oldValue = this.get(key) ?? undefined
    super.set(key, value)
    const get = this.listners.get(key)
    if (get !== undefined) {
      get.forEach(l => l(value, oldValue))
    }
    Array.from(this.globalListeners).forEach(l => l([{ key, oldValue, value }]))
    return this
  }

  setSilently(key: K, value: V) {
    super.set(key, value)
  }

  addGlobalListener = (func: (changedKeys: MapChangedKeys<K, V>[]) => void) => this.globalListeners.add(func)
  removeGlobalListener = (func: (changedKeys: MapChangedKeys<K, V>[]) => void) => this.globalListeners.delete(func)

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

  applyToSection<S extends UndoRedoSection>(
    section: SectionHandle<any, S>, propertyPrefix: string, silent = false,
    keyMapper: (key: K) => string, reverseKeyMapper: (str: string) => K | null,
    reason?: string | ((val: V | undefined) => string), action?: HistoryActionType | ((val: V | undefined) => HistoryActionType)
  ) {
    let isModifying = false

    this.forEach((value, key) => {
      const stringKey = propertyPrefix + keyMapper(key)
      section.modifyDirectly(stringKey, value)
    })

    section.addPrefixCallback(propertyPrefix, (property, value) => {
      const key = reverseKeyMapper(property)
      if (key === null) {
        return
      }
      isModifying = true
      this.set(key, value)
      isModifying = false
    })

    this.addGlobalListener(changed => {
      if (isModifying) {
        return
      }
      changed.forEach(({ key, oldValue, value }) => {
        const stringKey = propertyPrefix + keyMapper(key)
        section.modify(stringKey, value, oldValue, silent, _getOrRun(value, reason), _getOrRun(value, action))
      })
    })
    return this
  }

  static applyToSectionStringKey<S extends UndoRedoSection, V>(
    map: LOMap<string, V>,
    section: SectionHandle<any, S>, propertyPrefix: string, silent = false,
    reason?: string | ((val: V | undefined) => string), action?: HistoryActionType | ((val: V | undefined) => HistoryActionType)
  ) {
    return map.applyToSection(section, propertyPrefix, silent, s => s, s => s, reason, action)
  }

  static extractSectionDataToMap<D, SK extends keyof D & string, MK>(data: D, key: SK, keyMapper: (key: SK) => MK) {
    const map = new Map<MK, D[SK]>()
    Object.keys(data)
      .filter((d): d is SK => d.startsWith(key))
      .forEach(k => {
        const key = keyMapper(k)
        const value = data[k]
        map.set(key, value)
      })
    return map
  }
}


export const useListenableObjectInMap = <K, V>(obj: LOMap<K, V>, key: K, deps: DependencyList = []): [V | undefined, (val: V) => void, () => void] => {
  const [state, setState] = useState(obj.get(key))
  useEffect(() => {
    const v = obj.get(key)
    if (state !== v) {
      setState(() => v)
    }
    const listener = (v?: V) => setState(() => v)
    obj.addListener(key, listener)
    return () => obj.removeListener(key, listener)
  }, [state, setState, obj, key, ...deps])
  return [
    state,
    useCallback(val => obj.set(key, val), [obj, key, ...deps]),
    useCallback(() => obj.delete(key), [obj, key, ...deps])
  ]
}

export const useListenableObjectInMapNullable = <K, V>(obj?: LOMap<K, V>, key?: K, deps: DependencyList = []): [V | undefined, (val: V) => void, () => void] => {
  const [state, setState] = useState(obj !== undefined && key !== undefined ? obj.get(key) : undefined)
  useEffect(() => {
    if (obj === undefined || key === undefined) {
      setState(undefined)
      return
    }
    const v = obj.get(key)
    if (state !== v) {
      setState(() => v)
    }
    const listener = (v?: V) => setState(() => v)
    obj.addListener(key, listener)
    return () => obj.removeListener(key, listener)
  }, [state, setState, obj, key, ...deps])
  return [
    state,
    useCallback(val => {
      if (obj !== undefined && key !== undefined) {
        obj.set(key, val)
      }
    }, [obj, key, ...deps]),
    useCallback(() => {
      if (obj !== undefined && key !== undefined) {
        obj.delete(key)
      }
    }, [obj, key, ...deps])
  ]
}