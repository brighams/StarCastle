import { CENTER_X, CENTER_Y, TOP_RIGHT_X, TOP_RIGHT_Y } from './constants.js'
import { identity_matrix } from './math.js'
import { draw_ship, draw_line } from './renderer.js'
import { getHighScore, getIsNewHighScore } from './score.js'

let isNewHighScore = false

export const setNewHighScore = (value) => {
  isNewHighScore = value
}

export const checkForNewHighScore = (round) => {
  if (checkAndUpdateHighScore(round)) {
    isNewHighScore = true
  }
}

const letter_strokes = {
  'P': [[0,0,0,1],[0,0,0.6,0],[0.6,0,0.6,0.5],[0.6,0.5,0,0.5]],
  'R': [[0,0,0,1],[0,0,0.6,0],[0.6,0,0.6,0.5],[0.6,0.5,0,0.5],[0.3,0.5,0.6,1]],
  'E': [[0,0,0,1],[0,0,0.6,0],[0,0.5,0.4,0.5],[0,1,0.6,1]],
  'S': [[0.6,0,0,0],[0,0,0,0.5],[0,0.5,0.6,0.5],[0.6,0.5,0.6,1],[0.6,1,0,1]],
  ' ': [],
  'A': [[0,1,0.3,0],[0.3,0,0.6,1],[0.1,0.6,0.5,0.6]],
  'C': [[0.6,0,0,0],[0,0,0,1],[0,1,0.6,1]],
  'B': [[0,0,0,1],[0,0,0.5,0],[0.5,0,0.6,0.1],[0.6,0.1,0.6,0.4],[0.6,0.4,0.5,0.5],[0.5,0.5,0,0.5],[0.5,0.5,0.6,0.6],[0.6,0.6,0.6,0.9],[0.6,0.9,0.5,1],[0.5,1,0,1]],
  'T': [[0,0,0.6,0],[0.3,0,0.3,1]],
  'O': [[0,0,0.6,0],[0.6,0,0.6,1],[0.6,1,0,1],[0,1,0,0]],
  'D': [[0,0,0,1],[0,0,0.5,0],[0.5,0,0.6,0.2],[0.6,0.2,0.6,0.8],[0.6,0.8,0.5,1],[0.5,1,0,1]],
  'F': [[0,0,0,1],[0,0,0.6,0],[0,0.5,0.4,0.5]],
  'G': [[0.6,0,0,0],[0,0,0,1],[0,1,0.6,1],[0.6,1,0.6,0.5],[0.6,0.5,0.3,0.5]],
  'H': [[0,0,0,1],[0.6,0,0.6,1],[0,0.5,0.6,0.5]],
  'I': [[0,0,0.6,0],[0.3,0,0.3,1],[0,1,0.6,1]],
  'J': [[0.6,0,0.6,1],[0.6,1,0,1],[0,1,0,0.7]],
  'K': [[0,0,0,1],[0.6,0,0,0.5],[0,0.5,0.6,1]],
  'L': [[0,0,0,1],[0,1,0.6,1]],
  'M': [[0,1,0,0],[0,0,0.3,0.5],[0.3,0.5,0.6,0],[0.6,0,0.6,1]],
  'N': [[0,1,0,0],[0,0,0.6,1],[0.6,1,0.6,0]],
  'Q': [[0,0,0.6,0],[0.6,0,0.6,1],[0.6,1,0,1],[0,1,0,0],[0.4,0.7,0.7,1.1]],
  'U': [[0,0,0,1],[0,1,0.6,1],[0.6,1,0.6,0]],
  'V': [[0,0,0.3,1],[0.3,1,0.6,0]],
  'W': [[0,0,0,1],[0,1,0.3,0.5],[0.3,0.5,0.6,1],[0.6,1,0.6,0]],
  'X': [[0,0,0.6,1],[0.6,0,0,1]],
  'Y': [[0,0,0.3,0.5],[0.6,0,0.3,0.5],[0.3,0.5,0.3,1]],
  'Z': [[0,0,0.6,0],[0.6,0,0,1],[0,1,0.6,1]],
  '0': [[0,0,0.6,0],[0.6,0,0.6,1],[0.6,1,0,1],[0,1,0,0],[0,1,0.6,0]],
  '1': [[0.15,0.15,0.3,0],[0.3,0,0.3,1],[0,1,0.6,1]],
  '2': [[0,0,0.6,0],[0.6,0,0.6,0.5],[0.6,0.5,0,0.5],[0,0.5,0,1],[0,1,0.6,1]],
  '3': [[0,0,0.6,0],[0.6,0,0.6,1],[0.6,1,0,1],[0,0.5,0.6,0.5]],
  '4': [[0,0,0,0.5],[0,0.5,0.6,0.5],[0.6,0,0.6,1]],
  '5': [[0.6,0,0,0],[0,0,0,0.5],[0,0.5,0.6,0.5],[0.6,0.5,0.6,1],[0.6,1,0,1]],
  '6': [[0.6,0,0,0],[0,0,0,1],[0,1,0.6,1],[0.6,1,0.6,0.5],[0.6,0.5,0,0.5]],
  '7': [[0,0,0.6,0],[0.6,0,0.3,1]],
  '8': [[0,0,0.6,0],[0.6,0,0.6,1],[0.6,1,0,1],[0,1,0,0],[0,0.5,0.6,0.5]],
  '9': [[0,0.5,0.6,0.5],[0,0,0,0.5],[0,0,0.6,0],[0.6,0,0.6,1],[0.6,1,0,1]],
  '.': [[0.25,0.85,0.35,0.85],[0.35,0.85,0.35,1],[0.35,1,0.25,1],[0.25,1,0.25,0.85]],
  '@': [[0.5,0.5,0.5,0.3],[0.5,0.3,0.3,0.3],[0.3,0.3,0.3,0.6],[0.3,0.6,0.5,0.6],[0.5,0.6,0.5,0.8],[0.5,0.8,0.1,0.8],[0.1,0.8,0.1,0.2],[0.1,0.2,0.5,0],[0.5,0,0.6,0.1]]
}

let animationStartTime = null

export const resetTextAnimation = () => {
  animationStartTime = null
}

export const draw_animated_text = (text, x, y, scale, transform, color, duration) => {
  if (animationStartTime === null) {
    animationStartTime = performance.now()
  }

  const elapsed = (performance.now() - animationStartTime) / 1000 // convert to seconds
  const progress = Math.min(elapsed / duration, 1.0) // clamp to 0-1

  // Ease-out cubic for a nice deceleration effect
  const eased = 1 - Math.pow(1 - progress, 3)

  const currentScale = scale * eased

  if (currentScale > 0.01) { // avoid drawing at near-zero scale
    draw_text(text, x, y, currentScale, transform, color)
  }
}

export const draw_text = (text, x, y, scale, transform, color) => {
  const char_width = 0.8 * scale * 6
  const char_height = scale * 6
  const total_width = text.length * char_width
  let cursor_x = x - total_width / 2

  for (const char of text) {
    const strokes = letter_strokes[char]
    if (strokes) {
      for (const stroke of strokes) {
        const x1 = cursor_x + stroke[0] * char_width
        const y1 = y + stroke[1] * char_height
        const x2 = cursor_x + stroke[2] * char_width
        const y2 = y + stroke[3] * char_height
        draw_line(x1, y1, x2, y2, transform, color)
      }
    }
    cursor_x += char_width
  }
}

export const draw_ui = (lives, round, game_over, round_won) => {
  const transform = identity_matrix()

  for (let i = 0; i < lives; i++) {
    const ship_x = 30 + i * 25
    const ship_y = 30
    const ship_size = 8
    const ship_angle = 0
    draw_ship(ship_x, ship_y, ship_angle, ship_size, transform, [1.0, 0.5, 1.0, 1.0])
  }

  if (game_over) {
    draw_animated_text("STARKEEPER ONE", CENTER_X, CENTER_Y - 300, 8, transform, [1.0, 0.0, 0.5, 1.0], 3.0)
    draw_animated_text("BY BRIGHAM@STARKEEPER.IO", CENTER_X, CENTER_Y - 220, 1.5, transform, [1.0, 0.0, 0.5, 1.0], 3.0)
    draw_animated_text("INSPIRED BY THE 1980 ARCADE CLASSIC STAR CASTLE", CENTER_X, CENTER_Y - 180, 2, transform, [1.0, 0.0, 0.5, 1.0], 3.0)
    draw_animated_text("INSERT BITCOIN OR PRESS ENTER TO START", CENTER_X, CENTER_Y + 200, 3, transform, [0.0, 0.9, 0.9, 1.0], 3.0)
    draw_text(`HIGH SCORE: ${getHighScore()}`, CENTER_X, CENTER_Y + 260, 2, transform, [1.0, 1.0, 0.0, 1.0])
  } else if (round_won) {
    draw_text("YOU HAVE WON", CENTER_X, CENTER_Y - 200, 5, transform, [1.0, 0.84, 0.0, 1.0])
    draw_text("PRESS ENTER TO START THE NEXT ROUND", CENTER_X, CENTER_Y + 200, 3, transform, [1.0, 0.84, 0.0, 1.0])
    draw_text(`HIGH SCORE: ${getHighScore()}`, CENTER_X, CENTER_Y + 260, 2, transform, [1.0, 1.0, 0.0, 1.0])
    draw_text(`ROUND ${round}`, TOP_RIGHT_X - 100, TOP_RIGHT_Y , 3, transform, [1.0, 0.0, 0.5, 1.0])
  } else {
    draw_text(`ROUND ${round+1}`, TOP_RIGHT_X - 100, TOP_RIGHT_Y , 3, transform, [1.0, 0.0, 0.5, 1.0])
    draw_text('STARKEEPER ONE', CENTER_X - 32, 16 , 3, transform, [0.0, 1.0, 1.0, 1.0])
  }
}
