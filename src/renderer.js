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

export const draw_ship = (x, y, angle, size, transform, color, thrust = 0, rotation = 0, braking = false, strafing = 0, strafe_thrust = 0) => {
  const ship_transform = multiply_matrices(
    multiply_matrices(transform, translate_matrix(x, y)),
    rotate_matrix(angle)
  )

  // Draw thicker lines by drawing multiple times with slight offsets
  const offsets = [-0.5, 0, 0.5]
  for (const offset of offsets) {
    draw_line(offset, -size, -size * 0.7 + offset, size, ship_transform, color)
    draw_line(-size * 0.7 + offset, size, size * 0.7 + offset, size, ship_transform, color)
    draw_line(size * 0.7 + offset, size, offset, -size, ship_transform, color)
  }

  // Draw triangle inset at the bottom (/\ tail)
  const tail_height = size * 0.4
  const tail_width = size * 0.35
  for (const offset of offsets) {
    draw_line(-tail_width + offset, size, offset, size - tail_height, ship_transform, color)
    draw_line(tail_width + offset, size, offset, size - tail_height, ship_transform, color)
  }

  if (thrust > 0) {
    // Scale flame based on thrust amount (0.0 to 1.0)
    const flame_length = 1.0 + thrust * 3.2 // 1.0 to 3.2
    const flame_width = 0.2 + thrust * 0.1  // 0.2 to 0.3
    const flame_color = [1.0, 0.5 - thrust * 0.2, 0.0, thrust] // Fades in/out with thrust

    draw_line(0, size, -size * flame_width, size * flame_length, ship_transform, flame_color)
    draw_line(0, size, size * flame_width, size * flame_length, ship_transform, flame_color)
  }

  // Attitude jets - draw on the opposite side of rotation
  if (rotation !== 0) {
    const jet_color = [1.0, 0.0, 0.5, 0.9] // Blue-ish flame for attitude jets
    const jet_length = size * 0.6

    if (rotation > 0) {
      // Rotating right, jet fires from left side (pushing right)
      draw_line(-size * 0.7, -size * 0.5, -size * 0.7 - jet_length, -size * 0.3, ship_transform, jet_color)
      draw_line(-size * 0.7, -size * 0.5, -size * 0.7 - jet_length, -size * 0.7, ship_transform, jet_color)
    } else {
      // Rotating left, jet fires from right side (pushing left)
      draw_line(size * 0.7, -size * 0.5, size * 0.7 + jet_length, -size * 0.3, ship_transform, jet_color)
      draw_line(size * 0.7, -size * 0.5, size * 0.7 + jet_length, -size * 0.7, ship_transform, jet_color)
    }
  }

  // Retro-thruster for braking - fires from the nose
  if (braking) {
    const jet_color = [1.0, 0.0, 0.5, 0.9] // Blue-ish flame for attitude jets
    const jet_length = size * 0.8

    draw_line(0, -size, -size * 0.2, -size - jet_length, ship_transform, jet_color)
    draw_line(0, -size, size * 0.2, -size - jet_length, ship_transform, jet_color)
  }

  // Strafe thrusters - positioned at the rear sides, larger flames
  if (strafe_thrust > 0) {
    const strafe_color = [1.0, 0.3, 0.0, strafe_thrust * 0.9] // Orange flame that fades with thrust
    const strafe_jet_length = size * 1.2 * strafe_thrust // Larger flame than attitude jets

    if (strafing > 0) {
      // Strafing right, thruster fires from left side (pushing right)
      draw_line(-size * 0.5, size * 0.6, -size * 0.5 - strafe_jet_length, size * 0.8, ship_transform, strafe_color)
      draw_line(-size * 0.5, size * 0.6, -size * 0.5 - strafe_jet_length, size * 0.4, ship_transform, strafe_color)
      draw_line(-size * 0.5, size * 0.6, -size * 0.5 - strafe_jet_length * 0.7, size * 0.6, ship_transform, strafe_color)
    } else if (strafing < 0) {
      // Strafing left, thruster fires from right side (pushing left)
      draw_line(size * 0.5, size * 0.6, size * 0.5 + strafe_jet_length, size * 0.8, ship_transform, strafe_color)
      draw_line(size * 0.5, size * 0.6, size * 0.5 + strafe_jet_length, size * 0.4, ship_transform, strafe_color)
      draw_line(size * 0.5, size * 0.6, size * 0.5 + strafe_jet_length * 0.7, size * 0.6, ship_transform, strafe_color)
    }
  }
}


export const draw_spark = (x, y, angle, size, transform, color, show_thrust = false) => {
  // Use current time for continuous rotation animation
  const rotation_speed = 8.0 // radians per second
  const animated_angle = angle + (performance.now() / 1000) * rotation_speed

  const spark_transform = multiply_matrices(
    multiply_matrices(transform, translate_matrix(x, y)),
    rotate_matrix(animated_angle)
  )

  // Draw 6 lines in a cross/star pattern (3 lines through center at 60° intervals)
  for (let i = 0; i < 3; i++) {
    const line_angle = (i * Math.PI) / 3 // 0°, 60°, 120°
    const cos_a = Math.cos(line_angle)
    const sin_a = Math.sin(line_angle)

    // Line from -size to +size through center
    const x1 = -size * cos_a
    const y1 = -size * sin_a
    const x2 = size * cos_a
    const y2 = size * sin_a

    draw_line(x1, y1, x2, y2, spark_transform, color)
  }
}
