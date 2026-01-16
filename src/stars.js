import { identity_matrix } from './math.js'
import { draw_line } from './renderer.js'

const stars = []
const STAR_COUNT = 100
const CANVAS_SIZE = 800

export const init_stars = () => {
  stars.length = 0

  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * CANVAS_SIZE, y: Math.random() * CANVAS_SIZE, size: 0.5 + Math.random() * 2.5,
      twinkle_rate: 0.2 + Math.random() * 0.8,
      twinkle_offset: Math.random() * Math.PI * 2,
      brightness: 0.15 + Math.random() * 0.25
    })
  }
}

export const draw_stars = () => {
  const time = performance.now() / 1000
  const transform = identity_matrix()

  for (const star of stars) {
    const twinkle = Math.sin(time * star.twinkle_rate + star.twinkle_offset)
    const alpha = star.brightness * (0.5 + twinkle * 0.5)

    if (alpha > 0.05) {
      const color = [1.0, 1.0, 1.0, alpha]
      const s = star.size

      draw_line(star.x - s, star.y, star.x + s, star.y, transform, color)
      draw_line(star.x, star.y - s, star.x, star.y + s, transform, color)
    }
  }
}

init_stars()
