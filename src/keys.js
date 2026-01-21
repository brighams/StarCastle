// ========== REFERENCE NOT USED
const KeyBindings = {
  'KeyW': 'thrust_forward',
  'KeyS': 'thrust_reverse',
  'KeyA': 'strafe_left',
  'KeyQ': 'strafe_left',
  'KeyD': 'strafe_right',
  'KeyE': 'strafe_right',
  'Space': 'fire_torpedo',
  'KeyR': 'fire_space_mine',
  'ShiftKey': 'shift_key'
}

// ========== CLONE TO PROCESS INPUT EVENTS
export const Actions = {
  thrust_forward: false,
  thrust_reverse: false,
  rotate_left: false,
  rotate_right: false,
  strafe_left: false,
  strafe_right: false,
  fire_torpedo: false,
  fire_space_mine: false,
  shift_key: false
}

const send_actions = (actions) => {
  const event = new CustomEvent('actions', { detail: actions })
  document.dispatchEvent(event)
}

const check_keys = (e, keyPressed = true) => {
  const actions = { ...Actions }
  actions['ShiftKey'] = e.shiftKey
  if (e.key in KeyBindings) {
    actions[e.key] = keyPressed
  }
  return actions
}

document.addEventListener('keydown', (e) => {
  const actions = check_keys(false)
  send_actions(actions)
})

document.addEventListener('keyup', (e) => {
  const actions = check_keys(false)
  send_actions(actions)
})
