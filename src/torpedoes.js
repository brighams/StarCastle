import { CANVAS_SIZE } from './constants.js'
import { identity_matrix } from './math.js'
import { draw_spark } from './renderer.js'
import { playSound } from './sound.js'


export const player_torpedoes = []

export const fire_torpedo = ({
                               x,
                               y,
                               angle = 0,
                               speed = 100,
                               size = 15,
                               life = 5000,
                               is_mine = false,
                               color = [1.0, 1.0, 1.0]
                             }) => {
  playSound('player_shoot', 0.1, 0.1)
  player_torpedoes.push({
    x: x,
    y: y,
    vel_x: Math.sin(angle) * speed,
    vel_y: -Math.cos(angle) * speed,
    life: life,
    color: color,
    size: size,
    is_space_mine: is_mine
  })
}

export const update_torpedoes = (dt) => {
  for (let i = player_torpedoes.length - 1; i >= 0; i--) {
    const torpedo = player_torpedoes[i]
    torpedo.x += torpedo.vel_x * dt
    torpedo.y += torpedo.vel_y * dt

    if (torpedo.is_space_mine) {
      const jitter_strength = 60 // pixels per second
      torpedo.x += (Math.random() - 0.5) * jitter_strength * dt
      torpedo.y += (Math.random() - 0.5) * jitter_strength * dt
    }

    torpedo.life -= dt * 1000

    if (torpedo.life <= 0 ||
      torpedo.x < 0 || torpedo.x > CANVAS_SIZE ||
      torpedo.y < 0 || torpedo.y > CANVAS_SIZE) {
      player_torpedoes.splice(i, 1)
    }

  }
}

export const draw_torpedoes = () => {
  const transform = identity_matrix()
  for (const torpedo of player_torpedoes) {
    draw_spark({ x: torpedo.x, y: torpedo.y, angle: 0, size: torpedo.size, transform, color: torpedo.color })
  }
}

export const clear_torpedoes = () => {
  player_torpedoes.length = 0
}
