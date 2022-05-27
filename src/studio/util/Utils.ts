export const convertMapToRecord = <V>(map: Map<string, V>): Record<string, V> =>
  Array.from(map.entries()).reduce((dict, entry) => {
    dict[entry[0]] = entry[1]
    return dict
  }, {} as Record<string, V>)

export const convertRecordToMap = <V>(dict: Record<string, V>, map = new Map<string, V>()) => {
  Object.keys(dict).forEach(key => map.set(key, dict[key]))
}

export const imgSourceToElement = (src: string) => {
  const img = document.createElement("img")
  return new Promise<HTMLImageElement>((resolve, reject) => {
    img.onload = () => resolve(img)
    img.onerror = (e => reject(e))
    img.src = src
  })
}