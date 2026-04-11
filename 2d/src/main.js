import { clear_screen, init_renderer, resize_viewport } from './renderer.js'
import { update_camera } from './camera.js'
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
import { update_brain, reset_brain, commands_to_keys } from './brain.js'
import { CANVAS_SIZE,
  ENEMY_INITIAL_SPAWN_DELAY_MS,
  ENEMY_NEW_GAME_SPEED_MULTIPLIER,
  ENEMY_SPAWN_CHANCE,
  ENEMY_SPAWN_INITIAL_DELAY,
  ENEMY_SPAWN_INTERVAL,
  ENEMY_SPEED_INCREASE_CONTINUOUS,
  ENEMY_STARTING_COUNT,
  ENEMY_STARTING_SPEED_MULTIPLIER,
  ENTICE_ANIM_DURATION,
  ENTICE_DELAY,
  PLAYER_STARTING_LIVES,
  RING_SPEED_INCREASE_PER_ROUND,
  RING_STARTING_SPEED_MULTIPLIER } from './constants.js'

// ========== FEATURE FLAGS ==========
export const ENABLE_AUTOPILOT = true
// ===================================

const canvas = document.getElementById('gameCanvas')
init_renderer(canvas)

export let render_scale = 1.0

const apply_display_scale = () => {
  const size = Math.min(window.innerWidth, window.innerHeight)
  render_scale = size / CANVAS_SIZE
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
  round_starting: false,
  entice_mode: false,
  entice_animation_t: -1
}

let keys_pressed = {}
let brain_keys = {}
let last_time = 0
let enemy_spawn_timer = ENEMY_SPAWN_INITIAL_DELAY
let idle_timer = 0

const start_entice_mode = () => {
  reset_game(true)
  game_state.entice_mode = true
}

const reset_game = (new_game = true) => {
  idle_timer = 0
  brain_keys = {}
  game_state.entice_mode = false
  game_state.entice_animation_t = -1
  reset_brain()
  apply_display_scale()

  if (new_game) {
    game_state.lives = PLAYER_STARTING_LIVES
    game_state.round = 0
    game_state.score = 0
  } else {
    game_state.round += 1
  }

  game_state.max_enemies = ENEMY_STARTING_COUNT + game_state.round
  game_state.enemy_speed_multiplier = new_game ? ENEMY_NEW_GAME_SPEED_MULTIPLIER : (ENEMY_NEW_GAME_SPEED_MULTIPLIER + game_state.round * ENEMY_SPEED_INCREASE_CONTINUOUS)
  game_state.ring_speed_modifier = new_game ? RING_STARTING_SPEED_MULTIPLIER : (RING_STARTING_SPEED_MULTIPLIER + game_state.round * RING_SPEED_INCREASE_PER_ROUND)

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

  enemy_spawn_timer = ENEMY_SPAWN_INITIAL_DELAY

  setTimeout(() => spawn_enemies(game_state.max_enemies / 2, 1.0), ENEMY_INITIAL_SPAWN_DELAY_MS)
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
  if (!game_state.entice_mode) {
    keys_pressed[e.code] = true
  }

  if (e.key === 'Enter') {
    if (game_state.game_over || game_state.entice_mode) {
      reset_game(true)
    } else if (game_state.round_won) {
      reset_game(false)
    }
  }

  if (e.code === 'Tab') {
    if (!game_state.game_over && !game_state.round_won && !game_state.entice_mode) {
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
  if (!game_state.entice_mode) {
    keys_pressed[e.code] = false
  }
})

const render_frame = () => {
  update_camera(player)
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

  // If player died during entice mode, restart it immediately
  if (game_state.game_over && game_state.entice_mode) {
    start_entice_mode()
    return
  }

  if (game_state.game_over) {
    if (game_state.entice_animation_t < 0) {
      idle_timer += dt
      if (idle_timer >= ENTICE_DELAY) {
        game_state.entice_animation_t = 0
      }
    } else {
      game_state.entice_animation_t = Math.min(1, game_state.entice_animation_t + dt / ENTICE_ANIM_DURATION)
      if (game_state.entice_animation_t >= 1) {
        start_entice_mode()
        return
      }
    }
  }

  if (game_state.entice_mode) {
    brain_keys = update_brain(dt, player)
  }

  update_castle_rings(dt, player, game_state)
  if (game_state.round_starting) {
    if (!ring_spawning()) {
      game_state.round_starting = false
    } else {
      const rk = game_state.entice_mode ? brain_keys : keys_pressed
      update_player(dt, rk, game_state)
      update_torpedoes(dt)
      remove_destroyed_torpedoes()
      update_explosions(dt)
      return
    }
  }

  enemy_spawn_timer -= dt
  if (enemy_spawn_timer <= 0 && enemy_sparks.length < game_state.max_enemies) {
    if (Math.random() < ENEMY_SPAWN_CHANCE) {
      spawn_enemies(game_state.max_enemies, 0.5)
    }
    enemy_spawn_timer = ENEMY_SPAWN_INTERVAL
  }

  const active_keys = game_state.entice_mode
    ? brain_keys
    : (ENABLE_AUTOPILOT && game_state.autopilot_on)
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
