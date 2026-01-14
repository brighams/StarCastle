import { multiply_matrices, translate_matrix, rotate_matrix } from './math.js'

const vertex_shader_source = `
  attribute vec2 a_position;
  uniform vec2 u_resolution;
  uniform mat3 u_transform;

  void main() {
    vec2 position = (u_transform * vec3(a_position, 1.0)).xy;
    vec2 clipSpace = ((position / u_resolution) * 2.0) - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  }
`

const fragment_shader_source = `
  precision mediump float;
  uniform vec4 u_color;

  void main() {
    gl_FragColor = u_color;
  }
`

const create_shader = (gl, type, source) => {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }

  return shader
}

const create_program = (gl, vertexShader, fragmentShader) => {
  const program = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }

  return program
}

let gl, positionBuffer, positionLocation, transformLocation, colorLocation

export const init_renderer = (canvas) => {
  gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

  if (!gl) {
    alert('WebGL not supported')
    return null
  }

  const vertexShader = create_shader(gl, gl.VERTEX_SHADER, vertex_shader_source)
  const fragmentShader = create_shader(gl, gl.FRAGMENT_SHADER, fragment_shader_source)
  const program = create_program(gl, vertexShader, fragmentShader)

  positionLocation = gl.getAttribLocation(program, 'a_position')
  const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
  transformLocation = gl.getUniformLocation(program, 'u_transform')
  colorLocation = gl.getUniformLocation(program, 'u_color')

  positionBuffer = gl.createBuffer()

  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.useProgram(program)
  gl.uniform2f(resolutionLocation, canvas.width, canvas.height)

  return gl
}

export const clear_screen = () => {
  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)
}

export const draw_line = (x1, y1, x2, y2, transform, color) => {
  const vertices = new Float32Array([x1, y1, x2, y2])

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

  gl.enableVertexAttribArray(positionLocation)
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

  gl.uniformMatrix3fv(transformLocation, false, transform)
  gl.uniform4f(colorLocation, color[0], color[1], color[2], color[3])

  gl.drawArrays(gl.LINES, 0, 2)
}

export const draw_circle = (x, y, radius, segments, transform, color) => {
  const vertices = []
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    vertices.push(x + Math.cos(angle) * radius)
    vertices.push(y + Math.sin(angle) * radius)
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

  gl.enableVertexAttribArray(positionLocation)
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

  gl.uniformMatrix3fv(transformLocation, false, transform)
  gl.uniform4f(colorLocation, color[0], color[1], color[2], color[3])

  gl.drawArrays(gl.LINE_STRIP, 0, segments + 1)
}

export const draw_ship = (x, y, angle, size, transform, color, show_thrust = false) => {
  const ship_transform = multiply_matrices(
    multiply_matrices(transform, translate_matrix(x, y)),
    rotate_matrix(angle)
  )

  draw_line(0, -size, -size * 0.7, size, ship_transform, color)
  draw_line(-size * 0.7, size, size * 0.7, size, ship_transform, color)
  draw_line(size * 0.7, size, 0, -size, ship_transform, color)

  if (show_thrust) {
    const flame_color = [1.0, 0.5, 0.0, 1.0]
    draw_line(0, size, -size * 0.3, size * 1.8, ship_transform, flame_color)
    draw_line(0, size, size * 0.3, size * 1.8, ship_transform, flame_color)
  }
}
