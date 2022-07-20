import TextureLayer from './TextureLayer';
export class TextureGLManager {

  static instance: TextureGLManager | null = null

  readonly canvas = document.createElement("canvas")
  readonly gl = this.canvas.getContext("webgl")!

  private readonly program = this.createProgram()
  private readonly buffers = this.createBuffers()

  private readonly framebuffer = this.gl.createFramebuffer()

  static getInstance() {
    if (TextureGLManager.instance === null) {
      TextureGLManager.instance = new TextureGLManager()
    }
    return TextureGLManager.instance
  }

  //Render the textures to the destination
  //Note that the dest canvas won't be exactly right,
  //as 2d canvas rendering uses premultiplied alpha
  //Therefore, this method should not be used for accurate results 
  //To get accurate results, look at `this.canvas`
  render(textures: TextureLayer[], options?: {
    dest?: HTMLCanvasElement
    premultiply?: boolean
    width?: number
    height?: number
  }) {
    const { gl, program, buffers, canvas } = this

    const { dest, premultiply, width, height } = options || {}

    //Ensure the viewport is the same size as the canvas
    if (dest !== undefined) {
      canvas.width = width || dest.width
      canvas.height = height || dest.height
    } else {
      canvas.width = width || canvas.width
      canvas.height = height || canvas.height
    }
    gl.viewport(0, 0, canvas.width, canvas.height);

    //Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell WebGL we want to use this program for all subsequent rendering
    gl.useProgram(program);


    // Tell the shader if we want to premultiply the alpha
    gl.uniform1i(gl.getUniformLocation(program, "u_premultiply"), premultiply ? 1 : 0);

    // Tell the shader we bound the texture to texture unit 0
    gl.uniform1i(gl.getUniformLocation(program, "u_texture"), 0);

    // Bind the vertex buffer object to the array buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);

    // Tell the shader how to read the vertex buffer
    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    // Bind the index buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);

    //Enable blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);


    textures.forEach(texture => {
      // Bind the texture to texture unit 0
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture.texture);

      // Draw the triangles
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    })


    if (dest !== undefined) {
      //Copy the rendered image to the canvas
      dest.getContext("2d")!.drawImage(canvas, 0, 0, canvas.width, canvas.height)
    }
  }

  readTexture(texture: TextureLayer) {
    const { gl, framebuffer } = this
    // Bind the framebuffer and texture
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture.texture, 0);

    // Read the contents of the framebuffer
    const data = new Uint8Array(texture.width * texture.height * 4);
    gl.readPixels(0, 0, texture.width, texture.height, gl.RGBA, gl.UNSIGNED_BYTE, data);

    // Unbind the framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return data
  }

  createTexture() {
    const { gl } = this
    const texture = gl.createTexture();
    if (!texture) {
      throw new Error("Unable to create texture")
    }

    // Bind the texture to the WebGL context
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the parameters so we can render any size image
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // Set the texture to repeat
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    return texture;
  }


  private createBuffers() {
    const { gl } = this

    // Create the vertex buffer
    const vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      throw new Error("Unable to create vertex buffer")
    }

    // Bind the vertex buffer to ARRAY_BUFFER (we're talking about a buffer of vertices)
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    // Fill the vertex buffer with data. This is just the 4 vertices of the square.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, //0
      1, -1,  //1, 4
      -1, 1,  //2, 3
      1, 1    //5
    ]), gl.STATIC_DRAW);

    // Create the index buffer
    const indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
      throw new Error("Unable to create index buffer")
    }

    // Bind the index buffer to ELEMENT_ARRAY_BUFFER (we're talking about a buffer of indices)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    // Fill the index buffer with data
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([
      0, 1, 2,
      2, 1, 3
    ]), gl.STATIC_DRAW);

    return {
      vertexBuffer,
      indexBuffer
    }
  }

  private createProgram() {
    const { gl } = this
    const vertexShader = this.loadShader(gl.VERTEX_SHADER, `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0, 1);
        v_texCoord = a_position * vec2(0.5, -0.5) + 0.5;
      }
    `);
    const fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform bool u_premultiply;
      varying vec2 v_texCoord;
      void main() {
        vec4 colour = texture2D(u_texture, v_texCoord);
        if (u_premultiply) {
          colour.rgb *= colour.a;
        }
        gl_FragColor = colour;
      }`);

    // Create the shader program
    const shaderProgram = gl.createProgram();
    if (!shaderProgram) {
      throw new Error("Unable to create shader program");
    }
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      throw new Error("Unable to initialize the shader program: " + gl.getProgramInfoLog(shaderProgram));
    }

    return shaderProgram;
  }

  private loadShader(type: number, source: string) {
    const { gl } = this

    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error("Unable to create shader")
    }

    // Send the source to the shader object
    gl.shaderSource(shader, source);

    // Compile the shader program
    gl.compileShader(shader);

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      throw new Error("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader))
    }

    return shader;
  }
}