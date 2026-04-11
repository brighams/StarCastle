// Collision checking using refactored testable modules
import { get_castles } from './castle.js'
import { player_torpedoes } from './torpedoes.js'
import { enemy_sparks } from './enemies.js'
import { checkAndHandleCollisions } from './collisionHandlers.js'


export const check_collisions = (player, game_state) => {
  const castles = get_castles()

  checkAndHandleCollisions(
    player,
    castles,
    player_torpedoes,
    enemy_sparks,
    game_state
  )
}
