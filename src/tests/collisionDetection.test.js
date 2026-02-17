import { describe, it, expect } from 'vitest'
import {
  circlePointCollision,
  circleCircleCollision,
  torpedoRingCollision,
  torpedoCastleCoreCollision,
  torpedoEnemyCollision,
  projectilePlayerCollision,
  playerRingCollision,
  enemyPlayerCollision,
  getRingSegmentPoints,
  checkAllTorpedoCollisions
} from '../collisionDetection.js'

describe('Collision Detection', () => {
  describe('circlePointCollision', () => {
    it('should detect collision when point is inside circle', () => {
      const result = circlePointCollision(10, 10, 0, 0, 15)
      expect(result).toBe(true)
    })

    it('should not detect collision when point is outside circle', () => {
      const result = circlePointCollision(20, 20, 0, 0, 10)
      expect(result).toBe(false)
    })

    it('should detect collision at exact radius boundary', () => {
      const result = circlePointCollision(10, 0, 0, 0, 10)
      expect(result).toBe(false) // Just at boundary, not inside
    })

    it('should handle center collision', () => {
      const result = circlePointCollision(0, 0, 0, 0, 10)
      expect(result).toBe(true)
    })
  })

  describe('circleCircleCollision', () => {
    it('should detect collision when circles overlap', () => {
      const result = circleCircleCollision(0, 0, 10, 5, 5, 10)
      expect(result).toBe(true)
    })

    it('should not detect collision when circles are apart', () => {
      const result = circleCircleCollision(0, 0, 5, 20, 20, 5)
      expect(result).toBe(false)
    })

    it('should detect collision when circles touch exactly', () => {
      const result = circleCircleCollision(0, 0, 5, 10, 0, 5)
      expect(result).toBe(false) // Just touching, not overlapping
    })

    it('should detect collision when one circle contains another', () => {
      const result = circleCircleCollision(0, 0, 20, 5, 5, 5)
      expect(result).toBe(true)
    })
  })

  describe('torpedoRingCollision', () => {
    it('should detect collision when torpedo hits ring segment', () => {
      const torpedo = { x: 50, y: 50 }
      const ringSegment = { x1: 40, y1: 50, x2: 60, y2: 50 }
      const result = torpedoRingCollision(torpedo, ringSegment)
      expect(result.hit).toBe(true)
      expect(result.closestPoint.x).toBeCloseTo(50)
      expect(result.closestPoint.y).toBeCloseTo(50)
    })

    it('should not detect collision when torpedo is far from segment', () => {
      const torpedo = { x: 100, y: 100 }
      const ringSegment = { x1: 40, y1: 50, x2: 60, y2: 50 }
      const result = torpedoRingCollision(torpedo, ringSegment)
      expect(result.hit).toBe(false)
    })

    it('should provide midpoint of segment', () => {
      const torpedo = { x: 50, y: 50 }
      const ringSegment = { x1: 40, y1: 50, x2: 60, y2: 50 }
      const result = torpedoRingCollision(torpedo, ringSegment)
      expect(result.midPoint.x).toBe(50)
      expect(result.midPoint.y).toBe(50)
    })
  })

  describe('torpedoCastleCoreCollision', () => {
    it('should detect collision when torpedo hits castle core', () => {
      // Castle is at CENTER_X, CENTER_Y (400, 400)
      const torpedo = { x: 400, y: 400 }
      const result = torpedoCastleCoreCollision(torpedo)
      expect(result).toBe(true)
    })

    it('should not detect collision when torpedo is outside core', () => {
      const torpedo = { x: 500, y: 500 }
      const result = torpedoCastleCoreCollision(torpedo)
      expect(result).toBe(false)
    })
  })

  describe('torpedoEnemyCollision', () => {
    it('should detect collision when torpedo hits enemy', () => {
      const torpedo = { x: 100, y: 100 }
      const enemy = { x: 105, y: 105, size: 10 }
      const result = torpedoEnemyCollision(torpedo, enemy)
      expect(result).toBe(true)
    })

    it('should not detect collision when torpedo misses enemy', () => {
      const torpedo = { x: 100, y: 100 }
      const enemy = { x: 200, y: 200, size: 10 }
      const result = torpedoEnemyCollision(torpedo, enemy)
      expect(result).toBe(false)
    })
  })

  describe('projectilePlayerCollision', () => {
    it('should detect collision when projectile hits player', () => {
      const projectile = { x: 100, y: 100, size: 5 }
      const player = { x: 105, y: 105, size: 12 }
      const result = projectilePlayerCollision(projectile, player)
      expect(result).toBe(true)
    })

    it('should not detect collision when projectile misses player', () => {
      const projectile = { x: 100, y: 100, size: 5 }
      const player = { x: 200, y: 200, size: 12 }
      const result = projectilePlayerCollision(projectile, player)
      expect(result).toBe(false)
    })
  })

  describe('playerRingCollision', () => {
    it('should detect collision when player hits intact ring face', () => {
      const player = { x: 520, y: 400, size: 12 }
      const ring = {
        radius: 120,
        segments: 12,
        rotation: 0,
        faces: Array(12).fill(null).map((_, i) => ({ index: i, destroyed: false }))
      }
      const result = playerRingCollision(player, ring)
      expect(result.hit).toBe(true)
      expect(result.faceIndex).toBeGreaterThanOrEqual(0)
    })

    it('should not detect collision when player is far from ring', () => {
      const player = { x: 100, y: 100, size: 12 }
      const ring = {
        radius: 120,
        segments: 12,
        rotation: 0,
        faces: Array(12).fill(null).map((_, i) => ({ index: i, destroyed: false }))
      }
      const result = playerRingCollision(player, ring)
      expect(result.hit).toBe(false)
    })

    it('should not detect collision when ring face is already destroyed', () => {
      const player = { x: 520, y: 400, size: 12 }
      const ring = {
        radius: 120,
        segments: 12,
        rotation: 0,
        faces: Array(12).fill(null).map((_, i) => ({ index: i, destroyed: true }))
      }
      const result = playerRingCollision(player, ring)
      expect(result.hit).toBe(false)
    })
  })

  describe('enemyPlayerCollision', () => {
    it('should detect collision when enemy hits player', () => {
      const enemy = { x: 100, y: 100, size: 8 }
      const player = { x: 105, y: 105, size: 12 }
      const result = enemyPlayerCollision(enemy, player)
      expect(result).toBe(true)
    })

    it('should not detect collision when enemy misses player', () => {
      const enemy = { x: 100, y: 100, size: 8 }
      const player = { x: 200, y: 200, size: 12 }
      const result = enemyPlayerCollision(enemy, player)
      expect(result).toBe(false)
    })
  })

  describe('getRingSegmentPoints', () => {
    it('should calculate correct segment endpoints', () => {
      const ring = {
        radius: 100,
        segments: 4,
        rotation: 0
      }
      const result = getRingSegmentPoints(ring, 0)

      // First segment at 0 degrees (right side)
      expect(result.x1).toBeCloseTo(500) // CENTER_X + radius
      expect(result.y1).toBeCloseTo(400) // CENTER_Y
    })

    it('should account for ring rotation', () => {
      const ring = {
        radius: 100,
        segments: 4,
        rotation: Math.PI / 2 // 90 degrees
      }
      const result = getRingSegmentPoints(ring, 0)

      // Rotated 90 degrees, first segment starts at top
      // x1 = CENTER_X + cos(0 + PI/2) * 100 = 400 + cos(PI/2) * 100 = 400 + 0 = 400
      // y1 = CENTER_Y + sin(0 + PI/2) * 100 = 400 + sin(PI/2) * 100 = 400 + 100 = 500
      expect(result.x1).toBeCloseTo(400) // CENTER_X
      expect(result.y1).toBeCloseTo(500) // CENTER_Y + radius (sin(PI/2) = 1)
    })
  })

  describe('checkAllTorpedoCollisions', () => {
    it('should detect torpedo-castle collision', () => {
      const torpedoes = [{ x: 400, y: 400, alive: true }]
      const rings = []
      const enemies = []

      const results = checkAllTorpedoCollisions(torpedoes, rings, enemies)

      expect(results).toHaveLength(1)
      expect(results[0].type).toBe('torpedo-castle')
    })

    it('should detect torpedo-enemy collision', () => {
      const torpedoes = [{ x: 100, y: 100, alive: true }]
      const rings = []
      const enemies = [{ x: 105, y: 105, size: 10 }]

      const results = checkAllTorpedoCollisions(torpedoes, rings, enemies)

      expect(results).toHaveLength(1)
      expect(results[0].type).toBe('torpedo-enemy')
      expect(results[0].enemy).toBe(enemies[0])
    })

    it('should detect torpedo-ring collision', () => {
      const torpedoes = [{ x: 520, y: 400, alive: true }]
      const rings = [{
        radius: 120,
        segments: 4,
        rotation: 0,
        faces: [
          { index: 0, destroyed: false },
          { index: 1, destroyed: false },
          { index: 2, destroyed: false },
          { index: 3, destroyed: false }
        ]
      }]
      const enemies = []

      const results = checkAllTorpedoCollisions(torpedoes, rings, enemies)

      expect(results.length).toBeGreaterThan(0)
      expect(results[0].type).toBe('torpedo-ring')
    })

    it('should ignore dead torpedoes', () => {
      const torpedoes = [{ x: 400, y: 400, alive: false }]
      const rings = []
      const enemies = []

      const results = checkAllTorpedoCollisions(torpedoes, rings, enemies)

      expect(results).toHaveLength(0)
    })

    it('should handle multiple collision types in one check', () => {
      const torpedoes = [
        { x: 400, y: 400, alive: true }, // hits castle
        { x: 100, y: 100, alive: true }  // hits enemy
      ]
      const rings = []
      const enemies = [{ x: 105, y: 105, size: 10 }]

      const results = checkAllTorpedoCollisions(torpedoes, rings, enemies)

      expect(results).toHaveLength(2)
      expect(results.some(r => r.type === 'torpedo-castle')).toBe(true)
      expect(results.some(r => r.type === 'torpedo-enemy')).toBe(true)
    })
  })
})
