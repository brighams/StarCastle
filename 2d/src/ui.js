import { CANVAS_SIZE, CENTER_X, CENTER_Y, TOP_RIGHT_X, TOP_RIGHT_Y,
  RADAR_RADIUS, RADAR_CENTER_X, RADAR_CENTER_Y, WORLD_RADIUS,
  UI_AUTOPILOT_HINT_Y_OFFSET,
  UI_AUTOPILOT_X,
  UI_BITCOIN_Y_END,
  UI_BITCOIN_Y_START,
  UI_DEBUG_Y_BASE,
  UI_EXIT_Y,
  UI_HIGH_SCORE_Y_OFFSET,
  UI_HUD_SCORE_X_OFFSET,
  UI_HUD_TITLE_X_OFFSET,
  UI_HUD_TITLE_Y,
  UI_INSTRUCTIONS_Y_OFFSET,
  UI_LIVES_SHIP_SIZE,
  UI_LIVES_X_SPACING,
  UI_LIVES_X_START,
  UI_LIVES_Y,
  UI_PYRRHIC_HINT_Y_OFFSET,
  UI_PYRRHIC_SUBTITLE_Y_OFFSET,
  UI_PYRRHIC_TITLE_Y_OFFSET,
  UI_ROUND_WON_NEXT_Y_OFFSET,
  UI_ROUND_WON_SCORE_Y_OFFSET,
  UI_ROUND_WON_Y_OFFSET,
  UI_SUBTITLE_Y_OFFSET,
  UI_TAGLINE_Y_OFFSET,
  UI_TITLE_Y_OFFSET } from './constants.js'
import { identity_matrix } from './math.js'
import { draw_circle, draw_line } from './renderer.js'
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
    const ship_x = UI_LIVES_X_START + i * UI_LIVES_X_SPACING
    draw_player_ship({
      x: ship_x, y: UI_LIVES_Y, angle: 0, size: UI_LIVES_SHIP_SIZE, transform, color: [1.0, 1.0, 0.0, 1.0]
    })
  }
}

const TITLE_LINES = (transform) => {
  draw_animated_text('STARKEEPER ONE', CENTER_X, CENTER_Y + UI_TITLE_Y_OFFSET, 8, transform, [1.0, 0.0, 0.5, 1.0], 3.0)
  draw_animated_text('BY BRIGHAM@STARKEEPER.IO', CENTER_X, CENTER_Y + UI_SUBTITLE_Y_OFFSET, 1.5, transform, [1.0, 0.0, 0.5, 1.0], 3.0)
  draw_animated_text('INSPIRED BY THE 1980 ARCADE CLASSIC STAR CASTLE', CENTER_X, CENTER_Y + UI_TAGLINE_Y_OFFSET, 2, transform, [1.0, 0.0, 0.5, 1.0], 3.0)
}

const draw_radar = (transform) => {
  const scale = RADAR_RADIUS / WORLD_RADIUS

  draw_circle(RADAR_CENTER_X, RADAR_CENTER_Y, RADAR_RADIUS, 48, transform, [0.0, 0.4, 0.4, 0.35])
  draw_circle(RADAR_CENTER_X, RADAR_CENTER_Y, RADAR_RADIUS, 48, transform, [0.0, 0.8, 0.8, 0.8])

  const sq = 4
  draw_line(RADAR_CENTER_X - sq, RADAR_CENTER_Y - sq, RADAR_CENTER_X + sq, RADAR_CENTER_Y - sq, transform, [1.0, 0.0, 0.0, 1.0])
  draw_line(RADAR_CENTER_X + sq, RADAR_CENTER_Y - sq, RADAR_CENTER_X + sq, RADAR_CENTER_Y + sq, transform, [1.0, 0.0, 0.0, 1.0])
  draw_line(RADAR_CENTER_X + sq, RADAR_CENTER_Y + sq, RADAR_CENTER_X - sq, RADAR_CENTER_Y + sq, transform, [1.0, 0.0, 0.0, 1.0])
  draw_line(RADAR_CENTER_X - sq, RADAR_CENTER_Y + sq, RADAR_CENTER_X - sq, RADAR_CENTER_Y - sq, transform, [1.0, 0.0, 0.0, 1.0])

  const rx = player.x * scale
  const ry = player.y * scale
  const rd = Math.sqrt(rx * rx + ry * ry)
  const clamp_r = RADAR_RADIUS - 5
  const px = RADAR_CENTER_X + (rd > clamp_r ? (rx / rd) * clamp_r : rx)
  const py = RADAR_CENTER_Y + (rd > clamp_r ? (ry / rd) * clamp_r : ry)
  const xs = 4
  draw_line(px - xs, py - xs, px + xs, py + xs, transform, [1.0, 1.0, 1.0, 1.0])
  draw_line(px + xs, py - xs, px - xs, py + xs, transform, [1.0, 1.0, 1.0, 1.0])
}

export const draw_ui = (lives, score, game_over, round_won) => {
  const transform = identity_matrix()
  const { entice_mode, entice_animation_t } = game_state

  if (!game_over && !entice_mode) {
    draw_player_remaining_lives(lives, transform)
  }

  if (game_over) {
    const animating = entice_animation_t >= 0
    const t_s = animating ? entice_animation_t * entice_animation_t * (3 - 2 * entice_animation_t) : 0
    const bitcoin_y = UI_BITCOIN_Y_START + (UI_BITCOIN_Y_END - UI_BITCOIN_Y_START) * t_s

    TITLE_LINES(transform)
    draw_animated_text('INSERT BITCOIN OR PRESS ENTER TO START', CENTER_X, bitcoin_y, 3, transform, [0.0, 0.9, 0.9, 1.0], 3.0)

    const fade = 1 - t_s
    draw_animated_text('PRESS TAB FOR INSTRUCTIONS', CENTER_X, CENTER_Y + UI_INSTRUCTIONS_Y_OFFSET, 2.5, transform, [1.0, 0.0, 0.533, fade], 3.0)
    draw_animated_text(`HIGH SCORE: ${getHighScore()}`, CENTER_X, CENTER_Y + UI_HIGH_SCORE_Y_OFFSET, 2, transform, [1.0, 1.0, 0.0, fade], 3.0)
    if (window.self !== window.top) {
      draw_animated_text('PRESS X TO EXIT', CENTER_X, UI_EXIT_Y, 3, transform, [1.0, 0.45, 0.0, 1.0], 2.0)
    }
  } else if (entice_mode) {
    TITLE_LINES(transform)
    draw_animated_text('INSERT BITCOIN OR PRESS ENTER TO START', CENTER_X, UI_BITCOIN_Y_END, 3, transform, [0.0, 0.9, 0.9, 1.0], 3.0)
    if (window.self !== window.top) {
      draw_animated_text('PRESS X TO EXIT', CENTER_X, UI_EXIT_Y, 3, transform, [1.0, 0.45, 0.0, 1.0], 2.0)
    }
  } else if (round_won) {
    if (!game_state.pyrrhic_victory) {
      draw_text('ROUND WON', CENTER_X, CENTER_Y + UI_ROUND_WON_Y_OFFSET, 5, transform, [1.0, 0.84, 0.0, 1.0])
      draw_text('YOU ARE GRANTED ANOTHER SHIP', CENTER_X, CENTER_Y + UI_TITLE_Y_OFFSET, 5, transform, [1.0, 0.84, 0.0, 1.0])
    } else {
      draw_text('PYRRHIC VICTORY!', CENTER_X, CENTER_Y + UI_PYRRHIC_TITLE_Y_OFFSET, 5, transform, [1.0, 0.84, 0.0, 1.0])
      draw_text('A WORTHY SACRIFICE MY STARKEEPER', CENTER_X, CENTER_Y + UI_PYRRHIC_SUBTITLE_Y_OFFSET, 3, transform, [1.0, 0.84, 0.0, 1.0])
      draw_text('NEXT TIME TRY TO SURVIVE', CENTER_X, CENTER_Y + UI_PYRRHIC_HINT_Y_OFFSET, 3, transform, [1.0, 0.0, 0.5, 1.0])
    }
    draw_text('PRESS ENTER TO START THE NEXT ROUND', CENTER_X, CENTER_Y + UI_ROUND_WON_NEXT_Y_OFFSET, 3, transform, [1.0, 0.84, 0.0, 1.0])
    draw_text(`HIGH SCORE: ${getHighScore()}`, CENTER_X, CENTER_Y + UI_ROUND_WON_SCORE_Y_OFFSET, 2, transform, [1.0, 1.0, 0.0, 1.0])
    draw_text(`SCORE ${score}`, TOP_RIGHT_X + UI_HUD_SCORE_X_OFFSET, TOP_RIGHT_Y, 3, transform, [1.0, 0.0, 0.5, 1.0])
  } else {
    draw_text(`HIGH ${getHighScore()} SCORE ${score}`, TOP_RIGHT_X + UI_HUD_SCORE_X_OFFSET, TOP_RIGHT_Y, 3, transform, [1.0, 0.0, 0.5, 1.0])
    draw_text('STARKEEPER ONE', CENTER_X + UI_HUD_TITLE_X_OFFSET, UI_HUD_TITLE_Y, 3, transform, [0.0, 1.0, 1.0, 1.0])
    draw_radar(transform)

    // Show autopilot indicator
    if (ENABLE_AUTOPILOT && game_state.autopilot_on) {
      draw_animated_text('AUTOPILOT ACTIVE', UI_AUTOPILOT_X, TOP_RIGHT_Y, 2, transform, [0.0, 1.0, 0.0, 1.0], 2.0)
      draw_text('PRESS BACKSPACE TO DISABLE', UI_AUTOPILOT_X, TOP_RIGHT_Y + UI_AUTOPILOT_HINT_Y_OFFSET, 1.5, transform, [0.5, 1.0, 0.5, 0.8])
    }

    if (debug_enabled) {
      const display_px = Math.round(render_scale * CANVAS_SIZE)
      draw_text(`VIEW ${display_px}X${display_px}`, CENTER_X, UI_DEBUG_Y_BASE, 1.5, transform, [0.3, 1.0, 0.3, 1.0])
      draw_text(`RENDER ${CANVAS_SIZE}X${CANVAS_SIZE}`, CENTER_X, UI_DEBUG_Y_BASE + 14, 1.5, transform, [0.3, 1.0, 0.3, 1.0])
      draw_text(`SHIP ${Math.round(player.x)} ${Math.round(player.y)}`, CENTER_X, UI_DEBUG_Y_BASE + 28, 1.5, transform, [0.3, 1.0, 0.3, 1.0])
    }
  }

}
