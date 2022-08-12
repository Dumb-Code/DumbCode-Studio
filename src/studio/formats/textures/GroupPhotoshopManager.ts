import { Layer, Psd, readPsd, writePsd } from 'ag-psd';
import { Texture, TextureGroup } from './TextureManager';

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

export const loadGroupFromPsdFile = async (arrayBuffer: ArrayBuffer, group: TextureGroup) => {
  const psd = readPsd(arrayBuffer, { useImageData: true })

  if (!psd.children) {
    return Promise.reject("No children found in PSD file")
  }

  const textures = group.textures.value.map(t => group.manager.findTexture(t))

  const managedTextures: Texture[] = []

  psd.children.forEach((child) => {
    const texture = textures.find(t => t.name.value.toLowerCase() === child.name?.toLowerCase() && managedTextures.indexOf(t) === -1)
    if (!texture || !child.imageData) {
      return
    }
    texture.canvas.setBackground(child.imageData)
  })
}

const resizeTexture = (from: Uint8ClampedArray, fromWidth: number, fromHeight: number, toWidth: number, toHeight: number) => {
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