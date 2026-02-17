// Autopilot AI for StarCastle
// Provides automated gameplay for demo purposes

import { CENTER_X, CENTER_Y, MAX_TORPEDO_COUNT, CANVAS_SIZE } from './constants.js'
import { get_castle_rings, get_castle_projectile } from './castle.js'
import { enemy_sparks } from './enemies.js'
import { player_torpedoes } from './torpedoes.js'

// Centralized autopilot state
const autopilot_state = {
  enabled: false,
  decision_timer: 0,
  current_target: null,
  evasion_mode: false,
  attack_mode: 'castle', // 'castle', 'enemy', or 'core'
  circling_direction: 1, // 1 for clockwise, -1 for counterclockwise
  last_mine_drop: 0
}

const DECISION_INTERVAL = 0.1 // Make decisions every 100ms
const OPTIMAL_DISTANCE = 220 // Optimal torpedo range
const MIN_SAFE_DISTANCE = 140
const MAX_SAFE_DISTANCE = 300
const SCREEN_MARGIN = 100
const MINE_COOLDOWN = 2.0 // Seconds between mine drops

/**
 * Toggle autopilot on/off
 */
export const autopilot_enabled = (enabled, game_state) => {
  autopilot_state.enabled = enabled
  game_state.autopilot_on = enabled
  if (enabled) {
    resetAutopilot()
  }
}

/**
 * Check if autopilot is enabled
 */
export const isAutopilotEnabled = () => autopilot_state.enabled

/**
 * Find nearest threat (enemy or projectile)
 */
const findNearestThreat = (player) => {
  let nearest_threat = null
  let min_distance = Infinity

  // Check cannon projectile
  const cannon_projectile = get_castle_projectile()
  if (cannon_projectile) {
    const dx = cannon_projectile.x - player.x
    const dy = cannon_projectile.y - player.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance < min_distance && distance < 200) {
      min_distance = distance
      nearest_threat = {
        x: cannon_projectile.x,
        y: cannon_projectile.y,
        vx: cannon_projectile.vx,
        vy: cannon_projectile.vy,
        type: 'projectile',
        distance
      }
    }
  }

  // Check enemies
  for (const enemy of enemy_sparks) {
    if (!enemy.docked && !enemy.spawning && !enemy.lingering) {
      const dx = enemy.x - player.x
      const dy = enemy.y - player.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < min_distance && distance < 250) {
        min_distance = distance
        nearest_threat = {
          x: enemy.x,
          y: enemy.y,
          vx: enemy.vel_x || 0,
          vy: enemy.vel_y || 0,
          type: 'enemy',
          distance,
          enemy
        }
      }
    }
  }

  return nearest_threat
}

/**
 * Find best ring segment to shoot
 */
const findBestRingTarget = (player) => {
  const castle_rings = get_castle_rings()
  let best_target = null
  let best_score = -Infinity

  for (const ring of castle_rings) {
    const segment_angle = (Math.PI * 2) / ring.segments

    for (let i = 0; i < ring.faces.length; i++) {
      const face = ring.faces[i]
      if (face.destroyed) continue

      const face_angle = (i + 0.5) * segment_angle + ring.rotation
      const face_x = CENTER_X + Math.cos(face_angle) * ring.radius
      const face_y = CENTER_Y + Math.sin(face_angle) * ring.radius

      const dx = face_x - player.x
      const dy = face_y - player.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const angle_to_face = Math.atan2(dy, dx) - Math.PI / 2

      // Normalize angle difference
      let angle_diff = angle_to_face - player.angle
      while (angle_diff > Math.PI) angle_diff -= Math.PI * 2
      while (angle_diff < -Math.PI) angle_diff += Math.PI * 2

      // Score based on distance and angle alignment
      // Prefer innermost rings (smaller radius = higher priority)
      const ring_priority = (120 - ring.radius) / 120 // Inner rings score higher
      const angle_score = 1 - Math.abs(angle_diff) / Math.PI
      const distance_score = Math.max(0, 1 - distance / 400)
      const score = ring_priority * 2 + angle_score * 1.5 + distance_score * 0.5

      if (score > best_score) {
        best_score = score
        best_target = {
          x: face_x,
          y: face_y,
          angle: angle_to_face,
          distance,
          ring,
          face,
          score
        }
      }
    }
  }

  return best_target
}

/**
 * Find nearest active enemy to shoot
 */
const findNearestEnemy = (player) => {
  let nearest = null
  let min_distance = Infinity

  for (const enemy of enemy_sparks) {
    if (enemy.docked || enemy.spawning) continue

    const dx = enemy.x - player.x
    const dy = enemy.y - player.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < min_distance) {
      min_distance = distance
      const angle = Math.atan2(dy, dx) - Math.PI / 2
      nearest = {
        x: enemy.x,
        y: enemy.y,
        angle,
        distance,
        enemy
      }
    }
  }

  return nearest
}

/**
 * Check if line of fire is clear to castle core
 */
const hasClearShotToCore = (player) => {
  const castle_rings = get_castle_rings()
  const player_angle_to_center = Math.atan2(CENTER_Y - player.y, CENTER_X - player.x)

  for (const ring of castle_rings) {
    const segment_angle = (Math.PI * 2) / ring.segments

    // Check if any intact face blocks the shot
    for (const face of ring.faces) {
      if (face.destroyed) continue

      const face_start_angle = face.index * segment_angle + ring.rotation
      const face_end_angle = (face.index + 1) * segment_angle + ring.rotation

      // Normalize angles
      let normalized_player_angle = player_angle_to_center
      let normalized_start = face_start_angle
      let normalized_end = face_end_angle

      // Check if player's angle falls within this face's arc
      const angle_margin = 0.1
      if (
        (normalized_player_angle >= normalized_start - angle_margin &&
         normalized_player_angle <= normalized_end + angle_margin) ||
        (normalized_player_angle >= normalized_start - angle_margin - Math.PI * 2 &&
         normalized_player_angle <= normalized_end + angle_margin - Math.PI * 2)
      ) {
        return false // Face blocks the shot
      }
    }
  }

  return true // Clear shot
}

/**
 * Calculate safe position to avoid threats
 */
const calculateEvasionVector = (player, threat) => {
  if (!threat) return null

  // Predict where threat will be
  const prediction_time = 0.5
  const future_x = threat.x + (threat.vx || 0) * prediction_time
  const future_y = threat.y + (threat.vy || 0) * prediction_time

  // Vector away from threat
  const away_dx = player.x - future_x
  const away_dy = player.y - future_y
  const away_distance = Math.sqrt(away_dx * away_dx + away_dy * away_dy)

  if (away_distance < 0.1) {
    return { x: 1, y: 0 } // Default direction if on top of threat
  }

  // Also avoid getting too close to center
  const center_dx = player.x - CENTER_X
  const center_dy = player.y - CENTER_Y
  const center_distance = Math.sqrt(center_dx * center_dx + center_dy * center_dy)

  let evade_x = away_dx / away_distance
  let evade_y = away_dy / away_distance

  // If too close to center, add vector away from center
  if (center_distance < MIN_SAFE_DISTANCE) {
    evade_x += center_dx / center_distance * 0.5
    evade_y += center_dy / center_distance * 0.5
  }

  // Normalize
  const evade_distance = Math.sqrt(evade_x * evade_x + evade_y * evade_y)
  return {
    x: evade_x / evade_distance,
    y: evade_y / evade_distance
  }
}

/**
 * Calculate circling vector to orbit the castle
 */
const calculateCirclingVector = (player) => {
  const center_dx = player.x - CENTER_X
  const center_dy = player.y - CENTER_Y
  const center_distance = Math.sqrt(center_dx * center_dx + center_dy * center_dy)

  if (center_distance < 0.1) {
    return { tangent_angle: 0, radial_adjust: 0 }
  }

  // Calculate tangent angle (perpendicular to radius)
  const radial_angle = Math.atan2(center_dy, center_dx)
  const tangent_angle = radial_angle + (Math.PI / 2) * autopilot_state.circling_direction

  // Calculate how much to adjust radially
  const distance_error = center_distance - OPTIMAL_DISTANCE
  const radial_adjust = -distance_error / 100 // Gentle correction

  return { tangent_angle, radial_adjust }
}

/**
 * Check if player is near screen edge
 */
const isNearScreenEdge = (player) => {
  return (
    player.x < SCREEN_MARGIN ||
    player.x > CANVAS_SIZE - SCREEN_MARGIN ||
    player.y < SCREEN_MARGIN ||
    player.y > CANVAS_SIZE - SCREEN_MARGIN
  )
}

/**
 * Calculate vector toward screen center
 */
const calculateScreenCenterVector = (player) => {
  const screen_center_x = CANVAS_SIZE / 2
  const screen_center_y = CANVAS_SIZE / 2
  const dx = screen_center_x - player.x
  const dy = screen_center_y - player.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance < 0.1) {
    return { x: 0, y: 0 }
  }

  return {
    x: dx / distance,
    y: dy / distance,
    angle: Math.atan2(dy, dx) - Math.PI / 2
  }
}

/**
 * Update autopilot decision state
 */
const updateDecisions = (player, game_state) => {
  const threat = findNearestThreat(player)

  // Check for enemies behind (chasing)
  const enemies_chasing = enemy_sparks.filter(enemy => {
    if (enemy.docked || enemy.spawning || enemy.lingering) return false

    const dx = enemy.x - player.x
    const dy = enemy.y - player.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Check if enemy is behind player
    const angle_to_enemy = Math.atan2(dy, dx) - Math.PI / 2
    let angle_diff = angle_to_enemy - player.angle
    while (angle_diff > Math.PI) angle_diff -= Math.PI * 2
    while (angle_diff < -Math.PI) angle_diff += Math.PI * 2

    // Enemy is "behind" if angle difference is > 90 degrees
    return distance < 200 && Math.abs(angle_diff) > Math.PI / 2
  })

  autopilot_state.being_chased = enemies_chasing.length > 0

  // Decide mode based on threats
  if (threat && threat.distance < 150) {
    autopilot_state.evasion_mode = true
    autopilot_state.current_target = null
  } else {
    autopilot_state.evasion_mode = false

    // Decide between attacking enemies or castle
    const active_enemies = enemy_sparks.filter(e => !e.docked && !e.spawning && !e.lingering).length

    if (active_enemies > 3) {
      autopilot_state.attack_mode = 'enemy'
      autopilot_state.current_target = findNearestEnemy(player)
    } else {
      // Focus on castle
      if (hasClearShotToCore(player)) {
        autopilot_state.attack_mode = 'core'
        const dx = CENTER_X - player.x
        const dy = CENTER_Y - player.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx) - Math.PI / 2
        autopilot_state.current_target = {
          x: CENTER_X,
          y: CENTER_Y,
          angle,
          distance,
          type: 'core'
        }
      } else {
        autopilot_state.attack_mode = 'castle'
        autopilot_state.current_target = findBestRingTarget(player)
      }
    }
  }

  // Randomly change circling direction occasionally
  if (Math.random() < 0.01) {
    autopilot_state.circling_direction *= -1
  }
}

/**
 * Generate key presses based on current decisions
 */
const generateKeyPresses = (player, dt) => {
  const keys = {}

  // Handle screen edge avoidance with high priority
  if (isNearScreenEdge(player)) {
    const toward_center = calculateScreenCenterVector(player)
    const desired_angle = toward_center.angle

    let angle_diff = desired_angle - player.angle
    while (angle_diff > Math.PI) angle_diff -= Math.PI * 2
    while (angle_diff < -Math.PI) angle_diff += Math.PI * 2

    if (Math.abs(angle_diff) > 0.1) {
      if (angle_diff > 0) {
        keys.KeyD = true
      } else {
        keys.KeyA = true
      }
    }
    keys.KeyW = true
    return keys
  }

  if (autopilot_state.evasion_mode) {
    // Evasion behavior
    const threat = findNearestThreat(player)
    if (threat) {
      const evade = calculateEvasionVector(player, threat)
      if (evade) {
        // Calculate desired angle
        const desired_angle = Math.atan2(evade.y, evade.x) - Math.PI / 2

        // Rotate toward escape angle
        let angle_diff = desired_angle - player.angle
        while (angle_diff > Math.PI) angle_diff -= Math.PI * 2
        while (angle_diff < -Math.PI) angle_diff += Math.PI * 2

        if (Math.abs(angle_diff) > 0.1) {
          if (angle_diff > 0) {
            keys.KeyD = true
          } else {
            keys.KeyA = true
          }
        }

        // Thrust away
        keys.KeyW = true

        // Drop mine if being chased closely
        if (autopilot_state.being_chased &&
            autopilot_state.last_mine_drop > MINE_COOLDOWN) {
          keys.KeyR = true
          autopilot_state.last_mine_drop = 0
        }
      }
    }
  } else if (autopilot_state.current_target) {
    // Attack behavior with circling
    const center_dx = player.x - CENTER_X
    const center_dy = player.y - CENTER_Y
    const center_distance = Math.sqrt(center_dx * center_dx + center_dy * center_dy)

    // Calculate target angle with circling component
    const dx = autopilot_state.current_target.x - player.x
    const dy = autopilot_state.current_target.y - player.y
    const angle_to_target = Math.atan2(dy, dx) - Math.PI / 2

    // Get circling vector
    const circling = calculateCirclingVector(player)

    // Blend target angle with circling angle based on distance from optimal
    const distance_factor = Math.abs(center_distance - OPTIMAL_DISTANCE) / 100
    const blend_factor = Math.min(distance_factor, 0.7)

    let desired_angle = angle_to_target

    // If at good distance, add circling component
    if (center_distance > MIN_SAFE_DISTANCE && center_distance < MAX_SAFE_DISTANCE) {
      desired_angle = angle_to_target * (1 - blend_factor * 0.5) +
                     circling.tangent_angle * (blend_factor * 0.5)
    }

    // Calculate angle difference
    let angle_diff = desired_angle - player.angle
    while (angle_diff > Math.PI) angle_diff -= Math.PI * 2
    while (angle_diff < -Math.PI) angle_diff += Math.PI * 2

    // Rotate toward desired angle
    const aim_threshold = 0.15
    if (Math.abs(angle_diff) > aim_threshold) {
      if (angle_diff > 0) {
        keys.KeyD = true
      } else {
        keys.KeyA = true
      }
    }

    // Maintain optimal torpedo range through circling
    if (center_distance < MIN_SAFE_DISTANCE) {
      // Too close, back away while circling
      const angle_away_from_center = Math.atan2(center_dy, center_dx) - Math.PI / 2
      let away_diff = angle_away_from_center - player.angle
      while (away_diff > Math.PI) away_diff -= Math.PI * 2
      while (away_diff < -Math.PI) away_diff += Math.PI * 2

      if (Math.abs(away_diff) < Math.PI / 3) {
        keys.KeyW = true
      }
    } else if (center_distance > MAX_SAFE_DISTANCE) {
      // Too far, move closer
      const angle_toward_center = Math.atan2(-center_dy, -center_dx) - Math.PI / 2
      let toward_diff = angle_toward_center - player.angle
      while (toward_diff > Math.PI) toward_diff -= Math.PI * 2
      while (toward_diff < -Math.PI) toward_diff += Math.PI * 2

      if (Math.abs(toward_diff) < Math.PI / 3) {
        keys.KeyW = true
      }
    } else {
      // At good range, maintain circling speed
      keys.KeyW = true
    }

    // Fire when aimed at target
    if (Math.abs(angle_diff) < aim_threshold) {
      const alive_torpedoes = player_torpedoes.filter(t => t.alive).length
      if (alive_torpedoes < MAX_TORPEDO_COUNT && player.fire_cooldown <= 0) {
        keys.Space = true
      }
    }

    // Drop mine if being chased
    if (autopilot_state.being_chased &&
        autopilot_state.last_mine_drop > MINE_COOLDOWN) {
      keys.KeyR = true
      autopilot_state.last_mine_drop = 0
    }
  } else {
    // No target, maintain circling orbit
    const center_dx = player.x - CENTER_X
    const center_dy = player.y - CENTER_Y
    const center_distance = Math.sqrt(center_dx * center_dx + center_dy * center_dy)

    const circling = calculateCirclingVector(player)
    let angle_diff = circling.tangent_angle - player.angle
    while (angle_diff > Math.PI) angle_diff -= Math.PI * 2
    while (angle_diff < -Math.PI) angle_diff += Math.PI * 2

    if (Math.abs(angle_diff) > 0.2) {
      if (angle_diff > 0) {
        keys.KeyD = true
      } else {
        keys.KeyA = true
      }
    }

    if (center_distance < MIN_SAFE_DISTANCE || center_distance > MAX_SAFE_DISTANCE) {
      keys.KeyW = true
    }
  }

  // Update mine drop timer
  autopilot_state.last_mine_drop += dt

  return keys
}

/**
 * Main autopilot update function
 */
export const update_autopilot = (player, game_state, dt) => {
  if (!autopilot_state.enabled || !player.alive || game_state.game_over) {
    return {}
  }

  autopilot_state.decision_timer -= dt
  if (autopilot_state.decision_timer <= 0) {
    autopilot_state.decision_timer = DECISION_INTERVAL
    updateDecisions(player, game_state)
  }

  return generateKeyPresses(player, dt)
}

/**
 * Reset autopilot state
 */
const resetAutopilot = () => {
  autopilot_state.current_target = null
  autopilot_state.evasion_mode = false
  autopilot_state.attack_mode = 'castle'
  autopilot_state.decision_timer = 0
  autopilot_state.circling_direction = Math.random() > 0.5 ? 1 : -1
  autopilot_state.being_chased = false
  autopilot_state.last_mine_drop = MINE_COOLDOWN // Can drop mine immediately
}
