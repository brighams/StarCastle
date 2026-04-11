// Pure collision detection functions for testability
import {
  CASTLE_CORE_HIT_RADIUS,
  TORPEDO_ENEMY_HIT_BUFFER,
  TORPEDO_RING_HIT_DISTANCE
} from './constants.js'

/**
 * Checks if a point (x, y) collides with a circle at (cx, cy) with radius r
 */
export const circlePointCollision = (x, y, cx, cy, radius) => {
  const dx = x - cx
  const dy = y - cy
  const distance = Math.sqrt(dx * dx + dy * dy)
  return distance < radius
}

/**
 * Checks if two circles collide
 */
export const circleCircleCollision = (x1, y1, r1, x2, y2, r2) => {
  const dx = x1 - x2
  const dy = y1 - y2
  const distance = Math.sqrt(dx * dx + dy * dy)
  return distance < r1 + r2
}

/**
 * Checks if a torpedo hits a ring segment
 * Returns { hit: boolean, closestPoint: {x, y}, distance: number }
 */
export const torpedoRingCollision = (torpedo, ringSegment) => {
  const { x: torpedoX, y: torpedoY } = torpedo
  const { x1, y1, x2, y2 } = ringSegment

  const line_dx = x2 - x1
  const line_dy = y2 - y1
  const line_length_sq = line_dx * line_dx + line_dy * line_dy

  let projected_line_position = Math.max(
    0,
    Math.min(1, ((torpedoX - x1) * line_dx + (torpedoY - y1) * line_dy) / line_length_sq)
  )

  const closest_x = x1 + projected_line_position * line_dx
  const closest_y = y1 + projected_line_position * line_dy

  const dist_x = torpedoX - closest_x
  const dist_y = torpedoY - closest_y
  const distance = Math.sqrt(dist_x * dist_x + dist_y * dist_y)

  return {
    hit: distance < TORPEDO_RING_HIT_DISTANCE,
    closestPoint: { x: closest_x, y: closest_y },
    distance,
    midPoint: { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }
  }
}

/**
 * Checks if a torpedo hits the castle core
 */
export const torpedoCastleCoreCollision = (torpedo) => {
  return circlePointCollision(
    torpedo.x,
    torpedo.y,
    0,
    0,
    CASTLE_CORE_HIT_RADIUS
  )
}

/**
 * Checks if a torpedo hits an enemy
 */
export const torpedoEnemyCollision = (torpedo, enemy) => {
  return circleCircleCollision(
    torpedo.x,
    torpedo.y,
    0, // torpedoes are treated as points
    enemy.x,
    enemy.y,
    enemy.size + TORPEDO_ENEMY_HIT_BUFFER
  )
}

/**
 * Checks if a projectile hits the player
 */
export const projectilePlayerCollision = (projectile, player) => {
  return circleCircleCollision(
    player.x,
    player.y,
    player.size,
    projectile.x,
    projectile.y,
    projectile.size
  )
}

/**
 * Checks if player hits a ring
 * Returns { hit: boolean, faceIndex: number }
 */
export const playerRingCollision = (player, ring, centerX = 0, centerY = 0) => {
  const player_center_dx = player.x - centerX
  const player_center_dy = player.y - centerY
  const player_center_distance = Math.sqrt(
    player_center_dx * player_center_dx + player_center_dy * player_center_dy
  )

  // Check if player is at ring radius
  if (Math.abs(player_center_distance - ring.radius) < player.size) {
    const segment_angle = (Math.PI * 2) / ring.segments
    const player_angle_from_center = Math.atan2(player.y - centerY, player.x - centerX)
    const normalized_angle =
      ((player_angle_from_center - ring.rotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)
    const face_index = Math.floor(normalized_angle / segment_angle)

    const face = ring.faces[face_index]
    if (face && !face.destroyed) {
      return { hit: true, faceIndex: face_index, face }
    }
  }

  return { hit: false, faceIndex: -1, face: null }
}

/**
 * Checks if enemy hits player
 */
export const enemyPlayerCollision = (enemy, player) => {
  return circleCircleCollision(
    player.x,
    player.y,
    player.size,
    enemy.x,
    enemy.y,
    enemy.size
  )
}

/**
 * Gets ring segment endpoints for collision detection
 */
export const getRingSegmentPoints = (ring, faceIndex, centerX = 0, centerY = 0) => {
  const segment_angle = (Math.PI * 2) / ring.segments
  const start_angle = faceIndex * segment_angle + ring.rotation
  const end_angle = (faceIndex + 1) * segment_angle + ring.rotation

  return {
    x1: centerX + Math.cos(start_angle) * ring.radius,
    y1: centerY + Math.sin(start_angle) * ring.radius,
    x2: centerX + Math.cos(end_angle) * ring.radius,
    y2: centerY + Math.sin(end_angle) * ring.radius
  }
}

/**
 * Checks all torpedo collisions and returns collision results
 * This is a pure function that doesn't mutate state
 */
export const checkAllTorpedoCollisions = (torpedoes, rings, enemies, centerX = 0, centerY = 0) => {
  const results = []

  for (const torpedo of torpedoes) {
    if (!torpedo.alive) continue

    // Check ring collisions
    for (const ring of rings) {
      const segment_angle = (Math.PI * 2) / ring.segments

      for (let face of ring.faces) {
        if (face.destroyed || face.respawn_timer > 0) continue

        const segmentPoints = getRingSegmentPoints(ring, face.index, centerX, centerY)
        const collision = torpedoRingCollision(torpedo, segmentPoints)

        if (collision.hit) {
          results.push({
            type: 'torpedo-ring',
            torpedo,
            ring,
            face,
            collision
          })
          break
        }
      }
    }

    // Check castle core collision
    if (torpedoCastleCoreCollision(torpedo)) {
      results.push({
        type: 'torpedo-castle',
        torpedo
      })
    }

    // Check enemy collisions
    for (const enemy of enemies) {
      if (torpedoEnemyCollision(torpedo, enemy)) {
        results.push({
          type: 'torpedo-enemy',
          torpedo,
          enemy
        })
        break
      }
    }
  }

  return results
}
