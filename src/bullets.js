import { CANVAS_SIZE } from './constants.js'
import { identity_matrix } from './math.js'
import { draw_spark } from './renderer.js'
import { playSound } from './sound.js'

export const player_bullets = []

export const fire_bullet = (x, y, angle, speed) => {
  playSound('player_shoot', 0.1)
  player_bullets.push({
    x: x,
    y: y,
    vel_x: Math.sin(angle) * speed,
    vel_y: -Math.cos(angle) * speed,
    life: 3000
  })
}

export const update_bullets = (dt) => {
  for (let i = player_bullets.length - 1; i >= 0; i--) {
    const bullet = player_bullets[i]
    bullet.x += bullet.vel_x * dt
    bullet.y += bullet.vel_y * dt
    bullet.life -= dt * 1000

    if (bullet.life <= 0 ||
        bullet.x < 0 || bullet.x > CANVAS_SIZE ||
        bullet.y < 0 || bullet.y > CANVAS_SIZE) {
      player_bullets.splice(i, 1)
    }
  }
}

export const draw_bullets = (color) => {
  const transform = identity_matrix()
  const golden_color = [1.0, 0.84, 0.0, 1.0] // Golden color
  player_bullets.forEach(bullet => {
    draw_spark(bullet.x, bullet.y, 0, 5, transform, golden_color)
  })
}

export const clear_bullets = () => {
  player_bullets.length = 0
}
