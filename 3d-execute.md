# 3D Port Planning Document (StarCastle)

## 1. 2D System Analysis

### Scope Analyzed
- Canonical gameplay source: `2d/src/*.js` and `2d/src/tests/*`
- Runtime entry/UI shell: `2d/index.html`, `2d/index.css`
- Supporting behavior docs: `2d/AUTOPILOT.md`, `2d/FEATURE_FLAGS.md`, `2d/REFACTORING_SUMMARY.md`
- Excluded from gameplay analysis: `2d/node_modules`, `2d/dist` (build/dependency artifacts)

### Game Architecture

#### Main loop (`src/main.js`)
- Loop pattern: `requestAnimationFrame(game_loop)`
- Per-frame pipeline:
  1. `update_game(current_time)`
  2. `render_frame()`
- Delta time: `dt = (current_time - last_time) / 1000`

#### Update pipeline order
1. `update_castle_rings(dt, player, game_state)`
2. Round intro gate:
   - If rings still spawning: update player/torpedoes/explosions only, then return early
3. Enemy spawn timer handling
4. Input source selection:
   - keyboard keys
   - or autopilot-generated keys (feature-flagged)
5. `update_player(dt, active_keys, game_state)`
6. `update_torpedoes(dt)` + cleanup
7. `update_enemies(dt, player, ...)` + cleanup
8. `check_collisions(player, game_state)`
9. `update_explosions(dt)`

#### Render pipeline order
1. Clear screen
2. Draw stars
3. Draw castle
4. Draw player (if alive and not game over)
5. Draw enemies
6. Draw torpedoes
7. Draw explosions
8. Draw UI overlays/text

### Global State and State Management Patterns
- Main mutable singleton state objects/arrays:
  - `game_state` (main runtime progression state)
  - `player` (single player entity)
  - `castle_state` (rings, cannon, projectile)
  - `enemy_sparks[]`
  - `player_torpedoes[]`
  - `explosions[]`, `styled_explosions[]`, `castle_explosion`
- Refactoring introduced pure modules for testability:
  - `gameState.js` (pure state transition helpers)
  - `collisionDetection.js` (pure geometry checks)
  - `collisionHandlers.js` (side-effect orchestration)
- Runtime still uses mutable in-place state for performance and simplicity.

### Game Entities

#### Player Ship (`src/player.js`)
Responsibilities:
- Player movement/rotation/thrust/braking/strafe
- Firing fore torpedoes and aft space mines
- Respawn and death behavior
- Rendering ship and thruster visuals

State variables:
- Transform/kinematics: `x`, `y`, `angle`, `vel_x`, `vel_y`, `speed`
- Input-driven state: `thrust`, `rotation`, `braking`, `strafing`, `strafe_thrust`
- Combat: `torpedo_speed`, `torpedo_life`, `fire_cooldown`
- Lifecycle: `alive`, `respawn_timer`
- Limits: `max_speed`, reverse/strafe factors

Update logic:
- If game over: stop thruster sounds and exit
- If dead: respawn countdown; if no lives left -> `game_over`
- Process input in fixed order:
  - fire fore torpedo
  - drop aft mine
  - rotate
  - thrust forward/reverse/brake logic
  - strafe logic
- Clamp max speed
- Integrate position
- Wrap with screen margin

Interactions:
- On death: decrements lives, triggers enemy retreat to center
- Can collide with rings/enemies/cannon projectile
- Torpedoes can destroy rings, enemies, castle core

#### Star Castle (`src/castle.js`)
Responsibilities:
- Ring state, segment destruction/respawn
- Cannon tracking/firing
- Castle destruction and round-win transitions
- Rendering rings/cannon/core

State variables:
- Rings: 3 rings (radii 120/90/60, segment counts 12/8/6, opposing rotations)
- Ring runtime fields: `faces[]`, `spawn_radius`, `respawn_timer`, `rotation`
- Cannon: `angle`, `rotation_speed`, `length`, destroyed flag, cooldown
- Projectile: single active cannon projectile
- Spawn flags: `spawn_in_progress`

Update logic:
- Rings rotate every frame
- Round-start ring growth animation
- Destroyed ring fully respawns after timer
- Cannon tracks living player with angular clamp speed
- Cannon fires only when clear shot through destroyed ring segments
- Cannon projectile moves linearly, despawns out of bounds

Interactions:
- Torpedo to core triggers castle explosion and round resolution
- Castle destruction retreats enemies, clears torpedoes after delay
- Round win grants +1 life (normal and pyrrhic victory)

#### Torpedoes (`src/torpedoes.js`)
Responsibilities:
- Spawn and update player projectiles
- Life timers
- Rendering torpedoes/mines

State variables per torpedo:
- `x`, `y`, `vel_x`, `vel_y`, `size`, `life`, `alive`, `is_space_mine`
- Mine jitter fields: `jitter_x`, `jitter_y`, `jitter_timer`

Update logic:
- Integrate velocity
- Apply jitter drift for space mines
- Screen wrapping
- Decrement life, mark dead at zero

Interactions:
- Collides with ring faces, castle core, enemies

#### Enemies (`src/enemies.js`)
Responsibilities:
- Spawn from center to ring positions
- State-machine movement (spawning, lingering, docking, chasing)
- Flocking/chase behavior
- Rendering enemy sparks

State variables per enemy:
- Transform/velocity: `x`, `y`, `angle`, `vel_x`, `vel_y`
- Lifecycle: `alive`
- Behavior flags: `spawning`, `lingering`, `docked`
- Dock/ring fields: `spawn_ring_index`, `spawn_angle`, `dock_ring`, `dock_angle`
- Jitter fields/timers

Update logic:
- Priority states: spawning -> lingering -> docked -> docking/chasing
- If player unavailable (dead/game over/round won): move to docking behavior
- Chase behavior:
  - Far: flocking (alignment + separation + chase force)
  - Near: stronger chase + jitter
- Velocity damping then integrate

Interactions:
- Enemy-player collision destroys both
- Ring face destruction undocks one enemy
- Player death/castle death causes retreat to center

#### Explosions (`src/explosions.js`)
Responsibilities:
- Manage simple and styled explosions
- Timed expansion/fade
- Castle explosion “rings destroyed” threshold signal

#### Stars/UI/Text/Sound/Score
- `stars.js`: static starfield with twinkle
- `ui.js` + `text.js`: vector-stroke text, lives display, game/round messages, autopilot indicators
- `sound.js`: synthesized effects + looping thruster oscillators
- `score.js`: localStorage high score

### Physics Model (2D)
- Coordinate space: top-left origin, +x right, +y down, 800x800 playfield
- Player forward vector derived from `angle`: `(sin(angle), -cos(angle))`
- Motion: explicit Euler integration (`pos += vel * dt`)
- Rotation: direct angular step from input (`angle +=/-= step * dt * factor`)
- Reverse behavior:
  - if moving forward, `S` applies braking deceleration
  - otherwise applies reverse thrust with reverse speed clamp
- Strafe is local-right/local-left force application with visual thrust ramp
- Player speed clamped to `max_speed`
- Enemies use force-like velocity adjustments + damping
- Torpedoes are constant-velocity projectiles with lifetime

### Collision and Interaction Rules
- Collision check order is meaningful:
  1. Cannon projectile vs player (early return if player destroyed)
  2. All torpedo collisions (rings/core/enemies)
  3. Player vs rings (early return)
  4. Enemies vs player
- Torpedo-ring collision destroys face, torpedo, and undocks one enemy
- Torpedo-core collision destroys castle and initiates round resolution
- Torpedo-enemy collision destroys both
- Player-ring collision destroys player and also destroys the impacted face
- Castle cannon only fires when line to player is not blocked by intact ring faces

### Input System
- Keyboard-only controls:
  - `W`: forward thrust
  - `S`: reverse/brake
  - `A`/`D`: rotate
  - `Shift+A` or `E`: strafe right
  - `Shift+D` or `Q`: strafe left
  - `Space`: fore torpedo
  - `R` or `F`: aft mine
  - `Enter`: start game / next round
  - `Backspace`: toggle autopilot (feature flag)
- No gameplay mouse controls.

### Rendering Model
- Raw WebGL 1.0 immediate-style line rendering
- Primitive style: line segments and line-strip circles
- Entities are vector-line shapes, not sprite sheets
- Manual 3x3 transform math (`translate * rotate`)
- Camera assumption: fixed orthographic view of whole playfield (no pan/zoom)

### Implicit Gameplay Mechanics (not obvious from comments)
- During round-start ring spawn, collisions with rings/enemies are effectively deferred because enemies are not yet active and collision check is skipped in early return path.
- Ring destruction creates tactical pressure relief by undocking one enemy.
- Round victory always grants one life, even pyrrhic victory, enabling continuation from 0 lives.
- Castle cannon warmup delay means “telegraphed” shots; this should remain in 3D for feel parity.
- Score is overwritten as `round + 1` on castle destruction (not cumulative by default).

---

## 2. 3D Architecture Design

### 2D -> 3D Transformations

#### Position vectors
- 2D `(x, y)` -> 3D world `(x, y, z)` using gameplay plane
- Recommended parity plane: `y = 0` and gameplay on XZ
  - 2D `x -> x3d`
  - 2D `y -> z3d`

#### Rotation representation
- 2D scalar angle -> quaternion or Euler yaw
- Player orientation should be stored as quaternion internally, with helper for yaw-driven controls

#### Camera model
- Replace fixed screen-space with world camera
- Use a perspective camera with constrained angle, tuned to preserve tactical readability
- Maintain deterministic gameplay distances by decoupling camera from physics

#### World coordinate system
- Keep world units numerically equivalent to 2D where practical (e.g., ring radii 120/90/60)
- Add explicit world bounds equivalent to 800x800 with wrap semantics on gameplay plane

### Physics Changes
- All movement vectors become `Vector3`
- Player thrust/brake/strafe remain local-space force applications on the plane
- Keep ship planar for parity (yaw only) in first pass; avoid introducing pitch/roll to core gameplay physics
- Enemy flocking and ring orbiting become 3D vector math constrained to plane
- Torpedo/mine jitter should remain tangential/random in plane

### Rendering Changes
- Replace raw WebGL calls with three.js scene graph
- Replace line-based procedural shapes with mesh/line-model assets
- Systems required:
  - `THREE.Scene`
  - `WebGLRenderer`
  - `PerspectiveCamera`
  - lights/material presets for arcade neon look

### Asset Pipeline
Required `.glTF` models:
- `player_ship.glb`
- `star_castle_core.glb`
- `ring_segment_outer.glb`
- `ring_segment_mid.glb`
- `ring_segment_inner.glb`
- `enemy_spark.glb`
- `torpedo_fore.glb`
- `mine_aft.glb`
- Optional VFX proxies: explosion meshes, thruster flame meshes

Entity-model mapping:
- PlayerShip -> `player_ship.glb`
- StarCastle core/cannon -> `star_castle_core.glb`
- Ring faces -> ring segment GLBs instanced per ring
- Enemy -> `enemy_spark.glb`
- Projectile -> torpedo/mine GLBs

### Proposed `StarCastle/3d` Project Structure

```text
StarCastle/3d
  engine/
    Game.ts
    GameLoop.ts
    Time.ts
    EventBus.ts
    EntityManager.ts
  entities/
    BaseEntity.ts
    PlayerShip.ts
    StarCastle.ts
    RingLayer.ts
    RingFace.ts
    Enemy.ts
    Projectile.ts
    Explosion.ts
  physics/
    PhysicsWorld.ts
    MovementSystem.ts
    CollisionSystem.ts
    SteeringSystem.ts
    WrapSystem.ts
  input/
    InputController.ts
    KeyMap.ts
    AutopilotController.ts
  rendering/
    Renderer.ts
    CameraRig.ts
    SceneFactory.ts
    ModelRegistry.ts
    EffectsRenderer.ts
    UIRenderer.ts
  assets/
    models/
    audio/
  gameplay/
    GameState.ts
    Rules.ts
    RoundDirector.ts
    SpawnDirector.ts
    DifficultyScaling.ts
  audio/
    AudioManager.ts
  tests/
```

### Core Systems Design

#### Game loop
- Fixed-timestep update + interpolated render recommended
- Preserve deterministic interactions and collision ordering from 2D

#### Entity manager
- Owns lifecycle: create, update, destroy, cleanup
- Supports multiple instances for every entity type

#### Physics system
- Handles movement integration and local-space thrust transforms
- Enforces speed clamps and wrap bounds
- Runs before collision processing

#### Collision system
- Maintains 2D parity checks projected onto gameplay plane
- Preserves collision priority/early-return behavior

#### Input controller
- Keyboard abstraction to command-intent struct
- Optional autopilot command provider with same interface

#### Rendering system
- Converts entity state to scene graph transforms
- Keeps visuals decoupled from gameplay state

#### Camera system
- Provides stable framing; optional subtle follow/tilt
- Never alters gameplay coordinates

### Entity Class Design

#### `BaseEntity`
Responsibilities:
- Common id/type/alive flags
- Transform state, bounding shape, update contract

State:
- `id`, `type`, `alive`
- `position: Vector3`, `rotation: Quaternion`, `velocity: Vector3`
- optional `mesh`, `bounds`

Methods:
- `update(dt)`
- `onCollision(evt)`
- `destroy()`

#### `PlayerShip`
Responsibilities:
- Input-driven movement/combat
- Respawn/life state hooks

State:
- thrust/strafe/rotation command state
- fire cooldown
- speed limits
- alive/respawn timer

Methods:
- `applyInput(command, dt)`
- `fireForeTorpedo()`
- `dropAftMine()`
- `handleDeath()` / `handleRespawn()`

Interactions:
- Collides with rings/enemies/cannon projectile
- Spawns projectile entities

#### `StarCastle`
Responsibilities:
- Ring layers + cannon + core
- Clear-shot checks and cannon firing
- Round completion trigger

State:
- ring layers and face integrity
- cannon aim/cooldown/warmup
- active cannon projectile

Methods:
- `updateRings(dt)`
- `updateCannon(dt, player)`
- `hasClearShot(angle)`
- `onCoreDestroyed()`

Interactions:
- Receives torpedo hits, emits events to round director

#### `Projectile`
Responsibilities:
- Move, wrap/bounds handling, lifetime, subtype behavior

State:
- subtype (`foreTorpedo`, `aftMine`, `cannonShot`)
- lifetime, jitter params, owner

Methods:
- `update(dt)`
- `expire()`

Interactions:
- Hits rings/core/enemies/player based on subtype and ownership

#### `Enemy`
Responsibilities:
- State-machine AI: spawn, linger, dock, chase, retreat

State:
- current behavior state
- dock/spawn ring refs, timers, jitter

Methods:
- `updateAI(dt, context)`
- `retreatToCenter()`

Interactions:
- Reacts to ring destruction (undock pressure)
- Damages player on contact

---

## 3. 2D -> 3D Mapping Table

| 2D File / System | 3D Component | Reuse vs Redesign |
|---|---|---|
| `src/main.js` | `engine/Game.ts`, `engine/GameLoop.ts` | Reuse update/render ordering conceptually; redesign for fixed timestep and system orchestration |
| `src/player.js` | `entities/PlayerShip.ts` | Reuse control semantics, speed clamps, respawn behavior; redesign transform math to Vector3/quaternion |
| `src/castle.js` | `entities/StarCastle.ts`, `entities/RingLayer.ts` | Reuse ring/cannon logic and timers; redesign geometry/visuals as mesh instances |
| `src/enemies.js` | `entities/Enemy.ts`, `physics/SteeringSystem.ts` | Reuse behavior states/flocking formulas; redesign data flow into ECS-like systems |
| `src/torpedoes.js` | `entities/Projectile.ts` | Reuse projectile lifecycle/jitter/wrap; redesign ownership typing and mesh representation |
| `src/collisions.js` | `physics/CollisionSystem.ts` | Reuse top-level orchestration; redesign around entity query pipeline |
| `src/collisionDetection.js` | `physics/CollisionSystem.ts` helpers | Reuse pure geometry concepts projected onto plane; redesign with Vector3 helpers |
| `src/collisionHandlers.js` | `gameplay/Rules.ts` + event handlers | Reuse side-effect semantics/order; redesign into explicit event-driven rule layer |
| `src/explosions.js` | `entities/Explosion.ts`, `rendering/EffectsRenderer.ts` | Reuse timing/lifecycle cues; redesign visual implementation (particles/meshes) |
| `src/stars.js` | `rendering/SceneFactory.ts` sky/background | Reuse twinkle ambiance conceptually; redesign as 3D starfield/skybox |
| `src/ui.js`, `src/text.js` | `rendering/UIRenderer.ts` | Reuse messaging/state triggers; redesign with HTML/CSS overlay or 3D text |
| `src/sound.js` | `audio/AudioManager.ts` | Reuse event cues and loop control semantics; redesign to cleaner modular synth/sample layers |
| `src/autopilot.js` | `input/AutopilotController.ts` | Reuse decision model; redesign vector math for 3D plane and typed command output |
| `src/gameState.js` | `gameplay/GameState.ts` | Reuse immutable transition patterns; redesign typing and integration with runtime mutable state |
| `src/score.js` | `gameplay/ScoreService.ts` | Reuse localStorage behavior; minor adaptation |
| `src/settings.js` | `rendering/UIRenderer.ts` + `audio/AudioManager.ts` | Reuse UX intent; redesign panel integration |
| `src/constants.js` | `gameplay/BalanceConfig.ts` | Reuse values as baseline; redesign namespacing and 3D-specific additions |

Conceptually reusable logic:
- Round progression and difficulty scaling
- Collision precedence
- Ring integrity + cannon clear-shot gating
- Enemy state machine and pressure-release undock rule
- Pyrrhic victory handling

Must be redesigned:
- Rendering pipeline (raw GL -> three.js)
- Transform and orientation representation
- Asset/model loading and scene graph ownership
- Camera + lighting

---

## 4. Implementation Roadmap

### Phase 1: Project Scaffolding and Core Runtime
Deliverables:
- Vite + three.js app booting in `3d/`
- Folder structure aligned to architecture
- `GameLoop` with fixed update and render hooks
- Basic `GameState` object and config wiring

### Phase 2: Rendering Foundation
Deliverables:
- `Renderer`, `SceneFactory`, `CameraRig`
- Lighting and background starfield
- Debug primitives to validate world scale and camera framing

### Phase 3: Entity Framework and Lifecycle
Deliverables:
- `BaseEntity`, `EntityManager`
- Spawn/despawn/update cycle
- Event bus for collisions and gameplay events

### Phase 4: Physics and Movement Systems
Deliverables:
- Plane-constrained movement integration
- Wrap system equivalent to 2D behavior
- Speed clamp utilities and local-space thrust helpers

### Phase 5: PlayerShip Implementation
Deliverables:
- Keyboard mapping parity (`WASD`, `Shift`, `Q/E`, `Space`, `R/F`)
- Forward/reverse/brake/strafe behavior parity
- Fire cooldown and projectile spawning hooks
- Respawn lifecycle with spawn impulse behavior

### Phase 6: StarCastle and Ring System
Deliverables:
- 3 ring layers with segment integrity states
- Spawn growth animation + respawn timers
- Cannon aim, warmup, cooldown, projectile behavior
- Clear-shot logic across rings

### Phase 7: Enemy System
Deliverables:
- Spawn/linger/dock/chase/retreat states
- Flocking/separation/alignment behavior
- Undock-one-enemy response to ring hits
- Dynamic spawning logic and caps

### Phase 8: Collision Rules and Gameplay Effects
Deliverables:
- Collision detection parity with 2D order/priority
- Rule handlers for all interaction types
- Round win/game over/pyrrhic transitions
- Explosion entity lifecycle hooks

### Phase 9: UI, Audio, Score, and Settings
Deliverables:
- HUD and round/game over overlays
- High score persistence
- Audio events and thruster loop controls
- Basic settings panel parity (music volume + mute)

### Phase 10: Asset Integration (`.glTF`)
Deliverables:
- Model registry and asynchronous loading
- Entity-model binding
- Placeholder fallback meshes for missing assets

### Phase 11: Gameplay Parity Testing and Tuning
Deliverables:
- Parity checklist against 2D behaviors
- Automated tests for state transitions and collision rules
- Balance adjustments to preserve feel
- Performance baseline (stable frame time under expected enemy counts)

---

## 5. Final Executable Build Prompt

```markdown
You are an implementation agent building the `StarCastle/3d` project in this repository.

Goal:
Build a three.js-based 3D port of the existing 2D game with gameplay parity.
Use `StarCastle/2d/src` as the canonical behavioral reference.

Hard rules:
1. Do not modify `StarCastle/2d`.
2. Preserve gameplay behavior parity from 2D before adding enhancements.
3. Use encapsulated objects/classes; avoid global mutable state except a single root game container.
4. Support multiple instances for every entity type.
5. Keep logic deterministic and testable.
6. Keep collision ordering semantically identical to 2D.

Target architecture:

StarCastle/3d
  engine/
  entities/
  physics/
  input/
  rendering/
  gameplay/
  audio/
  assets/
  tests/

Required systems:
- Game loop (fixed timestep update + render)
- Entity manager
- Physics/movement system
- Collision system
- Input controller (keyboard + optional autopilot provider)
- Rendering system (three.js scene/camera/renderer)
- Camera rig
- Gameplay rules/state transition layer
- Audio manager

Entity classes:
- `BaseEntity`
- `PlayerShip`
- `StarCastle` (with ring layers + cannon)
- `Projectile`
- `Enemy`
- `Explosion`

2D behavior to preserve:
- Player controls and movement semantics (`W/S/A/D`, `Shift` strafe, `Q/E`, `Space`, `R/F`)
- Player speed clamping and wraparound behavior
- Ring segment destruction and full-ring respawn timer
- Cannon clear-shot gating through destroyed segments only
- Enemy state machine: spawning, lingering, docking, chasing, retreat
- Torpedo/mine lifetimes and mine jitter behavior
- Collision precedence:
  1) cannon projectile vs player,
  2) torpedo collisions,
  3) player-ring,
  4) enemy-player
- Round victory and pyrrhic victory behavior (+1 life even in pyrrhic)
- Difficulty scaling by round

World conversion:
- Implement gameplay on a plane in 3D space (recommended XZ plane, Y-up).
- Map 2D radii/distances to equivalent world units.
- Keep camera independent from gameplay physics.

Implementation order (strict):
1. Scaffold runtime and folder structure.
2. Implement rendering/camera foundation.
3. Implement base entity framework and manager.
4. Implement physics integration + wrap system.
5. Implement player ship + input.
6. Implement castle rings + cannon.
7. Implement enemies and spawn director.
8. Implement collision/rules pipeline.
9. Implement UI/audio/score/settings.
10. Integrate glTF assets with fallbacks.
11. Add tests for collision and game-state parity; run and fix.

Coding constraints:
- Use clear module boundaries; one responsibility per module.
- Prefer pure helper functions for geometry and state transitions.
- Keep magic numbers in `BalanceConfig`.
- Add concise comments only where logic is non-obvious.
- Provide small, verifiable commits/steps.

Execution protocol:
- After each phase, report deliverables and parity notes.
- If behavior differs from 2D, stop and document the delta before proceeding.
- Do not start visual polish until parity-critical mechanics are complete.

Start now with Phase 1 and Phase 2.
```
