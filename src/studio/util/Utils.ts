import { Camera, Object3D, OrthographicCamera, Vector3 } from "three"

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
    height: height * ratio,
    ratio
  }
}

const tempPos = new Vector3()
const tempPos2 = new Vector3()

export const scaleMeshToCamera = (mesh: Object3D, camera: Camera, invFactor: number) => {
  let factor;

  if (camera instanceof OrthographicCamera) {
    factor = (camera.top - camera.bottom);
  } else {
    //Used to have the mesh get smaller as it gets further away.
    //The angleBetween and cos is used to make it the right size even when not at the center of the screen
    tempPos2.subVectors(mesh.position, tempPos.setFromMatrixPosition(camera.matrixWorld)).normalize();
    let angleBetween = tempPos2.angleTo(camera.getWorldDirection(tempPos));
    factor = mesh.position.distanceTo(tempPos.setFromMatrixPosition(camera.matrixWorld)) * Math.cos(angleBetween);
  }

  mesh.scale.set(1, 1, 1).multiplyScalar(factor / invFactor);
}