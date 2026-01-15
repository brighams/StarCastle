import { CANVAS_SIZE, CENTER_X, CENTER_Y } from './constants.js'
import { playSound, startMainThruster, stopMainThruster, startAttitudeThruster, stopAttitudeThruster } from './sound.js'

export const player = {
  x: CENTER_X,
  y: CANVAS_SIZE - 100,
  angle: 0,
  vel_x: 0,
  vel_y: 0,
  thrust: 0,
  rotation: 0, // -1 for left, 0 for none, 1 for right
  braking: false,
  size: 12,
  color: [0.5, 0.5, 1.0, 1.0],
  speed: 0,
  max_speed: 200,
  max_reverse_factor: 0.30, // Reverse speed = max_speed * this factor (adjustable)
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
  player.thrust = 0
  playSound('player_spawn')
}

export const update_player = (dt, keys_pressed, lives, game_state) => {
  // Don't process input when game is over
  if (game_state.game_over) {
    stopMainThruster()
    stopAttitudeThruster()
    return
  }

  if (!player.alive) {
    player.respawn_timer -= dt
    if (player.respawn_timer <= 0) {
      if (lives > 0) {
        // Spawn on a ring at 80% of game size radius, pointing towards center
        const spawn_radius = CANVAS_SIZE * 0.4  // 80% of half the canvas = 40% of full size from center
        const random_angle = Math.random() * Math.PI * 2
        player.x = CENTER_X + Math.cos(random_angle) * spawn_radius
        player.y = CENTER_Y + Math.sin(random_angle) * spawn_radius
        player.vel_x = 0
        player.vel_y = 0
        player.speed = 0
        // Point towards the center (castle)
        player.angle = Math.atan2(CENTER_X - player.x, -(CENTER_Y - player.y))
        player.alive = true
        playSound('player_spawn')
      } else {
        game_state.game_over = true
        playSound('game_over', 1.0, 0.1)
      }
    }
    return
  }

  const rotation_step = Math.PI / 8
  player.rotation = 0 // Reset rotation state each frame

  let isRotatingOrBraking = false

  if (keys_pressed['a'] || keys_pressed['A'] || keys_pressed['ArrowLeft']) {
    player.angle -= rotation_step * dt * 4
    player.rotation = -1
    isRotatingOrBraking = true
  }
  if (keys_pressed['d'] || keys_pressed['D'] || keys_pressed['ArrowRight']) {
    player.angle += rotation_step * dt * 4
    player.rotation = 1
    isRotatingOrBraking = true
  }

  if (keys_pressed['w'] || keys_pressed['W'] || keys_pressed['ArrowUp']) {
    const thrust_force = 300 * dt
    player.vel_x += Math.sin(player.angle) * thrust_force
    player.vel_y += -Math.cos(player.angle) * thrust_force
    // Ramp up thrust smoothly
    player.thrust = Math.min(player.thrust + dt * 4, 1.0)
    startMainThruster()
  } else {
    // Ramp down thrust smoothly
    player.thrust = Math.max(player.thrust - dt * 8, 0)
    stopMainThruster()
  }

  if (keys_pressed['s'] || keys_pressed['S'] || keys_pressed['ArrowDown']) {
    const current_speed = Math.sqrt(player.vel_x * player.vel_x + player.vel_y * player.vel_y)

    // Determine if we're moving forward or in reverse
    // Forward direction is (sin(angle), -cos(angle))
    const forward_x = Math.sin(player.angle)
    const forward_y = -Math.cos(player.angle)
    const dot_product = player.vel_x * forward_x + player.vel_y * forward_y
    const is_moving_forward = dot_product > 0
    const max_reverse_speed = player.max_speed * player.max_reverse_factor

    if (is_moving_forward && current_speed > 0) {
      // Still moving forward, decelerate
      const new_speed = Math.max(current_speed - 800 * dt, 0)
      const speed_ratio = new_speed / current_speed
      player.vel_x *= speed_ratio
      player.vel_y *= speed_ratio
      player.speed = new_speed
    } else {
      // At zero or already in reverse - apply reverse thrust
      const reverse_force = 200 * dt
      player.vel_x -= forward_x * reverse_force
      player.vel_y -= forward_y * reverse_force

      // Clamp to max reverse speed
      const new_speed = Math.sqrt(player.vel_x * player.vel_x + player.vel_y * player.vel_y)
      if (new_speed > max_reverse_speed) {
        const speed_ratio = max_reverse_speed / new_speed
        player.vel_x *= speed_ratio
        player.vel_y *= speed_ratio
      }
      player.speed = -Math.sqrt(player.vel_x * player.vel_x + player.vel_y * player.vel_y) // Negative to indicate reverse
    }

    player.braking = current_speed > 10 || Math.abs(player.speed) > 5 // Show jet if moving forward or in reverse
    if (player.braking) isRotatingOrBraking = true
  } else {
    player.braking = false
  }

  // Handle attitude thruster sound
  if (isRotatingOrBraking) {
    startAttitudeThruster()
  } else {
    stopAttitudeThruster()
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
