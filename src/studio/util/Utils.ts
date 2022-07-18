import { PNG } from "pngjs"

export const convertMapToRecord = <V>(map: Map<string, V>): Record<string, V> =>
  Array.from(map.entries()).reduce((dict, entry) => {
    dict[entry[0]] = entry[1]
    return dict
  }, {} as Record<string, V>)

export const convertRecordToMap = <V>(dict: Record<string, V>, map = new Map<string, V>()) => {
  Object.keys(dict).forEach(key => map.set(key, dict[key]))
}

export const imgSourceToElement = (src: string) => {
  const png = new PNG()
  return new Promise<PNG>((resolve, reject) => {
    png.once('parsed', () => resolve(png))
    png.parse(src, (error, png) => {
      if (error) {
        reject(error)
      } else {
        resolve(png)
      }
    })
  })
}

export const writeImgToBlob = async (img: PNG): Promise<Blob> => {
  //DONT PACK, INSTEAD CREATE A NEW OBJECT THEN PACK IT
  //Actually, make a test to see if packing changes img.data ?
  img.pack()
  const blob = new Blob([img.data], { type: 'image/png' })

  return blob
}

export const writeImgToBase64 = async (img: PNG): Promise<string> => {
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
    height: height * ratio,
    ratio
  }
}