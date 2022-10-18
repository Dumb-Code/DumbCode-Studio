import { useCallback, useEffect, useState } from 'react';
import { HistoryActionTypes, SectionHandle, UndoRedoSection } from '../undoredo/UndoRedoHandler';
import { ValueOrGetter, _getOrRun } from './ListenableObject';

type MapChangedKeys<K, V> = {
  key: K;
  value: V | undefined;
  oldValue: V | undefined;
};

export class LOMap<K, V> extends Map<K, V> {
  constructor(
    defaultMap?: Map<K, V>,
    defaultCallback?: () => void,
    private listners: Map<K, Set<(newValue: V | undefined, oldValue: V | undefined) => void>> = new Map(),

    private preGlobalListeners = new Set<(changedKeys: MapChangedKeys<K, V>[]) => void>(),
    private globalListeners = new Set<(changedKeys: MapChangedKeys<K, V>[]) => void>()
  ) {
    super(defaultMap ?? null);
    if (defaultCallback) {
      this.globalListeners.add(defaultCallback);
    }
  }

  putAllSilently(map: Map<K, V>) {
    map.forEach((value, key) => super.set(key, value));
  }

  clear() {
    const changedKeys: MapChangedKeys<K, V>[] = [];
    this.forEach((oldValue, key) => {
      changedKeys.push({ key, oldValue, value: undefined });
    });

    this.forEach((v, k) => {
      const get = this.listners.get(k);
      if (get !== undefined) {
        get.forEach(l => l(undefined, v));
      }
    });
    Array.from(this.preGlobalListeners).forEach(l => l(changedKeys));
    super.clear();
    Array.from(this.globalListeners).forEach(l => l(changedKeys));
  }

  delete(key: K) {
    const oldValues = this.get(key) ?? undefined;
    const listeners = this.listners.get(key);
    if (listeners !== undefined) {
      listeners.forEach(l => l(undefined, oldValues));
    }
    Array.from(this.preGlobalListeners).forEach(l => l([{ key, oldValue: oldValues, value: undefined }]));
    const ret = super.delete(key);
    Array.from(this.globalListeners).forEach(l => l([{ key, oldValue: oldValues, value: undefined }]));
    return ret;
  }

  set(key: K, value: V) {
    const oldValue = this.get(key) ?? undefined;

    //Super constructor can call this, meaning the fields of this class will be undefined.
    if (this.preGlobalListeners !== undefined) {
      Array.from(this.preGlobalListeners).forEach(l => l([{ key, oldValue, value }]));
    }

    if (value === undefined) {
      super.delete(key);
    } else {
      super.set(key, value);
    }
    if (this.listners === undefined) {
      return this;
    }
    const get = this.listners.get(key);
    if (get !== undefined) {
      get.forEach(l => l(value, oldValue));
    }
    Array.from(this.globalListeners).forEach(l => l([{ key, oldValue, value }]));
    return this;
  }

  setSilently(key: K, value: V) {
    super.set(key, value);
  }

  addGlobalListener = (func: (changedKeys: MapChangedKeys<K, V>[]) => void) => this.globalListeners.add(func);
  addAndRunGlobalListener(func: (changedKeys: MapChangedKeys<K, V>[]) => void) {
    this.globalListeners.add(func);
    func(Array.from(this.entries()).map(([key, value]) => ({ key, value, oldValue: undefined })));
  }
  removeGlobalListener = (func: (changedKeys: MapChangedKeys<K, V>[]) => void) => this.globalListeners.delete(func);

  addPreGlobalListener = (func: (changedKeys: MapChangedKeys<K, V>[]) => void) => this.preGlobalListeners.add(func);
  addAndRunPreGlobalListener(func: (changedKeys: MapChangedKeys<K, V>[]) => void) {
    this.preGlobalListeners.add(func);
    func(Array.from(this.entries()).map(([key, value]) => ({ key, value, oldValue: undefined })));
  }
  removePreGlobalListener = (func: (changedKeys: MapChangedKeys<K, V>[]) => void) => this.preGlobalListeners.delete(func);

  addListener(key: K, func: (newValue: V | undefined, oldValue: V | undefined) => void) {
    const arr = this.listners.get(key) ?? new Set();
    arr.add(func);
    this.listners.set(key, arr);
  }

  removeListener(key: K, func: (newValue: V | undefined, oldValue: V | undefined) => void) {
    const arr = this.listners.get(key);
    if (arr !== undefined) {
      arr.delete(func);
    }
  }

  applyToSection<S extends UndoRedoSection>(
    section: SectionHandle<any, S>, propertyPrefix: string, silent = false,
    keyMapper: (key: K) => string, reverseKeyMapper: (str: string) => K | null,
    reason?: ValueOrGetter<V, string>, action?: ValueOrGetter<V, HistoryActionTypes>
  ) {
    let isModifying = false;

    this.forEach((value, key) => {
      const stringKey = propertyPrefix + keyMapper(key);
      section.modifyDirectly(stringKey, value);
    });

    section.addPrefixCallback(propertyPrefix, (property, value) => {
      const key = reverseKeyMapper(property);
      if (key === null) {
        return;
      }
      isModifying = true;
      this.set(key, value);
      isModifying = false;
    });

    this.addGlobalListener(changed => {
      if (isModifying) {
        return;
      }
      changed.forEach(({ key, oldValue, value }) => {
        const stringKey = propertyPrefix + keyMapper(key);
        section.modify(stringKey, value, oldValue, silent, _getOrRun(value, reason), _getOrRun(value, action));
      });
    });
    return this;
  }

  static applyToSectionStringKey<S extends UndoRedoSection, V>(
    map: LOMap<string, V>,
    section: SectionHandle<any, S>, propertyPrefix: string, silent = false,
    reason?: ValueOrGetter<V, string>, action?: ValueOrGetter<V, HistoryActionTypes>
  ) {
    return map.applyToSection(section, propertyPrefix, silent, s => s, s => s, reason, action);
  }

  static extractSectionDataToMap<D extends object, SK_PREFIX extends string, MK>(data: D, key: SK_PREFIX, keyMapper: (key: string) => MK) {
    type SK = `${SK_PREFIX}${string}` & keyof D;
    const map = new Map<MK, D[SK]>();
    Object.keys(data)
      .filter((d): d is SK => d.startsWith(key))
      .forEach(k => {
        const mapped = keyMapper(k.substring(key.length));
        const value = data[k];
        map.set(mapped, value);
      });
    return map;
  }
}


export const useListenableObjectInMap = <K, V>(obj: LOMap<K, V>, key: K): [V | undefined, (val: V) => void, () => void] => {
  const [state, setState] = useState(obj.get(key));
  useEffect(() => {
    const v = obj.get(key);
    if (state !== v) {
      setState(() => v);
    }
    const listener = (v?: V) => setState(() => v);
    obj.addListener(key, listener);
    return () => obj.removeListener(key, listener);
  }, [state, setState, obj, key]);
  return [
    state,
    useCallback(val => obj.set(key, val), [obj, key]),
    useCallback(() => obj.delete(key), [obj, key])
  ];
};

export const useListenableObjectInMapNullable = <K, V>(obj?: LOMap<K, V>, key?: K): [V | undefined, (val: V) => void, () => void] => {
  const [state, setState] = useState(obj !== undefined && key !== undefined ? obj.get(key) : undefined);
  useEffect(() => {
    if (obj === undefined || key === undefined) {
      setState(undefined);
      return;
    }
    const v = obj.get(key);
    if (state !== v) {
      setState(() => v);
    }
    const listener = (v?: V) => setState(() => v);
    obj.addListener(key, listener);
    return () => obj.removeListener(key, listener);
  }, [state, setState, obj, key]);
  return [
    state,
    useCallback(val => {
      if (obj !== undefined && key !== undefined) {
        obj.set(key, val);
      }
    }, [obj, key]),
    useCallback(() => {
      if (obj !== undefined && key !== undefined) {
        obj.delete(key);
      }
    }, [obj, key])
  ];
};

const isMapEqual = <K, V>(map1: Map<K, V>, map2: Map<K, V>) => {
  if (map1.size !== map2.size) {
    return
  }
  let equal = true
  map1.forEach((value, key) => equal = equal || (map2.has(key) && map2.get(key) === value))
  return equal
}
//Is readonly
export const useListenableMap = <K, V>(obj: LOMap<K, V>): Map<K, V> => {
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
  }, [state, setState, obj])
  return state
}


