import { identity_matrix } from './math.js'
import { draw_circle, draw_line } from './renderer.js'

export const explosions = []

// Special castle explosion state
export let castle_explosion = null

export const create_explosion = (x, y, maxSize, life) => {
  explosions.push({
    x: x,
    y: y,
    size: 0,
    maxSize: maxSize,
    life: life
  })
}

// Create a spectacular castle destruction explosion
export const create_castle_explosion = (x, y) => {
  // Generate random spikes for the vector-style explosion
  const num_spikes = 16 + Math.floor(Math.random() * 8) // 16-24 spikes
  const spikes = []

  for (let i = 0; i < num_spikes; i++) {
    const base_angle = (i / num_spikes) * Math.PI * 2
    const angle_variation = (Math.random() - 0.5) * 0.3
    spikes.push({
      angle: base_angle + angle_variation,
      length_factor: 0.6 + Math.random() * 0.8, // Random length between 0.6 and 1.4
      wobble_speed: 2 + Math.random() * 4,
      wobble_amount: 0.1 + Math.random() * 0.2
    })
  }

  castle_explosion = {
    x: x,
    y: y,
    size: 5,
    maxSize: 180, // Larger than inner ring (60 radius)
    life: 1.8, // Lasts at least 1.5 seconds
    maxLife: 1.8,
    spikes: spikes,
    rings_destroyed: false,
    inner_ring_radius: 60 // The innermost ring radius
  }
}

export const update_explosions = (dt) => {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const explosion = explosions[i]
    explosion.life -= dt
    explosion.size = explosion.maxSize * (1 - explosion.life / explosion.maxLife)

    if (explosion.life <= 0) {
      explosions.splice(i, 1)
    }
  }

  // Update castle explosion
  if (castle_explosion) {
    castle_explosion.life -= dt
    const progress = 1 - (castle_explosion.life / castle_explosion.maxLife)

    // Starts small, grows big with easing
    const eased_progress = 1 - Math.pow(1 - progress, 2) // Ease out quad
    castle_explosion.size = 5 + (castle_explosion.maxSize - 5) * eased_progress

    // Check if explosion has reached inner ring radius
    if (!castle_explosion.rings_destroyed && castle_explosion.size >= castle_explosion.inner_ring_radius) {
      castle_explosion.rings_destroyed = true
    }

    if (castle_explosion.life <= 0) {
      castle_explosion = null
    }
  }
}

export const draw_explosions = () => {
  const transform = identity_matrix()

  // Draw regular explosions
  explosions.forEach(explosion => {
    const segments = 8
    const alpha = explosion.life / explosion.maxLife
    const color = [1.0, 0.5, 0.0, alpha]
    draw_circle(explosion.x, explosion.y, explosion.size, segments, transform, color)
  })

  // Draw castle explosion with special vector style
  if (castle_explosion) {
    const time = performance.now() / 1000
    const alpha = Math.min(1.0, castle_explosion.life / castle_explosion.maxLife * 2)

    // Draw multiple expanding rings with different colors
    const progress = 1 - (castle_explosion.life / castle_explosion.maxLife)

    // Inner bright core
    const core_size = castle_explosion.size * 0.3
    draw_circle(castle_explosion.x, castle_explosion.y, core_size, 12, transform, [1.0, 1.0, 1.0, alpha])

    // Middle ring - orange/yellow
    const mid_size = castle_explosion.size * 0.6
    draw_circle(castle_explosion.x, castle_explosion.y, mid_size, 16, transform, [1.0, 0.7, 0.0, alpha * 0.8])

    // Outer ring - red
    draw_circle(castle_explosion.x, castle_explosion.y, castle_explosion.size, 20, transform, [1.0, 0.3, 0.0, alpha * 0.6])

    // Draw random spiky lines (vector style explosion)
    castle_explosion.spikes.forEach(spike => {
      const wobble = Math.sin(time * spike.wobble_speed) * spike.wobble_amount
      const angle = spike.angle + wobble
      const length = castle_explosion.size * spike.length_factor

      const x1 = castle_explosion.x
      const y1 = castle_explosion.y
      const x2 = castle_explosion.x + Math.cos(angle) * length
      const y2 = castle_explosion.y + Math.sin(angle) * length

      // Color varies from white/yellow at center to orange/red at tips
      const color = [1.0, 0.5 + Math.random() * 0.3, 0.0, alpha]
      draw_line(x1, y1, x2, y2, transform, color)
    })

    // Add some extra random short debris lines
    const num_debris = Math.floor(12 * alpha)
    for (let i = 0; i < num_debris; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = castle_explosion.size * (0.4 + Math.random() * 0.5)
      const debris_len = 5 + Math.random() * 15

      const x1 = castle_explosion.x + Math.cos(angle) * dist
      const y1 = castle_explosion.y + Math.sin(angle) * dist
      const x2 = x1 + Math.cos(angle) * debris_len
      const y2 = y1 + Math.sin(angle) * debris_len

      draw_line(x1, y1, x2, y2, transform, [1.0, 0.8, 0.2, alpha * 0.7])
    }
  }
}

export const clear_explosions = () => {
  explosions.length = 0
  castle_explosion = null
}

export const is_castle_exploding = () => {
  return castle_explosion !== null
}

export const are_rings_destroyed_by_explosion = () => {
  return castle_explosion && castle_explosion.rings_destroyed
}
