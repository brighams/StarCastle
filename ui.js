import { CANVAS_SIZE, CENTER_X, CENTER_Y } from './constants.js'
import { identity_matrix } from './math.js'
import { draw_line, draw_ship } from './renderer.js'

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
  'Z': [[0,0,0.6,0],[0.6,0,0,1],[0,1,0.6,1]]
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

export const draw_ui = (lives, round, game_over) => {
  const transform = identity_matrix()

  for (let i = 0; i < lives; i++) {
    const ship_x = 30 + i * 25
    const ship_y = 30
    const ship_size = 8
    const ship_angle = 0
    draw_ship(ship_x, ship_y, ship_angle, ship_size, transform, [1.0, 1.0, 1.0, 1.0])
  }

  if (game_over) {
    draw_text("PRESS SPACEBAR TO START", CENTER_X, CENTER_Y + 200, 3, transform, [1.0, 1.0, 1.0, 1.0])
  }
}
