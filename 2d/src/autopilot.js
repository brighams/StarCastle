import { CENTER_X, CENTER_Y, MAX_TORPEDO_COUNT, CANVAS_SIZE } from './constants.js'
import { get_castle_rings, get_castle_projectile } from './castle.js'
import { enemy_sparks } from './enemies.js'
import { player_torpedoes } from './torpedoes.js'


const autopilot_state = {
  enabled: false,
  decision_timer: 0,
  current_target: null,
  evasion_mode: false,
  attack_mode: 'castle',
  circling_direction: 1,
  last_mine_drop: 0
}

const DECISION_INTERVAL = 0.1 
const OPTIMAL_DISTANCE = 220 
const MIN_SAFE_DISTANCE = 140
const MAX_SAFE_DISTANCE = 300
const SCREEN_MARGIN = 100
const MINE_COOLDOWN = 2.0 

/**
 * Toggle autopilot on/off
 */
export const autopilot_enabled = (enabled, game_state) => {
  autopilot_state.enabled = enabled
  game_state.autopilot_on = enabled
  if (enabled) {
    resetAutopilot()
  }
}


/**
 * Main autopilot update function
 */
export const update_autopilot = (player, game_state, dt) => {
  if (!autopilot_state.enabled || !player.alive || game_state.game_over) {
    return {}
  }

  autopilot_state.decision_timer -= dt
  if (autopilot_state.decision_timer <= 0) {
    autopilot_state.decision_timer = DECISION_INTERVAL
    updateDecisions(player, game_state)
  }

  return generateKeyPresses(player, dt)
}

/**
 * Reset autopilot state
 */
const resetAutopilot = () => {
  autopilot_state.current_target = null
  autopilot_state.evasion_mode = false
  autopilot_state.attack_mode = 'castle'
  autopilot_state.decision_timer = 0
  autopilot_state.circling_direction = Math.random() > 0.5 ? 1 : -1
  autopilot_state.being_chased = false
  autopilot_state.last_mine_drop = MINE_COOLDOWN // Can drop mine immediately
}
