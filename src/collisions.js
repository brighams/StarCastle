import { CENTER_X, CENTER_Y } from './constants.js'
import { cannon_projectile, castle_destroyed, castle_rings, clear_cannon_projectile } from './castle.js'
import { player_bullets } from './bullets.js'
import { enemies, undock_one_enemy } from './enemies.js'
import { create_explosion, create_ship_explosion } from './explosions.js'
import { playSound } from './sound.js'
import { destroy_player } from './player.js'

export const check_collisions = (player, game_state) => {
  if (cannon_projectile && player.alive) {
    const dx = player.x - cannon_projectile.x
    const dy = player.y - cannon_projectile.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < player.size + cannon_projectile.size) {
      create_ship_explosion(player.x, player.y)
      playSound('player_explode')
      clear_cannon_projectile()
      destroy_player(player, game_state)
      return
    }
  }


  for (let i = player_bullets.length - 1; i >= 0; i--) {
    const bullet = player_bullets[i]
    let bullet_hit = false

    for (let ring of castle_rings) {
      if (bullet_hit) break

      const segment_angle = (Math.PI * 2) / ring.segments

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

        let t = Math.max(0, Math.min(1, ((bullet.x - x1) * line_dx + (bullet.y - y1) * line_dy) / line_length_sq))
        const closest_x = x1 + t * line_dx
        const closest_y = y1 + t * line_dy

        const dist_x = bullet.x - closest_x
        const dist_y = bullet.y - closest_y
        const distance = Math.sqrt(dist_x * dist_x + dist_y * dist_y)

        if (distance < 8) {
          const mid_x = (x1 + x2) / 2
          const mid_y = (y1 + y2) / 2
          create_explosion(mid_x, mid_y, 15, 0.5)
          playSound('ring_explode')

          face.destroyed = true
          player_bullets.splice(i, 1)
          bullet_hit = true


          undock_one_enemy()
          break
        }
      }
    }
  }


  for (let i = player_bullets.length - 1; i >= 0; i--) {
    const bullet = player_bullets[i]

    const bullet_center_dx = bullet.x - CENTER_X
    const bullet_center_dy = bullet.y - CENTER_Y
    const bullet_center_distance = Math.sqrt(bullet_center_dx * bullet_center_dx + bullet_center_dy * bullet_center_dy)

    if (bullet_center_distance < 15 + 2) {
      player_bullets.splice(i, 1)
      castle_destroyed(game_state)
      continue
    }

    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j]
      const dx = bullet.x - enemy.x
      const dy = bullet.y - enemy.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < enemy.size + 2) {
        create_explosion(enemy.x, enemy.y, 20, 0.5)
        playSound('enemy_explode')
        player_bullets.splice(i, 1)
        enemies.splice(j, 1)
        break
      }
    }
  }


  const player_center_dx = player.x - CENTER_X
  const player_center_dy = player.y - CENTER_Y
  const player_center_distance = Math.sqrt(player_center_dx * player_center_dx + player_center_dy * player_center_dy)

  if (player.alive && player_center_distance < 15 + player.size) {
    create_ship_explosion(player.x, player.y)
    playSound('player_explode')
    destroy_player(player, game_state)
    return
  }

  for (let ring of castle_rings) {
    if (player.alive && Math.abs(player_center_distance - ring.radius) < player.size) {
      const segment_angle = (Math.PI * 2) / ring.segments
      const player_angle_from_center = Math.atan2(player.y - CENTER_Y, player.x - CENTER_X)
      const normalized_angle = ((player_angle_from_center - ring.rotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)
      const face_index = Math.floor(normalized_angle / segment_angle)

      const face = ring.faces[face_index]
      if (face && !face.destroyed) {

        face.destroyed = true
        create_explosion(player.x, player.y, 25, 0.8)
        playSound('player_explode')
        playSound('ring_explode')
        destroy_player(player, game_state)
        return
      }
    }
  }


  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i]
    const dx = player.x - enemy.x
    const dy = player.y - enemy.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (player.alive && distance < player.size + enemy.size) {
      create_ship_explosion(player.x, player.y)
      create_explosion(enemy.x, enemy.y, 20, 0.5)
      playSound('player_explode')
      playSound('enemy_explode')
      enemies.splice(i, 1)
      destroy_player(player, game_state)
      break
    }
  }
}
