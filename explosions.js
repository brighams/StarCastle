import { identity_matrix } from './math.js'
import { draw_circle } from './renderer.js'

export const explosions = []

export const create_explosion = (x, y, maxSize, life) => {
  explosions.push({
    x: x,
    y: y,
    size: 0,
    maxSize: maxSize,
    life: life
  })
}

export const update_explosions = (dt) => {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const explosion = explosions[i]
    explosion.life -= dt
    explosion.size = explosion.maxSize * (1 - explosion.life / (explosion.life + dt))

    if (explosion.life <= 0) {
      explosions.splice(i, 1)
    }
  }
}

export const draw_explosions = () => {
  const transform = identity_matrix()
  explosions.forEach(explosion => {
    const segments = 8
    const color = [1.0, 0.5, 0.0, 1.0 - (explosion.life / 0.8)]
    draw_circle(explosion.x, explosion.y, explosion.size, segments, transform, color)
  })
}

export const clear_explosions = () => {
  explosions.length = 0
}
