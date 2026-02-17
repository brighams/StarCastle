// 3D Math utilities

export const vec3 = {
  create: (x = 0, y = 0, z = 0) => ({ x, y, z }),

  add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }),

  subtract: (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }),

  scale: (v, s) => ({ x: v.x * s, y: v.y * s, z: v.z * s }),

  length: (v) => Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z),

  normalize: (v) => {
    const len = vec3.length(v)
    if (len === 0) return { x: 0, y: 0, z: 0 }
    return { x: v.x / len, y: v.y / len, z: v.z / len }
  },

  dot: (a, b) => a.x * b.x + a.y * b.y + a.z * b.z,

  cross: (a, b) => ({
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  }),

  distance: (a, b) => {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const dz = b.z - a.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }
}

export const mat4 = {
  identity: () => [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ],

  perspective: (fov, aspect, near, far) => {
    const f = 1.0 / Math.tan(fov * Math.PI / 360)
    const nf = 1 / (near - far)

    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, (2 * far * near) * nf, 0
    ]
  },

  lookAt: (eye, target, up) => {
    const zAxis = vec3.normalize(vec3.subtract(eye, target))
    const xAxis = vec3.normalize(vec3.cross(up, zAxis))
    const yAxis = vec3.cross(zAxis, xAxis)

    return [
      xAxis.x, yAxis.x, zAxis.x, 0,
      xAxis.y, yAxis.y, zAxis.y, 0,
      xAxis.z, yAxis.z, zAxis.z, 0,
      -vec3.dot(xAxis, eye), -vec3.dot(yAxis, eye), -vec3.dot(zAxis, eye), 1
    ]
  },

  multiply: (a, b) => {
    const result = new Array(16)
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result[i * 4 + j] =
          a[i * 4 + 0] * b[0 * 4 + j] +
          a[i * 4 + 1] * b[1 * 4 + j] +
          a[i * 4 + 2] * b[2 * 4 + j] +
          a[i * 4 + 3] * b[3 * 4 + j]
      }
    }
    return result
  },

  translate: (tx, ty, tz) => [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    tx, ty, tz, 1
  ],

  rotateX: (angle) => {
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1
    ]
  },

  rotateY: (angle) => {
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1
    ]
  },

  rotateZ: (angle) => {
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    return [
      c, s, 0, 0,
      -s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]
  }
}

// Quaternion for smooth rotations
export const quat = {
  create: (x = 0, y = 0, z = 0, w = 1) => ({ x, y, z, w }),

  fromEuler: (pitch, yaw, roll) => {
    const cy = Math.cos(yaw * 0.5)
    const sy = Math.sin(yaw * 0.5)
    const cp = Math.cos(pitch * 0.5)
    const sp = Math.sin(pitch * 0.5)
    const cr = Math.cos(roll * 0.5)
    const sr = Math.sin(roll * 0.5)

    return {
      w: cr * cp * cy + sr * sp * sy,
      x: sr * cp * cy - cr * sp * sy,
      y: cr * sp * cy + sr * cp * sy,
      z: cr * cp * sy - sr * sp * cy
    }
  },

  toMatrix: (q) => {
    const x2 = q.x + q.x
    const y2 = q.y + q.y
    const z2 = q.z + q.z
    const xx = q.x * x2
    const xy = q.x * y2
    const xz = q.x * z2
    const yy = q.y * y2
    const yz = q.y * z2
    const zz = q.z * z2
    const wx = q.w * x2
    const wy = q.w * y2
    const wz = q.w * z2

    return [
      1 - (yy + zz), xy + wz, xz - wy, 0,
      xy - wz, 1 - (xx + zz), yz + wx, 0,
      xz + wy, yz - wx, 1 - (xx + yy), 0,
      0, 0, 0, 1
    ]
  }
}
