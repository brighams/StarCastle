import { CENTER_X, CENTER_Y } from './constants.js'
import { cannon_projectile, castle_rings, clear_cannon_projectile } from './castle.js'
import { destroy_torpedo, player_torpedoes } from './torpedoes.js'
import { destroy_enemy, enemies, undock_one_enemy } from './enemies.js'
import { create_explosion, create_ship_explosion } from './explosions.js'
import { playSound } from './sound.js'
import { destroy_player } from './player.js'


export const check_collisions = (player, game_state) => {
  const player_center_dx = player.x - CENTER_X
  const player_center_dy = player.y - CENTER_Y
  const player_center_distance = Math.sqrt(player_center_dx * player_center_dx + player_center_dy * player_center_dy)

  // ========== CHECK CANNON PROJECTILE HIT PLAYER
  if (cannon_projectile && player.alive) {
    const dx = player.x - cannon_projectile.x
    const dy = player.y - cannon_projectile.y
    const distance_from_projectile = Math.sqrt(dx * dx + dy * dy)

    if (distance_from_projectile < player.size + cannon_projectile.size) {
      create_ship_explosion(player.x, player.y)
      clear_cannon_projectile()
      destroy_player(player, game_state)
      return
    }
  }

  // ======== CHECK TORPEDO HIT RING

  for (const torpedo of player_torpedoes) {
    if (!torpedo.alive) continue  // Skip dead torpedoes

    let torpedo_hit = false

    for (const ring of castle_rings) {
      if (torpedo_hit) break
      const segment_angle = (Math.PI * 2) / ring.segments

      // ======== CHECK EACH RING
      for (let face of ring.faces) {
        if (face.destroyed || face.respawn_timer > 0) continue

        const start_angle = face.index * segment_angle + ring.rotation
        const end_angle = (face.index + 1) * segment_angle + ring.rotation

        const x1 = CENTER_X + Math.cos(start_angle) * ring.radius
        const y1 = CENTER_Y + Math.sin(start_angle) * ring.radius
        const x2 = CENTER_X + Math.cos(end_angle) * ring.radius
        const y2 = CENTER_Y + Math.sin(end_angle) * ring.radius

        const line_dx = x2 - x1
        const line_dy = y2 - y1
        const line_length_sq = line_dx * line_dx + line_dy * line_dy

        let projected_line_position = Math.max(0, Math.min(1, ((torpedo.x - x1) * line_dx + (torpedo.y - y1) * line_dy) / line_length_sq))
        const closest_x = x1 + projected_line_position * line_dx
        const closest_y = y1 + projected_line_position * line_dy

        const dist_x = torpedo.x - closest_x
        const dist_y = torpedo.y - closest_y
        const distance = Math.sqrt(dist_x * dist_x + dist_y * dist_y)

        if (distance < 8) {
          const mid_x = (x1 + x2) / 2
          const mid_y = (y1 + y2) / 2
          create_explosion(mid_x, mid_y, 15, 0.5)
          playSound('ring_explode')

          face.destroyed = true
          destroy_torpedo(torpedo)
          torpedo_hit = true
          undock_one_enemy()
          break
        }
      }
    }
  }

  for (const torpedo of player_torpedoes) {
    if (!torpedo.alive) continue  // Skip dead torpedoes

    // ========== CHECK TORPEDO HIT CASTLE CORE
    if (player.alive && player_center_distance < 15 + player.size) {
      create_ship_explosion(player.x, player.y)
      destroy_player(player, game_state)
      continue
    }

    // ========== CHECK TORPEDO HIT ENEMY SPARK
    for (const enemy of enemies) {
      const dx = torpedo.x - enemy.x
      const dy = torpedo.y - enemy.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < enemy.size + 2) {
        create_explosion(enemy.x, enemy.y, 20, 0.5)
        playSound('enemy_explode')
        destroy_torpedo(torpedo)
        destroy_enemy(enemy)
        break
      }
    }
  }

  // =========== CHECK PLAYER HIT RING
  for (let ring of castle_rings) {
    if (player.alive && Math.abs(player_center_distance - ring.radius) < player.size) {
      const segment_angle = (Math.PI * 2) / ring.segments
      const player_angle_from_center = Math.atan2(player.y - CENTER_Y, player.x - CENTER_X)
      const normalized_angle = ((player_angle_from_center - ring.rotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)
      const face_index = Math.floor(normalized_angle / segment_angle)

      const face = ring.faces[face_index]
      if (face && !face.destroyed) {
        face.destroyed = true
        playSound('ring_explode')
        create_explosion(player.x, player.y, 25, 0.8)
        destroy_player(player, game_state)
        return
      }
    }
  }

  // =========== CHECK ENEMY SPARK HIT PLAYER
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i]
    const dx = player.x - enemy.x
    const dy = player.y - enemy.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (player.alive && distance < player.size + enemy.size) {
      create_ship_explosion(player.x, player.y)
      create_explosion(enemy.x, enemy.y, 20, 0.5)
      destroy_player(player, game_state)
      destroy_enemy(enemy)
      break
    }
  }
}
