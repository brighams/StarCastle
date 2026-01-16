import { identity_matrix } from './math.js'
import { draw_circle, draw_line } from './renderer.js'

export const explosions = []

export let castle_explosion = null
export const styled_explosions = []

export const create_explosion = (x, y, maxSize, life) => {
  explosions.push({
    x: x,
    y: y,
    size: 0,
    maxSize: maxSize,
    life: life,
    maxLife: life
  })
}

const create_styled_explosion = (x, y, maxSize, life, num_spikes_base, num_spikes_random, is_castle = false) => {
  const num_spikes = num_spikes_base + Math.floor(Math.random() * num_spikes_random)
  const spikes = []

  for (let i = 0; i < num_spikes; i++) {
    const base_angle = (i / num_spikes) * Math.PI * 2
    const angle_variation = (Math.random() - 0.5) * 0.3
    spikes.push({
      angle: base_angle + angle_variation,
      length_factor: 0.6 + Math.random() * 0.8,
      wobble_speed: 2 + Math.random() * 4,
      wobble_amount: 0.1 + Math.random() * 0.2
    })
  }

  return {
    x: x,
    y: y,
    size: is_castle ? 5 : 2,
    maxSize: maxSize,
    life: life,
    maxLife: life,
    spikes: spikes,
    rings_destroyed: false,
    inner_ring_radius: 60,
    is_castle: is_castle
  }
}

export const create_castle_explosion = (x, y) => {
  castle_explosion = create_styled_explosion(x, y, 180, 1.8, 16, 8, true)
}

export const create_ship_explosion = (x, y) => {
  styled_explosions.push(create_styled_explosion(x, y, 45, 0.8, 10, 4, false))
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

  for (let i = styled_explosions.length - 1; i >= 0; i--) {
    const explosion = styled_explosions[i]
    explosion.life -= dt
    const progress = 1 - (explosion.life / explosion.maxLife)
    const eased_progress = 1 - Math.pow(1 - progress, 2)
    const start_size = explosion.is_castle ? 5 : 2
    explosion.size = start_size + (explosion.maxSize - start_size) * eased_progress

    if (explosion.life <= 0) {
      styled_explosions.splice(i, 1)
    }
  }

  if (castle_explosion) {
    castle_explosion.life -= dt
    const progress = 1 - (castle_explosion.life / castle_explosion.maxLife)

    const eased_progress = 1 - Math.pow(1 - progress, 2) // Ease out quad
    castle_explosion.size = 5 + (castle_explosion.maxSize - 5) * eased_progress
    if (!castle_explosion.rings_destroyed && castle_explosion.size >= castle_explosion.inner_ring_radius) {
      castle_explosion.rings_destroyed = true
    }

    if (castle_explosion.life <= 0) {
      castle_explosion = null
    }
  }
}

const draw_styled_explosion = (explosion, transform) => {
  const time = performance.now() / 1000
  const alpha = Math.min(1.0, explosion.life / explosion.maxLife * 2)

  // Inner bright core
  const core_size = explosion.size * 0.3
  draw_circle(explosion.x, explosion.y, core_size, 12, transform, [1.0, 1.0, 1.0, alpha])

  // Middle ring - orange/yellow
  const mid_size = explosion.size * 0.6
  draw_circle(explosion.x, explosion.y, mid_size, 16, transform, [1.0, 0.7, 0.0, alpha * 0.8])

  // Outer ring - red
  draw_circle(explosion.x, explosion.y, explosion.size, 20, transform, [1.0, 0.3, 0.0, alpha * 0.6])

  // Draw random spiky lines (vector style explosion)
  for (const spike of explosion.spikes) {
    const wobble = Math.sin(time * spike.wobble_speed) * spike.wobble_amount
    const angle = spike.angle + wobble
    const length = explosion.size * spike.length_factor

    const x1 = explosion.x
    const y1 = explosion.y
    const x2 = explosion.x + Math.cos(angle) * length
    const y2 = explosion.y + Math.sin(angle) * length

    // Color varies from white/yellow at center to orange/red at tips
    const color = [1.0, 0.5 + Math.random() * 0.3, 0.0, alpha]
    draw_line(x1, y1, x2, y2, transform, color)
  }

  // Add some extra random short debris lines (scaled for explosion size)
  const num_debris = Math.floor((explosion.is_castle ? 12 : 6) * alpha)
  const debris_scale = explosion.is_castle ? 1 : 0.4
  for (let i = 0; i < num_debris; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = explosion.size * (0.4 + Math.random() * 0.5)
    const debris_len = (5 + Math.random() * 15) * debris_scale

    const x1 = explosion.x + Math.cos(angle) * dist
    const y1 = explosion.y + Math.sin(angle) * dist
    const x2 = x1 + Math.cos(angle) * debris_len
    const y2 = y1 + Math.sin(angle) * debris_len

    draw_line(x1, y1, x2, y2, transform, [1.0, 0.8, 0.2, alpha * 0.7])
  }
}

export const draw_explosions = () => {
  const transform = identity_matrix()

  for (const explosion of explosions) {
    const segments = 8
    const alpha = explosion.life / explosion.maxLife
    const color = [1.0, 0.5, 0.0, alpha]
    draw_circle(explosion.x, explosion.y, explosion.size, segments, transform, color)
  }

  for (const explosion of styled_explosions) {
    draw_styled_explosion(explosion, transform)
  }

  if (castle_explosion) {
    draw_styled_explosion(castle_explosion, transform)
  }
}

export const clear_explosions = () => {
  explosions.length = 0
  styled_explosions.length = 0
  castle_explosion = null
}

export const is_castle_exploding = () => {
  return castle_explosion !== null
}

export const are_rings_destroyed_by_explosion = () => {
  return castle_explosion && castle_explosion.rings_destroyed
}
