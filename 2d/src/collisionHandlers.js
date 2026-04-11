// Collision event handlers - these coordinate between detection and effects
import {
  ENEMY_EXPLOSION_DURATION,
  ENEMY_EXPLOSION_PARTICLES,
  PLAYER_RING_EXPLOSION_DURATION,
  PLAYER_RING_EXPLOSION_PARTICLES,
  RING_EXPLOSION_DURATION,
  RING_EXPLOSION_PARTICLES
} from './constants.js'
import { create_explosion, create_ship_explosion } from './explosions.js'
import { playSound } from './sound.js'
import { destroy_torpedo } from './torpedoes.js'
import { destroy_enemy, undock_one_enemy } from './enemies.js'
import { castle_destroyed } from './castle.js'
import { destroy_player } from './player.js'
import { destroy_wingman, wingmen } from './wingmen.js'
import {
  circleCircleCollision,
  enemyPlayerCollision,
  playerRingCollision,
  projectilePlayerCollision,
  checkAllTorpedoCollisions
} from './collisionDetection.js'

/**
 * Handles torpedo hitting a ring face
 */
export const handleTorpedoRingHit = (torpedo, ring, face, collisionPoint) => {
  create_explosion(
    collisionPoint.x,
    collisionPoint.y,
    RING_EXPLOSION_PARTICLES,
    RING_EXPLOSION_DURATION
  )
  playSound('ring_explode')
  face.destroyed = true
  destroy_torpedo(torpedo)
  undock_one_enemy()
}

/**
 * Handles torpedo hitting castle core
 */
export const handleTorpedoCastleHit = (torpedo, castle, castle_index, game_state) => {
  castle_destroyed(castle, castle_index, game_state)
  destroy_torpedo(torpedo)
}

/**
 * Handles torpedo hitting enemy
 */
export const handleTorpedoEnemyHit = (torpedo, enemy) => {
  create_explosion(enemy.x, enemy.y, ENEMY_EXPLOSION_PARTICLES, ENEMY_EXPLOSION_DURATION)
  playSound('enemy_explode')
  destroy_torpedo(torpedo)
  destroy_enemy(enemy)
}

/**
 * Handles player hitting ring
 */
export const handlePlayerRingHit = (player, ring, face, game_state) => {
  face.destroyed = true
  playSound('ring_explode')
  create_explosion(player.x, player.y, PLAYER_RING_EXPLOSION_PARTICLES, PLAYER_RING_EXPLOSION_DURATION)
  destroy_player(player, game_state)
}

/**
 * Handles player hit by enemy
 */
export const handlePlayerEnemyHit = (player, enemy, game_state) => {
  create_ship_explosion(player.x, player.y)
  create_explosion(enemy.x, enemy.y, ENEMY_EXPLOSION_PARTICLES, ENEMY_EXPLOSION_DURATION)
  destroy_player(player, game_state)
  destroy_enemy(enemy)
}

/**
 * Handles player hit by cannon projectile
 */
export const handlePlayerCannonHit = (player, castle, game_state) => {
  create_ship_explosion(player.x, player.y)
  castle.cannon_projectile = null
  destroy_player(player, game_state)
}

/**
 * Processes all torpedo collision results
 */
export const processTorpedoCollisions = (collisionResults, game_state) => {
  for (const result of collisionResults) {
    switch (result.type) {
      case 'torpedo-ring':
        handleTorpedoRingHit(result.torpedo, result.ring, result.face, result.collision.midPoint)
        break
      case 'torpedo-castle':
        handleTorpedoCastleHit(result.torpedo, result.castle, result.castle_index, game_state)
        break
      case 'torpedo-enemy':
        handleTorpedoEnemyHit(result.torpedo, result.enemy)
        break
    }
  }
}

/**
 * Main collision check function that coordinates all collision detection
 * This function ties together pure detection with side-effecting handlers
 */
export const checkAndHandleCollisions = (player, castles, player_torpedoes, enemy_sparks, game_state) => {
  // Check cannon projectile hit player
  if (player.alive) {
    for (const castle of castles) {
      if (castle.cannon_projectile && projectilePlayerCollision(castle.cannon_projectile, player)) {
        handlePlayerCannonHit(player, castle, game_state)
        return // Player destroyed, no need to check other collisions
      }
    }
  }

  // Check and process all torpedo collisions
  const torpedoCollisions = checkAllTorpedoCollisions(player_torpedoes, castles, enemy_sparks)
  processTorpedoCollisions(torpedoCollisions, game_state)

  // Check player hit ring
  for (const castle of castles) {
    if (castle.is_destroyed) continue
    for (let ring of castle.rings) {
      if (player.alive) {
        const collision = playerRingCollision(player, ring, castle.x, castle.y)
        if (collision.hit) {
          handlePlayerRingHit(player, ring, collision.face, game_state)
          return // Player destroyed
        }
      }
    }
  }

  // Check enemy spark hit player
  for (let enemy of enemy_sparks) {
    if (player.alive && enemyPlayerCollision(enemy, player)) {
      handlePlayerEnemyHit(player, enemy, game_state)
      break // Player destroyed
    }
  }

  // Check cannon projectile hit wingmen
  for (const wingman of wingmen) {
    if (!wingman.alive) continue
    for (const castle of castles) {
      if (castle.cannon_projectile && projectilePlayerCollision(castle.cannon_projectile, wingman)) {
        castle.cannon_projectile = null
        destroy_wingman(wingman)
        break
      }
    }
  }

  // Check enemy hit wingmen
  for (const wingman of wingmen) {
    if (!wingman.alive) continue
    for (const enemy of enemy_sparks) {
      if (circleCircleCollision(enemy.x, enemy.y, enemy.size, wingman.x, wingman.y, wingman.size)) {
        create_explosion(enemy.x, enemy.y, ENEMY_EXPLOSION_PARTICLES, ENEMY_EXPLOSION_DURATION)
        destroy_wingman(wingman)
        destroy_enemy(enemy)
        break
      }
    }
  }
}
