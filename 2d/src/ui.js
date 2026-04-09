import { CENTER_X, CENTER_Y, TOP_RIGHT_X, TOP_RIGHT_Y } from './constants.js'
import { identity_matrix } from './math.js'
import { getHighScore } from './score.js'
import { game_state, ENABLE_AUTOPILOT, render_scale } from './main.js'
import { draw_player_ship, player } from './player.js'
import { draw_animated_text, draw_text } from './text.js'


let infoBox = document.getElementById('infoBox')
let debug_enabled = false
export const toggle_debug = () => { debug_enabled = !debug_enabled }

export const toggle_info_box = (show = null) => {
  const visible = show === null ? infoBox.style.display !== 'block' : show
  infoBox.style.display = visible ? 'block' : 'none'
}

const draw_player_remaining_lives = (lives, transform) => {
  for (let i = 0; i < lives; i++) {
    const ship_x = 30 + i * 25
    const ship_y = 30
    const ship_size = 8
    const ship_angle = 0
    draw_player_ship({
      x: ship_x, y: ship_y, angle: ship_angle, size: ship_size, transform, color: [1.0, 1.0, 0.0, 1.0]
    })
  }
}

export const draw_ui = (lives, score, game_over, round_won) => {
  const transform = identity_matrix()

  if (!game_over) {
    draw_player_remaining_lives(lives, transform)
  }

  if (game_over) {
    draw_animated_text('STARKEEPER ONE', CENTER_X, CENTER_Y - 300, 8, transform, [1.0, 0.0, 0.5, 1.0], 3.0)
    draw_animated_text('BY BRIGHAM@STARKEEPER.IO', CENTER_X, CENTER_Y - 220, 1.5, transform, [1.0, 0.0, 0.5, 1.0], 3.0)
    draw_animated_text('INSPIRED BY THE 1980 ARCADE CLASSIC STAR CASTLE', CENTER_X, CENTER_Y - 180, 2, transform, [1.0, 0.0, 0.5, 1.0], 3.0)
    draw_animated_text('INSERT BITCOIN OR PRESS ENTER TO START', CENTER_X, CENTER_Y + 150, 3, transform, [0.0, 0.9, 0.9, 1.0], 3.0)
    draw_animated_text('PRESS TAB FOR INSTRUCTIONS', CENTER_X, CENTER_Y + 195, 2.5, transform, [1.0, 0.0, 0.533, 1.0], 3.0)
    if (ENABLE_AUTOPILOT) {
      draw_animated_text('PRESS BACKSPACE FOR AUTOPILOT DEMO', CENTER_X, CENTER_Y + 240, 2, transform, [0.0, 1.0, 0.0, 1.0], 3.0)
    }
    draw_animated_text(`HIGH SCORE: ${getHighScore()}`, CENTER_X, CENTER_Y + (ENABLE_AUTOPILOT ? 280 : 240), 2, transform, [1.0, 1.0, 0.0, 1.0], 3.0)
  } else if (round_won) {
    if (!game_state.pyrrhic_victory) {
      draw_text('ROUND WON', CENTER_X, CENTER_Y - 200, 5, transform, [1.0, 0.84, 0.0, 1.0])
      draw_text('YOU ARE GRANTED ANOTHER SHIP', CENTER_X, CENTER_Y - 300, 5, transform, [1.0, 0.84, 0.0, 1.0])
    } else {
      draw_text('PYRRHIC VICTORY!', CENTER_X, CENTER_Y - 312, 5, transform, [1.0, 0.84, 0.0, 1.0])
      draw_text('A WORTHY SACRIFICE MY STARKEEPER', CENTER_X, CENTER_Y - 262, 3, transform, [1.0, 0.84, 0.0, 1.0])
      draw_text('NEXT TIME TRY TO SURVIVE', CENTER_X, CENTER_Y - 222, 3, transform, [1.0, 0.0, 0.5, 1.0])
    }
    draw_text('PRESS ENTER TO START THE NEXT ROUND', CENTER_X, CENTER_Y + 200, 3, transform, [1.0, 0.84, 0.0, 1.0])
    draw_text(`HIGH SCORE: ${getHighScore()}`, CENTER_X, CENTER_Y + 260, 2, transform, [1.0, 1.0, 0.0, 1.0])
    draw_text(`SCORE ${score}`, TOP_RIGHT_X - 100, TOP_RIGHT_Y, 3, transform, [1.0, 0.0, 0.5, 1.0])
  } else {
    draw_text(`HIGH ${getHighScore()} SCORE ${score}`, TOP_RIGHT_X - 120, TOP_RIGHT_Y, 3, transform, [1.0, 0.0, 0.5, 1.0])
    draw_text('STARKEEPER ONE', CENTER_X - 32, 16, 3, transform, [0.0, 1.0, 1.0, 1.0])

    // Show autopilot indicator
    if (ENABLE_AUTOPILOT && game_state.autopilot_on) {
      draw_animated_text('AUTOPILOT ACTIVE', 100, TOP_RIGHT_Y, 2, transform, [0.0, 1.0, 0.0, 1.0], 2.0)
      draw_text('PRESS BACKSPACE TO DISABLE', 100, TOP_RIGHT_Y + 25, 1.5, transform, [0.5, 1.0, 0.5, 0.8])
    }

    if (debug_enabled) {
      const display_px = Math.round(render_scale * 800)
      draw_text(`VIEW ${display_px}X${display_px}`, CENTER_X, 758, 1.5, transform, [0.3, 1.0, 0.3, 1.0])
      draw_text(`RENDER 800X800`, CENTER_X, 772, 1.5, transform, [0.3, 1.0, 0.3, 1.0])
      draw_text(`SHIP ${Math.round(player.x)} ${Math.round(player.y)}`, CENTER_X, 786, 1.5, transform, [0.3, 1.0, 0.3, 1.0])
    }
  }

  if (window.self !== window.top) {
    draw_animated_text('PRESS X TO EXIT', CENTER_X, 790, 2, transform, [1.0, 0.45, 0.0, 1.0], 2.0)
  }
}
