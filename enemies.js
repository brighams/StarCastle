import { CENTER_X, CENTER_Y } from './constants.js'
import { castle_rings } from './castle.js'

export const enemies = []

export const spawn_enemy = () => {
  const ring_index = Math.floor(Math.random() * castle_rings.length)
  const ring = castle_rings[ring_index]
  const angle = Math.random() * Math.PI * 2
  enemies.push({
    x: CENTER_X + Math.cos(angle) * ring.radius,
    y: CENTER_Y + Math.sin(angle) * ring.radius,
    angle: 0,
    vel_x: 0,
    vel_y: 0,
    size: 6,
    jitter_timer: 0,
    jitter_x: 0,
    jitter_y: 0
  })
}

export const update_enemies = (dt, player, game_over, round_won, enemy_speed_multiplier) => {
  const player_is_target = player.alive && !game_over && !round_won

  enemies.forEach((enemy, index) => {
    if (enemy.docked) {
      const ring = castle_rings[enemy.dock_ring]
      enemy.dock_angle += ring.rotationSpeed * dt
      enemy.x = CENTER_X + Math.cos(enemy.dock_angle) * ring.radius
      enemy.y = CENTER_Y + Math.sin(enemy.dock_angle) * ring.radius
      enemy.angle = enemy.dock_angle + Math.PI / 2

      if (player_is_target) {
        enemy.docked = false
      }
      return
    }

    if (!player_is_target) {
      if (!enemy.dock_ring) {
        enemy.dock_ring = Math.floor(Math.random() * castle_rings.length)
      }
      const ring = castle_rings[enemy.dock_ring]
      const angle_to_dock = Math.atan2(enemy.y - CENTER_Y, enemy.x - CENTER_X)
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
      return
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

      enemies.forEach((other, other_index) => {
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
      })

      if (neighbors > 0) {
        align_x /= neighbors
        align_y /= neighbors
        enemy.vel_x += align_x * dt * 0.5
        enemy.vel_y += align_y * dt * 0.5
      }

      enemy.vel_x += separate_x * dt * 60
      enemy.vel_y += separate_y * dt * 60

      enemy.vel_x += (dx / distance_to_player) * 30 * dt
      enemy.vel_y += (dy / distance_to_player) * 30 * dt

    } else {
      enemy.jitter_timer -= dt
      if (enemy.jitter_timer <= 0) {
        enemy.jitter_x = (Math.random() - 0.5) * 30
        enemy.jitter_y = (Math.random() - 0.5) * 30
        enemy.jitter_timer = 0.2 + Math.random() * 0.3
      }

      enemy.vel_x += (dx / distance_to_player) * 80 * dt * enemy_speed_multiplier
      enemy.vel_y += (dy / distance_to_player) * 80 * dt * enemy_speed_multiplier

      enemy.vel_x += enemy.jitter_x * dt
      enemy.vel_y += enemy.jitter_y * dt
    }

    enemy.vel_x *= 0.98
    enemy.vel_y *= 0.98

    enemy.x += enemy.vel_x * dt
    enemy.y += enemy.vel_y * dt

    enemy.angle = Math.atan2(enemy.vel_y, enemy.vel_x) + Math.PI / 2
  })
}

export const clear_enemies = () => {
  enemies.length = 0
}

export const retreat_enemies_to_center = () => {
  enemies.forEach(enemy => {
    const enemy_center_dx = CENTER_X - enemy.x
    const enemy_center_dy = CENTER_Y - enemy.y
    const enemy_center_distance = Math.sqrt(enemy_center_dx * enemy_center_dx + enemy_center_dy * enemy_center_dy)
    if (enemy_center_distance > 0) {
      enemy.vel_x = (enemy_center_dx / enemy_center_distance) * 100
      enemy.vel_y = (enemy_center_dy / enemy_center_distance) * 100
    }
  })
}
