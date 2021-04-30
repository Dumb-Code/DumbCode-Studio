export class StudioBuffer {
  offset: number
  buffer: ArrayBuffer
  
  useOldString: boolean

  constructor(buffer = new ArrayBuffer(0)) {
      this.offset = 0
      this.buffer = buffer
      this.useOldString = false
  }

  _addBuffer(buffer: ArrayBuffer) {
      let tmp = new Uint8Array(this.buffer.byteLength + buffer.byteLength)
      tmp.set(new Uint8Array(this.buffer), 0)
      tmp.set(new Uint8Array(buffer), this.buffer.byteLength)
      this.buffer = tmp.buffer
  }

  writeNumber(num: number) {
      let buffer = new ArrayBuffer(4)
      let veiw = new DataView(buffer)
      veiw.setFloat32(0, num)
      this._addBuffer(buffer)
  }

  writeString(str: string) {
      let arr = new TextEncoder().encode(str).buffer

      //write the length
      let buffer = new ArrayBuffer(2)
      let veiw = new DataView(buffer)
      veiw.setInt16(0, arr.byteLength)
      this._addBuffer(buffer)

      this._addBuffer(arr)
  }

  writeBool(bool: boolean) {
      let buffer = new ArrayBuffer(1)
      let view = new DataView(buffer)
      view.setInt8(0, bool ? 1 : 0)
      this._addBuffer(buffer)
  }

  readNumber() {
      let veiw = new DataView(this.buffer)
      let num = veiw.getFloat32(this.offset)
      this.offset += 4
      return num
  }

  readInteger() {
      return Math.round(this.readNumber())
  }

  readString() {
      //read the length
      let length: number
      if(this.useOldString) {
          length = this.readNumber()
      } else {
          let veiw = new DataView(this.buffer)
          length = veiw.getInt16(this.offset)
          this.offset += 2
      }

      this.offset += length
      return new TextDecoder().decode(this.buffer.slice(this.offset - length, this.offset))
  }

  readBool() {
      let veiw = new DataView(this.buffer)
      let bool = veiw.getInt8(this.offset) === 1 ? true : false
      this.offset += 1
      return bool
  }

  getAsBlob() {
      return new Blob([this.buffer])
  }

  getAsBase64() {
    return btoa(String.fromCharCode(...new Uint8Array(this.buffer)))
  }

  downloadAsFile(name: string) {
      let blob = new Blob([this.buffer]);
      let url = window.URL.createObjectURL(blob);
      let a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      window.URL.revokeObjectURL(url);
  }
}