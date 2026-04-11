import { viewport } from './renderer.js'
import { translate_matrix } from './math.js'
import { WORLD_RADIUS } from './constants.js'

const SPRING = 8.0
const DAMPING = 6.0

export const camera = { x: 0, y: 0, vel_x: 0, vel_y: 0 }

export const update_camera = (player, dt) => {
  const hw = viewport.width / 2
  const hh = viewport.height / 2
  const target_x = Math.max(-(WORLD_RADIUS - hw), Math.min(WORLD_RADIUS - hw, player.x))
  const target_y = Math.max(-(WORLD_RADIUS - hh), Math.min(WORLD_RADIUS - hh, player.y))

  camera.vel_x += (target_x - camera.x) * SPRING * dt
  camera.vel_y += (target_y - camera.y) * SPRING * dt
  const decay = Math.exp(-DAMPING * dt)
  camera.vel_x *= decay
  camera.vel_y *= decay
  camera.x += camera.vel_x * dt
  camera.y += camera.vel_y * dt
}

export const world_transform = () =>
  translate_matrix(viewport.width / 2 - camera.x, viewport.height / 2 - camera.y)

export const world_transform_at = (wx, wy) =>
  translate_matrix(viewport.width / 2 - camera.x + wx, viewport.height / 2 - camera.y + wy)
