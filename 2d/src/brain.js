import { CENTER_X, CENTER_Y } from './constants.js'

const BRAIN_TICK       = 0.70   // total cycle length
const BURST_DURATION   = 0.35   // thrusters active for first half, coast the rest
const ORBIT_RADIUS     = 220    // desired distance from castle
const NEAR_THRESHOLD   = 160    // retreat if closer than this
const FAR_THRESHOLD    = 290    // approach if farther than this
const AIM_TOLERANCE    = 0.22   // ~12 degrees — not pixel-perfect
const AIM_JITTER       = 0.08   // ±4.5 degrees of human perception noise
const FIRE_CHANCE      = 0.35   // probability of firing when well-aimed each tick

let brain_timer = 0
let orbit_direction = 1   // 1 = CCW (strafe_right), -1 = CW (strafe_left)

let current_commands = make_commands()

function make_commands() {
  return {
    rotate_left:    false,
    rotate_right:   false,
    thrust_forward: false,
    thrust_backward: false,
    strafe_left:    false,
    strafe_right:   false,
    fire:           false,
  }
}

// Translates abstract commands → key state the player system understands.
// Shift+A = strafe_right (CCW orbit), Shift+D = strafe_left (CW orbit).
// Rotation and strafe are mutually exclusive (they share A/D keys).
export const commands_to_keys = (cmds) => ({
  KeyW:     cmds.thrust_forward,
  KeyS:     cmds.thrust_backward,
  KeyA:     cmds.rotate_left  || cmds.strafe_right,
  KeyD:     cmds.rotate_right || cmds.strafe_left,
  ShiftKey: cmds.strafe_left  || cmds.strafe_right,
  Space:    cmds.fire,
})

export const reset_brain = () => {
  brain_timer = 0
  orbit_direction = Math.random() > 0.5 ? 1 : -1
  current_commands = make_commands()
}

export const update_brain = (dt, player) => {
  brain_timer += dt
  if (brain_timer >= BRAIN_TICK) {
    brain_timer -= BRAIN_TICK
    current_commands = think(player)
  }
  // Coast during the second half of each cycle — creates visible thruster pauses
  if (brain_timer > BURST_DURATION) {
    return commands_to_keys(make_commands())
  }
  return commands_to_keys(current_commands)
}

const normalize_angle = (a) => {
  while (a >  Math.PI) a -= 2 * Math.PI
  while (a < -Math.PI) a += 2 * Math.PI
  return a
}

const think = (player) => {
  const dx   = CENTER_X - player.x
  const dy   = CENTER_Y - player.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  // Angle the ship must face to point at the castle
  const target_angle = Math.atan2(dx, -dy)

  // Human perception: add a little jitter so aim isn't robotic
  const perceived_error = normalize_angle(target_angle - player.angle)
    + (Math.random() - 0.5) * AIM_JITTER

  const rotate_right = perceived_error >  AIM_TOLERANCE
  const rotate_left  = perceived_error < -AIM_TOLERANCE
  const well_aimed   = !rotate_left && !rotate_right

  // Distance correction — only engage when nose is roughly on target
  const thrust_forward  = well_aimed && dist > FAR_THRESHOLD
  const thrust_backward = well_aimed && dist < NEAR_THRESHOLD

  // Orbit: strafe perpendicular to castle when aimed and at comfortable range
  const in_orbit_range = dist >= NEAR_THRESHOLD && dist <= FAR_THRESHOLD
  const strafe_right = well_aimed && in_orbit_range && orbit_direction > 0
  const strafe_left  = well_aimed && in_orbit_range && orbit_direction < 0

  // Fire when aimed, with human-scale randomness
  const fire = well_aimed && Math.random() < FIRE_CHANCE

  return {
    rotate_left,
    rotate_right,
    thrust_forward,
    thrust_backward,
    strafe_left,
    strafe_right,
    fire,
  }
}
