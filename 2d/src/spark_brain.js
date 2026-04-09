import { enemy_sparks } from './enemies.js'

const CLOSE_THRESHOLD = 140      // px — switch to aggressive close-chase
const FAR_FORCE = 90             // acceleration toward player when far
const CLOSE_FORCE = 240          // acceleration toward player when close (ramps up closer)
const SEPARATION_DISTANCE = 50   // repel sparks within this range
const SEPARATION_FORCE = 80      // repulsion strength
const JITTER_INTERVAL_MIN = 0.3  // seconds between perpendicular kicks
const JITTER_INTERVAL_RAND = 0.4
const JITTER_STRENGTH = 100      // perpendicular velocity kick magnitude

export const update_spark_chase = (enemy, index, dt, player, enemy_speed_multiplier) => {
  enemy.dock_ring = null

  const dx = player.x - enemy.x
  const dy = player.y - enemy.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist === 0) return

  const nx = dx / dist
  const ny = dy / dist

  // Separation from other active sparks
  let sep_x = 0
  let sep_y = 0
  for (let i = 0; i < enemy_sparks.length; i++) {
    if (i === index) continue
    const other = enemy_sparks[i]
    if (!other.alive || other.docked) continue
    const odx = enemy.x - other.x
    const ody = enemy.y - other.y
    const od = Math.sqrt(odx * odx + ody * ody)
    if (od > 0 && od < SEPARATION_DISTANCE) {
      const strength = 1 - od / SEPARATION_DISTANCE
      sep_x += (odx / od) * strength
      sep_y += (ody / od) * strength
    }
  }

  enemy.vel_x += sep_x * SEPARATION_FORCE * dt
  enemy.vel_y += sep_y * SEPARATION_FORCE * dt

  if (dist > CLOSE_THRESHOLD) {
    // Far phase: steady glide toward player
    enemy.vel_x += nx * FAR_FORCE * dt * enemy_speed_multiplier
    enemy.vel_y += ny * FAR_FORCE * dt * enemy_speed_multiplier
  } else {
    // Close phase: aggressive burst that ramps up as distance shrinks
    const closeness = 1 - dist / CLOSE_THRESHOLD  // 0..1
    const force = CLOSE_FORCE * (1 + closeness) * enemy_speed_multiplier
    enemy.vel_x += nx * force * dt
    enemy.vel_y += ny * force * dt

    // Perpendicular jitter — kicks sideways only, never backward
    enemy.jitter_timer -= dt
    if (enemy.jitter_timer <= 0) {
      enemy.jitter_timer = JITTER_INTERVAL_MIN + Math.random() * JITTER_INTERVAL_RAND
      const kick = (Math.random() - 0.5) * 2 * JITTER_STRENGTH
      enemy.vel_x += -ny * kick
      enemy.vel_y +=  nx * kick
    }
  }
}
