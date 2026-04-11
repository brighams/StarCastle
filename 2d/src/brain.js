import { BRAIN_TICK,
  BRAIN_BURST_DURATION,
  BRAIN_NEAR_THRESHOLD,
  BRAIN_FAR_THRESHOLD,
  BRAIN_AIM_TOLERANCE,
  BRAIN_AIM_JITTER,
  BRAIN_FIRE_CHANCE } from './constants.js'

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
  if (brain_timer > BRAIN_BURST_DURATION) {
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
  const dx   = -player.x
  const dy   = -player.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  // Angle the ship must face to point at the castle
  const target_angle = Math.atan2(dx, -dy)

  // Human perception: add a little jitter so aim isn't robotic
  const perceived_error = normalize_angle(target_angle - player.angle)
    + (Math.random() - 0.5) * BRAIN_AIM_JITTER

  const rotate_right = perceived_error >  BRAIN_AIM_TOLERANCE
  const rotate_left  = perceived_error < -BRAIN_AIM_TOLERANCE
  const well_aimed   = !rotate_left && !rotate_right

  // Distance correction — only engage when nose is roughly on target
  const thrust_forward  = well_aimed && dist > BRAIN_FAR_THRESHOLD
  const thrust_backward = well_aimed && dist < BRAIN_NEAR_THRESHOLD

  // Orbit: strafe perpendicular to castle when aimed and at comfortable range
  const in_orbit_range = dist >= BRAIN_NEAR_THRESHOLD && dist <= BRAIN_FAR_THRESHOLD
  const strafe_right = well_aimed && in_orbit_range && orbit_direction > 0
  const strafe_left  = well_aimed && in_orbit_range && orbit_direction < 0

  // Fire when aimed, with human-scale randomness
  const fire = well_aimed && Math.random() < BRAIN_FIRE_CHANCE

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
