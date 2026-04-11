import { enemy_sparks } from './enemies.js'
import { SPARK_CLOSE_THRESHOLD, SPARK_FAR_FORCE, SPARK_CLOSE_FORCE,
  SPARK_SEPARATION_DISTANCE, SPARK_SEPARATION_FORCE,
  SPARK_JITTER_INTERVAL_MIN, SPARK_JITTER_INTERVAL_RAND,
  SPARK_JITTER_STRENGTH } from './constants.js'

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
    if (od > 0 && od < SPARK_SEPARATION_DISTANCE) {
      const strength = 1 - od / SPARK_SEPARATION_DISTANCE
      sep_x += (odx / od) * strength
      sep_y += (ody / od) * strength
    }
  }

  enemy.vel_x += sep_x * SPARK_SEPARATION_FORCE * dt
  enemy.vel_y += sep_y * SPARK_SEPARATION_FORCE * dt

  if (dist > SPARK_CLOSE_THRESHOLD) {
    // Far phase: steady glide toward player
    enemy.vel_x += nx * SPARK_FAR_FORCE * dt * enemy_speed_multiplier
    enemy.vel_y += ny * SPARK_FAR_FORCE * dt * enemy_speed_multiplier
  } else {
    // Close phase: aggressive burst that ramps up as distance shrinks
    const closeness = 1 - dist / SPARK_CLOSE_THRESHOLD  // 0..1
    const force = SPARK_CLOSE_FORCE * (1 + closeness) * enemy_speed_multiplier
    enemy.vel_x += nx * force * dt
    enemy.vel_y += ny * force * dt

    // Perpendicular jitter — kicks sideways only, never backward
    enemy.jitter_timer -= dt
    if (enemy.jitter_timer <= 0) {
      enemy.jitter_timer = SPARK_JITTER_INTERVAL_MIN + Math.random() * SPARK_JITTER_INTERVAL_RAND
      const kick = (Math.random() - 0.5) * 2 * SPARK_JITTER_STRENGTH
      enemy.vel_x += -ny * kick
      enemy.vel_y +=  nx * kick
    }
  }
}
