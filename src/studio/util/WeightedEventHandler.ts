type Callback<D> = (data: D) => boolean | void
export default class IndexedEventHandler<D> {
  listeners: { index: number, callback: Callback<D>, alwaysRecieve: boolean }[] = []

  addListener(weight: number, callback: Callback<D>, alwaysRecieve = false) {
    this.listeners.push({ index: weight, callback, alwaysRecieve })
    this.listeners.sort((a, b) => a.index - b.index)
  }

  removeListener(callback: Callback<D>) {
    this.listeners = this.listeners.filter(l => l.callback !== callback)
  }

  fireEvent(data: D) {
    let canceled = false
    for (let listener of this.listeners) {
      if ((!canceled || listener.alwaysRecieve) && listener.callback(data) === true) {
        canceled = true
        const dataAny = data as any
        if (dataAny["stopPropagation"] !== undefined) {
          dataAny["stopPropagation"]()
        }
        if (dataAny["preventDefault"] !== undefined) {
          dataAny["preventDefault"]()
        }
      }
    }
  }
}