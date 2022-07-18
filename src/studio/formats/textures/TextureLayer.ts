import BlobStream from 'blob-stream';
import { PNG } from 'pngjs';
import { TextureGLManager } from './TextureGLManager';
export default class TextureLayer {

  readonly manager = TextureGLManager.getInstance()
  readonly texture = this.manager.createTexture()

  width: number = 0
  height: number = 0

  async toDataURL() {
    const data = this.manager.readTexture(this)

    const png = new PNG({
      width: this.width,
      height: this.height,
    })
    png.data = Buffer.from(data)

    const fileReader = new FileReader()
    return new Promise<string>((resolve, reject) => {
      const blobStream = png.pack().pipe(BlobStream())
      png.once("end", () => {
        fileReader.onload = () => resolve(fileReader.result as string)
        fileReader.onerror = reject
        fileReader.readAsDataURL(blobStream.toBlob("image/png"))
      })
    })
  }

  setBackground(src: HTMLImageElement) {
    this.width = src.width
    this.height = src.height

    const gl = this.manager.gl

    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  }
}