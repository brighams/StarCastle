import { CENTER_X, CENTER_Y } from './constants.js'
import { translate_matrix } from './math.js'

export const camera = { x: 0, y: 0 }

export const update_camera = (player) => {
  camera.x = player.x
  camera.y = player.y
}

export const world_transform = () =>
  translate_matrix(CENTER_X - camera.x, CENTER_Y - camera.y)
