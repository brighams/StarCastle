import { identity_matrix } from './math.js'
import { draw_line } from './renderer.js'
import { CANVAS_SIZE, STAR_COUNT, STAR_MIN_SIZE, STAR_SIZE_RANGE,
  STAR_MIN_TWINKLE_RATE, STAR_TWINKLE_RATE_RANGE,
  STAR_MIN_BRIGHTNESS, STAR_BRIGHTNESS_RANGE,
  STAR_MIN_ALPHA } from './constants.js'

const stars = []

export const init_stars = () => {
  stars.length = 0

  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * CANVAS_SIZE,
      y: Math.random() * CANVAS_SIZE,
      size: STAR_MIN_SIZE + Math.random() * STAR_SIZE_RANGE,
      twinkle_rate: STAR_MIN_TWINKLE_RATE + Math.random() * STAR_TWINKLE_RATE_RANGE,
      twinkle_offset: Math.random() * Math.PI * 2,
      brightness: STAR_MIN_BRIGHTNESS + Math.random() * STAR_BRIGHTNESS_RANGE
    })
  }
}

export const draw_stars = () => {
  const time = performance.now() / 1000
  const transform = identity_matrix()

  for (const star of stars) {
    const twinkle = Math.sin(time * star.twinkle_rate + star.twinkle_offset)
    const alpha = star.brightness * (0.5 + twinkle * 0.5)

    if (alpha > STAR_MIN_ALPHA) {
      const color = [1.0, 1.0, 1.0, alpha]
      const s = star.size

      draw_line(star.x - s, star.y, star.x + s, star.y, transform, color)
      draw_line(star.x, star.y - s, star.x, star.y + s, transform, color)
    }
  }
}

init_stars()
