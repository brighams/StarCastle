import { CANVAS_SIZE, CENTER_X, CENTER_Y } from './constants.js'

export const player = {
  x: CENTER_X,
  y: CANVAS_SIZE - 100,
  angle: 0,
  vel_x: 0,
  vel_y: 0,
  thrust: false,
  size: 8,
  speed: 0,
  max_speed: 200,
  alive: true,
  respawn_timer: 0
}

export const reset_player = () => {
  player.x = CANVAS_SIZE - 100
  player.y = CANVAS_SIZE - 100
  player.vel_x = 0
  player.vel_y = 0
  player.speed = 0
  player.angle = Math.atan2(CENTER_X - player.x, CENTER_Y - player.y)
  player.alive = true
  player.respawn_timer = 0
  player.thrust = false
}

export const update_player = (dt, keys_pressed, lives, game_state) => {
  if (!player.alive) {
    player.respawn_timer -= dt
    if (player.respawn_timer <= 0) {
      if (lives > 0) {
        const corners = [
          { x: 50, y: 50 },
          { x: CANVAS_SIZE - 50, y: 50 },
          { x: 50, y: CANVAS_SIZE - 50 },
          { x: CANVAS_SIZE - 50, y: CANVAS_SIZE - 50 }
        ]
        const corner = corners[Math.floor(Math.random() * corners.length)]
        player.x = corner.x
        player.y = corner.y
        player.vel_x = 0
        player.vel_y = 0
        player.speed = 0
        player.angle = Math.atan2(CENTER_X - player.x, CENTER_Y - player.y)
        player.alive = true
      } else {
        game_state.game_over = true
      }
    }
    return
  }

  const rotation_step = Math.PI / 8
  if (keys_pressed['a'] || keys_pressed['A']) {
    player.angle -= rotation_step * dt * 4
  }
  if (keys_pressed['d'] || keys_pressed['D']) {
    player.angle += rotation_step * dt * 4
  }

  if (keys_pressed['w'] || keys_pressed['W']) {
    const thrust_force = 300 * dt
    player.vel_x += Math.sin(player.angle) * thrust_force
    player.vel_y += -Math.cos(player.angle) * thrust_force
    player.thrust = true
  } else {
    player.thrust = false
  }

  if (keys_pressed['s'] || keys_pressed['S']) {
    const current_speed = Math.sqrt(player.vel_x * player.vel_x + player.vel_y * player.vel_y)
    const new_speed = Math.max(current_speed - 800 * dt, 0)
    if (current_speed > 0) {
      const speed_ratio = new_speed / current_speed
      player.vel_x *= speed_ratio
      player.vel_y *= speed_ratio
    }
    player.speed = new_speed
  }

  const current_speed = Math.sqrt(player.vel_x * player.vel_x + player.vel_y * player.vel_y)
  if (current_speed > player.max_speed) {
    const speed_ratio = player.max_speed / current_speed
    player.vel_x *= speed_ratio
    player.vel_y *= speed_ratio
  }
  player.speed = Math.min(current_speed, player.max_speed)

  player.x += player.vel_x * dt
  player.y += player.vel_y * dt

  const margin = 20
  if (player.x < -margin) {
    player.x = CANVAS_SIZE + margin
  } else if (player.x > CANVAS_SIZE + margin) {
    player.x = -margin
  }
  if (player.y < -margin) {
    player.y = CANVAS_SIZE + margin
  } else if (player.y > CANVAS_SIZE + margin) {
    player.y = -margin
  }
}
