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
import { castle_destroyed, clear_cannon_projectile } from './castle.js'
import { destroy_player } from './player.js'
import {
  circleCircleCollision,
  enemyPlayerCollision,
  playerRingCollision,
  projectilePlayerCollision,
  checkAllTorpedoCollisions
} from './collisionDetection.js'
import { CENTER_X, CENTER_Y } from './constants.js'

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
export const handleTorpedoCastleHit = (torpedo, game_state) => {
  castle_destroyed(game_state)
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
export const handlePlayerCannonHit = (player, game_state) => {
  create_ship_explosion(player.x, player.y)
  clear_cannon_projectile()
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
        handleTorpedoCastleHit(result.torpedo, game_state)
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
export const checkAndHandleCollisions = (player, castle_rings, player_torpedoes, enemy_sparks, cannon_projectile, game_state) => {
  // Check cannon projectile hit player
  if (cannon_projectile && player.alive) {
    if (projectilePlayerCollision(cannon_projectile, player)) {
      handlePlayerCannonHit(player, game_state)
      return // Player destroyed, no need to check other collisions
    }
  }

  // Check and process all torpedo collisions
  const torpedoCollisions = checkAllTorpedoCollisions(player_torpedoes, castle_rings, enemy_sparks)
  processTorpedoCollisions(torpedoCollisions, game_state)

  // Check player hit ring
  for (let ring of castle_rings) {
    if (player.alive) {
      const collision = playerRingCollision(player, ring)
      if (collision.hit) {
        handlePlayerRingHit(player, ring, collision.face, game_state)
        return // Player destroyed
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
}
