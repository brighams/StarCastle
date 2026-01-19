import { CANVAS_SIZE, CENTER_X, CENTER_Y } from './constants.js'
import { playSound, startAttitudeThruster, startMainThruster, stopAttitudeThruster, stopMainThruster } from './sound.js'
import { retreat_enemies_to_center } from './enemies.js'
import { identity_matrix, multiply_matrices, rotate_matrix, translate_matrix } from './math.js'
import { draw_line } from './renderer.js'
import { toggle_info_box } from './ui.js'
import { fire_torpedo, player_torpedoes } from './torpedoes.js'


export const player = {
  x: CENTER_X,
  y: CANVAS_SIZE - 100,
  angle: 0,
  vel_x: 0,
  vel_y: 0,
  thrust: 0,
  rotation: 0, // -1 for left, 0 for none, 1 for right
  braking: false,
  strafing: 0, // -1 for left, 0 for none, 1 for right
  strafe_thrust: 0.0, // 0.0 to 1.0 for animation ramping
  size: 12,
  color: [1.0, 1.0, 1.0, 1.0],
  speed: 0,
  max_speed: 200,
  max_reverse_factor: 0.30, // Reverse speed = max_speed * this factor (adjustable)
  max_strafe_factor: 0.40, // Strafe speed = max_speed * this factor
  alive: true,
  respawn_timer: 0,
  spawn_anim_timer: 1.5,
  spawn_thrust: { forward: 0, strafe: 0 },
  torpedo_speed: 320,
  torpedo_life: 1600,
  fire_cooldown: 0
}

export const destroy_player = (player, game_state) => {
  game_state.lives--
  player.alive = false
  player.respawn_timer = 3.0
  playSound('player_explode')
  retreat_enemies_to_center()
}

const set_random_spawn_position = () => {
  const spawn_radius = CANVAS_SIZE * 0.4
  const random_angle = Math.random() * Math.PI * 2
  player.x = CENTER_X + Math.cos(random_angle) * spawn_radius
  player.y = CENTER_Y + Math.sin(random_angle) * spawn_radius
  player.vel_x = 0
  player.vel_y = 0
  player.speed = 0
  // Point towards the center (castle)
  player.angle = Math.atan2(CENTER_X - player.x, -(CENTER_Y - player.y))
}

export const reset_player = () => {
  set_random_spawn_position()
  player.alive = true
  player.respawn_timer = 0
  player.thrust = 0
  playSound('game_start', 0.5, 0.08)
}

export const spawn_player = (game_state, dt) => {
  player.respawn_timer -= dt
  if (player.respawn_timer <= 0) {
    if (game_state.lives > 0) {
      set_random_spawn_position()
      player.alive = true
      playSound('game_start', 0.5, 0.08)

      // Apply spawn thrust directly
      const spawn_forward_force = 60 // Forward thrust magnitude
      const spawn_strafe_force = 40 // Strafe thrust magnitude

      // Forward thrust
      player.vel_x += Math.sin(player.angle) * spawn_forward_force
      player.vel_y += -Math.cos(player.angle) * spawn_forward_force

      // Random left or right strafe
      const strafe_direction = Math.random() > 0.5 ? 1 : -1
      const strafe_x = strafe_direction * Math.cos(player.angle)
      const strafe_y = strafe_direction * Math.sin(player.angle)
      player.vel_x += strafe_x * spawn_strafe_force
      player.vel_y += strafe_y * spawn_strafe_force

    } else {
      game_state.game_over = true
      playSound('game_over', 1.0, 0.1)
      toggle_info_box(true)
    }
  }
}

export const update_player = (dt, keys_pressed, game_state) => {
  if (game_state.game_over) {
    stopMainThruster()
    stopAttitudeThruster()
    return
  }

  if (!player.alive) {
    if (game_state.round_won) {
      return
    }
    spawn_player(game_state, dt)
    return
  }

  const rotation_step = Math.PI / 8
  player.rotation = 0

  let isRotatingOrBraking = false
  const ROTATION_FACTOR = 6
  const THRUST_FACTOR = 4
  const THRUST_DECELERATE_FACTOR = 6
  const MAX_TORPEDO_COUNT = 2
  const SHIFT_DOWN = keys_pressed['ShiftKey']
  const FORE_TORPEDO_SIZE = 8
  const AFT_TORPEDO_SIZE = 7
  const AFT_TORPEDO_SPEED_MODIFIER = 0.35
  const AFT_TORPEDO_LIFE_MODIFIER = 1.0
  const AFT_TORPEDO_COLOR = [1.0, 0.5, 0.0]
  const FORE_TORPEDO_COLOR = [1.0, 0.0, 0.1]
  const FIRE_COOLDOWN_TIME = 0.40  // 400ms between shots

  // Update cooldown timer
  if (player.fire_cooldown > 0) {
    player.fire_cooldown -= dt
  }

  const alive_torpedo_count = player_torpedoes.filter(torpedo => torpedo.alive).length
  // =================== FIRE FORE TORPEDO
  if (keys_pressed['Space']) {
    if (player.alive && alive_torpedo_count < MAX_TORPEDO_COUNT && player.fire_cooldown <= 0) {
      if (!game_state.game_over && !game_state.round_won) {
        fire_torpedo({
          x: player.x,
          y: player.y,
          angle: player.angle,
          size: FORE_TORPEDO_SIZE,
          life: player.torpedo_life,
          speed: player.torpedo_speed,
          color: FORE_TORPEDO_COLOR,
          alive: true,
          is_space_mine: false
        })
        player.fire_cooldown = FIRE_COOLDOWN_TIME
      }
    }
  }

  // =================== FIRE AFT TORPEDO (SPACE MINE)
  if (keys_pressed['KeyR'] || keys_pressed['KeyF']) {
    if (!game_state.game_over && !game_state.round_won && player.alive && player_torpedoes.length < MAX_TORPEDO_COUNT && player.fire_cooldown <= 0) {
      fire_torpedo({
        x: player.x,
        y: player.y,
        angle: player.angle + Math.PI,
        size: AFT_TORPEDO_SIZE,
        speed: player.torpedo_speed * AFT_TORPEDO_SPEED_MODIFIER,
        life: player.torpedo_life * AFT_TORPEDO_LIFE_MODIFIER,
        is_space_mine: true,
        color: AFT_TORPEDO_COLOR,
        alive: true
      })
      player.fire_cooldown = FIRE_COOLDOWN_TIME
    }
  }

  // =================== ROTATE LEFT
  if (keys_pressed['KeyA'] && !SHIFT_DOWN) {
    player.angle -= rotation_step * dt * ROTATION_FACTOR
    player.rotation = -1
    isRotatingOrBraking = true
  }

  // =================== ROTATE RIGHT
  if (keys_pressed['KeyD'] && !SHIFT_DOWN) {
    player.angle += rotation_step * dt * ROTATION_FACTOR
    player.rotation = 1
    isRotatingOrBraking = true
  }

  // =================== FORWARD
  if (keys_pressed['KeyW']) {
    const thrust_force = 300 * dt
    player.vel_x += Math.sin(player.angle) * thrust_force
    player.vel_y += -Math.cos(player.angle) * thrust_force
    player.thrust = Math.min(player.thrust + dt * THRUST_FACTOR, 1.0)
    startMainThruster()
  } else {
    // decelerate while not thrusting
    player.thrust = Math.max(player.thrust - dt * THRUST_DECELERATE_FACTOR, 0)
    stopMainThruster()
  }

  // =================== REVERSE
  if (keys_pressed['KeyS']) {
    const current_speed = Math.sqrt(player.vel_x * player.vel_x + player.vel_y * player.vel_y)

    // Determine if we're moving forward or in reverse
    // Forward direction is (sin(angle), -cos(angle))
    const forward_x = Math.sin(player.angle)
    const forward_y = -Math.cos(player.angle)
    const dot_product = player.vel_x * forward_x + player.vel_y * forward_y
    const is_moving_forward = dot_product > 0
    const max_reverse_speed = player.max_speed * player.max_reverse_factor

    if (is_moving_forward && current_speed > 0) {

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
      player.speed = -Math.sqrt(player.vel_x * player.vel_x + player.vel_y * player.vel_y)
    }

    player.braking = current_speed > 10 || Math.abs(player.speed) > 5
    if (player.braking) isRotatingOrBraking = true
  } else {
    player.braking = false
  }

  // =================== STRAFING
  player.strafing = 0

  // =================== STRAFE RIGHT
  if ((keys_pressed['KeyD'] && SHIFT_DOWN) || keys_pressed['KeyE']) {
    player.strafing = -1

    const strafe_x = -Math.cos(player.angle)
    const strafe_y = -Math.sin(player.angle)
    const strafe_force = 250 * dt
    player.vel_x += strafe_x * strafe_force
    player.vel_y += strafe_y * strafe_force

    player.strafe_thrust = Math.min(player.strafe_thrust + dt * 3, 1.0)
    isRotatingOrBraking = true

    // =================== STRAFE LEFT
  } else if ((keys_pressed['KeyA'] && SHIFT_DOWN) || keys_pressed['KeyQ']) {
    player.strafing = 1

    const strafe_x = Math.cos(player.angle)
    const strafe_y = Math.sin(player.angle)
    const strafe_force = 250 * dt
    player.vel_x += strafe_x * strafe_force
    player.vel_y += strafe_y * strafe_force

    player.strafe_thrust = Math.min(player.strafe_thrust + dt * 3, 1.0)
    isRotatingOrBraking = true
  } else {
    player.strafe_thrust = Math.max(player.strafe_thrust - dt * 6, 0)
  }

  // =================== FINAL SPEED AND POSITION ADJUSTMENTS
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

export const draw_ship = (
  {
    x,
    y,
    angle,
    size,
    color,
    thrust = 0,
    rotation = 0,
    braking = false,
    strafing = 0,
    strafe_thrust = 0
  }
) => {
  const transform = identity_matrix()
  const ship_transform = multiply_matrices(
    multiply_matrices(transform, translate_matrix(x, y)),
    rotate_matrix(angle)
  )

  const offsets = [-0.5, 0, 0.5]
  for (const offset of offsets) {
    draw_line(offset, -size, -size * 0.7 + offset, size, ship_transform, color)
    draw_line(-size * 0.7 + offset, size, size * 0.7 + offset, size, ship_transform, color)
    draw_line(size * 0.7 + offset, size, offset, -size, ship_transform, color)
  }

  const tail_height = size * 0.4
  const tail_width = size * 0.35
  for (const offset of offsets) {
    draw_line(-tail_width + offset, size, offset, size - tail_height, ship_transform, color)
    draw_line(tail_width + offset, size, offset, size - tail_height, ship_transform, color)
  }

  if (thrust > 0) {

    const flame_length = 1.0 + thrust * 3.2
    const flame_width = 0.2 + thrust * 0.1
    const flame_color = [1.0, 0.5 - thrust * 0.2, 0.0, thrust]

    draw_line(0, size, -size * flame_width, size * flame_length, ship_transform, flame_color)
    draw_line(0, size, size * flame_width, size * flame_length, ship_transform, flame_color)
  }

  if (rotation !== 0) {
    const jet_color = [1.0, 0.0, 0.5, 0.9]
    const jet_length = size * 0.6

    if (rotation > 0) {

      draw_line(-size * 0.7, -size * 0.5, -size * 0.7 - jet_length, -size * 0.3, ship_transform, jet_color)
      draw_line(-size * 0.7, -size * 0.5, -size * 0.7 - jet_length, -size * 0.7, ship_transform, jet_color)
    } else {

      draw_line(size * 0.7, -size * 0.5, size * 0.7 + jet_length, -size * 0.3, ship_transform, jet_color)
      draw_line(size * 0.7, -size * 0.5, size * 0.7 + jet_length, -size * 0.7, ship_transform, jet_color)
    }
  }

  if (braking) {
    const jet_color = [1.0, 0.0, 0.5, 0.9]
    const jet_length = size * 0.8

    draw_line(0, -size, -size * 0.2, -size - jet_length, ship_transform, jet_color)
    draw_line(0, -size, size * 0.2, -size - jet_length, ship_transform, jet_color)
  }

  if (strafe_thrust > 0) {
    const strafe_color = [1.0, 0.3, 0.0, strafe_thrust * 0.9]
    const strafe_jet_length = size * 1.2 * strafe_thrust

    if (strafing > 0) {

      draw_line(-size * 0.5, 0, -size * 0.5 - strafe_jet_length, size * 0.2, ship_transform, strafe_color)
      draw_line(-size * 0.5, 0, -size * 0.5 - strafe_jet_length, -size * 0.2, ship_transform, strafe_color)
      draw_line(-size * 0.5, 0, -size * 0.5 - strafe_jet_length * 0.7, 0, ship_transform, strafe_color)
    } else if (strafing < 0) {

      draw_line(size * 0.5, 0, size * 0.5 + strafe_jet_length, size * 0.2, ship_transform, strafe_color)
      draw_line(size * 0.5, 0, size * 0.5 + strafe_jet_length, -size * 0.2, ship_transform, strafe_color)
      draw_line(size * 0.5, 0, size * 0.5 + strafe_jet_length * 0.7, 0, ship_transform, strafe_color)
    }
  }
}
