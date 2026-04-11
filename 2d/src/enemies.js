import { ENEMY_DOCK_ARRIVAL_THRESHOLD,
  ENEMY_DOCK_VELOCITY,
  ENEMY_LINGER_BASE_TIME,
  ENEMY_LINGER_RANDOM_TIME,
  ENEMY_PRIMARY_COLOR,
  ENEMY_RETREAT_VELOCITY,
  ENEMY_RING_CHANGE_CHANCE,
  ENEMY_RING_CHANGE_LINGER_BASE,
  ENEMY_RING_CHANGE_LINGER_RANDOM,
  ENEMY_SECONDARY_COLOR,
  ENEMY_SECONDARY_SIZE_FACTOR,
  ENEMY_SPARK_SIZE,
  ENEMY_SPAWN_VELOCITY,
  ENEMY_VELOCITY_DAMPING,
  WORLD_RADIUS } from './constants.js'
import { update_spark_chase } from './spark_brain.js'
import { get_castle, get_castles, get_castle_rings, ring_spawning } from './castle.js'
import { playSound } from './sound.js'
import { draw_spark } from './renderer.js'
import { world_transform } from './camera.js'


export const enemy_sparks = []

export const spawn_enemy = (castle_index) => {
  const castle = get_castle(castle_index)
  if (!castle || castle.is_destroyed) return
  const castle_rings = get_castle_rings(castle_index)
  const ring_index = Math.floor(Math.random() * castle_rings.length)
  const ring = castle_rings[ring_index]
  const angle = Math.random() * Math.PI * 2
  const target_x = castle.x + Math.cos(angle) * ring.radius
  const target_y = castle.y + Math.sin(angle) * ring.radius

  enemy_sparks.push({
    alive: true,
    spawning: true,
    castle_index,
    size: ENEMY_SPARK_SIZE,
    x: castle.x,
    y: castle.y,
    angle: 0,
    vel_x: 0,
    vel_y: 0,
    jitter_timer: 0,
    jitter_x: 0,
    jitter_y: 0,
    spawn_target_x: target_x,
    spawn_target_y: target_y,
    spawn_ring_index: ring_index,
    spawn_angle: angle,
    linger_timer: ENEMY_LINGER_BASE_TIME
      + Math.random() * ENEMY_LINGER_RANDOM_TIME
  })
}

const apply_spawn_movement = (enemy, dt) => {
  const dx = enemy.spawn_target_x - enemy.x
  const dy = enemy.spawn_target_y - enemy.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance < ENEMY_DOCK_ARRIVAL_THRESHOLD) {
    enemy.spawning = false
    enemy.lingering = true
    enemy.x = enemy.spawn_target_x
    enemy.y = enemy.spawn_target_y
    enemy.vel_x = 0
    enemy.vel_y = 0
    return true
  }

  enemy.vel_x = (dx / distance) * ENEMY_SPAWN_VELOCITY
  enemy.vel_y = (dy / distance) * ENEMY_SPAWN_VELOCITY
  enemy.x += enemy.vel_x * dt
  enemy.y += enemy.vel_y * dt
  enemy.angle = Math.atan2(enemy.vel_y, enemy.vel_x) + Math.PI / 2
  return true
}

const apply_lingering_movement = (enemy, dt, castle_rings) => {
  const castle = get_castle(enemy.castle_index)
  const ring = castle_rings[enemy.spawn_ring_index]
  enemy.spawn_angle += ring.rotationSpeed * dt
  enemy.x = castle.x + Math.cos(enemy.spawn_angle) * ring.radius
  enemy.y = castle.y + Math.sin(enemy.spawn_angle) * ring.radius
  enemy.angle = enemy.spawn_angle + Math.PI / 2

  enemy.linger_timer -= dt
  if (enemy.linger_timer <= 0) {
    if (Math.random() < ENEMY_RING_CHANGE_CHANCE) {
      enemy.spawn_ring_index = (enemy.spawn_ring_index + 1) % castle_rings.length
      const new_ring = castle_rings[enemy.spawn_ring_index]
      enemy.spawn_angle = Math.random() * Math.PI * 2
      enemy.x = castle.x + Math.cos(enemy.spawn_angle) * new_ring.radius
      enemy.y = castle.y + Math.sin(enemy.spawn_angle) * new_ring.radius
      enemy.linger_timer = ENEMY_RING_CHANGE_LINGER_BASE + Math.random() * ENEMY_RING_CHANGE_LINGER_RANDOM
    } else {
      enemy.lingering = false
    }
  }
  return true
}

const apply_docked_movement = (enemy, dt, castle_rings, player_is_target) => {
  const castle = get_castle(enemy.castle_index)
  const ring = castle_rings[enemy.dock_ring]
  enemy.dock_angle += ring.rotationSpeed * dt
  enemy.x = castle.x + Math.cos(enemy.dock_angle) * ring.radius
  enemy.y = castle.y + Math.sin(enemy.dock_angle) * ring.radius
  enemy.angle = enemy.dock_angle + Math.PI / 2

  if (player_is_target) {
    enemy.docked = false
  }
  return true
}

const choose_dock_ring = (enemy, castle_rings) => {
  if (!enemy.dock_ring && enemy.dock_ring !== 0) {
    enemy.dock_ring = Math.floor(Math.random() * castle_rings.length)
  }
}

const apply_docking_movement = (enemy, dt, castle_rings) => {
  choose_dock_ring(enemy, castle_rings)
  const castle = get_castle(enemy.castle_index)
  const ring = castle_rings[enemy.dock_ring]
  const angle_to_dock = Math.atan2(enemy.y - castle.y, enemy.x - castle.x)

  const segment_angle = (Math.PI * 2) / ring.segments
  const normalized_angle = ((angle_to_dock - ring.rotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)
  const face_index = Math.floor(normalized_angle / segment_angle)

  const face = ring.faces[face_index]
  if (face && face.destroyed) {
    enemy.dock_ring = (enemy.dock_ring + 1) % castle_rings.length
    return true
  }

  const target_x = castle.x + Math.cos(angle_to_dock) * ring.radius
  const target_y = castle.y + Math.sin(angle_to_dock) * ring.radius

  const dx = target_x - enemy.x
  const dy = target_y - enemy.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance < ENEMY_DOCK_ARRIVAL_THRESHOLD) {
    enemy.docked = true
    enemy.dock_angle = angle_to_dock
    enemy.x = target_x
    enemy.y = target_y
    enemy.vel_x = 0
    enemy.vel_y = 0
    return true
  }

  enemy.vel_x = (dx / distance) * ENEMY_DOCK_VELOCITY
  enemy.vel_y = (dy / distance) * ENEMY_DOCK_VELOCITY
  enemy.x += enemy.vel_x * dt
  enemy.y += enemy.vel_y * dt
  enemy.angle = Math.atan2(enemy.vel_y, enemy.vel_x) + Math.PI / 2
  return true
}


const update_enemy = (enemy, index, dt, player, player_is_target, enemy_speed_multiplier) => {
  if (!enemy.alive) return

  const castle = get_castle(enemy.castle_index)
  const castle_rings = get_castle_rings(enemy.castle_index)

  if (castle?.is_destroyed && (enemy.spawning || enemy.lingering || enemy.docked)) {
    enemy.spawning = false
    enemy.lingering = false
    enemy.docked = false
  }

  if (enemy.spawning && apply_spawn_movement(enemy, dt)) return
  if (enemy.lingering && apply_lingering_movement(enemy, dt, castle_rings)) return
  if (enemy.docked && apply_docked_movement(enemy, dt, castle_rings, player_is_target)) return

  if (!player_is_target) {
    apply_docking_movement(enemy, dt, castle_rings)
    return
  }

  update_spark_chase(enemy, index, dt, player, enemy_speed_multiplier)
  enemy.vel_x *= ENEMY_VELOCITY_DAMPING
  enemy.vel_y *= ENEMY_VELOCITY_DAMPING
  enemy.x += enemy.vel_x * dt
  enemy.y += enemy.vel_y * dt
  enemy.angle = Math.atan2(enemy.vel_y, enemy.vel_x) + Math.PI / 2

  const dist_sq = enemy.x * enemy.x + enemy.y * enemy.y
  if (dist_sq >= WORLD_RADIUS * WORLD_RADIUS) {
    const dist = Math.sqrt(dist_sq)
    const nx = enemy.x / dist
    const ny = enemy.y / dist
    const dot = enemy.vel_x * nx + enemy.vel_y * ny
    if (dot > 0) {
      enemy.vel_x -= 2 * dot * nx
      enemy.vel_y -= 2 * dot * ny
    }
    enemy.x = nx * (WORLD_RADIUS - 1)
    enemy.y = ny * (WORLD_RADIUS - 1)
  }
}

const update_enemies = (dt, player, game_over, round_won, enemy_speed_multiplier) => {
  const player_is_target = player.alive && !game_over && !round_won

  for (let index = 0; index < enemy_sparks.length; index += 1) {
    const enemy = enemy_sparks[index]
    update_enemy(enemy, index, dt, player, player_is_target, enemy_speed_multiplier)
  }
}
export default update_enemies

export const clear_enemies = () => {
  enemy_sparks.length = 0
}

export const spawn_enemies = (max_enemies_per_castle, chance = 0.5) => {
  if (ring_spawning()) return
  const living_castles = get_castles().filter(c => !c.is_destroyed)
  for (const castle of living_castles) {
    const castle_index = get_castles().indexOf(castle)
    const castle_enemies = enemy_sparks.filter(e => e.alive && e.castle_index === castle_index).length
    if (castle_enemies >= max_enemies_per_castle) continue
    for (let i = castle_enemies; i < max_enemies_per_castle; i++) {
      if (Math.random() <= chance) {
        spawn_enemy(castle_index)
      }
    }
  }
}

export const retreat_enemies_to_castle = () => {
  for (const enemy of enemy_sparks) {
    const castle = get_castle(enemy.castle_index)
    if (!castle || castle.is_destroyed) continue
    const dx = castle.x - enemy.x
    const dy = castle.y - enemy.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance > 0) {
      enemy.vel_x = (dx / distance) * ENEMY_RETREAT_VELOCITY
      enemy.vel_y = (dy / distance) * ENEMY_RETREAT_VELOCITY
    }
  }
}

export const undock_one_enemy = () => {
  const docked_enemy = enemy_sparks.find(enemy => enemy.docked)
  if (docked_enemy) {
    docked_enemy.docked = false
    docked_enemy.dock_ring = null
  }
}

export const destroy_enemy = (enemy) => {
  enemy.alive = false
  playSound('enemy_explode')
}

export const remove_destroyed_enemies = () => {
  for (let k = enemy_sparks.length - 1; k >= 0; k--) {
    if (!enemy_sparks[k].alive) {
      enemy_sparks.splice(k, 1)
    }
  }
}

export const draw_enemy_sparks = () => {
  const transform = world_transform()
  for (const enemy of enemy_sparks) {
    if (enemy.alive) {
      draw_spark({
        x: enemy.x,
        y: enemy.y,
        angle: enemy.angle,
        size: enemy.size,
        transform,
        color: ENEMY_PRIMARY_COLOR
      })
      let angle_mod = Math.random() - 0.5
      draw_spark({
        x: enemy.x,
        y: enemy.y,
        angle: enemy.angle + angle_mod,
        size: enemy.size * ENEMY_SECONDARY_SIZE_FACTOR,
        transform,
        color: ENEMY_SECONDARY_COLOR
      })
    }
  }
}
