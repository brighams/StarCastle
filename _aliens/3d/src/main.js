// Main game loop - 3D version

import { initRenderer, clearScreen, setViewMatrix, drawWireframeModel, drawLine, drawStarfield, getCanvas } from './renderer.js'
import { createGameState } from './gameState.js'
import { player, resetPlayer, updatePlayer } from './player.js'
import { castle, resetCastle, updateCastle, ringSpawning } from './castle.js'
import { torpedoes, updateTorpedoes, clearTorpedoes, removeDestroyedTorpedoes } from './torpedoes.js'
import { enemies, spawnEnemies, updateEnemies, clearEnemies, removeDestroyedEnemies } from './enemies.js'
import { checkCollisions } from './collisions.js'
import { explosions, updateExplosions, clearExplosions } from './explosions.js'
import { updateUI } from './ui.js'
import { mat4, vec3 } from './math3d.js'
import { createShipModel, createRingModel, createHexagonModel, createCannonModel, createSparkModel } from './models.js'
import {
  CASTLE_CENTRAL_HEX_RADIUS,
  CANNON_SPARK_COLOR,
  ENEMY_PRIMARY_COLOR,
  ENEMY_SECONDARY_COLOR,
  ENEMY_SECONDARY_SIZE_FACTOR,
  ENEMY_SPARK_SIZE
} from './constants.js'

// Initialize canvas
const canvas = document.getElementById('gameCanvas')
if (!initRenderer(canvas)) {
  alert('WebGL not supported!')
}

// Game state
const gameState = createGameState()

// Camera state
const camera = {
  distance: 150,
  pitch: 0.3,
  yaw: 0,
  target: { x: 0, y: 0, z: 0 }
}

// Input state
const input = {
  keys: {},
  keyPressed: {},
  mouse: { dx: 0, dy: 0, middleDown: false, lastX: 0, lastY: 0 }
}

// Models (cache)
const shipModel = createShipModel()
const hexModel = createHexagonModel(CASTLE_CENTRAL_HEX_RADIUS)
const cannonModel = createCannonModel(castle.cannon.length)
const sparkModel = createSparkModel(10)
const ringModels = castle.rings.map(ring => createRingModel(ring.radius, ring.segments))

let lastTime = 0
let enemySpawnTimer = 1.2

// Mouse handling - no pointer lock
canvas.addEventListener('mousedown', (e) => {
  if (e.button === 1) { // Middle mouse
    input.mouse.middleDown = true
    input.mouse.lastX = e.clientX
    input.mouse.lastY = e.clientY
    e.preventDefault()
  }
})

document.addEventListener('mouseup', (e) => {
  if (e.button === 1) {
    input.mouse.middleDown = false
  }
})

document.addEventListener('mousemove', (e) => {
  if (input.mouse.middleDown) {
    const dx = e.clientX - input.mouse.lastX
    const dy = e.clientY - input.mouse.lastY

    camera.yaw -= dx * 0.005
    camera.pitch += dy * 0.005

    // Clamp pitch
    camera.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.pitch))

    input.mouse.lastX = e.clientX
    input.mouse.lastY = e.clientY
  }

  // For ship rotation
  if (player.alive && !gameState.game_over) {
    input.mouse.dx = e.movementX * 0.002
    input.mouse.dy = e.movementY * 0.002
  }
})

canvas.addEventListener('wheel', (e) => {
  camera.distance += e.deltaY * 0.1
  camera.distance = Math.max(50, Math.min(500, camera.distance))
  e.preventDefault()
})

// Keyboard
document.addEventListener('keydown', (e) => {
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    input.keys['ShiftKey'] = true
  }

  if (!input.keys[e.code]) {
    input.keys[e.code] = true
    input.keyPressed[e.code] = true
  }

  if (e.key === 'Enter' && !e.repeat) {
    if (gameState.game_over || (!gameState.game_started && gameState.round === 0)) {
      resetGame(true)
    } else if (gameState.round_won) {
      resetGame(false)
    }
  }
})

document.addEventListener('keyup', (e) => {
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    input.keys['ShiftKey'] = false
  }
  input.keys[e.code] = false
  input.keyPressed[e.code] = false
})

function resetGame(newGame = true) {
  if (newGame) {
    gameState.lives = 4
    gameState.round = 0
    gameState.score = 0
  } else {
    gameState.round += 1
  }

  gameState.max_enemies = 3 + gameState.round
  gameState.enemy_speed_multiplier = newGame ? 1.0 : (1.0 + gameState.round * 0.02)
  gameState.ring_speed_modifier = newGame ? 1.0 : (1.0 + gameState.round * 0.01)

  gameState.game_over = false
  gameState.game_started = true
  gameState.round_won = false
  gameState.round_starting = true

  clearExplosions()
  clearEnemies()
  clearTorpedoes()
  resetPlayer()
  resetCastle()

  enemySpawnTimer = 1.2

  setTimeout(() => spawnEnemies(Math.floor(gameState.max_enemies / 2), 1.0), 5000)
}

function updateGame(currentTime) {
  const dt = (currentTime - lastTime) / 1000
  lastTime = currentTime

  // Reset mouse delta
  input.mouse.dx = 0
  input.mouse.dy = 0

  updateCastle(dt, player, gameState)

  if (gameState.round_starting) {
    if (!ringSpawning()) {
      gameState.round_starting = false
    } else {
      updatePlayer(dt, input, gameState)
      updateTorpedoes(dt)
      removeDestroyedTorpedoes()
      updateExplosions(dt)
      return
    }
  }

  enemySpawnTimer -= dt
  if (enemySpawnTimer <= 0 && enemies.length < gameState.max_enemies) {
    if (Math.random() < 0.3) {
      spawnEnemies(gameState.max_enemies, 0.5)
    }
    enemySpawnTimer = 3
  }

  updatePlayer(dt, input, gameState)
  updateTorpedoes(dt)
  removeDestroyedTorpedoes()
  updateEnemies(dt, player, gameState.game_over, gameState.round_won, gameState.enemy_speed_multiplier)
  removeDestroyedEnemies()
  checkCollisions(gameState)
  updateExplosions(dt)
}

function renderGame() {
  clearScreen()

  let cameraPos, targetPos

  if (player.alive && gameState.game_started && !gameState.game_over) {
    // Fixed camera: behind and above the ship, always looking at it
    // Camera stays at a fixed offset, doesn't rotate with ship
    cameraPos = {
      x: player.ship.position.x,
      y: player.ship.position.y + 50,  // 50 units above
      z: player.ship.position.z + 100  // 100 units back
    }

    // Always look at the ship
    targetPos = {
      x: player.ship.position.x,
      y: player.ship.position.y,
      z: player.ship.position.z
    }
  } else {
    // Orbital camera when not playing (menu, game over)
    camera.target = { x: 0, y: 0, z: 0 }

    cameraPos = {
      x: camera.target.x + Math.sin(camera.yaw) * Math.cos(camera.pitch) * camera.distance,
      y: camera.target.y + Math.sin(camera.pitch) * camera.distance,
      z: camera.target.z + Math.cos(camera.yaw) * Math.cos(camera.pitch) * camera.distance
    }

    targetPos = camera.target
  }

  const viewMatrix = mat4.lookAt(cameraPos, targetPos, { x: 0, y: 1, z: 0 })
  setViewMatrix(viewMatrix)

  // Draw starfield first (background)
  drawStarfield(cameraPos)

  // Draw castle
  drawWireframeModel(hexModel, [1, 1, 1, 1], mat4.rotateY(castle.center_rotation))

  // Draw cannon
  const cannonYawMatrix = mat4.rotateY(castle.cannon.angle_yaw)
  const cannonPitchMatrix = mat4.rotateX(-castle.cannon.angle_pitch)
  const cannonMatrix = mat4.multiply(cannonYawMatrix, cannonPitchMatrix)
  drawWireframeModel(cannonModel, [0.5, 0.5, 0.5, 1], cannonMatrix)

  // Draw cannon projectile
  if (castle.cannon_projectile) {
    const projMatrix = mat4.translate(
      castle.cannon_projectile.position.x,
      castle.cannon_projectile.position.y,
      castle.cannon_projectile.position.z
    )
    drawWireframeModel(sparkModel, CANNON_SPARK_COLOR, projMatrix)
  }

  // Draw rings (wireframe only)
  for (let i = 0; i < castle.rings.length; i++) {
    const ring = castle.rings[i]
    const ringModel = ringModels[i]

    const scale = ring.spawn_radius / ring.radius
    const scaleMatrix = mat4.multiply(
      mat4.multiply(
        mat4.identity(),
        mat4.rotateY(ring.rotation)
      ),
      [
        scale, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, scale, 0,
        0, 0, 0, 1
      ]
    )

    // Draw only non-destroyed segments
    const filteredEdges = []
    for (let j = 0; j < ring.segments; j++) {
      if (!ring.faces[j].destroyed) {
        const baseIdx = j * 8
        filteredEdges.push(
          [baseIdx + 0, baseIdx + 4],  // top outer
          [baseIdx + 1, baseIdx + 5],  // top inner
          [baseIdx + 2, baseIdx + 6],  // bottom outer
          [baseIdx + 3, baseIdx + 7],  // bottom inner
          [baseIdx + 0, baseIdx + 2],  // outer vertical
          [baseIdx + 1, baseIdx + 3],  // inner vertical
          [baseIdx + 0, baseIdx + 1],  // top radial
          [baseIdx + 2, baseIdx + 3]   // bottom radial
        )
      }
    }

    const filteredModel = {
      vertices: ringModel.vertices,
      edges: filteredEdges
    }

    drawWireframeModel(filteredModel, ring.color, scaleMatrix)
  }

  // Draw player ship
  if (player.alive && !gameState.game_over) {
    const shipMatrix = mat4.multiply(
      mat4.multiply(
        mat4.multiply(
          mat4.translate(player.ship.position.x, player.ship.position.y, player.ship.position.z),
          mat4.rotateY(player.ship.rotation.yaw)
        ),
        mat4.rotateX(player.ship.rotation.pitch)
      ),
      mat4.rotateZ(player.ship.rotation.roll)
    )

    drawWireframeModel(shipModel, [1, 1, 1, 1], shipMatrix)

    // Calculate ship direction vectors
    const forward = {
      x: -Math.sin(player.ship.rotation.yaw) * Math.cos(player.ship.rotation.pitch),
      y: Math.sin(player.ship.rotation.pitch),
      z: -Math.cos(player.ship.rotation.yaw) * Math.cos(player.ship.rotation.pitch)
    }
    const right = {
      x: Math.cos(player.ship.rotation.yaw),
      y: 0,
      z: -Math.sin(player.ship.rotation.yaw)
    }

    // Main thrust (W key)
    if (player.ship.thrust > 0) {
      const thrustLength = 20 * player.ship.thrust
      const thrustPos = vec3.add(player.ship.position, vec3.scale(forward, -12))
      const thrustEnd = vec3.add(thrustPos, vec3.scale(forward, -thrustLength))
      drawLine(thrustPos, thrustEnd, [1, 0.5, 0, player.ship.thrust * 0.8])

      // Add side flames
      const leftFlame = vec3.add(thrustPos, vec3.scale(right, -3))
      const leftFlameEnd = vec3.add(leftFlame, vec3.scale(forward, -thrustLength * 0.7))
      drawLine(leftFlame, leftFlameEnd, [1, 0.3, 0, player.ship.thrust * 0.6])

      const rightFlame = vec3.add(thrustPos, vec3.scale(right, 3))
      const rightFlameEnd = vec3.add(rightFlame, vec3.scale(forward, -thrustLength * 0.7))
      drawLine(rightFlame, rightFlameEnd, [1, 0.3, 0, player.ship.thrust * 0.6])
    }

    // Reverse/Brake thrust (S key)
    if (player.ship.braking) {
      const brakeLength = 15
      const brakePos = vec3.add(player.ship.position, vec3.scale(forward, 12))
      const brakeEnd = vec3.add(brakePos, vec3.scale(forward, brakeLength))
      drawLine(brakePos, brakeEnd, [1, 0, 0.5, 0.9])
    }

    // Strafe thrust (A/D keys)
    if (player.ship.strafe_thrust > 0) {
      const strafeLength = 15 * player.ship.strafe_thrust
      const strafeColor = [1, 0.5, 0, player.ship.strafe_thrust * 0.9]

      if (player.ship.strafing < 0) { // Strafing left - jets on right
        const jetPos = vec3.add(player.ship.position, vec3.scale(right, 8))
        const jetEnd = vec3.add(jetPos, vec3.scale(right, strafeLength))
        drawLine(jetPos, jetEnd, strafeColor)
      } else if (player.ship.strafing > 0) { // Strafing right - jets on left
        const jetPos = vec3.add(player.ship.position, vec3.scale(right, -8))
        const jetEnd = vec3.add(jetPos, vec3.scale(right, -strafeLength))
        drawLine(jetPos, jetEnd, strafeColor)
      }
    }

    // Attitude thrusters (mouse rotation)
    if (input.mouse.dx !== 0 || input.mouse.dy !== 0) {
      const jetColor = [1, 0, 0.5, 0.9]
      const jetLength = 8

      if (input.mouse.dx !== 0) {
        const leftJetPos = vec3.add(player.ship.position, vec3.scale(right, -8))
        const leftJetEnd = vec3.add(leftJetPos, vec3.scale(right, input.mouse.dx > 0 ? jetLength : -jetLength))
        drawLine(leftJetPos, leftJetEnd, jetColor)

        const rightJetPos = vec3.add(player.ship.position, vec3.scale(right, 8))
        const rightJetEnd = vec3.add(rightJetPos, vec3.scale(right, input.mouse.dx > 0 ? -jetLength : jetLength))
        drawLine(rightJetPos, rightJetEnd, jetColor)
      }
    }
  }

  // Draw torpedoes
  for (const torpedo of torpedoes) {
    if (!torpedo.alive) continue

    const torpedoMatrix = mat4.translate(
      torpedo.position.x + torpedo.jitter.x,
      torpedo.position.y + torpedo.jitter.y,
      torpedo.position.z + torpedo.jitter.z
    )
    const torpedoModel = createSparkModel(torpedo.size)
    drawWireframeModel(torpedoModel, torpedo.color, torpedoMatrix)
  }

  // Draw enemies
  for (const enemy of enemies) {
    if (!enemy.alive) continue

    const enemyMatrix = mat4.translate(enemy.position.x, enemy.position.y, enemy.position.z)
    drawWireframeModel(sparkModel, ENEMY_PRIMARY_COLOR, enemyMatrix)

    const secondaryModel = createSparkModel(ENEMY_SPARK_SIZE * ENEMY_SECONDARY_SIZE_FACTOR)
    drawWireframeModel(secondaryModel, ENEMY_SECONDARY_COLOR, enemyMatrix)
  }

  // Draw explosions
  for (const explosion of explosions) {
    const alpha = explosion.life / explosion.initial_life

    for (const particle of explosion.particles) {
      const start = particle.position
      const end = {
        x: start.x + Math.cos(particle.rotation) * particle.length,
        y: start.y,
        z: start.z + Math.sin(particle.rotation) * particle.length
      }

      drawLine(start, end, [...explosion.color, alpha])
    }
  }

  // Display camera coordinates
  updateUI(
    gameState.lives,
    gameState.score,
    gameState.game_over,
    gameState.round_won,
    gameState.round,
    gameState.game_started,
    { distance: camera.distance.toFixed(1), pitch: camera.pitch.toFixed(2), yaw: camera.yaw.toFixed(2) }
  )
}

function gameLoop(currentTime) {
  updateGame(currentTime)
  renderGame()
  requestAnimationFrame(gameLoop)
}

// Start the game
resetCastle()
requestAnimationFrame(gameLoop)
