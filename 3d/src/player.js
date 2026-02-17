// Player ship - 3D version with WASD + mouse controls

import {
  PLAYER_SPAWN_DISTANCE_FROM_CENTER,
  PLAYER_SPAWN_FORWARD_PUSH,
  PLAYER_SPAWN_SIDEWAYS_PUSH,
  PLAYER_RESPAWN_DELAY_SECONDS,
  PLAYER_SHIP_FORWARD_THRUST_FORCE,
  PLAYER_SHIP_REVERSE_THRUST_FORCE,
  PLAYER_SHIP_BRAKING_DECELERATION,
  PLAYER_SHIP_STRAFE_THRUST_FORCE,
  PLAYER_SHIP_THRUST_FACTOR,
  PLAYER_SHIP_THRUST_DECELERATE_FACTOR,
  PLAYER_SHIP_ROTATION_SPEED,
  PLAYER_SHIP_STRAFE_THRUST_RAMP_UP_SPEED,
  PLAYER_SHIP_STRAFE_THRUST_RAMP_DOWN_SPEED,
  PLAYER_SHIP_BRAKING_VISUAL_THRESHOLD,
  PLAYER_SHIP_REVERSE_VISUAL_THRESHOLD,
  SHIP_SIZE,
  FIRE_COOLDOWN_TIME,
  MAX_TORPEDO_COUNT,
  FORE_TORPEDO_SIZE,
  FORE_TORPEDO_COLOR,
  AFT_TORPEDO_SIZE,
  AFT_TORPEDO_COLOR,
  AFT_TORPEDO_SPEED_MODIFIER,
  AFT_TORPEDO_LIFE_MODIFIER,
  WORLD_HEIGHT_LIMIT
} from './constants.js'
import { vec3 } from './math3d.js'
import { fireTorpedo } from './torpedoes.js'

export const createPlayer = () => ({
  ship: {
    position: { x: 0, y: 0, z: PLAYER_SPAWN_DISTANCE_FROM_CENTER },
    velocity: { x: 0, y: 0, z: 0 },
    rotation: { pitch: 0, yaw: 0, roll: 0 },
    size: SHIP_SIZE,
    max_speed: 200,
    max_reverse_factor: 0.30,
    max_strafe_factor: 0.40,
    thrust: 0,
    strafe_thrust: 0,
    braking: false,
    strafing: 0,
    rotation_input: { x: 0, y: 0 }
  },
  alive: true,
  respawn_timer: 0,
  torpedo_speed: 360,
  torpedo_life: 1800,
  fire_cooldown: 0
})

export let player = createPlayer()

export function resetPlayer() {
  player = createPlayer()
  setRandomSpawnPosition()
  player.alive = true
  player.respawn_timer = 0

  // NO spawn drift - start stationary
  player.ship.velocity = { x: 0, y: 0, z: 0 }
}

function setRandomSpawnPosition() {
  const angle = Math.random() * Math.PI * 2
  const radius = PLAYER_SPAWN_DISTANCE_FROM_CENTER

  player.ship.position.x = Math.cos(angle) * radius
  player.ship.position.z = Math.sin(angle) * radius
  player.ship.position.y = (Math.random() - 0.5) * 50

  // Point towards center
  player.ship.rotation.yaw = angle + Math.PI
  player.ship.rotation.pitch = 0
}

function getForwardVector() {
  const yaw = player.ship.rotation.yaw
  const pitch = player.ship.rotation.pitch

  return {
    x: -Math.sin(yaw) * Math.cos(pitch),
    y: Math.sin(pitch),
    z: -Math.cos(yaw) * Math.cos(pitch)
  }
}

function getRightVector() {
  const yaw = player.ship.rotation.yaw

  return {
    x: Math.cos(yaw),
    y: 0,
    z: -Math.sin(yaw)
  }
}

function getUpVector() {
  const yaw = player.ship.rotation.yaw
  const pitch = player.ship.rotation.pitch

  return {
    x: Math.sin(yaw) * Math.sin(pitch),
    y: Math.cos(pitch),
    z: Math.cos(yaw) * Math.sin(pitch)
  }
}

export function spawnPlayer(gameState, dt) {
  player.respawn_timer -= dt
  if (player.respawn_timer <= 0) {
    if (gameState.lives > 0) {
      setRandomSpawnPosition()
      player.alive = true

      // NO spawn drift - start stationary
      player.ship.velocity = { x: 0, y: 0, z: 0 }
    } else {
      gameState.game_over = true
    }
  }
}

export function destroyPlayer(gameState) {
  gameState.lives--
  player.alive = false
  player.respawn_timer = PLAYER_RESPAWN_DELAY_SECONDS
}

export function updatePlayer(dt, input, gameState) {
  if (gameState.game_over || !player.alive) {
    if (!player.alive && !gameState.round_won) {
      spawnPlayer(gameState, dt)
    }
    return
  }

  player.ship.strafing = 0

  // Update cooldown
  if (player.fire_cooldown > 0) {
    player.fire_cooldown -= dt
  }

  // Mouse rotation
  if (input.mouse.dx !== 0 || input.mouse.dy !== 0) {
    player.ship.rotation.yaw += input.mouse.dx * PLAYER_SHIP_ROTATION_SPEED * dt
    player.ship.rotation.pitch -= input.mouse.dy * PLAYER_SHIP_ROTATION_SPEED * dt

    // Clamp pitch
    player.ship.rotation.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, player.ship.rotation.pitch))
  }

  const forward = getForwardVector()
  const right = getRightVector()
  const up = getUpVector()

  // Forward thrust (W)
  if (input.keys['KeyW']) {
    const thrust_force = PLAYER_SHIP_FORWARD_THRUST_FORCE * dt
    player.ship.velocity = vec3.add(player.ship.velocity, vec3.scale(forward, thrust_force))
    player.ship.thrust = Math.min(player.ship.thrust + dt * PLAYER_SHIP_THRUST_FACTOR, 1.0)
  } else {
    player.ship.thrust = Math.max(player.ship.thrust - dt * PLAYER_SHIP_THRUST_DECELERATE_FACTOR, 0)
  }

  // Reverse/Brake (S)
  if (input.keys['KeyS']) {
    const current_speed = vec3.length(player.ship.velocity)
    const dot = vec3.dot(player.ship.velocity, forward)

    if (dot > 0 && current_speed > 0) {
      // Braking
      const new_speed = Math.max(current_speed - PLAYER_SHIP_BRAKING_DECELERATION * dt, 0)
      if (current_speed > 0) {
        const speed_ratio = new_speed / current_speed
        player.ship.velocity = vec3.scale(player.ship.velocity, speed_ratio)
      }
    } else {
      // Reverse thrust
      const reverse_force = PLAYER_SHIP_REVERSE_THRUST_FORCE * dt
      player.ship.velocity = vec3.add(player.ship.velocity, vec3.scale(forward, -reverse_force))
    }

    player.ship.braking = current_speed > PLAYER_SHIP_BRAKING_VISUAL_THRESHOLD
  } else {
    player.ship.braking = false
  }

  // Strafe left (A)
  if (input.keys['KeyA']) {
    const strafe_force = PLAYER_SHIP_STRAFE_THRUST_FORCE * dt
    player.ship.velocity = vec3.add(player.ship.velocity, vec3.scale(right, -strafe_force))
    player.ship.strafe_thrust = Math.min(player.ship.strafe_thrust + dt * PLAYER_SHIP_STRAFE_THRUST_RAMP_UP_SPEED, 1.0)
    player.ship.strafing = -1
  }
  // Strafe right (D)
  else if (input.keys['KeyD']) {
    const strafe_force = PLAYER_SHIP_STRAFE_THRUST_FORCE * dt
    player.ship.velocity = vec3.add(player.ship.velocity, vec3.scale(right, strafe_force))
    player.ship.strafe_thrust = Math.min(player.ship.strafe_thrust + dt * PLAYER_SHIP_STRAFE_THRUST_RAMP_UP_SPEED, 1.0)
    player.ship.strafing = 1
  } else {
    player.ship.strafe_thrust = Math.max(player.ship.strafe_thrust - dt * PLAYER_SHIP_STRAFE_THRUST_RAMP_DOWN_SPEED, 0)
  }

  // Fire torpedo (Space)
  if (input.keys['Space'] && input.keyPressed['Space']) {
    input.keyPressed['Space'] = false
    fireTorpedo({
      position: { ...player.ship.position },
      direction: forward,
      size: FORE_TORPEDO_SIZE,
      speed: player.torpedo_speed,
      life: player.torpedo_life,
      color: FORE_TORPEDO_COLOR,
      is_space_mine: false
    })
  }

  // Fire aft mine (R or F)
  if ((input.keys['KeyR'] || input.keys['KeyF']) && (input.keyPressed['KeyR'] || input.keyPressed['KeyF'])) {
    input.keyPressed['KeyR'] = false
    input.keyPressed['KeyF'] = false
    fireTorpedo({
      position: { ...player.ship.position },
      direction: vec3.scale(forward, -1),
      size: AFT_TORPEDO_SIZE,
      speed: player.torpedo_speed * AFT_TORPEDO_SPEED_MODIFIER,
      life: player.torpedo_life * AFT_TORPEDO_LIFE_MODIFIER,
      color: AFT_TORPEDO_COLOR,
      is_space_mine: true
    })
  }

  // Clamp speed
  const current_speed = vec3.length(player.ship.velocity)
  if (current_speed > player.ship.max_speed) {
    player.ship.velocity = vec3.scale(vec3.normalize(player.ship.velocity), player.ship.max_speed)
  }

  // Update position
  player.ship.position = vec3.add(player.ship.position, vec3.scale(player.ship.velocity, dt))

  // Clamp vertical position
  player.ship.position.y = Math.max(-WORLD_HEIGHT_LIMIT, Math.min(WORLD_HEIGHT_LIMIT, player.ship.position.y))
}
