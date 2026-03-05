// Torpedoes system - 3D version

import { vec3 } from './math3d.js'
import { MAX_TORPEDO_COUNT } from './constants.js'
import { player } from './player.js'

export const torpedoes = []

export function fireTorpedo(config) {
  const aliveTorpedoes = torpedoes.filter(t => t.alive).length

  if (aliveTorpedoes >= MAX_TORPEDO_COUNT || player.fire_cooldown > 0) {
    return
  }

  torpedoes.push({
    position: { ...config.position },
    velocity: vec3.scale(config.direction, config.speed),
    size: config.size,
    life: config.life,
    initial_life: config.life,
    color: config.color,
    is_space_mine: config.is_space_mine,
    alive: true,
    jitter_timer: 0,
    jitter: { x: 0, y: 0, z: 0 }
  })

  player.fire_cooldown = 0.2
}

export function updateTorpedoes(dt) {
  for (const torpedo of torpedoes) {
    if (!torpedo.alive) continue

    torpedo.life -= dt * 1000
    if (torpedo.life <= 0) {
      torpedo.alive = false
      continue
    }

    // Update jitter
    torpedo.jitter_timer -= dt
    if (torpedo.jitter_timer <= 0) {
      torpedo.jitter = {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        z: (Math.random() - 0.5) * 2
      }
      torpedo.jitter_timer = 0.1
    }

    torpedo.position = vec3.add(torpedo.position, vec3.scale(torpedo.velocity, dt))
  }
}

export function clearTorpedoes() {
  torpedoes.length = 0
}

export function removeDestroyedTorpedoes() {
  for (let i = torpedoes.length - 1; i >= 0; i--) {
    if (!torpedoes[i].alive) {
      torpedoes.splice(i, 1)
    }
  }
}
