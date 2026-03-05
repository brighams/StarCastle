// 3D WebGL Renderer with Gouraud shading

import { CANVAS_WIDTH, CANVAS_HEIGHT, CAMERA_FOV, CAMERA_NEAR, CAMERA_FAR } from './constants.js'
import { mat4, vec3 } from './math3d.js'

let gl = null
let canvas = null
let lineProgram = null
let shadedProgram = null
let projectionMatrix = null
let viewMatrix = null
let starfieldBuffer = null
let starfieldColorBuffer = null
let starCount = 1000

// Shader sources
const lineVertexShader = `
  attribute vec3 aPosition;
  attribute vec4 aColor;
  uniform mat4 uProjection;
  uniform mat4 uView;
  uniform mat4 uModel;
  varying vec4 vColor;

  void main() {
    gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
    vColor = aColor;
  }
`

const lineFragmentShader = `
  precision mediump float;
  varying vec4 vColor;

  void main() {
    gl_FragColor = vColor;
  }
`

const shadedVertexShader = `
  attribute vec3 aPosition;
  attribute vec3 aNormal;
  attribute vec4 aColor;
  uniform mat4 uProjection;
  uniform mat4 uView;
  uniform mat4 uModel;
  uniform mat3 uNormalMatrix;
  uniform vec3 uLightDir;
  varying vec4 vColor;

  void main() {
    gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);

    // Gouraud shading - lighting calculated per vertex
    vec3 normal = normalize(uNormalMatrix * aNormal);
    float diffuse = max(dot(normal, uLightDir), 0.0);
    float ambient = 0.3;
    float lighting = ambient + diffuse * 0.7;

    vColor = vec4(aColor.rgb * lighting, aColor.a);
  }
`

const shadedFragmentShader = `
  precision mediump float;
  varying vec4 vColor;

  void main() {
    gl_FragColor = vColor;
  }
`

function compileShader(source, type) {
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

function createProgram(vertexSource, fragmentSource) {
  const vertexShader = compileShader(vertexSource, gl.VERTEX_SHADER)
  const fragmentShader = compileShader(fragmentSource, gl.FRAGMENT_SHADER)

  const program = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program))
    return null
  }

  return program
}

export function initRenderer(canvasElement) {
  canvas = canvasElement

  // Set canvas to window size
  resizeCanvas()

  gl = canvas.getContext('webgl', { antialias: true })
  if (!gl) {
    console.error('WebGL not supported')
    return false
  }

  // Create shader programs
  lineProgram = createProgram(lineVertexShader, lineFragmentShader)
  shadedProgram = createProgram(shadedVertexShader, shadedFragmentShader)

  // Enable depth testing and blending
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  // Set up projection matrix
  updateProjection()

  // Handle window resize
  window.addEventListener('resize', () => {
    resizeCanvas()
    updateProjection()
  })

  // Generate starfield
  generateStarfield()

  return true
}

function resizeCanvas() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  if (gl) {
    gl.viewport(0, 0, canvas.width, canvas.height)
  }
}

function updateProjection() {
  const aspect = canvas.width / canvas.height
  projectionMatrix = mat4.perspective(CAMERA_FOV, aspect, CAMERA_NEAR, CAMERA_FAR)
}

function generateStarfield() {
  const stars = []
  const colors = []
  const radius = 2000 // Large sphere radius

  for (let i = 0; i < starCount; i++) {
    // Random point on sphere using spherical coordinates
    const theta = Math.random() * Math.PI * 2 // Azimuth
    const phi = Math.acos(2 * Math.random() - 1) // Polar angle

    const x = radius * Math.sin(phi) * Math.cos(theta)
    const y = radius * Math.sin(phi) * Math.sin(theta)
    const z = radius * Math.cos(phi)

    stars.push(x, y, z)

    // Varying brightness for depth perception
    const brightness = 0.4 + Math.random() * 0.6
    colors.push(brightness, brightness, brightness, 1.0)
  }

  starfieldBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, starfieldBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(stars), gl.STATIC_DRAW)

  starfieldColorBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, starfieldColorBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)
}

export function clearScreen() {
  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
}

export function drawStarfield(cameraPos) {
  if (!starfieldBuffer || !starfieldColorBuffer) return

  gl.useProgram(lineProgram)

  // Bind position buffer
  const aPosition = gl.getAttribLocation(lineProgram, 'aPosition')
  gl.bindBuffer(gl.ARRAY_BUFFER, starfieldBuffer)
  gl.enableVertexAttribArray(aPosition)
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0)

  // Bind color buffer
  const aColor = gl.getAttribLocation(lineProgram, 'aColor')
  gl.bindBuffer(gl.ARRAY_BUFFER, starfieldColorBuffer)
  gl.enableVertexAttribArray(aColor)
  gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0)

  // Create translation matrix to move starfield with camera (but not rotate)
  const starfieldMatrix = mat4.translate(cameraPos.x, cameraPos.y, cameraPos.z)

  gl.uniformMatrix4fv(gl.getUniformLocation(lineProgram, 'uProjection'), false, projectionMatrix)
  gl.uniformMatrix4fv(gl.getUniformLocation(lineProgram, 'uView'), false, viewMatrix)
  gl.uniformMatrix4fv(gl.getUniformLocation(lineProgram, 'uModel'), false, starfieldMatrix)

  // Disable depth test so stars are always in background
  gl.disable(gl.DEPTH_TEST)
  gl.drawArrays(gl.POINTS, 0, starCount)
  gl.enable(gl.DEPTH_TEST)
}

export function setViewMatrix(matrix) {
  viewMatrix = matrix
}

export function drawLine(start, end, color, modelMatrix = mat4.identity()) {
  const vertices = new Float32Array([
    start.x, start.y, start.z,
    end.x, end.y, end.z
  ])

  const colors = new Float32Array([
    color[0], color[1], color[2], color[3] || 1.0,
    color[0], color[1], color[2], color[3] || 1.0
  ])

  const posBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

  const colorBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW)

  gl.useProgram(lineProgram)

  const aPosition = gl.getAttribLocation(lineProgram, 'aPosition')
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
  gl.enableVertexAttribArray(aPosition)
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0)

  const aColor = gl.getAttribLocation(lineProgram, 'aColor')
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
  gl.enableVertexAttribArray(aColor)
  gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0)

  gl.uniformMatrix4fv(gl.getUniformLocation(lineProgram, 'uProjection'), false, projectionMatrix)
  gl.uniformMatrix4fv(gl.getUniformLocation(lineProgram, 'uView'), false, viewMatrix)
  gl.uniformMatrix4fv(gl.getUniformLocation(lineProgram, 'uModel'), false, modelMatrix)

  gl.drawArrays(gl.LINES, 0, 2)

  gl.deleteBuffer(posBuffer)
  gl.deleteBuffer(colorBuffer)
}

export function drawWireframeModel(model, color, modelMatrix = mat4.identity()) {
  if (!model.edges || model.edges.length === 0) return

  for (const edge of model.edges) {
    const v1Idx = edge[0] * 3
    const v2Idx = edge[1] * 3

    const start = {
      x: model.vertices[v1Idx],
      y: model.vertices[v1Idx + 1],
      z: model.vertices[v1Idx + 2]
    }

    const end = {
      x: model.vertices[v2Idx],
      y: model.vertices[v2Idx + 1],
      z: model.vertices[v2Idx + 2]
    }

    drawLine(start, end, color, modelMatrix)
  }
}

export function drawShadedModel(model, modelMatrix = mat4.identity()) {
  if (!model.faces || model.faces.length === 0) return

  gl.useProgram(shadedProgram)

  // Light direction (from above and slightly to the side)
  const lightDir = vec3.normalize({ x: 0.3, y: 0.8, z: 0.5 })

  gl.uniform3f(
    gl.getUniformLocation(shadedProgram, 'uLightDir'),
    lightDir.x, lightDir.y, lightDir.z
  )

  gl.uniformMatrix4fv(gl.getUniformLocation(shadedProgram, 'uProjection'), false, projectionMatrix)
  gl.uniformMatrix4fv(gl.getUniformLocation(shadedProgram, 'uView'), false, viewMatrix)
  gl.uniformMatrix4fv(gl.getUniformLocation(shadedProgram, 'uModel'), false, modelMatrix)

  // Calculate normal matrix (inverse transpose of model matrix's upper 3x3)
  const normalMatrix = [
    modelMatrix[0], modelMatrix[1], modelMatrix[2],
    modelMatrix[4], modelMatrix[5], modelMatrix[6],
    modelMatrix[8], modelMatrix[9], modelMatrix[10]
  ]
  gl.uniformMatrix3fv(gl.getUniformLocation(shadedProgram, 'uNormalMatrix'), false, normalMatrix)

  for (const face of model.faces) {
    const faceVertices = []
    const faceNormals = []
    const faceColors = []

    const color = face.color || [1, 1, 1]

    for (const vIdx of face.vertices) {
      const idx = vIdx * 3
      faceVertices.push(
        model.vertices[idx],
        model.vertices[idx + 1],
        model.vertices[idx + 2]
      )
      faceNormals.push(face.normal[0], face.normal[1], face.normal[2])
      faceColors.push(color[0], color[1], color[2], 1.0)
    }

    const posBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(faceVertices), gl.STATIC_DRAW)

    const normalBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(faceNormals), gl.STATIC_DRAW)

    const colorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(faceColors), gl.STATIC_DRAW)

    const aPosition = gl.getAttribLocation(shadedProgram, 'aPosition')
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
    gl.enableVertexAttribArray(aPosition)
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0)

    const aNormal = gl.getAttribLocation(shadedProgram, 'aNormal')
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
    gl.enableVertexAttribArray(aNormal)
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0)

    const aColor = gl.getAttribLocation(shadedProgram, 'aColor')
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.enableVertexAttribArray(aColor)
    gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0)

    gl.drawArrays(gl.TRIANGLE_FAN, 0, face.vertices.length)

    gl.deleteBuffer(posBuffer)
    gl.deleteBuffer(normalBuffer)
    gl.deleteBuffer(colorBuffer)
  }
}

export function getGL() {
  return gl
}

export function getCanvas() {
  return canvas
}
