# StarCastle Autopilot System

## Overview
The autopilot is an AI system that can play StarCastle automatically, providing a demo mode for users who want to watch the game or need enticement to play.

## Usage
- **Toggle On/Off**: Press `Backspace` at any time to enable/disable autopilot
- **Visual Indicator**: When active, "AUTOPILOT ACTIVE" appears in green at the top left of the screen
- **Manual Override**: Press `Backspace` again to take back control at any time

## Features

### Intelligent Target Selection
The autopilot prioritizes targets based on the game situation:
1. **Threat Evasion Mode**: When enemies or cannon projectiles are within 150 units, enters evasion mode
2. **Enemy Attack Mode**: When more than 3 active enemies, focuses on shooting enemies
3. **Castle Attack Mode**: Targets ring segments, prioritizing inner rings
4. **Core Attack Mode**: When a clear shot to the castle core exists, takes it

### Behavioral Systems

#### 1. Threat Detection
- Monitors cannon projectiles within 200 units
- Tracks active enemies within 250 units
- Calculates nearest threat and its distance

#### 2. Evasion Tactics
- Predicts projectile/enemy future positions (0.5s ahead)
- Calculates escape vectors away from threats
- Avoids getting too close to castle center while evading
- Uses thrust to escape dangerous situations

#### 3. Ring Targeting
The AI scores each ring segment based on:
- **Ring Priority**: Inner rings (smaller radius) score higher (2x weight)
- **Angle Alignment**: Segments that require less rotation score higher (1.5x weight)
- **Distance**: Closer segments score slightly higher (0.5x weight)

This ensures the autopilot efficiently breaks through rings from inside out.

#### 4. Circling and Position Management
- **Orbits castle at optimal torpedo range (~220 units)**
- Circles clockwise or counterclockwise (randomly switches)
- Blends circling motion with target tracking for fluid movement
- Backs away if too close (< 140 units)
- Moves closer if too far (> 300 units)
- Maintains tangential velocity for continuous orbiting

#### 5. Firing Logic
- Only fires when aimed at target (within 0.15 radians)
- Respects maximum torpedo count limit
- Respects fire cooldown timer
- Conserves ammunition by accurate shooting

### Decision Making
The autopilot makes decisions every 0.1 seconds (10 times per second):
- Re-evaluates threats and targets
- Updates mode (evasion vs attack)
- Recalculates optimal strategies

Between decisions, it executes the current strategy smoothly.

## AI Capabilities

**What the autopilot can do:**
- ✅ Evade cannon projectiles
- ✅ Avoid enemy collisions
- ✅ Target and destroy ring segments
- ✅ Shoot castle core when path is clear
- ✅ **Circle the castle at optimal torpedo range (~220 units)**
- ✅ **Drop space mines when being chased by enemies**
- ✅ **Avoid screen edges and prevent wrapping**
- ✅ **Detect enemies attacking from behind**
- ✅ Handle multiple threats simultaneously
- ✅ Adapt strategy based on enemy count
- ✅ Maintain optimal combat distance

**Advanced behaviors:**
- Circles clockwise or counterclockwise (randomly switches)
- Blends circling motion with target tracking for smooth gameplay
- Drops space mines with 2-second cooldown when enemies chase
- Prioritizes screen edge avoidance over other behaviors
- Maintains 220-unit optimal torpedo range while circling
- Detects enemies behind player (> 90° angle difference)

## Implementation Details

### Module: `src/autopilot.js`
**Centralized State Object:**
```javascript
autopilot_state = {
  enabled, decision_timer, current_target, evasion_mode,
  attack_mode, circling_direction, last_mine_drop, being_chased
}
```

**Core Functions:**
- `autopilot_enabled(enabled, game_state)` - Toggle autopilot
- `update_autopilot(player, game_state, dt)` - Main update loop
- `findNearestThreat(player)` - Threat detection
- `findBestRingTarget(player)` - Ring targeting AI
- `findNearestEnemy(player)` - Enemy targeting
- `hasClearShotToCore(player)` - Core targeting check
- `calculateEvasionVector(player, threat)` - Evasion calculation
- `calculateCirclingVector(player)` - **NEW: Orbital movement**
- `isNearScreenEdge(player)` - **NEW: Screen boundary check**
- `calculateScreenCenterVector(player)` - **NEW: Edge avoidance**

### Integration: `src/main.js`
- Backspace key handler for toggle
- Input routing (autopilot keys vs player keys)
- State management

### UI: `src/ui.js`
- Visual indicators for autopilot state
- Instructions on game over screen
- Active status display during gameplay

## Demo Mode Benefits

1. **Attraction Mode**: Shows off the game to potential players
2. **Learning Tool**: Players can watch AI strategies
3. **Accessibility**: Allows spectating the game
4. **Testing**: Useful for development and playtesting
5. **Entertainment**: Can be fun to watch the AI play

## Performance

The autopilot is designed to be:
- **Efficient**: Decision updates only 10x per second
- **Lightweight**: No impact on game performance
- **Reactive**: Responds quickly to threats
- **Competent**: Can play for extended periods successfully

## Recent Improvements (v2.0)

**✅ Implemented:**
1. **Circling Behavior** - AI now orbits castle at optimal range instead of just hovering
2. **Mine Dropping** - Drops space mines when being chased (2s cooldown)
3. **Screen Edge Avoidance** - Prevents wrapping, stays visible on screen
4. **Chase Detection** - Identifies enemies behind player and reacts accordingly
5. **Centralized State** - All autopilot variables in `autopilot_state` object

**Player Improvements:**
- Player now has spawn drift on first game start (matching respawn behavior)

## Future Enhancements (Optional)

Potential improvements:
- Difficulty levels (cautious, balanced, aggressive)
- Predictive aiming for moving enemies
- More advanced evasion patterns (spiral, weaving)
- Learning from player strategies
- Adaptive difficulty based on performance
