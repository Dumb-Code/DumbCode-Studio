export default class EventManager<T> {

  constructor(
    public handlers: EventTypeList<T, any>[] = []
  ) { }

  _findEventArray = <K extends keyof T>(k: K) => {
    const existing = this.handlers.find(t => t.type === k)
    if (existing !== undefined) {
      return (existing as EventTypeList<T, K>).array
    }

    const list = new EventTypeList<T, K>(k)
    this.handlers.push(list)
    return list.array
  }

  addEventListener = <K extends keyof T>(key: K, func: (e: T[K]) => void) => {
    this._findEventArray(key).add(func)
  }

  hasEventListener = <K extends keyof T>(key: K, func: (e: T[K]) => void) => {
    this._findEventArray(key).has(func)
  }

  removeEventListener = <K extends keyof T>(key: K, func: (e: T[K]) => void) => {
    this._findEventArray(key).delete(func)
  }

  dispatchEvent = <K extends keyof T>(key: K, e: T[K]) => {
    this._findEventArray(key).forEach(f => f(e))
  }

}

class EventTypeList<T, K extends keyof T> {
  constructor(
    public type: K,
    public array: Set<(e: T[K]) => void> = new Set(),
  ) { }
}