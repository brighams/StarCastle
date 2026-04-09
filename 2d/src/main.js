import { clear_screen, init_renderer, resize_viewport } from './renderer.js'
import { draw_player_ship, player, reset_player, update_player } from './player.js'
import { draw_castle, reset_castle, ring_spawning, update_castle_rings } from './castle.js'
import { clear_torpedoes, draw_torpedoes, remove_destroyed_torpedoes, update_torpedoes } from './torpedoes.js'
import update_enemies, { clear_enemies,
  draw_enemy_sparks,
  enemy_sparks,
  remove_destroyed_enemies,
  spawn_enemies } from './enemies.js'
import { clear_explosions, draw_explosions, update_explosions } from './explosions.js'
import { check_collisions } from './collisions.js'
import { draw_ui, toggle_debug, toggle_info_box } from './ui.js'
import { draw_stars } from './stars.js'
import { autopilot_enabled, update_autopilot } from './autopilot.js'
import { ENEMY_STARTING_COUNT,
  ENEMY_STARTING_SPEED_MULTIPLIER,
  PLAYER_STARTING_LIVES,
  RING_STARTING_SPEED_MULTIPLIER } from './constants.js'

// ========== FEATURE FLAGS ==========
export const ENABLE_AUTOPILOT = false
// ===================================

const STARTING_ENEMY_SPEED_MULTIPLIER = 1.0

const canvas = document.getElementById('gameCanvas')
init_renderer(canvas)

export let render_scale = 1.0

const apply_display_scale = () => {
  const size = Math.min(window.innerWidth, window.innerHeight)
  render_scale = size / 800
  canvas.width = size
  canvas.height = size
  resize_viewport(size, size)
  document.body.style.padding = '0'
  document.body.style.alignItems = 'center'
  document.body.style.height = '100vh'
  document.body.style.overflow = 'hidden'
}

export const game_state = {
  lives: PLAYER_STARTING_LIVES,
  enemy_speed_multiplier: ENEMY_STARTING_SPEED_MULTIPLIER,
  ring_speed_modifier: RING_STARTING_SPEED_MULTIPLIER,
  round: 0,
  score: 0,
  max_enemies: ENEMY_STARTING_COUNT,
  game_over: true,
  game_started: false,
  round_won: false,
  pyrrhic_victory: false,
  autopilot_on: false,
  round_starting: false
}

let keys_pressed = {}
let last_time = 0
let enemy_spawn_timer = 1.2

const reset_game = (new_game = true) => {
  apply_display_scale()

  if (new_game) {
    game_state.lives = PLAYER_STARTING_LIVES
    game_state.round = 0
    game_state.score = 0
  } else {
    game_state.round += 1
  }

  game_state.max_enemies = 3 + game_state.round
  game_state.enemy_speed_multiplier = new_game ? STARTING_ENEMY_SPEED_MULTIPLIER : (STARTING_ENEMY_SPEED_MULTIPLIER + game_state.round * 0.02)
  game_state.ring_speed_modifier = new_game ? RING_STARTING_SPEED_MULTIPLIER : (RING_STARTING_SPEED_MULTIPLIER + game_state.round * 0.01)

  game_state.game_over = false
  game_state.game_started = true
  game_state.round_won = false
  game_state.round_starting = true

  toggle_info_box(false)

  clear_explosions()
  clear_enemies()
  clear_torpedoes()
  reset_player()
  reset_castle()

  enemy_spawn_timer = 1.2

  setTimeout(() => spawn_enemies(game_state.max_enemies / 2, 1.0), 5000)
}

const check_shift_key = (e) => {
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    keys_pressed['ShiftKey'] = true
    return
  }
  keys_pressed['ShiftKey'] = e.shiftKey
}

document.addEventListener('keydown', (e) => {
  check_shift_key(e)
  keys_pressed[e.code] = true

  if (e.key === 'Enter') {
    if (game_state.game_over) {
      reset_game(true)
    } else if (game_state.round_won) {
      reset_game(false)
    }
  }

  if (e.code === 'Tab') {
    if (!game_state.game_over && !game_state.round_won) {
      toggle_debug()
    } else {
      toggle_info_box()
    }
    e.preventDefault()
  }

  // Toggle autopilot with Backspace
  if (ENABLE_AUTOPILOT && e.code === 'Backspace') {
    autopilot_enabled(!game_state.autopilot_on, game_state)
    e.preventDefault() // Prevent browser back navigation
  }

  if (e.code === 'KeyX' && window.self !== window.top) {
    window.parent.postMessage({ type: 'starcastle-exit' }, '*')
  }
})

document.addEventListener('keyup', (e) => {
  check_shift_key(e)
  keys_pressed[e.code] = false
})

const render_frame = () => {
  clear_screen()
  draw_stars()
  draw_castle()
  if (player.alive && !game_state.game_over) {
    draw_player_ship(player)
  }
  draw_enemy_sparks()
  draw_torpedoes()
  draw_explosions()
  draw_ui(game_state.lives, game_state.score, game_state.game_over, game_state.round_won)
  requestAnimationFrame(game_loop)
}

const update_game = (current_time) => {
  const dt = (current_time - last_time) / 1000
  last_time = current_time

  update_castle_rings(dt, player, game_state)
  if (game_state.round_starting) {
    if (!ring_spawning()) {
      game_state.round_starting = false
    } else {
      update_player(dt, keys_pressed, game_state)
      update_torpedoes(dt)
      remove_destroyed_torpedoes()
      update_explosions(dt)
      return
    }
  }

  enemy_spawn_timer -= dt
  if (enemy_spawn_timer <= 0 && enemy_sparks.length < game_state.max_enemies) {
    if (Math.random() < 0.3) {
      spawn_enemies(game_state.max_enemies, 0.5)
    }
    enemy_spawn_timer = 3
  }

  // Use autopilot input if enabled, otherwise use player input
  const active_keys = (ENABLE_AUTOPILOT && game_state.autopilot_on)
    ? update_autopilot(player, game_state, dt)
    : keys_pressed

  update_player(dt, active_keys, game_state)
  update_torpedoes(dt)
  remove_destroyed_torpedoes()
  update_enemies(dt, player, game_state.game_over, game_state.round_won, game_state.enemy_speed_multiplier)
  remove_destroyed_enemies()
  check_collisions(player, game_state)
  update_explosions(dt)
}

const game_loop = (current_time) => {
  update_game(current_time)
  render_frame()
}

apply_display_scale()
window.addEventListener('resize', apply_display_scale)
reset_castle()
requestAnimationFrame(game_loop)
