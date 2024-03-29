import { Psd, readPsd, writePsd } from 'ag-psd';
import TextureLayer from './TextureLayer';
import { Texture } from './TextureManager';

export const writeToPhotoshopObject = (texture: Texture): Psd => {
  return {
    name: texture.name.value,
    width: texture.width,
    height: texture.height,
    children: [{
      name: texture.name.value,
      imageData: new ImageData(texture.canvas.manager.readTexture(texture.canvas), texture.width, texture.height)
    }]
  }

}
export const saveToPhotoshopFile = (texture: Texture): Blob => {
  const data = texture.psdData.value ?? writeToPhotoshopObject(texture)
  texture.psdData.value = data
  const arrayBuffer = writePsd(data, {})
  return new Blob([arrayBuffer], { type: "image/psd" })
}

export const loadFromPsdFile = async (arrayBuffer: ArrayBuffer): Promise<[HTMLImageElement, Psd]> => {
  const psd = readPsd(arrayBuffer, { useImageData: true })

  if (!psd.imageData) {
    return Promise.reject("No image data found in PSD file")
  }

  //If the number of channels is 3 and we have one children, it's probaly because we wrote this psd.
  //Therefore, due to fucky wucky stuff, we can't read the main image data, but we can just read the first child, as 
  //we assume that we wrote it
  const imgData = psd.channels === 3 && psd.children?.length === 1 ? psd.children[0].imageData ?? psd.imageData : psd.imageData

  const img = await imageDataToHTMLElement(imgData)
  return [img, psd]
}

export const imageDataToHTMLElement = async (imgData: ImageData): Promise<HTMLImageElement> => {
  const textureLayer = new TextureLayer()
  textureLayer.setBackground(imgData)
  const dataUrl = await textureLayer.toDataURL()
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = dataUrl
  })
}