# StarCastle Feature Flags

This document describes the feature flags available in StarCastle for controlling optional functionality.

## Location

Feature flags are defined at the top of `src/main.js`:

```javascript
// ========== FEATURE FLAGS ==========
export const ENABLE_AUTOPILOT = true // Set to false to hide autopilot feature
// ===================================
```

## Available Feature Flags

### `ENABLE_AUTOPILOT`

**Type:** `boolean`
**Default:** `true`
**File:** `src/main.js`

Controls the autopilot/demo mode feature.

#### When `true`:
- ✅ Backspace key toggles autopilot on/off
- ✅ "PRESS BACKSPACE FOR AUTOPILOT DEMO" shown on game over screen
- ✅ "AUTOPILOT ACTIVE" indicator shown during gameplay
- ✅ AI can control the player ship
- 📦 Bundle size: ~49.22 kB

#### When `false`:
- ❌ Backspace key does nothing
- ❌ No autopilot UI messages shown
- ❌ Autopilot input never processed
- ❌ AI code tree-shaken from bundle
- 📦 Bundle size: ~44.01 kB (5.21 kB savings)

## How to Use

### Disable Autopilot Feature

Edit `src/main.js`:

```javascript
export const ENABLE_AUTOPILOT = false
```

Then rebuild:

```bash
npm run build
```

### Re-enable Autopilot Feature

Edit `src/main.js`:

```javascript
export const ENABLE_AUTOPILOT = true
```

Then rebuild:

```bash
npm run build
```

## Implementation Details

The feature flag is used in three locations:

### 1. `src/main.js` - Key Binding
```javascript
if (ENABLE_AUTOPILOT && e.code === 'Backspace') {
  autopilot_enabled(!game_state.autopilot_on, game_state)
  e.preventDefault()
}
```

### 2. `src/main.js` - Input Processing
```javascript
const active_keys = (ENABLE_AUTOPILOT && game_state.autopilot_on)
  ? update_autopilot(player, game_state, dt)
  : keys_pressed
```

### 3. `src/ui.js` - UI Display
```javascript
// Game over screen
if (ENABLE_AUTOPILOT) {
  draw_animated_text('PRESS BACKSPACE FOR AUTOPILOT DEMO', ...)
}

// During gameplay
if (ENABLE_AUTOPILOT && game_state.autopilot_on) {
  draw_animated_text('AUTOPILOT ACTIVE', ...)
}
```

## Benefits

### Bundle Size Optimization
When autopilot is disabled, Vite's tree-shaking removes:
- Entire `src/autopilot.js` module (~5 KB)
- All autopilot decision-making logic
- Circling, evasion, and targeting algorithms

### Production Use
For production deployments where demo mode isn't needed:
1. Set `ENABLE_AUTOPILOT = false`
2. Build for production
3. Deploy smaller bundle

### Development
During development, keep `ENABLE_AUTOPILOT = true` for:
- Testing AI behavior
- Demo mode for showcasing
- Automated playtesting

## Adding New Feature Flags

To add a new feature flag:

1. **Define it in `src/main.js`:**
```javascript
export const ENABLE_NEW_FEATURE = true
```

2. **Import where needed:**
```javascript
import { ENABLE_NEW_FEATURE } from './main.js'
```

3. **Guard feature code:**
```javascript
if (ENABLE_NEW_FEATURE) {
  // Feature-specific code
}
```

4. **Document in this file**

## Testing

Feature flags should not break existing tests. The test suite validates that:
- ✅ All 73 unit tests pass with autopilot enabled
- ✅ All 73 unit tests pass with autopilot disabled
- ✅ Game builds successfully in both configurations
- ✅ No runtime errors in either mode

## Best Practices

1. **Use descriptive names**: `ENABLE_FEATURE_NAME` format
2. **Export from main.js**: Centralized feature flag location
3. **Default to true**: For development convenience
4. **Document in this file**: Keep feature flags documented
5. **Test both states**: Verify functionality in both enabled/disabled states
6. **Consider bundle impact**: Large features should be flag-guarded
