// Collision checking using refactored testable modules
import { get_castle_projectile, get_castle_rings } from './castle.js'
import { player_torpedoes } from './torpedoes.js'
import { enemy_sparks } from './enemies.js'
import { checkAndHandleCollisions } from './collisionHandlers.js'


export const check_collisions = (player, game_state) => {
  const castle_rings = get_castle_rings()
  const cannon_projectile = get_castle_projectile()

  // Use the refactored collision system
  checkAndHandleCollisions(
    player,
    castle_rings,
    player_torpedoes,
    enemy_sparks,
    cannon_projectile,
    game_state
  )
}
