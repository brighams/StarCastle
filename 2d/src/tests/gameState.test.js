import { describe, it, expect, beforeEach } from 'vitest'
import {
  createGameState,
  handlePlayerDestruction,
  shouldGameBeOver,
  handleCastleDestruction,
  checkRoundVictory,
  handleRoundWon
} from '../gameState.js'

describe('Game State Management', () => {
  let gameState

  beforeEach(() => {
    gameState = createGameState()
  })

  describe('createGameState', () => {
    it('should create initial game state with default values', () => {
      expect(gameState.lives).toBe(4) // PLAYER_STARTING_LIVES
      expect(gameState.round).toBe(0)
      expect(gameState.score).toBe(0)
      expect(gameState.game_over).toBe(true)
      expect(gameState.game_started).toBe(false)
      expect(gameState.round_won).toBe(false)
      expect(gameState.pyrrhic_victory).toBe(false)
    })
  })

  describe('handlePlayerDestruction', () => {
    it('should decrement player lives by 1', () => {
      gameState.lives = 3
      const newState = handlePlayerDestruction(gameState)

      expect(newState.lives).toBe(2)
    })

    it('should not mutate original state (immutable)', () => {
      gameState.lives = 3
      const originalLives = gameState.lives
      const newState = handlePlayerDestruction(gameState)

      expect(gameState.lives).toBe(originalLives)
      expect(newState.lives).not.toBe(originalLives)
    })

    it('should handle going to zero lives', () => {
      gameState.lives = 1
      const newState = handlePlayerDestruction(gameState)

      expect(newState.lives).toBe(0)
    })

    it('should handle negative lives scenario', () => {
      gameState.lives = 0
      const newState = handlePlayerDestruction(gameState)

      expect(newState.lives).toBe(-1)
    })
  })

  describe('shouldGameBeOver', () => {
    it('should return true when lives are zero', () => {
      gameState.lives = 0
      expect(shouldGameBeOver(gameState)).toBe(true)
    })

    it('should return true when lives are negative', () => {
      gameState.lives = -1
      expect(shouldGameBeOver(gameState)).toBe(true)
    })

    it('should return false when player has lives remaining', () => {
      gameState.lives = 1
      expect(shouldGameBeOver(gameState)).toBe(false)
    })

    it('should return false when player has multiple lives', () => {
      gameState.lives = 3
      expect(shouldGameBeOver(gameState)).toBe(false)
    })
  })

  describe('handleCastleDestruction', () => {
    it('should set score to round + 1', () => {
      gameState.round = 0
      const newState = handleCastleDestruction(gameState)

      expect(newState.score).toBe(1)
    })

    it('should calculate score correctly for later rounds', () => {
      gameState.round = 5
      const newState = handleCastleDestruction(gameState)

      expect(newState.score).toBe(6)
    })

    it('should not mutate original state (immutable)', () => {
      gameState.round = 2
      const originalScore = gameState.score
      const newState = handleCastleDestruction(gameState)

      expect(gameState.score).toBe(originalScore)
      expect(newState.score).not.toBe(originalScore)
    })
  })

  describe('checkRoundVictory', () => {
    it('should return round not won when castle not destroyed', () => {
      const result = checkRoundVictory(true, false)

      expect(result.roundWon).toBe(false)
      expect(result.pyrrhicVictory).toBe(false)
    })

    it('should return round won and not pyrrhic when player alive and castle destroyed', () => {
      const result = checkRoundVictory(true, true)

      expect(result.roundWon).toBe(true)
      expect(result.pyrrhicVictory).toBe(false)
    })

    it('should return round won and pyrrhic when player dead and castle destroyed', () => {
      const result = checkRoundVictory(false, true)

      expect(result.roundWon).toBe(true)
      expect(result.pyrrhicVictory).toBe(true)
    })

    it('should return round not won when both player and castle alive', () => {
      const result = checkRoundVictory(true, false)

      expect(result.roundWon).toBe(false)
      expect(result.pyrrhicVictory).toBe(false)
    })
  })

  describe('handleRoundWon', () => {
    it('should set round_won to true', () => {
      const newState = handleRoundWon(gameState, false)

      expect(newState.round_won).toBe(true)
    })

    it('should set pyrrhic_victory flag correctly', () => {
      const newState = handleRoundWon(gameState, true)

      expect(newState.pyrrhic_victory).toBe(true)
    })

    it('should award bonus life', () => {
      gameState.lives = 2
      const newState = handleRoundWon(gameState, false)

      expect(newState.lives).toBe(3)
    })

    it('should award bonus life even in pyrrhic victory', () => {
      gameState.lives = 0
      const newState = handleRoundWon(gameState, true)

      expect(newState.lives).toBe(1)
    })

    it('should not mutate original state (immutable)', () => {
      gameState.lives = 2
      const originalLives = gameState.lives
      const originalRoundWon = gameState.round_won
      const newState = handleRoundWon(gameState, false)

      expect(gameState.lives).toBe(originalLives)
      expect(gameState.round_won).toBe(originalRoundWon)
      expect(newState.lives).not.toBe(originalLives)
      expect(newState.round_won).not.toBe(originalRoundWon)
    })
  })

  describe('Game State Transitions - Integration Scenarios', () => {
    it('should handle player destroyed then game over scenario', () => {
      gameState.lives = 1

      let newState = handlePlayerDestruction(gameState)
      expect(newState.lives).toBe(0)
      expect(shouldGameBeOver(newState)).toBe(true)
    })

    it('should handle player destroyed but game continues', () => {
      gameState.lives = 2

      let newState = handlePlayerDestruction(gameState)
      expect(newState.lives).toBe(1)
      expect(shouldGameBeOver(newState)).toBe(false)
    })

    it('should handle castle destroyed with player alive (normal victory)', () => {
      gameState.round = 0
      gameState.lives = 2

      let newState = handleCastleDestruction(gameState)
      expect(newState.score).toBe(1)

      const victory = checkRoundVictory(true, true)
      expect(victory.roundWon).toBe(true)
      expect(victory.pyrrhicVictory).toBe(false)

      newState = handleRoundWon(newState, victory.pyrrhicVictory)
      expect(newState.round_won).toBe(true)
      expect(newState.pyrrhic_victory).toBe(false)
      expect(newState.lives).toBe(3)
    })

    it('should handle castle destroyed with player dead (pyrrhic victory)', () => {
      gameState.round = 0
      gameState.lives = 1

      // Player gets destroyed first
      let newState = handlePlayerDestruction(gameState)
      expect(newState.lives).toBe(0)

      // Castle also gets destroyed (by torpedo in flight)
      newState = handleCastleDestruction(newState)
      expect(newState.score).toBe(1)

      const victory = checkRoundVictory(false, true)
      expect(victory.roundWon).toBe(true)
      expect(victory.pyrrhicVictory).toBe(true)

      newState = handleRoundWon(newState, victory.pyrrhicVictory)
      expect(newState.round_won).toBe(true)
      expect(newState.pyrrhic_victory).toBe(true)
      expect(newState.lives).toBe(1) // Gets bonus life
    })

    it('should handle multiple player destructions in same round', () => {
      gameState.lives = 3

      let newState = handlePlayerDestruction(gameState)
      expect(newState.lives).toBe(2)

      newState = handlePlayerDestruction(newState)
      expect(newState.lives).toBe(1)

      newState = handlePlayerDestruction(newState)
      expect(newState.lives).toBe(0)
      expect(shouldGameBeOver(newState)).toBe(true)
    })

    it('should handle progression through multiple rounds', () => {
      gameState.lives = 2
      gameState.round = 0

      // Round 1 victory
      let newState = handleCastleDestruction(gameState)
      expect(newState.score).toBe(1)
      newState = handleRoundWon(newState, false)
      expect(newState.lives).toBe(3)

      // Round 2 - player dies then castle destroyed
      newState.round = 1
      newState = handlePlayerDestruction(newState)
      expect(newState.lives).toBe(2)
      newState = handleCastleDestruction(newState)
      expect(newState.score).toBe(2)

      const victory = checkRoundVictory(false, true)
      newState = handleRoundWon(newState, victory.pyrrhicVictory)
      expect(newState.pyrrhic_victory).toBe(true)
      expect(newState.lives).toBe(3) // Gets bonus life
    })
  })
})
