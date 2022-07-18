import { PNG } from 'pngjs';
import { TextureGLManager } from './TextureGLManager';
export default class TextureCanvas {

  readonly manager = TextureGLManager.getInstance()
  readonly texture = this.manager.createTexture()

  width: number = 0
  height: number = 0

  toDataURL() {
    const data = this.manager.readTexture(this)

    return data
  }

  setBackground(src: PNG) {
    this.width = src.width
    this.height = src.height

    const gl = this.manager.gl

    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, src.data);
  }

}