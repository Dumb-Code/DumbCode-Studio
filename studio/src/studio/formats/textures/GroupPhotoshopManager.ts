import { Layer, Psd, readPsd, writePsd } from 'ag-psd';
import { Texture, TextureGroup } from './TextureManager';
import { imageDataToHTMLElement } from './TexturePhotoshopManager';

export const writeGroupToPhotoshopObject = (group: TextureGroup): Psd => {
  const textures = group.textures.value.map(t => group.manager.findTexture(t))

  const width = Math.max(...textures.map(t => t.width), 1)
  const height = Math.max(...textures.map(t => t.height), 1)
  const data: Psd = {
    width,
    height,
    children: textures.map<Layer>(t => ({
      name: t.name.value,
      imageData: new ImageData(resizeTexture(t.canvas.manager.readTexture(t.canvas), t.width, t.height, width, height), width, height, {}),
    })).reverse()
  }

  return data

}
export const saveGroupToPhotoshopFile = (group: TextureGroup): Blob => {
  const data = group.psdData.value ?? writeGroupToPhotoshopObject(group)
  group.psdData.value = data
  const arrayBuffer = writePsd(data, {})
  return new Blob([arrayBuffer], { type: "image/psd" })
}

const combinePixel = (src: Uint8ClampedArray, dest: Uint8ClampedArray, srcIndex: number, destIndex: number) => {
  const a1 = src[srcIndex + 3] / 255
  const r1 = src[srcIndex] / 255 * a1
  const g1 = src[srcIndex + 1] / 255 * a1
  const b1 = src[srcIndex + 2] / 255 * a1

  const a2 = dest[destIndex + 3] / 255
  const r2 = dest[destIndex] / 255 * a2
  const g2 = dest[destIndex + 1] / 255 * a2
  const b2 = dest[destIndex + 2] / 255 * a2

  //Blend the pixels together. The rgb values are premultipled above.
  const a = a1 + a2 * (1 - a1)
  const r = (r1 + r2 * (1 - a1)) / a
  const g = (g1 + g2 * (1 - a1)) / a
  const b = (b1 + b2 * (1 - a1)) / a

  dest[destIndex] = Math.floor(r * 255)
  dest[destIndex + 1] = Math.floor(g * 255)
  dest[destIndex + 2] = Math.floor(b * 255)
  dest[destIndex + 3] = Math.floor(a * 255)
}

const addOntoLayer = (dest: ImageData, src: ImageData, left: number, top: number) => {
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const srcIndex = (y * src.width + x) * 4
      const destIndex = ((y + top) * dest.width + (x + left)) * 4
      combinePixel(src.data, dest.data, srcIndex, destIndex)
    }
  }
}

type OffsetImageData = {
  data: ImageData,
  left: number,
  top: number
}

const gatherAllImgDatas = (layer: Layer, left = 0, top = 0) => {
  const images: OffsetImageData[] = []
  if (layer.hidden) {
    return images
  }
  if (layer.imageData) {
    images.push({
      data: layer.imageData,
      left: left + (layer.left ?? 0),
      top: top + (layer.top ?? 0)
    })
  }
  if (layer.children) {
    for (const child of layer.children) {
      images.push(...gatherAllImgDatas(child, layer.left ?? 0, layer.top ?? 0))
    }
  }
  return images
}

const combine = (images: OffsetImageData[], psd: Psd, width: number, height: number) => {
  const dest = new ImageData(psd.width, psd.height)
  for (const image of images) {
    addOntoLayer(dest, image.data, image.left, image.top)
  }
  return dest
}
const createImgData = (layer: Layer, psd: Psd, width: number, height: number) => {
  const images = gatherAllImgDatas(layer)
  if (images.length === 0) {
    return new ImageData(width, height)
  }

  return combine(images, psd, width, height)
}

export const loadGroupFromPsdFile = async (arrayBuffer: ArrayBuffer, group: TextureGroup) => {
  const psd = readPsd(arrayBuffer, { useImageData: true })

  if (!psd.children) {
    return psd
  }

  const textures = group.textures.value.map(t => group.manager.findTexture(t))

  const managedTextures: Texture[] = []

  const promises = psd.children.map(async (child) => {
    const texture = textures.find(t => t.name.value.trim().toLowerCase() === child.name?.trim()?.toLowerCase() && managedTextures.indexOf(t) === -1)
    if (!texture) {
      return
    }
    const imgData = createImgData(child, psd, texture.width, texture.height)
    texture.element.value = await imageDataToHTMLElement(imgData)
  })

  await Promise.all(promises)

  return psd
}

const resizeTexture = (from: Uint8ClampedArray, fromWidth: number, fromHeight: number, toWidth: number, toHeight: number) => {
  if (fromWidth === toWidth && fromHeight === toHeight) {
    return from
  }
  const to = new Uint8ClampedArray(toWidth * toHeight * 4)
  for (let y = 0; y < toHeight; y++) {
    for (let x = 0; x < toWidth; x++) {
      const fromX = Math.floor(x * fromWidth / toWidth)
      const fromY = Math.floor(y * fromHeight / toHeight)
      const fromIndex = (fromY * fromWidth + fromX) * 4
      const toIndex = (y * toWidth + x) * 4
      to[toIndex] = from[fromIndex]
      to[toIndex + 1] = from[fromIndex + 1]
      to[toIndex + 2] = from[fromIndex + 2]
      to[toIndex + 3] = from[fromIndex + 3]
    }
  }
  return to
}
