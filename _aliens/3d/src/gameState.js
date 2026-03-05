// Game state management - ported from 2D version

import {
  ENEMY_STARTING_COUNT,
  ENEMY_STARTING_SPEED_MULTIPLIER,
  PLAYER_STARTING_LIVES,
  RING_STARTING_SPEED_MULTIPLIER
} from './constants.js'

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
  round_starting: false
})

export const handlePlayerDestruction = (gameState) => {
  return {
    ...gameState,
    lives: gameState.lives - 1
  }
}

export const shouldGameBeOver = (gameState) => {
  return gameState.lives <= 0
}

export const handleCastleDestruction = (gameState) => {
  return {
    ...gameState,
    score: gameState.round + 1
  }
}

export const checkRoundVictory = (playerAlive, castleDestroyed) => {
  if (!castleDestroyed) {
    return { roundWon: false, pyrrhicVictory: false }
  }

  return {
    roundWon: true,
    pyrrhicVictory: !playerAlive
  }
}

export const handleRoundWon = (gameState, pyrrhicVictory) => {
  return {
    ...gameState,
    round_won: true,
    pyrrhic_victory: pyrrhicVictory,
    lives: gameState.lives + 1
  }
}
