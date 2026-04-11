import { world_transform } from './camera.js'
import { draw_circle, draw_line } from './renderer.js'
import { ALPHA_FADE_MULTIPLIER,
  BASIC_EXPLOSION_COLOR,
  BASIC_EXPLOSION_SEGMENTS,
  CASTLE_EXPLOSION_DEBRIS_COUNT,
  CASTLE_EXPLOSION_DEBRIS_SCALE,
  CASTLE_EXPLOSION_INITIAL_SIZE,
  CASTLE_EXPLOSION_LIFE,
  CASTLE_EXPLOSION_MAX_SIZE,
  CASTLE_EXPLOSION_SPIKES_BASE,
  CASTLE_EXPLOSION_SPIKES_RANDOM,
  CASTLE_INNER_RING_RADIUS,
  CORE_COLOR,
  CORE_SEGMENTS,
  CORE_SIZE_FACTOR,
  DEBRIS_ALPHA_MULTIPLIER,
  DEBRIS_COLOR,
  DEBRIS_DISTANCE_RANDOM,
  DEBRIS_LENGTH_BASE,
  DEBRIS_LENGTH_RANDOM,
  DEBRIS_MIN_DISTANCE_FACTOR,
  MID_ALPHA_MULTIPLIER,
  MID_COLOR,
  MID_SEGMENTS,
  MID_SIZE_FACTOR,
  OUTER_ALPHA_MULTIPLIER,
  OUTER_COLOR,
  OUTER_SEGMENTS,
  SHIP_EXPLOSION_DEBRIS_COUNT,
  SHIP_EXPLOSION_DEBRIS_SCALE,
  SHIP_EXPLOSION_INITIAL_SIZE,
  SHIP_EXPLOSION_LIFE,
  SHIP_EXPLOSION_MAX_SIZE,
  SHIP_EXPLOSION_SPIKES_BASE,
  SHIP_EXPLOSION_SPIKES_RANDOM,
  SPIKE_ANGLE_VARIATION,
  SPIKE_COLOR_BASE,
  SPIKE_COLOR_GREEN_RANDOM,
  SPIKE_LENGTH_FACTOR_BASE,
  SPIKE_LENGTH_FACTOR_RANDOM,
  SPIKE_WOBBLE_AMOUNT_BASE,
  SPIKE_WOBBLE_AMOUNT_RANDOM,
  SPIKE_WOBBLE_SPEED_BASE,
  SPIKE_WOBBLE_SPEED_RANDOM } from './constants.js'

// ============================================

export const explosions = []

const castle_explosions = {}
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
    const angle_variation = (Math.random() - 0.5) * SPIKE_ANGLE_VARIATION
    spikes.push({
      angle: base_angle + angle_variation,
      length_factor: SPIKE_LENGTH_FACTOR_BASE + Math.random() * SPIKE_LENGTH_FACTOR_RANDOM,
      wobble_speed: SPIKE_WOBBLE_SPEED_BASE + Math.random() * SPIKE_WOBBLE_SPEED_RANDOM,
      wobble_amount: SPIKE_WOBBLE_AMOUNT_BASE + Math.random() * SPIKE_WOBBLE_AMOUNT_RANDOM
    })
  }

  return {
    x: x,
    y: y,
    size: is_castle ? CASTLE_EXPLOSION_INITIAL_SIZE : SHIP_EXPLOSION_INITIAL_SIZE,
    maxSize: maxSize,
    life: life,
    maxLife: life,
    spikes: spikes,
    rings_destroyed: false,
    inner_ring_radius: CASTLE_INNER_RING_RADIUS,
    is_castle: is_castle
  }
}

export const create_castle_explosion = (x, y, castle_index) => {
  castle_explosions[castle_index] = create_styled_explosion(x, y, CASTLE_EXPLOSION_MAX_SIZE,
    CASTLE_EXPLOSION_LIFE,
    CASTLE_EXPLOSION_SPIKES_BASE,
    CASTLE_EXPLOSION_SPIKES_RANDOM, true)
}

export const create_ship_explosion = (x, y) => {
  styled_explosions.push(create_styled_explosion(x, y, SHIP_EXPLOSION_MAX_SIZE,
    SHIP_EXPLOSION_LIFE,
    SHIP_EXPLOSION_SPIKES_BASE,
    SHIP_EXPLOSION_SPIKES_RANDOM, false))
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
    const start_size = explosion.is_castle ? CASTLE_EXPLOSION_INITIAL_SIZE : SHIP_EXPLOSION_INITIAL_SIZE
    explosion.size = start_size + (explosion.maxSize - start_size) * eased_progress

    if (explosion.life <= 0) {
      styled_explosions.splice(i, 1)
    }
  }

  for (const key of Object.keys(castle_explosions)) {
    const explosion = castle_explosions[key]
    explosion.life -= dt
    const progress = 1 - (explosion.life / explosion.maxLife)
    const eased_progress = 1 - Math.pow(1 - progress, 2)
    explosion.size = CASTLE_EXPLOSION_INITIAL_SIZE + (explosion.maxSize - CASTLE_EXPLOSION_INITIAL_SIZE) * eased_progress
    if (!explosion.rings_destroyed && explosion.size >= explosion.inner_ring_radius) {
      explosion.rings_destroyed = true
    }
    if (explosion.life <= 0) {
      delete castle_explosions[key]
    }
  }
}

const draw_styled_explosion = (explosion, transform) => {
  const time = performance.now() / 1000
  const alpha = Math.min(1.0, explosion.life / explosion.maxLife * ALPHA_FADE_MULTIPLIER)

  const core_size = explosion.size * CORE_SIZE_FACTOR
  draw_circle(explosion.x, explosion.y, core_size,
    CORE_SEGMENTS, transform, [...CORE_COLOR, alpha])

  const mid_size = explosion.size * MID_SIZE_FACTOR
  draw_circle(explosion.x, explosion.y, mid_size,
    MID_SEGMENTS, transform, [...MID_COLOR, alpha * MID_ALPHA_MULTIPLIER])

  draw_circle(explosion.x, explosion.y, explosion.size,
    OUTER_SEGMENTS, transform, [...OUTER_COLOR, alpha * OUTER_ALPHA_MULTIPLIER])

  for (const spike of explosion.spikes) {
    const wobble = Math.sin(time * spike.wobble_speed) * spike.wobble_amount
    const angle = spike.angle + wobble
    const length = explosion.size * spike.length_factor

    const x1 = explosion.x
    const y1 = explosion.y
    const x2 = explosion.x + Math.cos(angle) * length
    const y2 = explosion.y + Math.sin(angle) * length

    const color = [SPIKE_COLOR_BASE[0],
      SPIKE_COLOR_BASE[1] + Math.random() * SPIKE_COLOR_GREEN_RANDOM,
      SPIKE_COLOR_BASE[2], alpha]
    draw_line(x1, y1, x2, y2, transform, color)
  }

  const num_debris = Math.floor((explosion.is_castle ? CASTLE_EXPLOSION_DEBRIS_COUNT : SHIP_EXPLOSION_DEBRIS_COUNT) * alpha)
  const debris_scale = explosion.is_castle ? CASTLE_EXPLOSION_DEBRIS_SCALE : SHIP_EXPLOSION_DEBRIS_SCALE
  for (let i = 0; i < num_debris; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = explosion.size * (DEBRIS_MIN_DISTANCE_FACTOR + Math.random() * DEBRIS_DISTANCE_RANDOM)
    const debris_len = (DEBRIS_LENGTH_BASE + Math.random() * DEBRIS_LENGTH_RANDOM) * debris_scale

    const x1 = explosion.x + Math.cos(angle) * dist
    const y1 = explosion.y + Math.sin(angle) * dist
    const x2 = x1 + Math.cos(angle) * debris_len
    const y2 = y1 + Math.sin(angle) * debris_len

    draw_line(x1, y1, x2, y2, transform, [...DEBRIS_COLOR, alpha * DEBRIS_ALPHA_MULTIPLIER])
  }
}

export const draw_explosions = () => {
  const transform = world_transform()

  for (const explosion of explosions) {
    const alpha = explosion.life / explosion.maxLife
    const color = [...BASIC_EXPLOSION_COLOR, alpha]
    draw_circle(explosion.x, explosion.y, explosion.size, BASIC_EXPLOSION_SEGMENTS, transform, color)
  }

  for (const explosion of styled_explosions) {
    draw_styled_explosion(explosion, transform)
  }

  for (const explosion of Object.values(castle_explosions)) {
    draw_styled_explosion(explosion, transform)
  }
}

export const clear_explosions = () => {
  explosions.length = 0
  styled_explosions.length = 0
  for (const key of Object.keys(castle_explosions)) delete castle_explosions[key]
}

export const is_castle_exploding = (castle_index) =>
  castle_explosions[castle_index] != null

export const are_rings_destroyed_by_explosion = (castle_index) =>
  castle_explosions[castle_index]?.rings_destroyed ?? false
