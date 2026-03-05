// UI rendering - text overlay

export function updateUI(lives, score, game_over, round_won, round, game_started, camera) {
  const uiElement = document.getElementById('ui')
  const overlayElement = document.getElementById('overlay')

  let uiText = `Lives: ${lives}<br>Score: ${score}<br>Round: ${round}`

  // Only show camera info when not playing (menu/game over with orbital camera)
  if (camera && (!game_started || game_over)) {
    uiText += `<br><br>Camera:<br>Distance: ${camera.distance}<br>Pitch: ${camera.pitch}<br>Yaw: ${camera.yaw}`
  }

  uiElement.innerHTML = uiText

  if (game_over) {
    overlayElement.innerHTML = `
      <div class="title">GAME OVER</div>
      <div class="subtitle">Final Score: ${score}</div>
      <div class="subtitle">A/D = Strafe | W/S = Thrust/Reverse | Mouse = Aim | Space = Fire</div>
      <div class="subtitle">Middle Mouse = Orbital Camera | Wheel = Zoom</div>
      <div class="subtitle">Press ENTER to restart</div>
    `
  } else if (!game_over && !game_started) {
    overlayElement.innerHTML = `
      <div class="title">STARKEEPER ONE - 3D</div>
      <div class="subtitle">A/D = Strafe | W/S = Thrust/Reverse | Mouse = Aim | Space = Fire</div>
      <div class="subtitle">Middle Mouse = Orbital Camera | Wheel = Zoom</div>
      <div class="subtitle">Press ENTER to start</div>
    `
  } else {
    overlayElement.innerHTML = ''
  }
}
