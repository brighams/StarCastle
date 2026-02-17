# StarCastle Test Suite

This directory contains comprehensive unit tests for the StarCastle game, focusing on collision detection and game state transitions.

## Overview

The test suite validates critical game mechanics including:
- Collision detection (player, enemies, torpedoes, rings, castle)
- Game state transitions (player destruction, castle destruction)
- Victory conditions (normal and pyrrhic victories)
- Game over scenarios

## Test Files

### `collisionDetection.test.js`
Tests for pure collision detection functions that determine if game objects intersect:
- **Circle-point collisions**: Basic geometric collision detection
- **Circle-circle collisions**: For player/enemy interactions
- **Torpedo-ring collisions**: Line segment intersection tests
- **Torpedo-castle collisions**: Core destruction mechanics
- **Player-ring collisions**: Tests for player hitting shields
- **Enemy-player collisions**: Tests for enemy hitting player
- **Batch collision detection**: Tests checking multiple collisions in one frame

**Coverage**: 29 tests

### `gameState.test.js`
Tests for pure game state management functions:
- **State creation**: Initial game state setup
- **Player destruction**: Life decrements and respawn logic
- **Game over detection**: When player runs out of lives
- **Castle destruction**: Score calculation
- **Round victory**: Normal and pyrrhic victory conditions
- **Multi-round progression**: State transitions across rounds

**Coverage**: 27 tests

### `gameInteractions.test.js`
Integration tests that combine collision detection with game state transitions:
- **Player death scenarios**: By enemy, cannon, ring collision
- **Castle destruction scenarios**: By torpedo, score tracking
- **Victory scenarios**: Normal victory (player alive), pyrrhic victory (player dead)
- **Simultaneous destruction**: Player and castle destroyed in same frame
- **Edge cases**: Negative lives, multiple deaths, bonus life awards

**Coverage**: 17 tests

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Architecture

The refactoring introduced three key modules for testability:

### `src/gameState.js`
Pure functions for game state management:
- `createGameState()`: Creates initial game state
- `handlePlayerDestruction()`: Immutable state update when player dies
- `handleCastleDestruction()`: Immutable state update when castle destroyed
- `checkRoundVictory()`: Determines victory conditions
- `handleRoundWon()`: State update for round completion
- `shouldGameBeOver()`: Game over detection

### `src/collisionDetection.js`
Pure collision detection functions (no side effects):
- `circlePointCollision()`: Basic circle-point intersection
- `circleCircleCollision()`: Circle-circle intersection
- `torpedoRingCollision()`: Line segment intersection
- `torpedoCastleCoreCollision()`: Castle core hit detection
- `torpedoEnemyCollision()`: Torpedo-enemy detection
- `projectilePlayerCollision()`: Cannon projectile-player detection
- `playerRingCollision()`: Player-ring intersection
- `enemyPlayerCollision()`: Enemy-player collision
- `checkAllTorpedoCollisions()`: Batch collision checking

### `src/collisionHandlers.js`
Collision event handlers that coordinate detection with game effects:
- `handleTorpedoRingHit()`: Ring destruction effects
- `handleTorpedoCastleHit()`: Castle destruction effects
- `handleTorpedoEnemyHit()`: Enemy destruction effects
- `handlePlayerRingHit()`: Player-ring collision effects
- `handlePlayerEnemyHit()`: Player-enemy collision effects
- `handlePlayerCannonHit()`: Player-cannon collision effects
- `checkAndHandleCollisions()`: Main collision coordination

## Key Test Scenarios

### Player Destruction
- Player hit by enemy → lives decremented, respawn initiated
- Player hit by cannon → lives decremented, respawn initiated
- Player hit by ring → lives decremented, respawn initiated
- Player runs out of lives → game over triggered

### Castle Destruction
- Torpedo hits castle core → castle destroyed, score incremented
- Score calculation based on current round number

### Victory Conditions
- **Normal Victory**: Castle destroyed while player alive
  - Round won flag set to true
  - Pyrrhic victory flag set to false
  - Bonus life awarded

- **Pyrrhic Victory**: Castle destroyed while player dead
  - Round won flag set to true
  - Pyrrhic victory flag set to true
  - Bonus life still awarded (enables continuation)

### Simultaneous Events
- Player and castle destroyed in same frame
  - Both state transitions processed
  - Pyrrhic victory detected
  - Bonus life allows game continuation

## Design Principles

1. **Pure Functions**: Collision detection and state management use pure functions that don't mutate inputs or have side effects
2. **Immutability**: State transitions return new state objects rather than mutating existing ones
3. **Separation of Concerns**: Detection logic separated from effect/rendering logic
4. **Testability**: All critical game logic can be tested without DOM or rendering
5. **Integration Testing**: Integration tests verify the full chain of detection → state transition → effects

## Coverage Goals

The test suite aims for comprehensive coverage of:
- ✅ All collision detection paths
- ✅ All game state transitions
- ✅ Victory conditions (normal and pyrrhic)
- ✅ Game over scenarios
- ✅ Edge cases (simultaneous events, negative lives, etc.)

Current coverage: **73 tests** covering collision detection, game state management, and game interaction scenarios.
