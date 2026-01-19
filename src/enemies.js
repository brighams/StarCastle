import { CENTER_X, CENTER_Y } from './constants.js'
import { castle_rings, ring_spawning } from './castle.js'
import { playSound } from './sound.js'
import { draw_spark } from './renderer.js'
import { identity_matrix } from './math.js'


export const enemy_sparks = []

const ENEMY_SPARK_SIZE = 10
const ENEMY_SEEK_LIMIT = 180

export const spawn_enemy = () => {
  const ring_index = Math.floor(Math.random() * castle_rings.length)
  const ring = castle_rings[ring_index]
  const angle = Math.random() * Math.PI * 2
  const target_x = CENTER_X + Math.cos(angle) * ring.radius
  const target_y = CENTER_Y + Math.sin(angle) * ring.radius

  enemy_sparks.push({
    alive: true,
    spawning: true,
    size: ENEMY_SPARK_SIZE,
    x: CENTER_X,
    y: CENTER_Y,
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
    linger_timer: 2 + Math.random() * 3
  })
}

export const update_enemies = (dt, player, game_over, round_won, enemy_speed_multiplier) => {
  const player_is_target = player.alive && !game_over && !round_won

  for (let index = 0; index < enemy_sparks.length; index += 1) {
    const enemy = enemy_sparks[index]
    if (!enemy.alive) continue
    if (enemy.spawning) {
      const dx = enemy.spawn_target_x - enemy.x
      const dy = enemy.spawn_target_y - enemy.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < 5) {
        enemy.spawning = false
        enemy.lingering = true
        enemy.x = enemy.spawn_target_x
        enemy.y = enemy.spawn_target_y
        enemy.vel_x = 0
        enemy.vel_y = 0
      } else {
        const spawn_speed = 200
        enemy.vel_x = (dx / distance) * spawn_speed
        enemy.vel_y = (dy / distance) * spawn_speed
        enemy.x += enemy.vel_x * dt
        enemy.y += enemy.vel_y * dt
        enemy.angle = Math.atan2(enemy.vel_y, enemy.vel_x) + Math.PI / 2
      }
      continue
    }

    if (enemy.lingering) {
      const ring = castle_rings[enemy.spawn_ring_index]
      enemy.spawn_angle += ring.rotationSpeed * dt
      enemy.x = CENTER_X + Math.cos(enemy.spawn_angle) * ring.radius
      enemy.y = CENTER_Y + Math.sin(enemy.spawn_angle) * ring.radius
      enemy.angle = enemy.spawn_angle + Math.PI / 2

      enemy.linger_timer -= dt
      if (enemy.linger_timer <= 0) {
        if (Math.random() < 0.30) {
          enemy.spawn_ring_index = (enemy.spawn_ring_index + 1) % castle_rings.length
          const new_ring = castle_rings[enemy.spawn_ring_index]
          enemy.spawn_angle = Math.random() * Math.PI * 2
          enemy.x = CENTER_X + Math.cos(enemy.spawn_angle) * new_ring.radius
          enemy.y = CENTER_Y + Math.sin(enemy.spawn_angle) * new_ring.radius
          enemy.linger_timer = 1 + Math.random() * 2
        } else {
          enemy.lingering = false
        }
      }
      continue
    }

    if (enemy.docked) {
      const ring = castle_rings[enemy.dock_ring]
      enemy.dock_angle += ring.rotationSpeed * dt
      enemy.x = CENTER_X + Math.cos(enemy.dock_angle) * ring.radius
      enemy.y = CENTER_Y + Math.sin(enemy.dock_angle) * ring.radius
      enemy.angle = enemy.dock_angle + Math.PI / 2

      if (player_is_target) {
        enemy.docked = false
      }
      continue
    }

    if (!player_is_target) {
      if (!enemy.dock_ring && enemy.dock_ring !== 0) {
        enemy.dock_ring = Math.floor(Math.random() * castle_rings.length)
      }
      const ring = castle_rings[enemy.dock_ring]
      const angle_to_dock = Math.atan2(enemy.y - CENTER_Y, enemy.x - CENTER_X)

      const segment_angle = (Math.PI * 2) / ring.segments
      const normalized_angle = ((angle_to_dock - ring.rotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)
      const face_index = Math.floor(normalized_angle / segment_angle)

      const face = ring.faces[face_index]

      if (face && face.destroyed) {
        enemy.dock_ring = (enemy.dock_ring + 1) % castle_rings.length
        continue
      }

      const target_x = CENTER_X + Math.cos(angle_to_dock) * ring.radius
      const target_y = CENTER_Y + Math.sin(angle_to_dock) * ring.radius

      const dx = target_x - enemy.x
      const dy = target_y - enemy.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < 5) {
        enemy.docked = true
        enemy.dock_angle = angle_to_dock
        enemy.x = target_x
        enemy.y = target_y
        enemy.vel_x = 0
        enemy.vel_y = 0
      } else {
        enemy.vel_x = (dx / distance) * 100
        enemy.vel_y = (dy / distance) * 100
        enemy.x += enemy.vel_x * dt
        enemy.y += enemy.vel_y * dt
        enemy.angle = Math.atan2(enemy.vel_y, enemy.vel_x) + Math.PI / 2
      }
      continue
    }

    enemy.dock_ring = null
    const dx = player.x - enemy.x
    const dy = player.y - enemy.y
    const distance_to_player = Math.sqrt(dx * dx + dy * dy)

    if (distance_to_player > ENEMY_SEEK_LIMIT) {
      let align_x = 0
      let align_y = 0
      let separate_x = 0
      let separate_y = 0
      let neighbors = 0

      // ====== FLOCKING BEHAVIOR
      for (let other_index = 0; other_index < enemy_sparks.length; other_index++) {
        const other = enemy_sparks[other_index]
        if (index !== other_index && !other.docked) {
          const other_dx = other.x - enemy.x
          const other_dy = other.y - enemy.y
          const other_distance = Math.sqrt(other_dx * other_dx + other_dy * other_dy)

          if (other_distance < 40 && other_distance > 0) {
            separate_x -= other_dx / other_distance
            separate_y -= other_dy / other_distance
          }

          if (other_distance < 100) {
            align_x += other.vel_x
            align_y += other.vel_y
            neighbors++
          }
        }
      }

      if (neighbors > 0) {
        align_x /= neighbors
        align_y /= neighbors
        enemy.vel_x += align_x * dt * 0.5
        enemy.vel_y += align_y * dt * 0.5
      }

      enemy.vel_x += separate_x * dt * 60
      enemy.vel_y += separate_y * dt * 60

      // 40 -> make constant -> it determines how fast the enemy moves when far to the player
      enemy.vel_x += (dx / distance_to_player) * 40 * dt * enemy_speed_multiplier
      enemy.vel_y += (dy / distance_to_player) * 40 * dt * enemy_speed_multiplier

    } else {
      // ============ ENEMY IS CLOSE TO SHIP - MOVE FASTER & DODGE
      enemy.jitter_timer -= dt
      if (enemy.jitter_timer <= 0) {
        enemy.jitter_x = (Math.random() - 0.5) * 160
        enemy.jitter_y = (Math.random() - 0.5) * 160
        enemy.jitter_timer = 0.15 + Math.random() * 0.2
      }

      // 60 -> make constant -> it determines how fast the enemy moves when close to the player
      enemy.vel_x += (dx / distance_to_player) * 60 * dt * enemy_speed_multiplier
      enemy.vel_y += (dy / distance_to_player) * 60 * dt * enemy_speed_multiplier

      // Apply jitter directly to position for visible effect
      enemy.x += enemy.jitter_x * dt
      enemy.y += enemy.jitter_y * dt
    }

    enemy.vel_x *= 0.98
    enemy.vel_y *= 0.98

    enemy.x += enemy.vel_x * dt
    enemy.y += enemy.vel_y * dt

    enemy.angle = Math.atan2(enemy.vel_y, enemy.vel_x) + Math.PI / 2
  }
}

export const clear_enemies = () => {
  enemy_sparks.length = 0
}

export const spawn_enemies = (max_enemies, chance = 0.5) => {
  if (ring_spawning()) return
  const alive_enemies = enemy_sparks.filter(e => e.alive).length
  if (alive_enemies >= max_enemies) return
  for (let i = 0; i < max_enemies && enemy_sparks.length < max_enemies; i++) {
    if (Math.random() <= chance) {
      spawn_enemy()
    }
  }
}

export const retreat_enemies_to_center = () => {
  for (const enemy of enemy_sparks) {
    const enemy_center_dx = CENTER_X - enemy.x
    const enemy_center_dy = CENTER_Y - enemy.y
    const enemy_center_distance = Math.sqrt(enemy_center_dx * enemy_center_dx + enemy_center_dy * enemy_center_dy)
    if (enemy_center_distance > 0) {
      enemy.vel_x = (enemy_center_dx / enemy_center_distance) * 100
      enemy.vel_y = (enemy_center_dy / enemy_center_distance) * 100
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
  const transform = identity_matrix()
  for (const enemy of enemy_sparks) {
    if (enemy.alive) {
      draw_spark({
        x: enemy.x,
        y: enemy.y,
        angle: enemy.angle,
        size: enemy.size,
        transform,
        color: [1.0, 0.0, 1.0, 1.0]
      })
      let angle_mod = Math.random() - 0.5
      draw_spark({
        x: enemy.x,
        y: enemy.y,
        angle: enemy.angle + angle_mod,
        size: enemy.size * 0.75,
        transform,
        color: [1.0, 1.0, 0.0, 0.7]
      })
    }
  }
}
