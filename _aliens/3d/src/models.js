// 3D Models - converted from 2D versions

import { SHIP_SIZE } from './constants.js'

// Ship model - triangular design
export const createShipModel = () => {
  const size = SHIP_SIZE
  const vertices = [
    // Main hull - triangular
    0, 0, -size,           // nose (front)
    -size * 0.7, 0, size,  // left wing
    size * 0.7, 0, size,   // right wing

    // Bottom plane
    0, size * 0.3, -size * 0.5,
    -size * 0.5, size * 0.3, size * 0.5,
    size * 0.5, size * 0.3, size * 0.5,

    // Top plane
    0, -size * 0.3, -size * 0.5,
    -size * 0.5, -size * 0.3, size * 0.5,
    size * 0.5, -size * 0.3, size * 0.5,

    // Tail notch points
    -size * 0.35, 0, size,
    size * 0.35, 0, size,
    0, 0, size * 0.6
  ]

  const edges = [
    // Main outline
    [0, 1], [1, 2], [2, 0],
    // Bottom plane
    [3, 4], [4, 5], [5, 3],
    // Top plane
    [6, 7], [7, 8], [8, 6],
    // Connect top/bottom to main
    [0, 3], [0, 6],
    [1, 4], [1, 7],
    [2, 5], [2, 8],
    // Tail notch
    [9, 11], [11, 10]
  ]

  const faces = [
    // Top face (with normals pointing up)
    { vertices: [0, 1, 7], normal: [0, -1, 0], color: [0.9, 0.9, 0.9] },
    { vertices: [0, 7, 6], normal: [0, -1, 0], color: [0.9, 0.9, 0.9] },
    { vertices: [0, 6, 8], normal: [0, -1, 0], color: [0.85, 0.85, 0.85] },
    { vertices: [0, 8, 2], normal: [0, -1, 0], color: [0.85, 0.85, 0.85] },
    // Bottom face
    { vertices: [0, 4, 1], normal: [0, 1, 0], color: [0.7, 0.7, 0.7] },
    { vertices: [0, 3, 4], normal: [0, 1, 0], color: [0.7, 0.7, 0.7] },
    { vertices: [0, 5, 3], normal: [0, 1, 0], color: [0.65, 0.65, 0.65] },
    { vertices: [0, 2, 5], normal: [0, 1, 0], color: [0.65, 0.65, 0.65] },
    // Side faces
    { vertices: [1, 4, 7], normal: [-1, 0, 0], color: [0.8, 0.8, 0.8] },
    { vertices: [2, 8, 5], normal: [1, 0, 0], color: [0.8, 0.8, 0.8] }
  ]

  return { vertices, edges, faces }
}

// Castle rings - circular segments
export const createRingModel = (radius, segments) => {
  const vertices = []
  const edges = []
  const faces = []
  const thickness = 4

  const segmentAngle = (Math.PI * 2) / segments

  for (let i = 0; i < segments; i++) {
    const angle1 = i * segmentAngle
    const angle2 = (i + 1) * segmentAngle

    // Outer ring vertices
    const x1 = Math.cos(angle1) * radius
    const z1 = Math.sin(angle1) * radius
    const x2 = Math.cos(angle2) * radius
    const z2 = Math.sin(angle2) * radius

    // Inner ring vertices
    const ix1 = Math.cos(angle1) * (radius - thickness)
    const iz1 = Math.sin(angle1) * (radius - thickness)
    const ix2 = Math.cos(angle2) * (radius - thickness)
    const iz2 = Math.sin(angle2) * (radius - thickness)

    const baseIdx = i * 8
    const height = 8  // 4x taller

    // Top outer
    vertices.push(x1, height, z1)
    // Top inner
    vertices.push(ix1, height, iz1)
    // Bottom outer
    vertices.push(x1, -height, z1)
    // Bottom inner
    vertices.push(ix1, -height, iz1)
    // Next segment top outer
    vertices.push(x2, height, z2)
    // Next segment top inner
    vertices.push(ix2, height, iz2)
    // Next segment bottom outer
    vertices.push(x2, -height, z2)
    // Next segment bottom inner
    vertices.push(ix2, -height, iz2)

    // Edges for wireframe
    edges.push(
      [baseIdx + 0, baseIdx + 4],  // top outer
      [baseIdx + 1, baseIdx + 5],  // top inner
      [baseIdx + 2, baseIdx + 6],  // bottom outer
      [baseIdx + 3, baseIdx + 7],  // bottom inner
      [baseIdx + 0, baseIdx + 2],  // outer vertical
      [baseIdx + 1, baseIdx + 3],  // inner vertical
      [baseIdx + 0, baseIdx + 1],  // top radial
      [baseIdx + 2, baseIdx + 3]   // bottom radial
    )

    // Compute face normal (pointing outward)
    const midAngle = (angle1 + angle2) / 2
    const nx = Math.cos(midAngle)
    const nz = Math.sin(midAngle)

    faces.push({
      index: i,
      vertices: [
        baseIdx + 0, baseIdx + 4, baseIdx + 6, baseIdx + 2,  // outer face
        baseIdx + 1, baseIdx + 3, baseIdx + 7, baseIdx + 5   // inner face (reverse winding)
      ],
      normal: [nx, 0, nz]
    })
  }

  return { vertices, edges, faces, segments }
}

// Central hexagon - now 3D with height
export const createHexagonModel = (radius) => {
  const vertices = []
  const edges = []
  const sides = 6
  const height = 6  // Make it 3D for collisions

  // Top vertices
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2
    vertices.push(
      Math.cos(angle) * radius,
      height,
      Math.sin(angle) * radius
    )
  }

  // Bottom vertices
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2
    vertices.push(
      Math.cos(angle) * radius,
      -height,
      Math.sin(angle) * radius
    )
  }

  // Top edges
  for (let i = 0; i < sides; i++) {
    edges.push([i, (i + 1) % sides])
  }

  // Bottom edges
  for (let i = 0; i < sides; i++) {
    edges.push([sides + i, sides + ((i + 1) % sides)])
  }

  // Vertical edges
  for (let i = 0; i < sides; i++) {
    edges.push([i, sides + i])
  }

  return { vertices, edges }
}

// Cannon model
export const createCannonModel = (length) => {
  const vertices = [
    0, 0, 0,                // base
    length, 0, 0,           // tip
    length * 0.3, 2, 0,     // upper support
    length * 0.3, -2, 0,    // lower support
    length * 0.3, 0, 2,     // right support
    length * 0.3, 0, -2     // left support
  ]

  const edges = [
    [0, 1],  // main barrel
    [0, 2], [0, 3], [0, 4], [0, 5],  // supports
    [2, 1], [3, 1], [4, 1], [5, 1]   // tip connections
  ]

  return { vertices, edges }
}

// Spark/particle model (4-pointed star)
export const createSparkModel = (size) => {
  const vertices = [
    size, 0, 0,
    -size, 0, 0,
    0, size, 0,
    0, -size, 0,
    0, 0, size,
    0, 0, -size
  ]

  const edges = [
    [0, 1],
    [2, 3],
    [4, 5]
  ]

  return { vertices, edges }
}

// Explosion debris
export const createDebrisModel = (length) => {
  const vertices = [
    0, 0, 0,
    length, 0, 0
  ]

  const edges = [[0, 1]]

  return { vertices, edges }
}
