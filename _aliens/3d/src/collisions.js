// Collision detection - 3D version

import { vec3 } from './math3d.js'
import {
  CASTLE_CORE_HIT_RADIUS,
  TORPEDO_RING_HIT_DISTANCE,
  TORPEDO_ENEMY_HIT_BUFFER,
  ENEMY_SPARK_SIZE
} from './constants.js'
import { torpedoes } from './torpedoes.js'
import { castle, destroyCastle } from './castle.js'
import { enemies } from './enemies.js'
import { player, destroyPlayer } from './player.js'
import { createExplosion } from './explosions.js'

export function checkCollisions(gameState) {
  if (gameState.game_over || gameState.round_won) return

  // Torpedo vs Castle Rings
  for (const torpedo of torpedoes) {
    if (!torpedo.alive) continue

    for (const ring of castle.rings) {
      if (ring.respawn_timer > 0) continue

      const dist_to_center = Math.sqrt(
        torpedo.position.x * torpedo.position.x +
        torpedo.position.z * torpedo.position.z
      )

      const ring_radius = ring.spawn_radius < ring.radius ? ring.spawn_radius : ring.radius

      if (Math.abs(dist_to_center - ring_radius) < TORPEDO_RING_HIT_DISTANCE) {
        // Check which segment
        const angle = Math.atan2(torpedo.position.z, torpedo.position.x)
        let rel_angle = angle - ring.rotation

        while (rel_angle < 0) rel_angle += Math.PI * 2
        while (rel_angle >= Math.PI * 2) rel_angle -= Math.PI * 2

        const segment_angle = (Math.PI * 2) / ring.segments
        const face_index = Math.floor(rel_angle / segment_angle)
        const face = ring.faces[face_index]

        if (face && !face.destroyed) {
          face.destroyed = true
          torpedo.alive = false
          createExplosion(torpedo.position, 15, 0.5, [ring.color[0], ring.color[1], ring.color[2]])
          break
        }
      }
    }
  }

  // Torpedo vs Castle Core
  for (const torpedo of torpedoes) {
    if (!torpedo.alive) continue

    const dist = vec3.length(torpedo.position)
    if (dist < CASTLE_CORE_HIT_RADIUS) {
      torpedo.alive = false
      destroyCastle(gameState)
      createExplosion({ x: 0, y: 0, z: 0 }, 80, 1.8, [1, 0.5, 0])
    }
  }

  // Torpedo vs Enemy
  for (const torpedo of torpedoes) {
    if (!torpedo.alive) continue

    for (const enemy of enemies) {
      if (!enemy.alive) continue

      const dist = vec3.distance(torpedo.position, enemy.position)
      if (dist < (torpedo.size + ENEMY_SPARK_SIZE) / 2 + TORPEDO_ENEMY_HIT_BUFFER) {
        torpedo.alive = false
        enemy.alive = false
        createExplosion(enemy.position, 20, 0.5, [1, 0, 1])
      }
    }
  }

  // Cannon projectile vs Player
  if (castle.cannon_projectile && player.alive) {
    const dist = vec3.distance(castle.cannon_projectile.position, player.ship.position)
    if (dist < player.ship.size) {
      castle.cannon_projectile = null
      destroyPlayer(gameState)
      createExplosion(player.ship.position, 40, 0.8, [1, 1, 1])
    }
  }

  // Enemy vs Player
  if (player.alive) {
    for (const enemy of enemies) {
      if (!enemy.alive) continue

      const dist = vec3.distance(enemy.position, player.ship.position)
      if (dist < (player.ship.size + ENEMY_SPARK_SIZE) / 2) {
        enemy.alive = false
        destroyPlayer(gameState)
        createExplosion(player.ship.position, 40, 0.8, [1, 1, 1])
        break
      }
    }
  }

  // Check if game over
  if (!player.alive && gameState.lives <= 0) {
    gameState.game_over = true
  }
}
