// Pure game state management for testability
import {
  ENEMY_STARTING_COUNT,
  ENEMY_STARTING_SPEED_MULTIPLIER,
  PLAYER_STARTING_LIVES,
  RING_STARTING_SPEED_MULTIPLIER
} from './constants.js'

/**
 * Creates a new game state object
 */
export const createGameState = () => ({
  lives: PLAYER_STARTING_LIVES,
  enemy_speed_multiplier: ENEMY_STARTING_SPEED_MULTIPLIER,
  ring_speed_modifier: RING_STARTING_SPEED_MULTIPLIER,
  round: 0,
  score: 0,
  max_enemies: ENEMY_STARTING_COUNT,
  game_over: true,
  game_started: false,
  round_won: false,
  pyrrhic_victory: false,
  autopilot_on: false,
  round_starting: false
})

/**
 * Handles player destruction state transition
 * Returns new game state (immutable)
 */
export const handlePlayerDestruction = (gameState) => {
  return {
    ...gameState,
    lives: gameState.lives - 1
  }
}

/**
 * Checks if game should be over after player destruction
 */
export const shouldGameBeOver = (gameState) => {
  return gameState.lives <= 0
}

/**
 * Handles castle destruction state transition
 * Returns new game state (immutable)
 */
export const handleCastleDestruction = (gameState) => {
  return {
    ...gameState,
    score: gameState.round + 1
  }
}

/**
 * Checks round victory conditions
 * Returns object with roundWon and pyrrhicVictory flags
 */
export const checkRoundVictory = (playerAlive, castleDestroyed) => {
  if (!castleDestroyed) {
    return { roundWon: false, pyrrhicVictory: false }
  }

  return {
    roundWon: true,
    pyrrhicVictory: !playerAlive
  }
}

/**
 * Handles round won state transition
 */
export const handleRoundWon = (gameState, pyrrhicVictory) => {
  return {
    ...gameState,
    round_won: true,
    pyrrhic_victory: pyrrhicVictory,
    lives: gameState.lives + 1
  }
}
