import { CANVAS_SIZE } from './constants.js'
import { identity_matrix } from './math.js'
import { draw_spark } from './renderer.js'
import { playSound } from './sound.js'


export const player_torpedos = []

export const fire_torpedo = (x, y, angle, speed) => {
  playSound('fire_torpedo', 0.2, 0.1)
  player_torpedos.push({
    x: x,
    y: y,
    vel_x: Math.sin(angle) * speed,
    vel_y: -Math.cos(angle) * speed,
    life: 2000
  })
}

export const update_torpedos = (dt) => {
  for (let i = player_torpedos.length - 1; i >= 0; i--) {
    const torpedo = player_torpedos[i]
    torpedo.x += torpedo.vel_x * dt
    torpedo.y += torpedo.vel_y * dt
    torpedo.life -= dt * 1000

    if (torpedo.life <= 0 ||
      torpedo.x < 0 || torpedo.x > CANVAS_SIZE ||
      torpedo.y < 0 || torpedo.y > CANVAS_SIZE) {
      player_torpedos.splice(i, 1)
    }
  }
}

export const draw_torpedoes = (color = [1.0, 0.84, 0.0, 1.0]) => {
  const transform = identity_matrix()
  for (const torpedo of player_torpedos) {
    draw_spark({ x: torpedo.x, y: torpedo.y, angle: 0, size: 5, transform, color })
  }
}

export const clear_torpedos = () => {
  player_torpedos.length = 0
}
