type Callback<D> = (data: D) => boolean | void

type Options = {
  alwaysRecieve: boolean
  recieveWhenIndexBlocked: boolean
}
export default class IndexedEventHandler<D> {
  listeners: { index: number, callback: Callback<D>, options: Options }[] = []

  addListener(weight: number, callback: Callback<D>, opts: Partial<Options> = {}) {
    const options: Options = {
      alwaysRecieve: opts.alwaysRecieve ?? false,
      recieveWhenIndexBlocked: opts.recieveWhenIndexBlocked ?? false,
    }
    this.listeners.push({ index: weight, callback, options })
    this.listeners.sort((a, b) => a.index - b.index)
  }

  removeListener(callback: Callback<D>) {
    this.listeners = this.listeners.filter(l => l.callback !== callback)
  }

  fireEvent(data: D) {
    let canceledIndex = -1
    for (let listener of this.listeners) {
      if ((
        canceledIndex === -1 ||            //The event is not cancled
        listener.options.alwaysRecieve ||  //The listener always recieves the event

        //The listener recieves the event when the index is blocked at the same index as the listener
        (listener.options.recieveWhenIndexBlocked && listener.index === canceledIndex)
      ) && listener.callback(data) === true) {
        canceledIndex = listener.index
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