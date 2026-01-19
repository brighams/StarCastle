import { update_player } from './player.js'


const AUTOPILOT_KEYS = {
  'KeyQ': false,
  'KeyW': false,
  'KeyE': false,
  'KeyR': false,
  'KeyA': false,
  'KeyS': false,
  'KeyD': false,
  'Space': false
}

const ALL_AUTOPILOT_KEYS = Object.keys(AUTOPILOT_KEYS)
const AUTOPILOT_UPDATE_INTERVAL = 250

const autopilot_state = {
  on: false,
  update_timer: 0,
  keys_pressed: { ...AUTOPILOT_KEYS }
}

export const autopilot_enabled = (enabled, game_state) => {
  if (autopilot_state.on !== enabled) {
    autopilot_state.on = enabled
    autopilot_state.update_timer = 0
    autopilot_state.keys_pressed = { ...AUTOPILOT_KEYS }
    game_state.autopilot_on = enabled
  }
}

export const update_autopilot = (player, game_state, dt) => {
  if (!autopilot_state.on) return

  autopilot_state.update_timer += dt
  if (autopilot_state.update_timer >= AUTOPILOT_UPDATE_INTERVAL) {
    const target_key = ALL_AUTOPILOT_KEYS[Math.floor(Math.random() * ALL_AUTOPILOT_KEYS.length)]
    autopilot_state.keys_pressed[target_key] = !autopilot_state.keys_pressed[target_key]
    update_player(dt, autopilot_state.keys_pressed, game_state)
  }
}
