import { CENTER_X, CENTER_Y } from './constants.js'
import { castle_rings } from './castle.js'
import { playSound } from './sound.js'

export const enemies = []

export const spawn_enemy = () => {
  playSound('enemy_spawn')
  const ring_index = Math.floor(Math.random() * castle_rings.length)
  const ring = castle_rings[ring_index]
  const angle = Math.random() * Math.PI * 2
  const target_x = CENTER_X + Math.cos(angle) * ring.radius
  const target_y = CENTER_Y + Math.sin(angle) * ring.radius

  enemies.push({
    x: CENTER_X,
    y: CENTER_Y,
    angle: 0,
    vel_x: 0,
    vel_y: 0,
    size: 8,
    jitter_timer: 0,
    jitter_x: 0,
    jitter_y: 0,
    spawning: true,
    spawn_target_x: target_x,
    spawn_target_y: target_y,
    spawn_ring_index: ring_index,
    spawn_angle: angle,
    linger_timer: 2 + Math.random() * 3
  })
}

export const update_enemies = (dt, player, game_over, round_won, enemy_speed_multiplier) => {
  const player_is_target = player.alive && !game_over && !round_won

  for (let index = 0; index < enemies.length; index++) {
    const enemy = enemies[index]
    // Handle spawning state - move from center to target position
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

    // Handle lingering state - orbit on spawn ring
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

      // Check if the segment at this angle is destroyed
      const segment_angle = (Math.PI * 2) / ring.segments
      const normalized_angle = ((angle_to_dock - ring.rotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)
      const face_index = Math.floor(normalized_angle / segment_angle)
      const face = ring.faces[face_index]

      // If segment is destroyed, pick a different ring or keep moving
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

    if (distance_to_player > 150) {
      let align_x = 0
      let align_y = 0
      let separate_x = 0
      let separate_y = 0
      let neighbors = 0

      for (let other_index = 0; other_index < enemies.length; other_index++) {
        const other = enemies[other_index];
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

      // enemy speed when not close to player
      enemy.vel_x += (dx / distance_to_player) * 20 * dt * enemy_speed_multiplier
      enemy.vel_y += (dy / distance_to_player) * 20 * dt * enemy_speed_multiplier

    } else {
      // getting closer to player, speed up
      enemy.jitter_timer -= dt
      if (enemy.jitter_timer <= 0) {
        enemy.jitter_x = (Math.random() - 0.5) * 50
        enemy.jitter_y = (Math.random() - 0.5) * 50
        enemy.jitter_timer = 0.2 + Math.random() * 0.3
      }

      enemy.vel_x += (dx / distance_to_player) * 30 * dt * enemy_speed_multiplier
      enemy.vel_y += (dy / distance_to_player) * 30 * dt * enemy_speed_multiplier

      enemy.vel_x += enemy.jitter_x * dt
      enemy.vel_y += enemy.jitter_y * dt
    }

    enemy.vel_x *= 0.98
    enemy.vel_y *= 0.98

    enemy.x += enemy.vel_x * dt
    enemy.y += enemy.vel_y * dt

    enemy.angle = Math.atan2(enemy.vel_y, enemy.vel_x) + Math.PI / 2
  }
}

export const clear_enemies = () => {
  enemies.length = 0
}

export const spawn_enemies = (max_enemies) => {
  for (let i = 0; i < max_enemies; i++) {
    if (Math.random() < 0.5) {
      spawn_enemy()
    }
  }
}

export const retreat_enemies_to_center = () => {
   for (const enemy of enemies) {
    const enemy_center_dx = CENTER_X - enemy.x
    const enemy_center_dy = CENTER_Y - enemy.y
    const enemy_center_distance = Math.sqrt(enemy_center_dx * enemy_center_dx + enemy_center_dy * enemy_center_dy)
    if (enemy_center_distance > 0) {
      enemy.vel_x = (enemy_center_dx / enemy_center_distance) * 100
      enemy.vel_y = (enemy_center_dy / enemy_center_distance) * 100
    }
  }
}

// Undock one enemy when a wall is destroyed
export const undock_one_enemy = () => {
  const docked_enemy = enemies.find(enemy => enemy.docked)
  if (docked_enemy) {
    docked_enemy.docked = false
    docked_enemy.dock_ring = null
  }
}
