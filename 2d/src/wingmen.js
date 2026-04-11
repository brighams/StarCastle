import {
  FORE_TORPEDO_SIZE,
  PLAYER_SIZE,
  PLAYER_SPAWN_OUTER_RING_MIN,
  PLAYER_SPAWN_OUTER_RING_MAX,
  PLAYER_TORPEDO_LIFE,
  PLAYER_TORPEDO_SPEED,
  WINGMAN_AIM_TOLERANCE,
  WINGMAN_COLOR,
  WINGMAN_FIRE_COOLDOWN,
  WINGMAN_FORMATION_RADIUS,
  WINGMAN_JOIN_RADIUS,
  WINGMAN_MAX_COUNT,
  WINGMAN_MAX_SPEED,
  WINGMAN_RESPAWN_TIME,
  WINGMAN_ROTATION_SPEED,
  WINGMAN_THRUST_FORCE,
  WINGMAN_TORPEDO_COLOR,
  WINGMAN_MIN_SEPARATION,
  WINGMAN_SEPARATION_FORCE,
  WINGMAN_VELOCITY_DAMPING,
  WORLD_RADIUS,
} from './constants.js'
import { world_transform } from './camera.js'
import { create_ship_explosion } from './explosions.js'
import { enemy_sparks } from './enemies.js'
import { playSound } from './sound.js'
import { draw_player_ship } from './player.js'
import { fire_torpedo } from './torpedoes.js'

export let wingmen = []

const make_wingman = () => {
  const angle = Math.random() * Math.PI * 2
  const radius =
    PLAYER_SPAWN_OUTER_RING_MIN +
    Math.random() * (PLAYER_SPAWN_OUTER_RING_MAX - PLAYER_SPAWN_OUTER_RING_MIN)
  return {
    alive: true,
    joining: true,
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    angle: 0,
    vel_x: 0,
    vel_y: 0,
    size: PLAYER_SIZE,
    thrust: 0,
    rotation: 0,
    fire_cooldown: 0,
    respawn_timer: 0,
  }
}

export const spawn_wingman = (round = 0) => {
  if (wingmen.filter((w) => w.alive).length >= WINGMAN_MAX_COUNT + round) return
  wingmen.push(make_wingman())
}

export const spawn_initial_wingmen = (round = 0) => {
  const count = WINGMAN_MAX_COUNT + round
  while (wingmen.filter((w) => w.alive || w.respawn_timer > 0).length < count) {
    wingmen.push(make_wingman())
  }
}

const normalize_angle = (a) => {
  while (a > Math.PI) a -= 2 * Math.PI
  while (a < -Math.PI) a += 2 * Math.PI
  return a
}

const steer_toward = (wingman, tx, ty, dt) => {
  const dx = tx - wingman.x
  const dy = ty - wingman.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist < 1) return false
  const target_angle = Math.atan2(dx, -dy)
  const diff = normalize_angle(target_angle - wingman.angle)
  const max_rot = WINGMAN_ROTATION_SPEED * dt
  wingman.angle += Math.abs(diff) < max_rot ? diff : Math.sign(diff) * max_rot
  if (Math.abs(diff) > 0.05) {
    wingman.rotation = Math.sign(diff)
  } else {
    wingman.rotation = 0
  }
  wingman.vel_x += Math.sin(wingman.angle) * WINGMAN_THRUST_FORCE * dt
  wingman.vel_y -= Math.cos(wingman.angle) * WINGMAN_THRUST_FORCE * dt
  return true
}

const apply_separation = (wingman, dt, others) => {
  for (const other of others) {
    const dx = wingman.x - other.x
    const dy = wingman.y - other.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > 0 && dist < WINGMAN_MIN_SEPARATION) {
      const strength = (1 - dist / WINGMAN_MIN_SEPARATION) * WINGMAN_SEPARATION_FORCE
      wingman.vel_x += (dx / dist) * strength * dt
      wingman.vel_y += (dy / dist) * strength * dt
    }
  }
}

const update_wingman = (wingman, dt, player, others) => {
  if (!wingman.alive) return

  if (wingman.fire_cooldown > 0) wingman.fire_cooldown -= dt

  const dx_p = player.x - wingman.x
  const dy_p = player.y - wingman.y
  const dist_to_player = Math.sqrt(dx_p * dx_p + dy_p * dy_p)

  let wants_thrust = false

  if (wingman.joining) {
    wants_thrust = steer_toward(wingman, player.x, player.y, dt)
    if (dist_to_player < WINGMAN_JOIN_RADIUS) wingman.joining = false
  } else if (dist_to_player > WINGMAN_FORMATION_RADIUS) {
    wants_thrust = steer_toward(wingman, player.x, player.y, dt)
  } else {
    let nearest = null
    let nearest_dist_sq = Infinity
    for (const enemy of enemy_sparks) {
      if (!enemy.alive) continue
      const ex = enemy.x - wingman.x
      const ey = enemy.y - wingman.y
      const dsq = ex * ex + ey * ey
      if (dsq < nearest_dist_sq) {
        nearest_dist_sq = dsq
        nearest = enemy
      }
    }

    if (nearest) {
      const target_angle = Math.atan2(nearest.x - wingman.x, -(nearest.y - wingman.y))
      const diff = normalize_angle(target_angle - wingman.angle)
      const max_rot = WINGMAN_ROTATION_SPEED * dt
      wingman.angle += Math.abs(diff) < max_rot ? diff : Math.sign(diff) * max_rot
      wingman.rotation = Math.abs(diff) > 0.05 ? Math.sign(diff) : 0
      if (Math.abs(diff) < WINGMAN_AIM_TOLERANCE && wingman.fire_cooldown <= 0) {
        fire_torpedo({
          x: wingman.x,
          y: wingman.y,
          angle: wingman.angle,
          size: FORE_TORPEDO_SIZE,
          life: PLAYER_TORPEDO_LIFE,
          speed: PLAYER_TORPEDO_SPEED,
          color: WINGMAN_TORPEDO_COLOR,
          is_space_mine: false,
        })
        wingman.fire_cooldown = WINGMAN_FIRE_COOLDOWN
      }
    } else {
      wingman.rotation = 0
    }
  }

  const ramp_up = 3
  const ramp_down = 4
  if (wants_thrust) {
    wingman.thrust = Math.min(1, wingman.thrust + ramp_up * dt)
  } else {
    wingman.thrust = Math.max(0, wingman.thrust - ramp_down * dt)
  }

  apply_separation(wingman, dt, others)

  wingman.vel_x *= WINGMAN_VELOCITY_DAMPING
  wingman.vel_y *= WINGMAN_VELOCITY_DAMPING

  const speed = Math.sqrt(wingman.vel_x * wingman.vel_x + wingman.vel_y * wingman.vel_y)
  if (speed > WINGMAN_MAX_SPEED) {
    wingman.vel_x *= WINGMAN_MAX_SPEED / speed
    wingman.vel_y *= WINGMAN_MAX_SPEED / speed
  }

  wingman.x += wingman.vel_x * dt
  wingman.y += wingman.vel_y * dt

  const dist_sq = wingman.x * wingman.x + wingman.y * wingman.y
  if (dist_sq >= WORLD_RADIUS * WORLD_RADIUS) {
    const dist = Math.sqrt(dist_sq)
    const nx = wingman.x / dist
    const ny = wingman.y / dist
    const dot = wingman.vel_x * nx + wingman.vel_y * ny
    if (dot > 0) {
      wingman.vel_x -= 2 * dot * nx
      wingman.vel_y -= 2 * dot * ny
    }
    wingman.x = nx * (WORLD_RADIUS - 1)
    wingman.y = ny * (WORLD_RADIUS - 1)
  }
}

export const update_wingmen = (dt, player, round = 0) => {
  const max = WINGMAN_MAX_COUNT + round
  for (const wingman of wingmen) {
    if (wingman.alive) {
      const others = [player, ...wingmen.filter((w) => w !== wingman && w.alive)]
      update_wingman(wingman, dt, player, others)
    } else if (wingman.respawn_timer > 0) {
      wingman.respawn_timer -= dt
      if (wingman.respawn_timer <= 0) {
        const alive_count = wingmen.filter((w) => w.alive).length
        const pending_count = wingmen.filter((w) => !w.alive && w.respawn_timer > 0).length
        if (alive_count + pending_count < max) {
          const spawned = make_wingman()
          Object.assign(wingman, spawned)
        }
      }
    }
  }
}

export const draw_wingmen = () => {
  const transform = world_transform()
  for (const wingman of wingmen) {
    if (wingman.alive) {
      draw_player_ship({
        x: wingman.x,
        y: wingman.y,
        angle: wingman.angle,
        size: wingman.size,
        color: WINGMAN_COLOR,
        thrust: wingman.thrust,
        rotation: wingman.rotation,
        transform,
      })
    }
  }
}

export const destroy_wingman = (wingman) => {
  wingman.alive = false
  wingman.respawn_timer = WINGMAN_RESPAWN_TIME
  create_ship_explosion(wingman.x, wingman.y)
  playSound('player_explode')
}

export const clear_wingmen = () => {
  wingmen.length = 0
}
