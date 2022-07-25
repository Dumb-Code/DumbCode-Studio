/* eslint-disable react-hooks/exhaustive-deps */ // -- we want to use exhaustive deps (or do we)
import { DependencyList, useCallback, useEffect, useState } from 'react';
import { HistoryActionTypes, SectionHandle, UndoRedoSection } from './../undoredo/UndoRedoHandler';

type FieldsFor<DataType, FieldType> = { [K in keyof DataType]: DataType[K] extends FieldType ? K : never }[keyof DataType]

type ValueOrGetter<T, R> = R | ((val: T | undefined) => R)

function _getOrRun<T, R>(value: T | undefined, data: ValueOrGetter<T, R>): R {
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
  public dontUpdateSection = false
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
    (section: SectionHandle<any, S>, property_name: P, silent = false, reason?: ValueOrGetter<T, string>, action?: ValueOrGetter<T, HistoryActionTypes>) {
    let isModifying = false
    section.modifyFirst(property_name, this.value, value => {
      isModifying = true
      this.value = value
      isModifying = false
    })
    this.addListener((value, oldValue) => !isModifying && !this.dontUpdateSection && section.modify(property_name, value, oldValue, silent, _getOrRun(value, reason), _getOrRun(value, action)))
    return this
  }

  applyMappedToSection
    <
      S extends UndoRedoSection,
      M,
      P extends FieldsFor<S['data'], M> & string
    >
    (section: SectionHandle<any, S>, mapper: (val: T) => M, reverseMapper: (val: M) => T, property_name: P, silent = false, reason?: string | ((val: T | undefined) => string), action?: HistoryActionTypes | ((val: T | undefined) => HistoryActionTypes)) {
    let isModifying = false
    section.modifyFirst(property_name, mapper(this.value), value => {
      isModifying = true
      this.value = reverseMapper(value)
      isModifying = false
    })
    this.addListener((value, oldValue) => !isModifying && !this.dontUpdateSection && section.modify(property_name, mapper(value), mapper(oldValue), silent, _getOrRun(value, reason), _getOrRun(value, action)))
    return this
  }

  static createDelegateListener<T, R>(
    root: LO<R>,
    mapperFromThisToRoot: (val: T, root: R) => R,
    mapperFromRootToThis: (val: R) => T,
    defaultCallback?: Listener<T>,
    preModifyListener?: Set<ModifiableListener<T>>,
    listners?: Set<Listener<T>>,
    postListeners?: Set<Listener<T>>,
  ) {
    const lo = new LO(mapperFromRootToThis(root.value), defaultCallback, preModifyListener, listners, postListeners)
    root.addListener(newVal => lo.value = mapperFromRootToThis(newVal))
    lo.addListener(newValue => root.value = mapperFromThisToRoot(newValue, root.value))
    return lo
  }

  static createOneWayDelegateListener<T, R>(
    root: LO<R>,
    mapperFromRootToThis: (val: R) => T,
    defaultCallback?: Listener<T>,
    preModifyListener?: Set<ModifiableListener<T>>,
    listners?: Set<Listener<T>>,
    postListeners?: Set<Listener<T>>,
  ) {
    const lo = new LO(mapperFromRootToThis(root.value), defaultCallback, preModifyListener, listners, postListeners)
    root.addPostListener(newVal => lo.value = mapperFromRootToThis(newVal))
    return lo
  }

  static createReadonly = <T>(value: T) => {
    const lo = new LO(value)
    lo.addPreModifyListener((_new, _old, naughtModifyValue) => naughtModifyValue(value))
    return lo
  }

  static combine = <L, R, T>(left: LO<L>, right: LO<R>, mapper: (left: L, right: R) => T) => {
    const lo = new LO(mapper(left.value, right.value))
    left.addListener(newVal => lo.value = mapper(newVal, right.internalValue))
    right.addListener(newVal => lo.value = mapper(left.internalValue, newVal))
    return lo
  }
}


export const useChangingDelegateListenableObject = <T>(source: LO<T> | undefined, target: LO<T>, defaultValue?: T, copyToSourceInsteadOfTargetOnChange = false) => {
  useEffect(() => {
    if (source === undefined) {
      if (defaultValue !== undefined && !copyToSourceInsteadOfTargetOnChange) {
        target.value = defaultValue
      }
      return
    }
    if (source.value !== target.value) {
      if (copyToSourceInsteadOfTargetOnChange) {
        source.value = target.value
      } else {
        target.value = source.value
      }
    }
    let isSetting = false

    const createDelegateListener = <T>(other: LO<T>) => (val: T) => {
      if (!isSetting) {
        isSetting = true
        other.value = val
        isSetting = false
      }
    }

    const sourceListener = createDelegateListener(target)
    const targetListener = createDelegateListener(source)

    source.addListener(sourceListener)
    target.addListener(targetListener)

    return () => {
      source.removeListener(sourceListener)
      target.removeListener(targetListener)
    }
  }, [source, target])
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

export const useListenableObjectToggle = (obj: LO<boolean>, deps: DependencyList = []): [boolean, (val?: boolean) => void] => {
  const [value, setValue] = useListenableObject(obj, deps)
  const toggle = useCallback(() => setValue(!value), [value])
  return [value, toggle]
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

    private preGlobalListeners = new Set<(changedKeys: MapChangedKeys<K, V>[]) => void>(),
    private globalListeners = new Set<(changedKeys: MapChangedKeys<K, V>[]) => void>(),
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
    Array.from(this.preGlobalListeners).forEach(l => l(changedKeys))
    super.clear()
    Array.from(this.globalListeners).forEach(l => l(changedKeys))
  }

  delete(key: K) {
    const oldValues = this.get(key) ?? undefined
    const listeners = this.listners.get(key)
    if (listeners !== undefined) {
      listeners.forEach(l => l(undefined, oldValues))
    }
    Array.from(this.preGlobalListeners).forEach(l => l([{ key, oldValue: oldValues, value: undefined }]))
    const ret = super.delete(key);
    Array.from(this.globalListeners).forEach(l => l([{ key, oldValue: oldValues, value: undefined }]))
    return ret
  }

  set(key: K, value: V) {
    const oldValue = this.get(key) ?? undefined

    //Super constructor can call this, meaning the fields of this class will be undefined.
    if (this.preGlobalListeners !== undefined) {
      Array.from(this.preGlobalListeners).forEach(l => l([{ key, oldValue, value }]))
    }

    if (value === undefined) {
      super.delete(key)
    } else {
      super.set(key, value)
    }
    if (this.listners === undefined) {
      return this
    }
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


  addPreGlobalListener = (func: (changedKeys: MapChangedKeys<K, V>[]) => void) => this.preGlobalListeners.add(func)
  removePreGlobalListener = (func: (changedKeys: MapChangedKeys<K, V>[]) => void) => this.preGlobalListeners.delete(func)

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
    reason?: ValueOrGetter<V, string>, action?: ValueOrGetter<V, HistoryActionTypes>
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
    reason?: ValueOrGetter<V, string>, action?: ValueOrGetter<V, HistoryActionTypes>
  ) {
    return map.applyToSection(section, propertyPrefix, silent, s => s, s => s, reason, action)
  }

  static extractSectionDataToMap<D, SK_PREFIX extends string, MK>(data: D, key: SK_PREFIX, keyMapper: (key: string) => MK) {
    type SK = `${SK_PREFIX}${string}` & keyof D
    const map = new Map<MK, D[SK]>()
    Object.keys(data)
      .filter((d): d is SK => d.startsWith(key))
      .forEach(k => {
        const mapped = keyMapper(k.substring(key.length))
        const value = data[k]
        map.set(mapped, value)
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
