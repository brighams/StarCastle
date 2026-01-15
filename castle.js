import { CENTER_X, CENTER_Y } from './constants.js'
import { identity_matrix } from './math.js'
import { draw_line, draw_circle } from './renderer.js'
import { playSound } from './sound.js'
import { is_castle_exploding, are_rings_destroyed_by_explosion } from './explosions.js'

export const castle_rings = [
  { radius: 120, segments: 12, rotation: 0, rotationSpeed: 0.5, color: [0.0, 1.0, 0.0, 1.0] },
  { radius: 90, segments: 8, rotation: 0, rotationSpeed: -0.7, color: [0.0, 0.0, 1.0, 1.0] },
  { radius: 60, segments: 6, rotation: 0, rotationSpeed: 1.0, color: [1.0, 1.0, 0.0, 1.0] }
]

export const init_ring_faces = () => {
  castle_rings.forEach(ring => {
    ring.faces = []
    ring.respawn_timer = 0
    for (let i = 0; i < ring.segments; i++) {
      ring.faces.push({
        index: i,
        destroyed: false
      })
    }
  })
}

export const update_castle_rings = (dt) => {
  castle_rings.forEach(ring => {
    ring.rotation += ring.rotationSpeed * dt

    // Check if ring needs respawning
    if (ring.respawn_timer > 0) {
      ring.respawn_timer -= dt
      if (ring.respawn_timer <= 0) {
        // Respawn all faces
        ring.faces.forEach(face => {
          face.destroyed = false
        })
        ring.respawn_timer = 0
      }
    } else {
      // Check if all faces are destroyed
      const all_destroyed = ring.faces.every(face => face.destroyed)
      if (all_destroyed) {
        ring.respawn_timer = 1.0
      }
    }
  })
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

  castle_rings.forEach(ring => {
    const segment_angle = (Math.PI * 2) / ring.segments

    ring.faces.forEach(face => {
      if (face.destroyed) return

      const start_angle = face.index * segment_angle + ring.rotation
      const end_angle = (face.index + 1) * segment_angle + ring.rotation

      const x1 = CENTER_X + Math.cos(start_angle) * ring.radius
      const y1 = CENTER_Y + Math.sin(start_angle) * ring.radius
      const x2 = CENTER_X + Math.cos(end_angle) * ring.radius
      const y2 = CENTER_Y + Math.sin(end_angle) * ring.radius

      draw_line(x1, y1, x2, y2, transform, ring.color)
    })
  })

  draw_circle(CENTER_X, CENTER_Y, 15, 8, transform, [1.0, 0.0, 0.0, 1.0])
}
