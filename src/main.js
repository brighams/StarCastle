import { identity_matrix } from './math.js'
import { clear_screen, draw_spark, init_renderer } from './renderer.js'
import { draw_ship, player, reset_player, update_player } from './player.js'
import { clear_cannon_projectile, draw_castle, init_ring_faces, update_castle_rings } from './castle.js'
import { clear_bullets, draw_bullets, fire_bullet, player_bullets, update_bullets } from './bullets.js'
import { clear_enemies, enemies, spawn_enemies, update_enemies } from './enemies.js'
import { clear_explosions, draw_explosions, update_explosions } from './explosions.js'
import { check_collisions } from './collisions.js'
import { draw_ui, toggle_info_box } from './ui.js'
import { draw_stars } from './stars.js'


const MAX_BULLETS = 2

const canvas = document.getElementById('gameCanvas')
init_renderer(canvas)

export const game_state = {
  lives: 3,
  round: 0,
  score: 0,
  max_enemies: 3,
  game_over: true,
  game_started: false,
  round_won: false,
  pyrrhic_victory: false,
  enemy_speed_multiplier: 1.0
}

let keys_pressed = {}
let space_pressed = false
let last_time = 0
let enemy_spawn_timer = 1.2

const reset_game = (new_game = true) => {
  if (new_game) {
    game_state.lives = 3
    game_state.round = 0
    game_state.score = 0
  } else {
    game_state.round += 1
  }

  game_state.max_enemies = 3 + game_state.round
  game_state.game_over = false
  game_state.game_started = true
  game_state.round_won = false
  game_state.enemy_speed_multiplier = 10.0

  toggle_info_box(game_state.game_over)

  clear_explosions()
  clear_enemies()
  clear_bullets()
  clear_cannon_projectile()
  reset_player()
  init_ring_faces()

  enemy_spawn_timer = 1.2

  setTimeout(() => spawn_enemies(game_state.max_enemies / 2, 1.0), 5000)
}

document.addEventListener('keydown', (e) => {
  keys_pressed[e.key] = true

  if (e.key === ' ') {
    if (!game_state.game_over && !game_state.round_won && !space_pressed && player.alive && player_bullets.length < MAX_BULLETS) {
      space_pressed = true
      fire_bullet(player.x, player.y, player.angle, 450)
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
  keys_pressed[e.key] = false

  if (e.key === ' ') {
    space_pressed = false
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

  update_castle_rings(dt, player)
  update_player(dt, keys_pressed, game_state.lives, game_state)
  update_bullets(dt)
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
    draw_spark(enemy.x, enemy.y, enemy.angle, enemy.size, transform, [1.0, 0.0, 1.0, 1.0])
  }

  draw_bullets([1.0, 1.0, 0.0, 1.0])
  draw_explosions()
  draw_ui(game_state.lives, game_state.score, game_state.game_over, game_state.round_won)
  requestAnimationFrame(game_loop)
}

init_ring_faces()
requestAnimationFrame(game_loop)
