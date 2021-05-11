type Callback<D> = (data: D) => boolean | void
export default class IndexedEventHandler<D> {
  listeners: { index: number, callback: Callback<D> }[] = []

  addListener(weight: number, callback: Callback<D>) {
    this.listeners.push({ index: weight, callback })
    this.listeners.sort((a, b) => a.index - b.index)
  }

  removeListener(callback: Callback<D>) {
    this.listeners = this.listeners.filter(l => l.callback !== callback)
  }

  fireEvent(data: D) {
    for (let listener of this.listeners) {
      if (listener.callback(data) === true) {
        if (data["stopPropagation"] !== undefined) {
          data["stopPropagation"]()
        }
        if (data["preventDefault"] !== undefined) {
          data["preventDefault"]()
        }
        return
      }
    }
  }
}