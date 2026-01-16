import { CENTER_X, CENTER_Y } from './constants.js'
import { identity_matrix } from './math.js'
import { draw_line, draw_spark } from './renderer.js'
import { is_castle_exploding, are_rings_destroyed_by_explosion } from './explosions.js'
import { playSound } from './sound.js'
import { clear_bullets } from './bullets.js'
import { retreat_enemies_to_center } from './enemies.js'
import { create_castle_explosion } from './explosions.js'

// Glow animation state
let glow_time = 0

// Center castle rotation
let center_rotation = 0
const CENTER_ROTATION_SPEED = 0.8 // radians per second

export const castle_rings = [
  { radius: 120, segments: 12, rotation: 0, rotationSpeed: 0.5, color: [0.0, 1.0, 0.0, 1.0] },
  { radius: 90, segments: 8, rotation: 0, rotationSpeed: -0.7, color: [0.0, 0.0, 1.0, 1.0] },
  { radius: 60, segments: 6, rotation: 0, rotationSpeed: 1.0, color: [1.0, 1.0, 0.0, 1.0] }
]

// Cannon state
export const cannon = {
  angle: 0,
  rotation_speed: 2.0, // radians per second
  length: 18 // extends beyond inner castle radius of 15
}

// Cannon projectile
export let cannon_projectile = null

export const clear_cannon_projectile = () => {
  cannon_projectile = null
}

// Called when a bullet hits the castle center
export const castle_destroyed = (game_state) => {
  create_castle_explosion(CENTER_X, CENTER_Y)
  playSound('castle_explode')
  clear_bullets()
  game_state.round_won = true
  game_state.lives += 1
  game_state.enemy_speed_multiplier += 0.1
  retreat_enemies_to_center()
}

const CANNON_SPARK_SIZE = 24 // 3x normal spark size of 8
const CANNON_SPARK_SPEED = 300
const CANNON_SPARK_COLOR = [0.0, 1.0, 1.0, 1.0] // Cyan

// Check if a given angle has a clear path through all rings
const has_clear_shot = (angle) => {
  for (const ring of castle_rings) {
    const segment_angle = (Math.PI * 2) / ring.segments

    // Normalize angle relative to ring rotation
    let rel_angle = angle - ring.rotation
    while (rel_angle < 0) rel_angle += Math.PI * 2
    while (rel_angle >= Math.PI * 2) rel_angle -= Math.PI * 2

    // Find which face this angle would pass through
    const face_index = Math.floor(rel_angle / segment_angle)
    const face = ring.faces[face_index]

    // If this face is NOT destroyed, there's no clear shot
    if (face && !face.destroyed) {
      return false
    }
  }
  return true
}

export const init_ring_faces = () => {
  for (const ring of castle_rings) {
    ring.faces = []
    ring.respawn_timer = 0
    for (let i = 0; i < ring.segments; i++) {
      ring.faces.push({
        index: i,
        destroyed: false
      })
    }
  }
  // Reset cannon angle and projectile
  cannon.angle = 0
  cannon_projectile = null
}

export const update_castle_rings = (dt, player = null) => {
  // Update glow animation
  glow_time += dt

  // Update center castle rotation
  center_rotation += CENTER_ROTATION_SPEED * dt

  for (const ring of castle_rings) {
    ring.rotation += ring.rotationSpeed * dt

    // Check if ring needs respawning
    if (ring.respawn_timer > 0) {
      ring.respawn_timer -= dt
      if (ring.respawn_timer <= 0) {
        // Respawn all faces
        for (const face of ring.faces) {
          face.destroyed = false
        }
        ring.respawn_timer = 0
      }
    } else {
      // Check if all faces are destroyed
      const all_destroyed = ring.faces.every(face => face.destroyed)
      if (all_destroyed) {
        ring.respawn_timer = 1.0
      }
    }
  }

  // Update cannon to track player
  if (player && player.alive) {
    const target_angle = Math.atan2(player.y - CENTER_Y, player.x - CENTER_X)

    // Calculate shortest angle difference
    let angle_diff = target_angle - cannon.angle
    while (angle_diff > Math.PI) angle_diff -= Math.PI * 2
    while (angle_diff < -Math.PI) angle_diff += Math.PI * 2

    // Rotate towards player at limited speed
    const max_rotation = cannon.rotation_speed * dt
    if (Math.abs(angle_diff) < max_rotation) {
      cannon.angle = target_angle
    } else {
      cannon.angle += Math.sign(angle_diff) * max_rotation
    }

    // Try to fire if no projectile exists and we have a clear shot
    if (!cannon_projectile && has_clear_shot(cannon.angle)) {
      // Fire the cannon!
      cannon_projectile = {
        x: CENTER_X + Math.cos(cannon.angle) * cannon.length,
        y: CENTER_Y + Math.sin(cannon.angle) * cannon.length,
        angle: cannon.angle,
        vx: Math.cos(cannon.angle) * CANNON_SPARK_SPEED,
        vy: Math.sin(cannon.angle) * CANNON_SPARK_SPEED,
        size: CANNON_SPARK_SIZE
      }
      playSound('cannon_fire')
    }
  }

  // Update cannon projectile
  if (cannon_projectile) {
    cannon_projectile.x += cannon_projectile.vx * dt
    cannon_projectile.y += cannon_projectile.vy * dt

    // Remove if off screen
    if (cannon_projectile.x < -50 || cannon_projectile.x > 1074 ||
        cannon_projectile.y < -50 || cannon_projectile.y > 1074) {
      cannon_projectile = null
    }
  }
}

export const draw_castle = () => {
  // Don't render castle at all during explosion
  if (is_castle_exploding()) {
    // Once explosion reaches inner ring, all rings are gone
    if (are_rings_destroyed_by_explosion()) {
      return // Don't render anything
    }

    // Render only rings that are outside the explosion radius
    // (This will be handled by the explosion itself - just don't render)
    return
  }

  const transform = identity_matrix()

  // Calculate glow intensity with pulse effect
  const glow_pulse = 0.15 + Math.sin(glow_time * 2.5) * 0.08 // Subtle pulse between 0.07 and 0.23

  for (const ring of castle_rings) {
    const segment_angle = (Math.PI * 2) / ring.segments

    for (const face of ring.faces) {
      if (face.destroyed) continue

      const start_angle = face.index * segment_angle + ring.rotation
      const end_angle = (face.index + 1) * segment_angle + ring.rotation

      const x1 = CENTER_X + Math.cos(start_angle) * ring.radius
      const y1 = CENTER_Y + Math.sin(start_angle) * ring.radius
      const x2 = CENTER_X + Math.cos(end_angle) * ring.radius
      const y2 = CENTER_Y + Math.sin(end_angle) * ring.radius

      // Draw glow layers (outer to inner)
      const glow_color = [ring.color[0], ring.color[1], ring.color[2], glow_pulse * 0.3]
      const glow_color_inner = [ring.color[0], ring.color[1], ring.color[2], glow_pulse * 0.5]

      // Outer glow - offset outward from center
      const mid_angle = (start_angle + end_angle) / 2
      const offset_outer = 4
      const offset_inner = 2

      const ox1_outer = x1 + Math.cos(start_angle) * offset_outer - Math.cos(mid_angle) * offset_outer * 0.3
      const oy1_outer = y1 + Math.sin(start_angle) * offset_outer - Math.sin(mid_angle) * offset_outer * 0.3
      const ox2_outer = x2 + Math.cos(end_angle) * offset_outer - Math.cos(mid_angle) * offset_outer * 0.3
      const oy2_outer = y2 + Math.sin(end_angle) * offset_outer - Math.sin(mid_angle) * offset_outer * 0.3

      draw_line(ox1_outer, oy1_outer, ox2_outer, oy2_outer, transform, glow_color)

      // Inner glow layer
      const ox1_inner = x1 + Math.cos(start_angle) * offset_inner - Math.cos(mid_angle) * offset_inner * 0.3
      const oy1_inner = y1 + Math.sin(start_angle) * offset_inner - Math.sin(mid_angle) * offset_inner * 0.3
      const ox2_inner = x2 + Math.cos(end_angle) * offset_inner - Math.cos(mid_angle) * offset_inner * 0.3
      const oy2_inner = y2 + Math.sin(end_angle) * offset_inner - Math.sin(mid_angle) * offset_inner * 0.3

      draw_line(ox1_inner, oy1_inner, ox2_inner, oy2_inner, transform, glow_color_inner)

      // Main ring segment
      draw_line(x1, y1, x2, y2, transform, ring.color)
    }
  }

  // Draw cannon as a thick line (multiple parallel lines for thickness)
  const cannon_color = [0.5, 0.5, 0.5, 1.0] // Orange
  const cannon_end_x = CENTER_X + Math.cos(cannon.angle) * cannon.length
  const cannon_end_y = CENTER_Y + Math.sin(cannon.angle) * cannon.length

  // Draw multiple offset lines to create thickness
  const thickness = 0.8
  const perp_x = Math.cos(cannon.angle + Math.PI / 2)
  const perp_y = Math.sin(cannon.angle + Math.PI / 2)

  for (let offset = -thickness; offset <= thickness; offset++) {
    draw_line(
      CENTER_X + perp_x * offset,
      CENTER_Y + perp_y * offset,
      cannon_end_x + perp_x * offset,
      cannon_end_y + perp_y * offset,
      transform,
      cannon_color
    )
  }

  // Draw rotating hexagon center
  const hex_color = [1.0, 1.0, 1.0, 1.0]
  const hex_radius = 15
  const num_sides = 6

  for (let i = 0; i < num_sides; i++) {
    const angle1 = center_rotation + (i / num_sides) * Math.PI * 2
    const angle2 = center_rotation + ((i + 1) / num_sides) * Math.PI * 2

    const x1 = CENTER_X + Math.cos(angle1) * hex_radius
    const y1 = CENTER_Y + Math.sin(angle1) * hex_radius
    const x2 = CENTER_X + Math.cos(angle2) * hex_radius
    const y2 = CENTER_Y + Math.sin(angle2) * hex_radius

    draw_line(x1, y1, x2, y2, transform, hex_color)
  }

  // Draw 6-pointed star center with rotation
  // const star_color = [1.0, 0.5, 0.0, 1.0]
  // const outer_radius = 15
  // const inner_radius = 7
  // const num_points = 6

  // for (let i = 0; i < num_points; i++) {
  //   // Outer point
  //   const outer_angle = center_rotation + (i / num_points) * Math.PI * 2
  //   // Inner points between outer points
  //   const inner_angle1 = center_rotation + ((i - 0.5) / num_points) * Math.PI * 2
  //   const inner_angle2 = center_rotation + ((i + 0.5) / num_points) * Math.PI * 2
  //
  //   const outer_x = CENTER_X + Math.cos(outer_angle) * outer_radius
  //   const outer_y = CENTER_Y + Math.sin(outer_angle) * outer_radius
  //   const inner_x1 = CENTER_X + Math.cos(inner_angle1) * inner_radius
  //   const inner_y1 = CENTER_Y + Math.sin(inner_angle1) * inner_radius
  //   const inner_x2 = CENTER_X + Math.cos(inner_angle2) * inner_radius
  //   const inner_y2 = CENTER_Y + Math.sin(inner_angle2) * inner_radius
  //
  //   // Draw lines from inner points to outer point
  //   draw_line(inner_x1, inner_y1, outer_x, outer_y, transform, star_color)
  //   draw_line(outer_x, outer_y, inner_x2, inner_y2, transform, star_color)
  // }

  // Draw cannon projectile
  if (cannon_projectile) {
    draw_spark(
      cannon_projectile.x,
      cannon_projectile.y,
      cannon_projectile.angle,
      cannon_projectile.size,
      transform,
      CANNON_SPARK_COLOR
    )
  }
}
