// Background stars with twinkling effect
import { identity_matrix } from './math.js'
import { draw_line } from './renderer.js'

const stars = []
const STAR_COUNT = 100
const CANVAS_SIZE = 800

// Initialize stars with random positions, sizes, and twinkle rates
export const init_stars = () => {
  stars.length = 0

  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
                 x: Math.random() * CANVAS_SIZE,
                 y: Math.random() * CANVAS_SIZE,
                 size: 0.5 + Math.random() * 2.5,  // Size varies from 0.5 to 3
                 twinkle_rate: 0.2 + Math.random() * 0.8,  // Slower twinkle: 0.2 to 1.0 Hz
                 twinkle_offset: Math.random() * Math.PI * 2,  // Random phase offset
                 brightness: 0.15 + Math.random() * 0.25  // Dimmer: 0.15 to 0.4 max brightness
               })
  }
}

export const draw_stars = () => {
  const time = performance.now() / 1000
  const transform = identity_matrix()

  stars.forEach(star => {
    // Calculate twinkling brightness using sine wave
    const twinkle = Math.sin(time * star.twinkle_rate + star.twinkle_offset)
    const alpha = star.brightness * (0.5 + twinkle * 0.5)  // Oscillates between 0 and brightness

    // Only draw if visible enough
    if (alpha > 0.05) {
      const color = [1.0, 1.0, 1.0, alpha]
      const s = star.size

      // Draw star as a small cross
      draw_line(star.x - s, star.y, star.x + s, star.y, transform, color)
      draw_line(star.x, star.y - s, star.x, star.y + s, transform, color)
    }
  })
}

// Initialize on load
init_stars()
