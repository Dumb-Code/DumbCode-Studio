import { Psd, readPsd, writePsd } from 'ag-psd';
import TextureLayer from './TextureLayer';
import { Texture } from './TextureManager';

export const saveToPhotoshopFile = (texture: Texture): Blob => {

  const data: Psd = {
    name: texture.name.value,
    width: texture.width,
    height: texture.height,
    children: [{
      name: texture.name.value,
      imageData: new ImageData(texture.canvas.manager.readTexture(texture.canvas), texture.width, texture.height)
    }]
  }

  const arrayBuffer = writePsd(data, {})
  return new Blob([arrayBuffer], { type: "image/psd" })
}

export const loadFromPsdFile = async (arrayBuffer: ArrayBuffer): Promise<[HTMLImageElement, Psd]> => {
  const psd = readPsd(arrayBuffer, { useImageData: true })

  if (!psd.imageData) {
    return Promise.reject("No image data found in PSD file")
  }
  const textureLayer = new TextureLayer()
  textureLayer.setBackground(psd.imageData)
  const dataUrl = await textureLayer.toDataURL()
  const image = new Image()
  return new Promise<[HTMLImageElement, Psd]>((resolve, reject) => {
    image.onload = () => resolve([image, psd])
    image.onerror = reject
    image.src = dataUrl
  })
}