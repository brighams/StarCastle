import { identity_matrix } from './math.js'
import { init_renderer, clear_screen, draw_ship, draw_spark } from './renderer.js'
import { player, reset_player, update_player } from './player.js'
import { init_ring_faces, update_castle_rings, draw_castle } from './castle.js'
import { player_bullets, fire_bullet, update_bullets, draw_bullets, clear_bullets } from './bullets.js'
import { enemies, spawn_enemy, update_enemies, clear_enemies } from './enemies.js'
import { update_explosions, draw_explosions, clear_explosions } from './explosions.js'
import { check_collisions } from './collisions.js'
import { draw_ui } from './ui.js'
import { draw_stars } from './stars.js'
import { playSound } from "./sound.js";

const canvas = document.getElementById('gameCanvas')
const gl = init_renderer(canvas)

const game_state = {
  lives: 3,
  round: 0,
  game_over: true,
  game_started: false,
  round_won: false,
  enemy_speed_multiplier: 1.0
}

let keys_pressed = {}

const init_game = () => {
  game_state.lives = 3
  game_state.round = 0
  game_state.game_over = false
  game_state.game_started = true
  game_state.round_won = false
  game_state.enemy_speed_multiplier = 10.0

  clear_explosions()
  clear_enemies()
  clear_bullets()
  reset_player()
  init_ring_faces()
  spawn_enemy()
  playSound('game_start', 1.0, 0.1)
}

let space_pressed = false

document.addEventListener('keydown', (e) => {
  keys_pressed[e.key] = true

  if (e.key === ' ') {
    if (game_state.game_over) {
      init_game()
    } else if (game_state.round_won) {
      // Start next round
      game_state.round_won = false
      clear_explosions()
      clear_enemies()
      clear_bullets()
      reset_player()
      init_ring_faces()
      spawn_enemy()
    } else if (!space_pressed && player.alive && player_bullets.length < 3) {
      space_pressed = true
      fire_bullet(player.x, player.y, player.angle, 400)
    }
  }
})

document.addEventListener('keyup', (e) => {
  keys_pressed[e.key] = false

  if (e.key === ' ') {
    space_pressed = false
  }
})

let last_time = 0
let enemy_spawn_timer = 3

const game_loop = (current_time) => {
  const dt = (current_time - last_time) / 1000
  last_time = current_time

  enemy_spawn_timer -= dt
  if (enemy_spawn_timer <= 0) {
    const max_enemies = 3 + game_state.round
    if (enemies.length < max_enemies && Math.random() < 0.3) {
      spawn_enemy()
    }
    enemy_spawn_timer = 3
  }

  update_castle_rings(dt, player)
  update_player(dt, keys_pressed, game_state.lives, game_state)
  update_bullets(dt)
  update_enemies(dt, player, game_state.game_over, game_state.round_won, game_state.enemy_speed_multiplier)
  check_collisions(player, game_state)
  update_explosions(dt)

  clear_screen()

  // Draw stars first (background layer)
  draw_stars()

  const transform = identity_matrix()

  draw_castle()
  if (player.alive && !game_state.game_over) {
    draw_ship(player.x, player.y, player.angle, player.size, transform, player.color, player.thrust, player.rotation, player.braking)
  }

  enemies.forEach(enemy => {
    draw_spark(enemy.x, enemy.y, enemy.angle, enemy.size, transform, [1.0, 0.0, 1.0, 1.0])
  })

  draw_bullets([1.0, 1.0, 0.0, 1.0])
  draw_explosions()
  draw_ui(game_state.lives, game_state.round, game_state.game_over, game_state.round_won)

  requestAnimationFrame(game_loop)
}

init_ring_faces()
requestAnimationFrame(game_loop)
