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

export const writeImgToBlob = async (img: HTMLImageElement): Promise<Blob> => fetch(img.src).then(res => res.blob())

export const writeImgToBase64 = async (img: HTMLImageElement): Promise<string> => {
  const blob = await writeImgToBlob(img)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      resolve((reader.result as string).replace(/^.+,/, ''))
    }
    reader.onerror = e => {
      console.error(e)
      reject(e)
    }
    reader.readAsDataURL(blob)
  })
}

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
};


export const fitAreaWithinBounds = (width: number, height: number, areaWidth: number, areaHeight: number) => {
  const ratio = Math.min(areaWidth / width, areaHeight / height)
  return {
    width: width * ratio,
    height: height * ratio
  }
}