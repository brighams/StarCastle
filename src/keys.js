//
//  FOR LATER
//
// const KeyBindings = {
//   'w': 'thrust_forward',
//   'W': 'thrust_forward',
//
//   's': 'thrust_reverse',
//   'S': 'thrust_reverse',
//
//   'a': 'rotate_left',
//
//   'A': 'strafe_left',
//   'q': 'strafe_left',
//   'Q': 'strafe_left',
//
//   'd': 'rotate_right',
//
//   'D': 'strafe_right',
//   'e': 'strafe_right',
//   'E': 'strafe_right',
//
//   ' ': 'fire_torpedo',
//   'r': 'fire_aft_torpedo',
//   'R': 'fire_aft_torpedo',
//
//   'Enter': 'start_game'
// }
//
// export const Actions = {
//   thrust_forward: false,
//   thrust_reverse: false,
//   rotate_left: false,
//   rotate_right: false,
//   strafe_left: false,
//   strafe_right: false,
//   fire_torpedo: false,
//   fire_aft_torpedo: false,
//   start_game: false
// }
//
// // Track previous frame's actions for change detection
// const last_actions = { ...Actions }
//
// // Track raw key states
// const key_state = {}
//
// document.addEventListener('keydown', (e) => {
//   if (e.key in KeyBindings) {
//     key_state[e.key] = true
//   }
// })
//
// document.addEventListener('keyup', (e) => {
//   if (e.key in KeyBindings) {
//     key_state[e.key] = false
//   }
// })
//
// export const check_keys = () => {
//   const updated_actions = {}
//
//   // Reset all actions to false
//   for (const action in Actions) {
//     updated_actions[action] = false
//   }
//
//   // Set actions based on current key states
//   for (const key in key_state) {
//     if (key_state[key] && key in KeyBindings) {
//       Actions[KeyBindings[key]] = true
//     }
//   }
//
//   // Find actions that changed
//   for (const action in Actions) {
//     if (Actions[action] !== last_actions[action]) {
//       updated_actions.push(action)
//     }
//   }
//
//   // Update last_actions for next frame
//   for (const action in Actions) {
//     last_actions[action] = Actions[action]
//   }
//
//   return updated_actions
// }
