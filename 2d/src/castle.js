import { CANNON_COLOR,
  CANNON_COOL_OFF_TIME,
  CANNON_FIRE_WARMUP_TIME,
  CANNON_LENGTH,
  CANNON_PROJECTILE_BOUNDS_MAX,
  CANNON_PROJECTILE_BOUNDS_MIN,
  CANNON_ROTATION_SPEED,
  CANNON_SPARK_COLOR,
  CANNON_SPARK_SIZE,
  CANNON_SPARK_SPEED,
  CANNON_THICKNESS,
  CASTLE_CENTER_ROTATION_SPEED,
  CASTLE_CENTRAL_HEX_COLOR,
  CASTLE_CENTRAL_HEX_RADIUS,
  CASTLE_CENTRAL_HEX_SIDES,
  CASTLE_DESTROYED_CHECK_DELAY,
  CASTLE_INNER_RING_RADIUS,
  CENTER_X,
  CENTER_Y,
  ENEMY_SPEED_INCREASE_PER_ROUND,
  RING_GLOW_BASE,
  RING_GLOW_INNER_ALPHA,
  RING_GLOW_OFFSET_FACTOR,
  RING_GLOW_OFFSET_INNER,
  RING_GLOW_OFFSET_OUTER,
  RING_GLOW_OUTER_ALPHA,
  RING_GLOW_PULSE_AMOUNT,
  RING_GLOW_PULSE_SPEED,
  RING_INNER_COLOR,
  RING_INNER_ROTATION_SPEED,
  RING_INNER_SEGMENTS,
  RING_MIDDLE_COLOR,
  RING_MIDDLE_RADIUS,
  RING_MIDDLE_ROTATION_SPEED,
  RING_MIDDLE_SEGMENTS,
  RING_OUTER_COLOR,
  RING_OUTER_RADIUS,
  RING_OUTER_ROTATION_SPEED,
  RING_OUTER_SEGMENTS,
  RING_RESPAWN_TIME,
  RING_SPAWN_INITIAL_RADIUS } from './constants.js'

import { identity_matrix } from './math.js'
import { draw_line, draw_spark } from './renderer.js'
import { are_rings_destroyed_by_explosion, create_castle_explosion, is_castle_exploding } from './explosions.js'
import { playSound } from './sound.js'
import { clear_torpedoes } from './torpedoes.js'
import { retreat_enemies_to_center } from './enemies.js'
import { player } from './player.js'
import { checkAndUpdateHighScore } from './score.js'


export const castle_state = {
  ring_glow_time: 0,
  center_rotation: 0,
  spawn_in_progress: false,
  spawn_ring_index: 0,
  rings: [
    { round: 0, index: 0, radius: RING_OUTER_RADIUS, segments: RING_OUTER_SEGMENTS, rotation: 0, rotationSpeed: RING_OUTER_ROTATION_SPEED, color: RING_OUTER_COLOR },
    { round: 1, index: 1, radius: RING_MIDDLE_RADIUS, segments: RING_MIDDLE_SEGMENTS, rotation: 0, rotationSpeed: RING_MIDDLE_ROTATION_SPEED, color: RING_MIDDLE_COLOR },
    { round: 2, index: 2, radius: CASTLE_INNER_RING_RADIUS, segments: RING_INNER_SEGMENTS, rotation: 0, rotationSpeed: RING_INNER_ROTATION_SPEED, color: RING_INNER_COLOR }
  ],
  cannon: {
    angle: 0,
    rotation_speed: CANNON_ROTATION_SPEED,
    length: CANNON_LENGTH,
    is_destroyed: false,
    cool_off_timer: 0
  },
  cannon_projectile: null
}

export const get_castle_state = () => castle_state
export const get_castle_rings = () => castle_state.rings
export const get_castle_cannon = () => castle_state.cannon
export const get_castle_projectile = () => castle_state.cannon_projectile

export const clear_cannon_projectile = () => {
  castle_state.cannon_projectile = null
}

export const castle_destroyed = (game_state) => {
  create_castle_explosion(CENTER_X, CENTER_Y)
  playSound('castle_explode')
  retreat_enemies_to_center()
  castle_state.cannon.is_destroyed = true
  game_state.score = (game_state.round + 1)
  setTimeout(() => delayed_check_round_won(game_state), CASTLE_DESTROYED_CHECK_DELAY)
}

export const delayed_check_round_won = (game_state) => {
  clear_torpedoes()
  if (player.alive) {
    game_state.pyrrhic_victory = false
    game_state.round_won = true
  } else {
    game_state.pyrrhic_victory = true
    game_state.round_won = true
  }
  game_state.lives += 1
  game_state.enemy_speed_multiplier += ENEMY_SPEED_INCREASE_PER_ROUND
  checkAndUpdateHighScore(game_state.score)
}

const has_clear_shot = (angle) => {
  if (castle_state.cannon.is_destroyed) return false
  for (const ring of castle_state.rings) {
    const segment_angle = (Math.PI * 2) / ring.segments

    let rel_angle = angle - ring.rotation
    while (rel_angle < 0) rel_angle += Math.PI * 2
    while (rel_angle >= Math.PI * 2) rel_angle -= Math.PI * 2

    const face_index = Math.floor(rel_angle / segment_angle)
    const face = ring.faces[face_index]

    if (face && !face.destroyed) {
      return false
    }
  }
  return true
}

export const init_ring_faces = () => {
  for (const ring of castle_state.rings) {
    ring.faces = []
    ring.respawn_timer = 0
    ring.spawn_radius = RING_SPAWN_INITIAL_RADIUS
    for (let i = 0; i < ring.segments; i++) {
      ring.faces.push({
        index: i, destroyed: false
      })
    }
  }

  castle_state.cannon.is_destroyed = false
  castle_state.cannon.angle = 0
  castle_state.cannon.cool_off_timer = 0
  castle_state.cannon_projectile = null
}

export const reset_castle = () => {
  castle_state.ring_glow_time = 0
  castle_state.center_rotation = 0
  castle_state.spawn_in_progress = true
  castle_state.spawn_ring_index = 0
  init_ring_faces()
  for (const ring of castle_state.rings) {
    ring.rotation = 0
    ring.spawn_radius = RING_SPAWN_INITIAL_RADIUS
  }
}

export const ring_spawning = () => {
  if (castle_state.spawn_in_progress) {
    return true
  }
  return castle_state.rings.some(ring => ring.spawn_radius < ring.radius)
}

export const update_castle_rings = (dt, player, game_state) => {
  castle_state.ring_glow_time += dt
  castle_state.center_rotation += CASTLE_CENTER_ROTATION_SPEED * dt

  const cannon = castle_state.cannon
  let all_rings_spawned = true

  for (let ring_index = 0; ring_index < castle_state.rings.length; ring_index += 1) {
    const ring = castle_state.rings[ring_index]
    ring.rotation += ring.rotationSpeed * dt * game_state.ring_speed_modifier

    if (castle_state.spawn_in_progress) {
      if (ring.spawn_radius < ring.radius) {
        ring.spawn_radius += dt * ring.radius
      }
      if (ring.spawn_radius >= ring.radius) {
        ring.spawn_radius = ring.radius
      } else {
        all_rings_spawned = false
      }
    } else if (ring.spawn_radius < ring.radius) {
      ring.spawn_radius += dt * ring.radius
    }

    if (ring.respawn_timer > 0) {
      ring.respawn_timer -= dt
      if (ring.respawn_timer <= 0) {

        for (const face of ring.faces) {
          face.destroyed = false
        }
        ring.respawn_timer = 0
        ring.spawn_radius = RING_SPAWN_INITIAL_RADIUS
      }
    } else {
      const all_destroyed = ring.faces.every(face => face.destroyed)
      if (all_destroyed) {
        ring.respawn_timer = RING_RESPAWN_TIME
      }
    }
  }

  if (castle_state.spawn_in_progress) {
    if (all_rings_spawned) {
      castle_state.spawn_in_progress = false
    }
    return
  }

  if (player.alive) {
    const target_angle = Math.atan2(player.y - CENTER_Y, player.x - CENTER_X)

    let angle_diff = target_angle - cannon.angle
    while (angle_diff > Math.PI) angle_diff -= Math.PI * 2
    while (angle_diff < -Math.PI) angle_diff += Math.PI * 2

    const max_rotation = cannon.rotation_speed * dt
    if (Math.abs(angle_diff) < max_rotation) {
      cannon.angle = target_angle
    } else {
      cannon.angle += Math.sign(angle_diff) * max_rotation
    }

    if (cannon.cool_off_timer > 0) {
      cannon.cool_off_timer -= dt
    }

    if (!castle_state.cannon_projectile && cannon.cool_off_timer <= 0 && has_clear_shot(cannon.angle)) {
      playSound('cannon_fire')
      setTimeout(() => {
        castle_state.cannon_projectile = {
          x: CENTER_X + Math.cos(cannon.angle) * cannon.length,
          y: CENTER_Y + Math.sin(cannon.angle) * cannon.length,
          angle: cannon.angle,
          vx: Math.cos(cannon.angle) * CANNON_SPARK_SPEED,
          vy: Math.sin(cannon.angle) * CANNON_SPARK_SPEED,
          size: CANNON_SPARK_SIZE
        }
        cannon.cool_off_timer = CANNON_COOL_OFF_TIME
      }, CANNON_FIRE_WARMUP_TIME)
    }
  }

  if (castle_state.cannon_projectile) {
    castle_state.cannon_projectile.x += castle_state.cannon_projectile.vx * dt
    castle_state.cannon_projectile.y += castle_state.cannon_projectile.vy * dt

    if (castle_state.cannon_projectile.x < CANNON_PROJECTILE_BOUNDS_MIN || castle_state.cannon_projectile.x > CANNON_PROJECTILE_BOUNDS_MAX || castle_state.cannon_projectile.y < CANNON_PROJECTILE_BOUNDS_MIN || castle_state.cannon_projectile.y > CANNON_PROJECTILE_BOUNDS_MAX) {
      castle_state.cannon_projectile = null
    }
  }
}

export const draw_castle = () => {

  if (is_castle_exploding()) {
    if (are_rings_destroyed_by_explosion()) {
      return
    }
    return
  }

  const transform = identity_matrix()

  const glow_pulse = RING_GLOW_BASE + Math.sin(castle_state.ring_glow_time * RING_GLOW_PULSE_SPEED) * RING_GLOW_PULSE_AMOUNT

  for (const ring of castle_state.rings) {
    const segment_angle = (Math.PI * 2) / ring.segments
    const draw_radius = ring.spawn_radius < ring.radius ? ring.spawn_radius : ring.radius
    for (const face of ring.faces) {
      if (face.destroyed) continue

      const start_angle = face.index * segment_angle + ring.rotation
      const end_angle = (face.index + 1) * segment_angle + ring.rotation

      const x1 = CENTER_X + Math.cos(start_angle) * draw_radius
      const y1 = CENTER_Y + Math.sin(start_angle) * draw_radius
      const x2 = CENTER_X + Math.cos(end_angle) * draw_radius
      const y2 = CENTER_Y + Math.sin(end_angle) * draw_radius

      const glow_color = [ring.color[0], ring.color[1], ring.color[2], glow_pulse * RING_GLOW_OUTER_ALPHA]
      const glow_color_inner = [ring.color[0], ring.color[1], ring.color[2], glow_pulse * RING_GLOW_INNER_ALPHA]

      const mid_angle = (start_angle + end_angle) / 2
      const offset_outer = RING_GLOW_OFFSET_OUTER
      const offset_inner = RING_GLOW_OFFSET_INNER

      const ox1_outer = x1 + Math.cos(start_angle) * offset_outer - Math.cos(mid_angle) * offset_outer * RING_GLOW_OFFSET_FACTOR
      const oy1_outer = y1 + Math.sin(start_angle) * offset_outer - Math.sin(mid_angle) * offset_outer * RING_GLOW_OFFSET_FACTOR
      const ox2_outer = x2 + Math.cos(end_angle) * offset_outer - Math.cos(mid_angle) * offset_outer * RING_GLOW_OFFSET_FACTOR
      const oy2_outer = y2 + Math.sin(end_angle) * offset_outer - Math.sin(mid_angle) * offset_outer * RING_GLOW_OFFSET_FACTOR

      draw_line(ox1_outer, oy1_outer, ox2_outer, oy2_outer, transform, glow_color)

      const ox1_inner = x1 + Math.cos(start_angle) * offset_inner - Math.cos(mid_angle) * offset_inner * RING_GLOW_OFFSET_FACTOR
      const oy1_inner = y1 + Math.sin(start_angle) * offset_inner - Math.sin(mid_angle) * offset_inner * RING_GLOW_OFFSET_FACTOR
      const ox2_inner = x2 + Math.cos(end_angle) * offset_inner - Math.cos(mid_angle) * offset_inner * RING_GLOW_OFFSET_FACTOR
      const oy2_inner = y2 + Math.sin(end_angle) * offset_inner - Math.sin(mid_angle) * offset_inner * RING_GLOW_OFFSET_FACTOR

      draw_line(ox1_inner, oy1_inner, ox2_inner, oy2_inner, transform, glow_color_inner)
      draw_line(x1, y1, x2, y2, transform, ring.color)
    }
  }

  const cannon = castle_state.cannon
  const cannon_end_x = CENTER_X + Math.cos(cannon.angle) * cannon.length
  const cannon_end_y = CENTER_Y + Math.sin(cannon.angle) * cannon.length

  const perp_x = Math.cos(cannon.angle + Math.PI / 2)
  const perp_y = Math.sin(cannon.angle + Math.PI / 2)

  for (let offset = -CANNON_THICKNESS; offset <= CANNON_THICKNESS; offset++) {
    draw_line(CENTER_X + perp_x * offset, CENTER_Y + perp_y * offset, cannon_end_x + perp_x * offset, cannon_end_y + perp_y * offset, transform, CANNON_COLOR)
  }

  for (let i = 0; i < CASTLE_CENTRAL_HEX_SIDES; i++) {
    const angle1 = castle_state.center_rotation + (i / CASTLE_CENTRAL_HEX_SIDES) * Math.PI * 2
    const angle2 = castle_state.center_rotation + ((i + 1) / CASTLE_CENTRAL_HEX_SIDES) * Math.PI * 2

    const x1 = CENTER_X + Math.cos(angle1) * CASTLE_CENTRAL_HEX_RADIUS
    const y1 = CENTER_Y + Math.sin(angle1) * CASTLE_CENTRAL_HEX_RADIUS
    const x2 = CENTER_X + Math.cos(angle2) * CASTLE_CENTRAL_HEX_RADIUS
    const y2 = CENTER_Y + Math.sin(angle2) * CASTLE_CENTRAL_HEX_RADIUS

    draw_line(x1, y1, x2, y2, transform, CASTLE_CENTRAL_HEX_COLOR)
  }

  if (castle_state.cannon_projectile) {
    draw_spark({
      x: castle_state.cannon_projectile.x,
      y: castle_state.cannon_projectile.y,
      angle: castle_state.cannon_projectile.angle,
      size: castle_state.cannon_projectile.size,
      transform,
      color: CANNON_SPARK_COLOR
    })
  }
}
