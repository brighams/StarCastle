// Explosions system - 3D version

export const explosions = []

export function createExplosion(position, max_size, duration, color) {
  const particle_count = Math.floor(max_size / 2)

  const explosion = {
    position: { ...position },
    particles: [],
    life: duration,
    initial_life: duration,
    max_size,
    color
  }

  // Create debris particles
  for (let i = 0; i < particle_count; i++) {
    const angle_xz = Math.random() * Math.PI * 2
    const angle_y = (Math.random() - 0.5) * Math.PI

    const speed = 20 + Math.random() * 80

    explosion.particles.push({
      position: { ...position },
      velocity: {
        x: Math.cos(angle_xz) * Math.cos(angle_y) * speed,
        y: Math.sin(angle_y) * speed,
        z: Math.sin(angle_xz) * Math.cos(angle_y) * speed
      },
      length: 2 + Math.random() * 8,
      rotation: Math.random() * Math.PI * 2
    })
  }

  explosions.push(explosion)
}

export function updateExplosions(dt) {
  for (const explosion of explosions) {
    explosion.life -= dt

    for (const particle of explosion.particles) {
      particle.position.x += particle.velocity.x * dt
      particle.position.y += particle.velocity.y * dt
      particle.position.z += particle.velocity.z * dt

      // Slow down
      particle.velocity.x *= 0.98
      particle.velocity.y *= 0.98
      particle.velocity.z *= 0.98

      particle.rotation += dt * 2
    }
  }

  // Remove dead explosions
  for (let i = explosions.length - 1; i >= 0; i--) {
    if (explosions[i].life <= 0) {
      explosions.splice(i, 1)
    }
  }
}

export function clearExplosions() {
  explosions.length = 0
}
