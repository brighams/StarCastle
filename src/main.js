import { identity_matrix } from './math.js'
import { clear_screen, draw_spark, init_renderer } from './renderer.js'
import { draw_ship, player, reset_player, update_player } from './player.js'
import { clear_cannon_projectile, draw_castle, init_ring_faces, update_castle_rings } from './castle.js'
import { clear_torpedoes, draw_torpedoes, fire_torpedo, player_torpedoes, update_torpedoes } from './torpedoes.js'
import { clear_enemies, enemies, spawn_enemies, update_enemies } from './enemies.js'
import { clear_explosions, draw_explosions, update_explosions } from './explosions.js'
import { check_collisions } from './collisions.js'
import { draw_ui, toggle_info_box } from './ui.js'
import { draw_stars } from './stars.js'


const MAX_TORPEDO_COUNT = 2
const STARTING_LIVES = 4
const STARTING_ENEMY_SPEED_MULTIPLIER = 10.0
const STARTING_RING_SPEED_MULTIPLIER = 1.0

const canvas = document.getElementById('gameCanvas')
init_renderer(canvas)

export const game_state = {
  lives: STARTING_LIVES,
  enemy_speed_multiplier: STARTING_ENEMY_SPEED_MULTIPLIER,
  ring_speed_modifier: STARTING_RING_SPEED_MULTIPLIER,
  round: 0,
  score: 0,
  max_enemies: 3,
  game_over: true,
  game_started: false,
  round_won: false,
  pyrrhic_victory: false
}

let keys_pressed = {}
let space_pressed = false
let r_pressed = false
let last_time = 0
let enemy_spawn_timer = 1.2

const reset_game = (new_game = true) => {
  if (new_game) {
    game_state.lives = STARTING_LIVES
    game_state.round = 0
    game_state.score = 0
  } else {
    game_state.round += 1
  }

  game_state.max_enemies = 3 + game_state.round
  game_state.enemy_speed_multiplier = new_game ? STARTING_ENEMY_SPEED_MULTIPLIER : (game_state.round * 0.02)
  game_state.ring_speed_modifier = new_game ? STARTING_RING_SPEED_MULTIPLIER : (game_state.round * 0.01)

  game_state.game_over = false
  game_state.game_started = true
  game_state.round_won = false

  toggle_info_box(false)

  clear_explosions()
  clear_enemies()
  clear_torpedoes()
  clear_cannon_projectile()
  reset_player()
  init_ring_faces()

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

  if (e.key === ' ') {
    // FORE TORPEDO LAUNCHER
    if (!game_state.game_over && !game_state.round_won && !space_pressed && player.alive && player_torpedoes.length < MAX_TORPEDO_COUNT) {
      space_pressed = true
      fire_torpedo({
        x: player.x,
        y: player.y,
        angle: player.angle,
        size: 6,
        life: player.torpedo_life,
        speed: player.torpedo_speed,
        color: [1.0, 0.0, 0.5]
      })
    }
  }

  if (e.key === 'r' || e.key === 'R') {
    // AFT TORPEDO/MINE LAUNCHER
    if (!game_state.game_over && !game_state.round_won && !r_pressed && player.alive && player_torpedoes.length < MAX_TORPEDO_COUNT) {
      r_pressed = true
      fire_torpedo({
        x: player.x,
        y: player.y,
        angle: player.angle + Math.PI,
        size: 5,
        speed: player.torpedo_speed / 4,
        life: player.torpedo_life * 0.75,
        is_space_mine: true,
        color: [1.0, 0.0, 0.5]
      })
    }
  }

  if (e.key === 'Enter') {
    if (game_state.game_over) {
      reset_game(true)
    } else if (game_state.round_won) {
      reset_game(false)
    }
  }
})

document.addEventListener('keyup', (e) => {
  check_shift_key(e)
  keys_pressed[e.code] = false

  if (e.key === ' ') {
    space_pressed = false
  }

  if (e.key === 'r' || e.key === 'R') {
    r_pressed = false
  }
})

const game_loop = (current_time) => {
  const dt = (current_time - last_time) / 1000
  last_time = current_time

  enemy_spawn_timer -= dt
  if (enemy_spawn_timer <= 0 && enemies.length < game_state.max_enemies) {
    if (Math.random() < 0.3) {
      spawn_enemies(game_state.max_enemies, 0.5)
    }
    enemy_spawn_timer = 3
  }

  update_castle_rings(dt, player, game_state)
  update_player(dt, keys_pressed, game_state.lives, game_state)
  update_torpedoes(dt)
  update_enemies(dt, player, game_state.game_over, game_state.round_won, game_state.enemy_speed_multiplier)
  check_collisions(player, game_state)
  update_explosions(dt)
  clear_screen()
  draw_stars()

  const transform = identity_matrix()
  draw_castle()
  if (player.alive && !game_state.game_over) {
    draw_ship(player.x, player.y, player.angle, player.size, transform, player.color, player.thrust, player.rotation, player.braking, player.strafing, player.strafe_thrust)
  }
  for (const enemy of enemies) {
    draw_spark({ x: enemy.x, y: enemy.y, angle: enemy.angle, size: enemy.size, transform, color: [1.0, 0.0, 1.0, 1.0] })
  }

  draw_torpedoes()
  draw_explosions()
  draw_ui(game_state.lives, game_state.score, game_state.game_over, game_state.round_won)
  requestAnimationFrame(game_loop)
}

init_ring_faces()
requestAnimationFrame(game_loop)
