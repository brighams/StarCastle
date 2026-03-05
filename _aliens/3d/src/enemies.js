// Enemy AI - 3D version

import {
  ENEMY_SPAWN_VELOCITY,
  ENEMY_DOCK_ARRIVAL_THRESHOLD,
  ENEMY_LINGER_BASE_TIME,
  ENEMY_LINGER_RANDOM_TIME,
  ENEMY_RING_CHANGE_CHANCE,
  ENEMY_RING_CHANGE_LINGER_BASE,
  ENEMY_RING_CHANGE_LINGER_RANDOM,
  ENEMY_FLOCKING_DISTANCE,
  ENEMY_SEPARATION_FORCE,
  ENEMY_FLOCKING_SEPARATION_DISTANCE,
  ENEMY_CLOSE_CHASE_FORCE,
  ENEMY_FAR_CHASE_FORCE,
  ENEMY_JITTER_MAGNITUDE,
  ENEMY_JITTER_MIN_INTERVAL,
  ENEMY_JITTER_RANDOM_INTERVAL,
  ENEMY_RETREAT_VELOCITY,
  ENEMY_VELOCITY_DAMPING,
  ENEMY_SPARK_SIZE
} from './constants.js'
import { vec3 } from './math3d.js'
import { castle } from './castle.js'

export const enemies = []

export function spawnEnemy() {
  const rings = castle.rings
  const ring_index = Math.floor(Math.random() * rings.length)
  const ring = rings[ring_index]

  const angle = Math.random() * Math.PI * 2
  const target_x = Math.cos(angle) * ring.radius
  const target_z = Math.sin(angle) * ring.radius
  const target_y = (Math.random() - 0.5) * 20

  enemies.push({
    alive: true,
    spawning: true,
    lingering: false,
    chasing: false,
    retreating: false,
    size: ENEMY_SPARK_SIZE,
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    spawn_target: { x: target_x, y: target_y, z: target_z },
    spawn_ring_index: ring_index,
    spawn_angle: angle,
    linger_timer: ENEMY_LINGER_BASE_TIME + Math.random() * ENEMY_LINGER_RANDOM_TIME,
    jitter_timer: 0,
    jitter: { x: 0, y: 0, z: 0 }
  })
}

export function spawnEnemies(count, delay_factor) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => spawnEnemy(), i * delay_factor * 1000)
  }
}

export function clearEnemies() {
  enemies.length = 0
}

export function retreatEnemiesToCenter() {
  for (const enemy of enemies) {
    if (enemy.alive) {
      enemy.retreating = true
      enemy.spawning = false
      enemy.lingering = false
      enemy.chasing = false
    }
  }
}

export function removeDestroyedEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (!enemies[i].alive) {
      enemies.splice(i, 1)
    }
  }
}

function applySpawnMovement(enemy, dt) {
  const dx = enemy.spawn_target.x - enemy.position.x
  const dy = enemy.spawn_target.y - enemy.position.y
  const dz = enemy.spawn_target.z - enemy.position.z
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

  if (distance < ENEMY_DOCK_ARRIVAL_THRESHOLD) {
    enemy.spawning = false
    enemy.lingering = true
    enemy.position = { ...enemy.spawn_target }
    enemy.velocity = { x: 0, y: 0, z: 0 }
    return
  }

  enemy.velocity.x = (dx / distance) * ENEMY_SPAWN_VELOCITY
  enemy.velocity.y = (dy / distance) * ENEMY_SPAWN_VELOCITY
  enemy.velocity.z = (dz / distance) * ENEMY_SPAWN_VELOCITY

  enemy.position.x += enemy.velocity.x * dt
  enemy.position.y += enemy.velocity.y * dt
  enemy.position.z += enemy.velocity.z * dt
}

function applyLingeringMovement(enemy, dt) {
  const rings = castle.rings
  const ring = rings[enemy.spawn_ring_index]

  enemy.spawn_angle += ring.rotationSpeed * dt
  enemy.position.x = Math.cos(enemy.spawn_angle) * ring.radius
  enemy.position.z = Math.sin(enemy.spawn_angle) * ring.radius

  enemy.linger_timer -= dt
  if (enemy.linger_timer <= 0) {
    if (Math.random() < ENEMY_RING_CHANGE_CHANCE) {
      enemy.spawn_ring_index = (enemy.spawn_ring_index + 1) % rings.length
      enemy.linger_timer = ENEMY_RING_CHANGE_LINGER_BASE + Math.random() * ENEMY_RING_CHANGE_LINGER_RANDOM
    } else {
      enemy.lingering = false
      enemy.chasing = true
    }
  }
}

function applyChasingMovement(enemy, dt, player, speed_multiplier) {
  if (!player.alive) {
    enemy.chasing = false
    enemy.retreating = true
    return
  }

  const player_pos = player.ship.position
  const to_player = vec3.subtract(player_pos, enemy.position)
  const dist_to_player = vec3.length(to_player)

  let chase_force = dist_to_player > 150 ? ENEMY_FAR_CHASE_FORCE : ENEMY_CLOSE_CHASE_FORCE

  if (dist_to_player > 0) {
    const chase_dir = vec3.normalize(to_player)
    enemy.velocity = vec3.add(enemy.velocity, vec3.scale(chase_dir, chase_force * dt * speed_multiplier))
  }

  // Flocking behavior - separation
  for (const other of enemies) {
    if (other === enemy || !other.alive) continue

    const to_other = vec3.subtract(other.position, enemy.position)
    const dist_to_other = vec3.length(to_other)

    if (dist_to_other < ENEMY_FLOCKING_SEPARATION_DISTANCE && dist_to_other > 0) {
      const separation_dir = vec3.normalize(vec3.scale(to_other, -1))
      enemy.velocity = vec3.add(enemy.velocity, vec3.scale(separation_dir, ENEMY_SEPARATION_FORCE * dt))
    }
  }

  // Jitter
  enemy.jitter_timer -= dt
  if (enemy.jitter_timer <= 0) {
    enemy.jitter = {
      x: (Math.random() - 0.5) * ENEMY_JITTER_MAGNITUDE,
      y: (Math.random() - 0.5) * ENEMY_JITTER_MAGNITUDE,
      z: (Math.random() - 0.5) * ENEMY_JITTER_MAGNITUDE
    }
    enemy.jitter_timer = ENEMY_JITTER_MIN_INTERVAL + Math.random() * ENEMY_JITTER_RANDOM_INTERVAL
  }

  enemy.velocity = vec3.add(enemy.velocity, vec3.scale(enemy.jitter, dt))

  // Damping
  enemy.velocity = vec3.scale(enemy.velocity, ENEMY_VELOCITY_DAMPING)

  enemy.position = vec3.add(enemy.position, vec3.scale(enemy.velocity, dt))
}

function applyRetreatingMovement(enemy, dt) {
  const to_center = vec3.scale(enemy.position, -1)
  const dist = vec3.length(to_center)

  if (dist < 5) {
    enemy.alive = false
    return
  }

  const dir = vec3.normalize(to_center)
  enemy.velocity = vec3.scale(dir, ENEMY_RETREAT_VELOCITY)
  enemy.position = vec3.add(enemy.position, vec3.scale(enemy.velocity, dt))
}

export function updateEnemies(dt, player, game_over, round_won, speed_multiplier) {
  for (const enemy of enemies) {
    if (!enemy.alive) continue

    if (game_over || round_won) {
      enemy.retreating = true
      enemy.spawning = false
      enemy.lingering = false
      enemy.chasing = false
    }

    if (enemy.spawning) {
      applySpawnMovement(enemy, dt)
    } else if (enemy.lingering) {
      applyLingeringMovement(enemy, dt)
    } else if (enemy.chasing) {
      applyChasingMovement(enemy, dt, player, speed_multiplier)
    } else if (enemy.retreating) {
      applyRetreatingMovement(enemy, dt)
    }
  }
}
