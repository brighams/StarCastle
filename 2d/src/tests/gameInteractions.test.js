import { describe, it, expect, beforeEach } from 'vitest'
import {
  createGameState,
  handlePlayerDestruction,
  handleCastleDestruction,
  checkRoundVictory,
  handleRoundWon,
  shouldGameBeOver
} from '../gameState.js'
import {
  circleCircleCollision,
  torpedoCastleCoreCollision,
  enemyPlayerCollision,
  playerRingCollision
} from '../collisionDetection.js'

describe('Game Interactions - Integration Tests', () => {
  let gameState

  beforeEach(() => {
    gameState = createGameState()
    gameState.lives = 3
    gameState.round = 0
    gameState.game_over = false
  })

  describe('Player Death Scenarios', () => {
    it('should handle player death by enemy collision', () => {
      const player = { x: 100, y: 100, size: 12, alive: true }
      const enemy = { x: 105, y: 105, size: 8 }

      const collision = enemyPlayerCollision(enemy, player)
      expect(collision).toBe(true)

      const newState = handlePlayerDestruction(gameState)
      expect(newState.lives).toBe(2)
      expect(shouldGameBeOver(newState)).toBe(false)
    })

    it('should handle player death by cannon projectile', () => {
      const player = { x: 100, y: 100, size: 12, alive: true }
      const projectile = { x: 105, y: 105, size: 5 }

      const collision = circleCircleCollision(
        player.x, player.y, player.size,
        projectile.x, projectile.y, projectile.size
      )
      expect(collision).toBe(true)

      const newState = handlePlayerDestruction(gameState)
      expect(newState.lives).toBe(2)
    })

    it('should handle player death by ring collision', () => {
      const player = { x: 520, y: 400, size: 12, alive: true }
      const ring = {
        radius: 120,
        segments: 12,
        rotation: 0,
        faces: Array(12).fill(null).map((_, i) => ({ index: i, destroyed: false }))
      }

      const collision = playerRingCollision(player, ring)
      expect(collision.hit).toBe(true)

      const newState = handlePlayerDestruction(gameState)
      expect(newState.lives).toBe(2)
    })

    it('should trigger game over when player has no lives left', () => {
      gameState.lives = 1

      const newState = handlePlayerDestruction(gameState)
      expect(newState.lives).toBe(0)
      expect(shouldGameBeOver(newState)).toBe(true)
    })
  })

  describe('Castle Destruction Scenarios', () => {
    it('should handle castle destruction by torpedo', () => {
      const torpedo = { x: 400, y: 400, alive: true }

      const collision = torpedoCastleCoreCollision(torpedo)
      expect(collision).toBe(true)

      const newState = handleCastleDestruction(gameState)
      expect(newState.score).toBe(1) // round 0 + 1
    })

    it('should award correct score based on round number', () => {
      gameState.round = 5

      const newState = handleCastleDestruction(gameState)
      expect(newState.score).toBe(6)
    })
  })

  describe('Victory Scenarios', () => {
    it('should handle normal victory (player alive, castle destroyed)', () => {
      gameState.lives = 2
      const playerAlive = true
      const castleDestroyed = true

      let newState = handleCastleDestruction(gameState)
      const victory = checkRoundVictory(playerAlive, castleDestroyed)

      expect(victory.roundWon).toBe(true)
      expect(victory.pyrrhicVictory).toBe(false)

      newState = handleRoundWon(newState, victory.pyrrhicVictory)
      expect(newState.round_won).toBe(true)
      expect(newState.pyrrhic_victory).toBe(false)
      expect(newState.lives).toBe(3) // Gets bonus life
    })

    it('should handle pyrrhic victory (player dead, castle destroyed)', () => {
      gameState.lives = 1
      let playerAlive = true
      const castleDestroyed = true

      // Player dies
      let newState = handlePlayerDestruction(gameState)
      expect(newState.lives).toBe(0)
      playerAlive = false

      // Castle destroyed (torpedo already in flight)
      newState = handleCastleDestruction(newState)
      const victory = checkRoundVictory(playerAlive, castleDestroyed)

      expect(victory.roundWon).toBe(true)
      expect(victory.pyrrhicVictory).toBe(true)

      newState = handleRoundWon(newState, victory.pyrrhicVictory)
      expect(newState.round_won).toBe(true)
      expect(newState.pyrrhic_victory).toBe(true)
      expect(newState.lives).toBe(1) // Gets bonus life even in pyrrhic victory
    })

    it('should handle simultaneous destruction (player and castle)', () => {
      // This simulates player hitting castle core while also dying
      gameState.lives = 2
      const torpedo = { x: 400, y: 400, alive: true }
      const player = { x: 100, y: 100, size: 12, alive: true }
      const enemy = { x: 105, y: 105, size: 8 }

      // Torpedo hits castle
      const castleHit = torpedoCastleCoreCollision(torpedo)
      expect(castleHit).toBe(true)

      // Enemy hits player in same frame
      const playerHit = enemyPlayerCollision(enemy, player)
      expect(playerHit).toBe(true)

      // Process state changes
      let newState = handlePlayerDestruction(gameState)
      expect(newState.lives).toBe(1)

      newState = handleCastleDestruction(newState)
      expect(newState.score).toBe(1)

      // Check victory (player died, so pyrrhic)
      const victory = checkRoundVictory(false, true)
      expect(victory.roundWon).toBe(true)
      expect(victory.pyrrhicVictory).toBe(true)

      newState = handleRoundWon(newState, victory.pyrrhicVictory)
      expect(newState.lives).toBe(2) // 1 + bonus
    })
  })

  describe('Multi-Round Game Progression', () => {
    it('should track state correctly through multiple rounds', () => {
      // Round 0
      gameState.lives = 3
      gameState.round = 0

      // Castle destroyed, player alive
      let newState = handleCastleDestruction(gameState)
      let victory = checkRoundVictory(true, true)
      newState = handleRoundWon(newState, victory.pyrrhicVictory)

      expect(newState.score).toBe(1)
      expect(newState.lives).toBe(4)
      expect(newState.round_won).toBe(true)
      expect(newState.pyrrhic_victory).toBe(false)

      // Round 1
      newState.round = 1
      newState.round_won = false

      // Player dies twice, then castle destroyed
      newState = handlePlayerDestruction(newState)
      expect(newState.lives).toBe(3)
      newState = handlePlayerDestruction(newState)
      expect(newState.lives).toBe(2)

      newState = handleCastleDestruction(newState)
      victory = checkRoundVictory(false, true)
      newState = handleRoundWon(newState, victory.pyrrhicVictory)

      expect(newState.score).toBe(2)
      expect(newState.lives).toBe(3)
      expect(newState.pyrrhic_victory).toBe(true)

      // Round 2
      newState.round = 2
      newState.round_won = false
      newState.pyrrhic_victory = false

      // Player dies 3 times
      newState = handlePlayerDestruction(newState)
      newState = handlePlayerDestruction(newState)
      newState = handlePlayerDestruction(newState)
      expect(newState.lives).toBe(0)
      expect(shouldGameBeOver(newState)).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle player with negative lives (edge case)', () => {
      gameState.lives = 0
      const newState = handlePlayerDestruction(gameState)
      expect(newState.lives).toBe(-1)
      expect(shouldGameBeOver(newState)).toBe(true)
    })

    it('should handle castle destruction at round 0', () => {
      gameState.round = 0
      const newState = handleCastleDestruction(gameState)
      expect(newState.score).toBe(1)
    })

    it('should give bonus life even when at 0 lives (pyrrhic victory)', () => {
      gameState.lives = 1
      let newState = handlePlayerDestruction(gameState)
      expect(newState.lives).toBe(0)

      newState = handleCastleDestruction(newState)
      newState = handleRoundWon(newState, true)

      expect(newState.lives).toBe(1)
      expect(shouldGameBeOver(newState)).toBe(false)
    })

    it('should handle multiple consecutive player deaths', () => {
      gameState.lives = 5

      let newState = gameState
      for (let i = 0; i < 5; i++) {
        newState = handlePlayerDestruction(newState)
      }

      expect(newState.lives).toBe(0)
      expect(shouldGameBeOver(newState)).toBe(true)
    })
  })

  describe('Critical Game State Transitions', () => {
    it('should correctly transition from playing to game over', () => {
      gameState.lives = 1
      gameState.game_over = false

      const newState = handlePlayerDestruction(gameState)
      const gameOver = shouldGameBeOver(newState)

      expect(newState.lives).toBe(0)
      expect(gameOver).toBe(true)
    })

    it('should correctly transition from playing to round won', () => {
      gameState.lives = 3
      gameState.round_won = false

      let newState = handleCastleDestruction(gameState)
      const victory = checkRoundVictory(true, true)
      newState = handleRoundWon(newState, victory.pyrrhicVictory)

      expect(newState.round_won).toBe(true)
      expect(newState.pyrrhic_victory).toBe(false)
    })

    it('should correctly transition from playing to pyrrhic victory', () => {
      gameState.lives = 2
      gameState.round_won = false

      let newState = handlePlayerDestruction(gameState)
      newState = handleCastleDestruction(newState)
      const victory = checkRoundVictory(false, true)
      newState = handleRoundWon(newState, victory.pyrrhicVictory)

      expect(newState.round_won).toBe(true)
      expect(newState.pyrrhic_victory).toBe(true)
      expect(newState.lives).toBe(2) // 1 after death + 1 bonus
    })
  })
})
