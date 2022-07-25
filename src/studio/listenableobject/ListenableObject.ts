import { useCallback, useEffect, useState } from 'react';
import { HistoryActionTypes, SectionHandle, UndoRedoSection } from '../undoredo/UndoRedoHandler';

type FieldsFor<DataType, FieldType> = { [K in keyof DataType]: DataType[K] extends FieldType ? K : never }[keyof DataType]

export type ValueOrGetter<T, R> = R | ((val: T | undefined) => R)

export function _getOrRun<T, R>(value: T | undefined, data: ValueOrGetter<T, R>): R {
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

//Links the source to the target.
//When the soure changes, the target changes, and vice versa.
//If copyToSourceInsteadOfTargetOnChange, then at the start the source copies the target. Otherwise the target copies the source.
//If there is no source, then `defaultValue` is used.
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
  }, [source, target, defaultValue, copyToSourceInsteadOfTargetOnChange])
}

export const useListenableObjectNullable = <T>(obj: LO<T> | undefined): [T | undefined, (val: T) => void] => {
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
  }, [state, setState, obj])
  return [
    state,
    useCallback(val => {
      if (obj !== undefined) {
        obj.value = val
      }
    }, [obj])
  ]
}

export const useListenableObjectToggle = (obj: LO<boolean>): [boolean, (val?: boolean) => void] => {
  const [value, setValue] = useListenableObject(obj)
  const toggle = useCallback(() => setValue(!value), [value, setValue])
  return [value, toggle]
}

export const useListenableObject = <T>(obj: LO<T>): [T, (val: T) => void] => {
  const [state, setState] = useState(() => obj.internalValue)
  useEffect(() => {
    if (state !== obj.internalValue) {
      setState(() => obj.internalValue)
    }
    const listener = (t: T) => setState(() => t)
    obj.addListener(listener)
    return () => obj.removeListener(listener)
  }, [state, setState, obj])
  return [state, useCallback(val => obj.value = val, [obj])]
}