import { viewport } from './renderer.js'
import { translate_matrix } from './math.js'

export const camera = { x: 0, y: 0 }

export const update_camera = (player) => {
  camera.x = player.x
  camera.y = player.y
}

export const world_transform = () =>
  translate_matrix(viewport.width / 2 - camera.x, viewport.height / 2 - camera.y)

export const world_transform_at = (wx, wy) =>
  translate_matrix(viewport.width / 2 - camera.x + wx, viewport.height / 2 - camera.y + wy)
