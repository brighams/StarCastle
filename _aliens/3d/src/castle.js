// Castle system - 3D version

import {
  CASTLE_CENTER_ROTATION_SPEED,
  CASTLE_CENTRAL_HEX_RADIUS,
  RING_SPAWN_INITIAL_RADIUS,
  RING_RESPAWN_TIME,
  CANNON_COOL_OFF_TIME,
  CANNON_FIRE_WARMUP_TIME,
  CANNON_SPARK_SPEED,
  CANNON_SPARK_SIZE,
  CANNON_PROJECTILE_BOUNDS,
  CASTLE_DESTROYED_CHECK_DELAY
} from './constants.js'
import { vec3 } from './math3d.js'

export const castle = {
  center_rotation: 0,
  spawn_in_progress: false,
  rings: [
    {
      index: 0,
      radius: 120,
      segments: 12,
      rotation: 0,
      rotationSpeed: 0.65,
      color: [0.0, 1.0, 0.0, 1.0],
      faces: [],
      respawn_timer: 0,
      spawn_radius: 0.1
    },
    {
      index: 1,
      radius: 90,
      segments: 8,
      rotation: 0,
      rotationSpeed: -0.95,
      color: [0.0, 0.0, 1.0, 1.0],
      faces: [],
      respawn_timer: 0,
      spawn_radius: 0.1
    },
    {
      index: 2,
      radius: 60,
      segments: 6,
      rotation: 0,
      rotationSpeed: 1.0,
      color: [1.0, 1.0, 0.0, 1.0],
      faces: [],
      respawn_timer: 0,
      spawn_radius: 0.1
    }
  ],
  cannon: {
    angle_yaw: 0,
    angle_pitch: 0,
    rotation_speed: 2.0,
    length: 18,
    is_destroyed: false,
    cool_off_timer: 0
  },
  cannon_projectile: null,
  destroyed: false
}

export function initRingFaces() {
  for (const ring of castle.rings) {
    ring.faces = []
    ring.respawn_timer = 0
    ring.spawn_radius = 0.1

    for (let i = 0; i < ring.segments; i++) {
      ring.faces.push({
        index: i,
        destroyed: false
      })
    }
  }

  castle.cannon.is_destroyed = false
  castle.cannon.angle_yaw = 0
  castle.cannon.angle_pitch = 0
  castle.cannon.cool_off_timer = 0
  castle.cannon_projectile = null
  castle.destroyed = false
}

export function resetCastle() {
  castle.center_rotation = 0
  castle.spawn_in_progress = true
  initRingFaces()

  for (const ring of castle.rings) {
    ring.rotation = 0
    ring.spawn_radius = RING_SPAWN_INITIAL_RADIUS
  }
}

export function ringSpawning() {
  if (castle.spawn_in_progress) {
    return true
  }
  return castle.rings.some(ring => ring.spawn_radius < ring.radius)
}

function hasClearShot(yaw, pitch, player_pos) {
  if (castle.cannon.is_destroyed) return false

  // Simple check - see if any ring segment blocks the shot
  for (const ring of castle.rings) {
    const segment_angle = (Math.PI * 2) / ring.segments
    let rel_angle = yaw - ring.rotation

    while (rel_angle < 0) rel_angle += Math.PI * 2
    while (rel_angle >= Math.PI * 2) rel_angle -= Math.PI * 2

    const face_index = Math.floor(rel_angle / segment_angle)
    const face = ring.faces[face_index]

    if (face && !face.destroyed) {
      // Check if shot would hit this ring segment
      const dist_to_player = vec3.distance({ x: 0, y: 0, z: 0 }, player_pos)
      if (dist_to_player > ring.radius) {
        return false
      }
    }
  }

  return true
}

export function updateCastle(dt, player, gameState) {
  castle.center_rotation += CASTLE_CENTER_ROTATION_SPEED * dt

  let all_rings_spawned = true

  for (const ring of castle.rings) {
    ring.rotation += ring.rotationSpeed * dt * gameState.ring_speed_modifier

    if (castle.spawn_in_progress) {
      if (ring.spawn_radius < ring.radius) {
        ring.spawn_radius += dt * ring.radius
        all_rings_spawned = false
      }
      if (ring.spawn_radius >= ring.radius) {
        ring.spawn_radius = ring.radius
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

  if (castle.spawn_in_progress && all_rings_spawned) {
    castle.spawn_in_progress = false
  }

  // Update cannon
  const cannon = castle.cannon
  if (player.alive && !castle.destroyed) {
    const player_pos = player.ship.position

    // Calculate angle to player
    const target_yaw = Math.atan2(player_pos.x, player_pos.z)
    const dist_xz = Math.sqrt(player_pos.x * player_pos.x + player_pos.z * player_pos.z)
    const target_pitch = Math.atan2(player_pos.y, dist_xz)

    // Rotate towards player
    let yaw_diff = target_yaw - cannon.angle_yaw
    while (yaw_diff > Math.PI) yaw_diff -= Math.PI * 2
    while (yaw_diff < -Math.PI) yaw_diff += Math.PI * 2

    const max_rotation = cannon.rotation_speed * dt
    if (Math.abs(yaw_diff) < max_rotation) {
      cannon.angle_yaw = target_yaw
    } else {
      cannon.angle_yaw += Math.sign(yaw_diff) * max_rotation
    }

    let pitch_diff = target_pitch - cannon.angle_pitch
    if (Math.abs(pitch_diff) < max_rotation) {
      cannon.angle_pitch = target_pitch
    } else {
      cannon.angle_pitch += Math.sign(pitch_diff) * max_rotation
    }

    if (cannon.cool_off_timer > 0) {
      cannon.cool_off_timer -= dt
    }

    if (!castle.cannon_projectile && cannon.cool_off_timer <= 0 && hasClearShot(cannon.angle_yaw, cannon.angle_pitch, player_pos)) {
      setTimeout(() => {
        const dir_x = Math.sin(cannon.angle_yaw) * Math.cos(cannon.angle_pitch)
        const dir_y = Math.sin(cannon.angle_pitch)
        const dir_z = Math.cos(cannon.angle_yaw) * Math.cos(cannon.angle_pitch)

        castle.cannon_projectile = {
          position: {
            x: dir_x * cannon.length,
            y: dir_y * cannon.length,
            z: dir_z * cannon.length
          },
          velocity: {
            x: dir_x * CANNON_SPARK_SPEED,
            y: dir_y * CANNON_SPARK_SPEED,
            z: dir_z * CANNON_SPARK_SPEED
          },
          size: CANNON_SPARK_SIZE
        }
        cannon.cool_off_timer = CANNON_COOL_OFF_TIME
      }, CANNON_FIRE_WARMUP_TIME)
    }
  }

  // Update cannon projectile
  if (castle.cannon_projectile) {
    castle.cannon_projectile.position = vec3.add(
      castle.cannon_projectile.position,
      vec3.scale(castle.cannon_projectile.velocity, dt)
    )

    const dist = vec3.length(castle.cannon_projectile.position)
    if (dist > CANNON_PROJECTILE_BOUNDS) {
      castle.cannon_projectile = null
    }
  }
}

export function destroyCastle(gameState) {
  castle.destroyed = true
  castle.cannon.is_destroyed = true
  gameState.score = gameState.round + 1

  setTimeout(() => {
    if (player.alive) {
      gameState.round_won = true
      gameState.pyrrhic_victory = false
    } else {
      gameState.round_won = true
      gameState.pyrrhic_victory = true
    }
    gameState.lives += 1
  }, CASTLE_DESTROYED_CHECK_DELAY)
}
