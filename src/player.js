import { CANVAS_SIZE, CENTER_X, CENTER_Y } from './constants.js'
import { playSound, startAttitudeThruster, startMainThruster, stopAttitudeThruster, stopMainThruster } from './sound.js'
import { retreat_enemies_to_center } from './enemies.js'
import { identity_matrix, multiply_matrices, rotate_matrix, translate_matrix } from './math.js'
import { draw_line } from './renderer.js'
import { toggle_info_box } from './ui.js'
import { fire_torpedo, player_torpedoes } from './torpedoes.js'


const ROTATION_STEP = Math.PI / 8
const ROTATION_FACTOR = 6
const THRUST_FACTOR = 4
const THRUST_DECELERATE_FACTOR = 6
const MAX_TORPEDO_COUNT = 3
const FORE_TORPEDO_SIZE = 8
const AFT_TORPEDO_SIZE = 7
const AFT_TORPEDO_SPEED_MODIFIER = 0.35
const AFT_TORPEDO_LIFE_MODIFIER = 1.0
const AFT_TORPEDO_COLOR = [1.0, 0.5, 0.0]
const FORE_TORPEDO_COLOR = [1.0, 0.0, 0.1]
const FIRE_COOLDOWN_TIME = 0.200

// Spawn behavior
const SPAWN_FORWARD_PUSH = 60                               // Initial forward velocity when respawning
const SPAWN_SIDEWAYS_PUSH = 40                              // Initial sideways velocity when respawning
const SPAWN_DISTANCE_FROM_CENTER_RATIO = 0.42               // How far from center to spawn (fraction of canvas)
const RESPAWN_DELAY_SECONDS = 3.0                           // Time before player respawns after death

// Physics forces (units per second squared)
const FORWARD_THRUST_FORCE = 300                            // Engine power when pressing forward
const REVERSE_THRUST_FORCE = 400                            // Reverse thruster power
const BRAKING_DECELERATION = 800                            // How fast the ship slows when braking
const STRAFE_THRUST_FORCE = 250                             // Sideways thruster power

// Animation ramp speeds (how fast thruster visuals fade in/out)
const STRAFE_THRUST_RAMP_UP_SPEED = 3
const STRAFE_THRUST_RAMP_DOWN_SPEED = 6

// Speed thresholds for visual effects
const BRAKING_VISUAL_THRESHOLD = 10                         // Min speed to show braking jets
const REVERSE_VISUAL_THRESHOLD = 5                          // Min speed to show reverse jets

// Screen wrap boundary
const SCREEN_WRAP_BUFFER = 20                               // Pixels beyond edge before wrapping

// Ship geometry ratios (relative to ship size)
const SHIP_HULL_WIDTH_RATIO = 0.7                           // How wide the hull sides are
const SHIP_TAIL_NOTCH_HEIGHT_RATIO = 0.4                    // Height of rear tail notch
const SHIP_TAIL_NOTCH_WIDTH_RATIO = 0.35                    // Width of rear tail notch
const SHIP_LINE_OFFSETS = [-0.5, 0, 0.5]                    // Offsets for bold line effect

// Rotation thruster jet geometry
const ROTATION_JET_LENGTH_RATIO = 0.6                       // Length of rotation jets
const ROTATION_JET_MOUNT_Y_RATIO = 0.5                      // Y position of rotation jet mounts
const ROTATION_JET_UPPER_SPREAD_RATIO = 0.3                 // Upper jet endpoint spread
const ROTATION_JET_LOWER_SPREAD_RATIO = 0.7                 // Lower jet endpoint spread

// Braking jet geometry
const BRAKE_JET_LENGTH_RATIO = 0.8                          // Length of forward braking jets
const BRAKE_JET_WIDTH_RATIO = 0.2                           // Width of braking jet spread

// Strafe jet geometry
const STRAFE_JET_MAX_LENGTH_RATIO = 1.2                     // Max length of strafe jets
const STRAFE_JET_CENTER_LENGTH_RATIO = 0.7                  // Center jet is shorter
const STRAFE_JET_VERTICAL_SPREAD_RATIO = 0.2                // Vertical spread of strafe jets
const STRAFE_JET_MOUNT_X_RATIO = 0.5                        // X position of strafe jet mounts

// Main engine flame
const FLAME_BASE_LENGTH = 1.0                               // Min flame length when thrusting
const FLAME_LENGTH_MULTIPLIER = 3.2                         // Additional flame length at full thrust
const FLAME_BASE_WIDTH = 0.2                                // Min flame width
const FLAME_WIDTH_MULTIPLIER = 0.1                          // Additional flame width at full thrust
const FLAME_GREEN_BASE = 0.5                                // Base green color value
const FLAME_GREEN_REDUCTION = 0.2                           // How much green decreases at full thrust

// Thruster jet colors [R, G, B, A]
const ROTATION_JET_COLOR = [1.0, 0.0, 0.5, 0.9]             // Magenta/pink
const BRAKE_JET_COLOR = [1.0, 0.0, 0.5, 0.9]                // Magenta/pink
const STRAFE_JET_COLOR_RGB = [1.0, 0.3, 0.0]                // Orange (alpha added dynamically)
const STRAFE_JET_ALPHA_MULTIPLIER = 0.9                     // Alpha = strafe_thrust * this

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
  torpedo_speed: 360,
  torpedo_life: 1800,
  fire_cooldown: 0
}

export const spawn_player = (game_state, dt) => {
  player.respawn_timer -= dt
  if (player.respawn_timer <= 0) {
    if (game_state.lives > 0) {
      set_random_spawn_position()
      player.alive = true
      playSound('game_start', 0.5, 0.08)

      // Forward thrust
      player.vel_x += Math.sin(player.angle) * SPAWN_FORWARD_PUSH
      player.vel_y += -Math.cos(player.angle) * SPAWN_FORWARD_PUSH

      // Random left or right strafe
      const strafe_direction = Math.random() > 0.5 ? 1 : -1
      const strafe_x = strafe_direction * Math.cos(player.angle)
      const strafe_y = strafe_direction * Math.sin(player.angle)
      player.vel_x += strafe_x * SPAWN_SIDEWAYS_PUSH
      player.vel_y += strafe_y * SPAWN_SIDEWAYS_PUSH

    } else {
      game_state.game_over = true
      playSound('game_over', 1.0, 0.1)
      toggle_info_box(true)
    }
  }
}

const set_random_spawn_position = () => {
  const spawn_radius = CANVAS_SIZE * SPAWN_DISTANCE_FROM_CENTER_RATIO
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

export const destroy_player = (player, game_state) => {
  game_state.lives--
  player.alive = false
  player.respawn_timer = RESPAWN_DELAY_SECONDS
  playSound('player_explode')
  retreat_enemies_to_center()
}

const apply_input_events = (keys_pressed, dt, game_state) => {

  let isRotatingOrBraking = false

  const check_keys = (key) => keys_pressed[key]
  const SHIFT_DOWN = keys_pressed['ShiftKey']

  const launch_torpedo = () => {
    if (check_keys('Space')) {
      const alive_torpedo_count = player_torpedoes.filter(torpedo => torpedo.alive).length
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
  }

  const launch_space_mine = () => {
    if (check_keys('KeyR') || check_keys('KeyF')) {
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
  }

  const thrust_forward = () => {
    if (check_keys('KeyW')) {
      const thrust_force = FORWARD_THRUST_FORCE * dt
      player.vel_x += Math.sin(player.angle) * thrust_force
      player.vel_y += -Math.cos(player.angle) * thrust_force
      player.thrust = Math.min(player.thrust + dt * THRUST_FACTOR, 1.0)
      startMainThruster()
    } else {
      // decelerate while not thrusting
      player.thrust = Math.max(player.thrust - dt * THRUST_DECELERATE_FACTOR, 0)
      stopMainThruster()
    }
  }

  const thrust_reverse = () => {
    const apply_braking = (current_speed) => {
      const new_speed = Math.max(current_speed - BRAKING_DECELERATION * dt, 0)
      const speed_ratio = new_speed / current_speed
      player.vel_x *= speed_ratio
      player.vel_y *= speed_ratio
      player.speed = new_speed
    }

    const apply_reverse_thrust = (forward_x, forward_y) => {
      const max_reverse_speed = player.max_speed * player.max_reverse_factor
      const reverse_force = REVERSE_THRUST_FORCE * dt
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

    if (check_keys('KeyS')) {
      const current_speed = Math.sqrt(player.vel_x * player.vel_x + player.vel_y * player.vel_y)

      // Determine if we're moving forward or in reverse
      // Forward direction is (sin(angle), -cos(angle))
      const forward_x = Math.sin(player.angle)
      const forward_y = -Math.cos(player.angle)
      const dot_product = player.vel_x * forward_x + player.vel_y * forward_y
      const is_moving_forward = dot_product > 0

      if (is_moving_forward && current_speed > 0) {
        apply_braking(current_speed)
      } else {
        // At zero or already in reverse - apply reverse thrust
        apply_reverse_thrust(forward_x, forward_y)
      }

      player.braking = current_speed > BRAKING_VISUAL_THRESHOLD || Math.abs(player.speed) > REVERSE_VISUAL_THRESHOLD
      if (player.braking) isRotatingOrBraking = true
    } else {
      player.braking = false
    }
  }

  const strafe_left = () => {
    if ((check_keys('KeyA') && SHIFT_DOWN) || check_keys('KeyQ')) {
      player.strafing = 1

      const strafe_x = Math.cos(player.angle)
      const strafe_y = Math.sin(player.angle)
      const strafe_force = STRAFE_THRUST_FORCE * dt
      player.vel_x += strafe_x * strafe_force
      player.vel_y += strafe_y * strafe_force

      player.strafe_thrust = Math.min(player.strafe_thrust + dt * STRAFE_THRUST_RAMP_UP_SPEED, 1.0)
      isRotatingOrBraking = true
      return true
    }
    return false
  }

  const strafe_right = () => {
    if ((check_keys('KeyD') && SHIFT_DOWN) || check_keys('KeyE')) {
      player.strafing = -1

      const strafe_x = -Math.cos(player.angle)
      const strafe_y = -Math.sin(player.angle)
      const strafe_force = STRAFE_THRUST_FORCE * dt
      player.vel_x += strafe_x * strafe_force
      player.vel_y += strafe_y * strafe_force

      player.strafe_thrust = Math.min(player.strafe_thrust + dt * STRAFE_THRUST_RAMP_UP_SPEED, 1.0)
      isRotatingOrBraking = true
      return true
    }
    return false
  }

  const rotate_left = () => {
    if (check_keys('KeyA') && !SHIFT_DOWN) {
      player.angle -= ROTATION_STEP * dt * ROTATION_FACTOR
      player.rotation = -1
      isRotatingOrBraking = true
    }
  }

  const rotate_right = () => {
    if (check_keys('KeyD') && !SHIFT_DOWN) {
      player.angle += ROTATION_STEP * dt * ROTATION_FACTOR
      player.rotation = 1
      isRotatingOrBraking = true
    }
  }

  const handle_strafing = () => {
    const did_strafe = strafe_right() || strafe_left()
    if (!did_strafe) {
      player.strafe_thrust = Math.max(player.strafe_thrust - dt * STRAFE_THRUST_RAMP_DOWN_SPEED, 0)
    }
  }

  // Process all input handlers
  launch_torpedo()
  launch_space_mine()
  rotate_left()
  rotate_right()
  thrust_forward()
  thrust_reverse()
  handle_strafing()

  return isRotatingOrBraking
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

  // Reset player state for this frame
  player.rotation = 0
  player.strafing = 0

  // Update cooldown timer
  if (player.fire_cooldown > 0) {
    player.fire_cooldown -= dt
  }

  // Process input events
  const isRotatingOrBraking = apply_input_events(keys_pressed, dt, game_state)

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

  if (player.x < -SCREEN_WRAP_BUFFER) {
    player.x = CANVAS_SIZE + SCREEN_WRAP_BUFFER
  } else if (player.x > CANVAS_SIZE + SCREEN_WRAP_BUFFER) {
    player.x = -SCREEN_WRAP_BUFFER
  }
  if (player.y < -SCREEN_WRAP_BUFFER) {
    player.y = CANVAS_SIZE + SCREEN_WRAP_BUFFER
  } else if (player.y > CANVAS_SIZE + SCREEN_WRAP_BUFFER) {
    player.y = -SCREEN_WRAP_BUFFER
  }
}

export const draw_player_ship = (
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

  // Draw ship hull with bold line effect
  for (const offset of SHIP_LINE_OFFSETS) {
    draw_line(offset, -size, -size * SHIP_HULL_WIDTH_RATIO + offset, size, ship_transform, color)
    draw_line(-size * SHIP_HULL_WIDTH_RATIO + offset, size, size * SHIP_HULL_WIDTH_RATIO + offset, size, ship_transform, color)
    draw_line(size * SHIP_HULL_WIDTH_RATIO + offset, size, offset, -size, ship_transform, color)
  }

  // Draw tail notch
  const tail_height = size * SHIP_TAIL_NOTCH_HEIGHT_RATIO
  const tail_width = size * SHIP_TAIL_NOTCH_WIDTH_RATIO
  for (const offset of SHIP_LINE_OFFSETS) {
    draw_line(-tail_width + offset, size, offset, size - tail_height, ship_transform, color)
    draw_line(tail_width + offset, size, offset, size - tail_height, ship_transform, color)
  }

  // Main engine flame
  if (thrust > 0) {
    const flame_length = FLAME_BASE_LENGTH + thrust * FLAME_LENGTH_MULTIPLIER
    const flame_width = FLAME_BASE_WIDTH + thrust * FLAME_WIDTH_MULTIPLIER
    const flame_color = [1.0, FLAME_GREEN_BASE - thrust * FLAME_GREEN_REDUCTION, 0.0, thrust]

    draw_line(0, size, -size * flame_width, size * flame_length, ship_transform, flame_color)
    draw_line(0, size, size * flame_width, size * flame_length, ship_transform, flame_color)
  }

  // Rotation thruster jets
  if (rotation !== 0) {
    const jet_length = size * ROTATION_JET_LENGTH_RATIO

    if (rotation > 0) {
      draw_line(-size * SHIP_HULL_WIDTH_RATIO, -size * ROTATION_JET_MOUNT_Y_RATIO, -size * SHIP_HULL_WIDTH_RATIO - jet_length, -size * ROTATION_JET_UPPER_SPREAD_RATIO, ship_transform, ROTATION_JET_COLOR)
      draw_line(-size * SHIP_HULL_WIDTH_RATIO, -size * ROTATION_JET_MOUNT_Y_RATIO, -size * SHIP_HULL_WIDTH_RATIO - jet_length, -size * ROTATION_JET_LOWER_SPREAD_RATIO, ship_transform, ROTATION_JET_COLOR)
    } else {
      draw_line(size * SHIP_HULL_WIDTH_RATIO, -size * ROTATION_JET_MOUNT_Y_RATIO, size * SHIP_HULL_WIDTH_RATIO + jet_length, -size * ROTATION_JET_UPPER_SPREAD_RATIO, ship_transform, ROTATION_JET_COLOR)
      draw_line(size * SHIP_HULL_WIDTH_RATIO, -size * ROTATION_JET_MOUNT_Y_RATIO, size * SHIP_HULL_WIDTH_RATIO + jet_length, -size * ROTATION_JET_LOWER_SPREAD_RATIO, ship_transform, ROTATION_JET_COLOR)
    }
  }

  // Braking jets
  if (braking) {
    const jet_length = size * BRAKE_JET_LENGTH_RATIO

    draw_line(0, -size, -size * BRAKE_JET_WIDTH_RATIO, -size - jet_length, ship_transform, BRAKE_JET_COLOR)
    draw_line(0, -size, size * BRAKE_JET_WIDTH_RATIO, -size - jet_length, ship_transform, BRAKE_JET_COLOR)
  }

  // Strafe thruster jets
  if (strafe_thrust > 0) {
    const strafe_color = [STRAFE_JET_COLOR_RGB[0], STRAFE_JET_COLOR_RGB[1], STRAFE_JET_COLOR_RGB[2], strafe_thrust * STRAFE_JET_ALPHA_MULTIPLIER]
    const strafe_jet_length = size * STRAFE_JET_MAX_LENGTH_RATIO * strafe_thrust

    if (strafing > 0) {
      draw_line(-size * STRAFE_JET_MOUNT_X_RATIO, 0, -size * STRAFE_JET_MOUNT_X_RATIO - strafe_jet_length, size * STRAFE_JET_VERTICAL_SPREAD_RATIO, ship_transform, strafe_color)
      draw_line(-size * STRAFE_JET_MOUNT_X_RATIO, 0, -size * STRAFE_JET_MOUNT_X_RATIO - strafe_jet_length, -size * STRAFE_JET_VERTICAL_SPREAD_RATIO, ship_transform, strafe_color)
      draw_line(-size * STRAFE_JET_MOUNT_X_RATIO, 0, -size * STRAFE_JET_MOUNT_X_RATIO - strafe_jet_length * STRAFE_JET_CENTER_LENGTH_RATIO, 0, ship_transform, strafe_color)
    } else if (strafing < 0) {
      draw_line(size * STRAFE_JET_MOUNT_X_RATIO, 0, size * STRAFE_JET_MOUNT_X_RATIO + strafe_jet_length, size * STRAFE_JET_VERTICAL_SPREAD_RATIO, ship_transform, strafe_color)
      draw_line(size * STRAFE_JET_MOUNT_X_RATIO, 0, size * STRAFE_JET_MOUNT_X_RATIO + strafe_jet_length, -size * STRAFE_JET_VERTICAL_SPREAD_RATIO, ship_transform, strafe_color)
      draw_line(size * STRAFE_JET_MOUNT_X_RATIO, 0, size * STRAFE_JET_MOUNT_X_RATIO + strafe_jet_length * STRAFE_JET_CENTER_LENGTH_RATIO, 0, ship_transform, strafe_color)
    }
  }
}
