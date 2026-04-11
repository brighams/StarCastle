import { identity_matrix } from './math.js'
import { draw_spark } from './renderer.js'
import { playSound } from './sound.js'
import { CANVAS_SIZE, TORPEDO_INNER_SPARK_SIZE_RATIO, TORPEDO_JITTER_TIMER,
  TORPEDO_JITTER_TIMER_MIN, TORPEDO_JITTER_X, TORPEDO_JITTER_Y } from './constants.js'
import { draw_space_mine } from './player.js'


export const player_torpedoes = []

export const fire_torpedo = (
  {
    x,
    y,
    angle = 0,
    speed = 120,
    size = 15,
    life = 5000,
    is_space_mine = false,
    color = [1.0, 0.0, 1.0]
  }
) => {
  playSound('player_shoot', 0.1, 0.1)
  player_torpedoes.push({
    x: x,
    y: y,
    alive: true,
    life: life,
    color: color,
    size: size,
    vel_x: Math.sin(angle) * speed,
    vel_y: -Math.cos(angle) * speed,
    is_space_mine: is_space_mine,
    jitter_x: 0,
    jitter_y: 0,
    jitter_timer: 0
  })
}

export const update_torpedoes = (dt) => {
  for (let k = player_torpedoes.length - 1; k >= 0; k--) {
    const torpedo = player_torpedoes[k]
    if (torpedo.alive) {
      torpedo.x += torpedo.vel_x * dt
      torpedo.y += torpedo.vel_y * dt

      if (torpedo.is_space_mine) {
        torpedo.jitter_timer -= dt
        if (torpedo.jitter_timer <= 0) {
          torpedo.jitter_x = (Math.random() - 0.5) * TORPEDO_JITTER_X
          torpedo.jitter_y = (Math.random() - 0.5) * TORPEDO_JITTER_Y
          torpedo.jitter_timer = TORPEDO_JITTER_TIMER_MIN + Math.random() * TORPEDO_JITTER_TIMER
        }
        torpedo.x += torpedo.jitter_x * dt
        torpedo.y += torpedo.jitter_y * dt
      }

      if (torpedo.x < 0) torpedo.x += CANVAS_SIZE
      else if (torpedo.x > CANVAS_SIZE) torpedo.x -= CANVAS_SIZE
      if (torpedo.y < 0) torpedo.y += CANVAS_SIZE
      else if (torpedo.y > CANVAS_SIZE) torpedo.y -= CANVAS_SIZE

      torpedo.life -= dt * 1000
      if (torpedo.life <= 0) {
        torpedo.alive = false
      }
    }
  }
}

export const draw_torpedo = ({ x, y, angle, size, transform, color }) => {
  draw_spark({ x, y, angle, size, transform, color })
  draw_spark({
    x,
    y,
    angle: angle + Math.random() - 0.5,
    size: size * TORPEDO_INNER_SPARK_SIZE_RATIO,
    transform,
    color: [Math.random(), Math.random(), Math.random(), Math.random()]
  })
}

export const draw_torpedoes = () => {
  const transform = identity_matrix()
  for (const torpedo of player_torpedoes) {
    if (torpedo.alive) {
      if (!torpedo.is_space_mine) {
        draw_torpedo({ x: torpedo.x, y: torpedo.y, angle: 0, size: torpedo.size, transform, color: torpedo.color })
      } else {
        draw_space_mine({ x: torpedo.x, y: torpedo.y, angle: 0, size: torpedo.size, transform, color: torpedo.color })
      }
    }
  }
}

export const clear_torpedoes = () => {
  player_torpedoes.length = 0
}

export const destroy_torpedo = (torpedo) => {
  torpedo.alive = false
}

export const remove_destroyed_torpedoes = () => {
  for (let k = player_torpedoes.length - 1; k >= 0; k--) {
    if (!player_torpedoes[k].alive) {
      player_torpedoes.splice(k, 1)  // Add the second argument
    }
  }
}
