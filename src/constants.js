export const CANVAS_SIZE = 800
export const CENTER_X = CANVAS_SIZE / 2
export const CENTER_Y = CANVAS_SIZE / 2
export const TOP_RIGHT_X = CANVAS_SIZE - 16
export const TOP_RIGHT_Y = 16
export const SCREEN_WRAP_EDGE_MARGIN = 20

export const ENEMY_SPEED_INCREASE_PER_ROUND = 0.2
export const ENEMY_STARTING_COUNT = 3
export const ENEMY_STARTING_SPEED_MULTIPLIER = 1.5
export const ENEMY_SPAWN_VELOCITY = 200
export const ENEMY_DOCK_VELOCITY = 100
export const ENEMY_RETREAT_VELOCITY = 100
export const ENEMY_FAR_CHASE_FORCE = 100
export const ENEMY_CLOSE_CHASE_FORCE = 50
export const ENEMY_VELOCITY_DAMPING = 0.98
export const ENEMY_SEPARATION_FORCE = 60
export const ENEMY_ALIGNMENT_FACTOR = 0.5

export const ENEMY_DOCK_ARRIVAL_THRESHOLD = 5
export const ENEMY_FLOCKING_SEPARATION_DISTANCE = 40
export const ENEMY_FLOCKING_ALIGNMENT_DISTANCE = 100

export const ENEMY_SPARK_SIZE = 10
export const ENEMY_FLOCKING_DISTANCE = 180

export const ENEMY_JITTER_MAGNITUDE = 120
export const ENEMY_JITTER_MIN_INTERVAL = 0.25
export const ENEMY_JITTER_RANDOM_INTERVAL = 0.5

export const ENEMY_LINGER_BASE_TIME = 2
export const ENEMY_LINGER_RANDOM_TIME = 3
export const ENEMY_RING_CHANGE_LINGER_BASE = 1
export const ENEMY_RING_CHANGE_LINGER_RANDOM = 2
export const ENEMY_RING_CHANGE_CHANCE = 0.30

export const ENEMY_PRIMARY_COLOR = [1.0, 0.0, 1.0, 1.0]
export const ENEMY_SECONDARY_COLOR = [1.0, 1.0, 0.0, 0.7]
export const ENEMY_SECONDARY_SIZE_FACTOR = 0.75

export const RING_STARTING_SPEED_MULTIPLIER = 1.0
export const RING_RESPAWN_TIME = 1.0
export const RING_SPAWN_INITIAL_RADIUS = 0.001

export const ENEMY_EXPLOSION_PARTICLES = 20
export const ENEMY_EXPLOSION_DURATION = 0.5

export const CASTLE_DESTROYED_CHECK_DELAY = 1200
export const CASTLE_CENTER_ROTATION_SPEED = 0.8

export const CANNON_SPARK_SIZE = 24
export const CANNON_COOL_OFF_TIME = 1.3
export const CANNON_FIRE_WARMUP_TIME = 200
export const CANNON_SPARK_SPEED = 300
export const CANNON_PROJECTILE_BOUNDS_MIN = -50
export const CANNON_PROJECTILE_BOUNDS_MAX = 1074

export const CANNON_SPARK_COLOR = [0.0, 1.0, 1.0, 1.0]
export const CANNON_COLOR = [0.5, 0.5, 0.5, 1.0]
export const CANNON_THICKNESS = 0.8

export const CASTLE_CENTRAL_HEX_COLOR = [1.0, 1.0, 1.0, 1.0]
export const CASTLE_CENTRAL_HEX_RADIUS = 15
export const CASTLE_CENTRAL_HEX_SIDES = 6

// Movement & Physics

export const CASTLE_CORE_HIT_RADIUS = 15
export const CASTLE_INNER_RING_RADIUS = 60

export const TORPEDO_RING_HIT_DISTANCE = 8
export const TORPEDO_ENEMY_HIT_BUFFER = 2

export const RING_EXPLOSION_PARTICLES = 15
export const RING_EXPLOSION_DURATION = 0.5

export const PLAYER_RING_EXPLOSION_PARTICLES = 25
export const PLAYER_RING_EXPLOSION_DURATION = 0.8

export const CASTLE_EXPLOSION_MAX_SIZE = 180
export const CASTLE_EXPLOSION_LIFE = 1.8
export const CASTLE_EXPLOSION_SPIKES_BASE = 16
export const CASTLE_EXPLOSION_SPIKES_RANDOM = 8
export const CASTLE_EXPLOSION_INITIAL_SIZE = 5
export const CASTLE_EXPLOSION_DEBRIS_COUNT = 12
export const CASTLE_EXPLOSION_DEBRIS_SCALE = 1

export const SHIP_EXPLOSION_MAX_SIZE = 45
export const SHIP_EXPLOSION_LIFE = 0.8
export const SHIP_EXPLOSION_SPIKES_BASE = 10
export const SHIP_EXPLOSION_SPIKES_RANDOM = 4
export const SHIP_EXPLOSION_INITIAL_SIZE = 2
export const SHIP_EXPLOSION_DEBRIS_COUNT = 6
export const SHIP_EXPLOSION_DEBRIS_SCALE = 0.4

export const SPIKE_ANGLE_VARIATION = 0.3
export const SPIKE_LENGTH_FACTOR_BASE = 0.6
export const SPIKE_LENGTH_FACTOR_RANDOM = 0.8
export const SPIKE_WOBBLE_SPEED_BASE = 2
export const SPIKE_WOBBLE_SPEED_RANDOM = 4
export const SPIKE_WOBBLE_AMOUNT_BASE = 0.1
export const SPIKE_WOBBLE_AMOUNT_RANDOM = 0.2

export const CORE_SIZE_FACTOR = 0.3
export const MID_SIZE_FACTOR = 0.6
export const CORE_SEGMENTS = 12
export const MID_SEGMENTS = 16
export const OUTER_SEGMENTS = 20
export const BASIC_EXPLOSION_SEGMENTS = 8

export const DEBRIS_MIN_DISTANCE_FACTOR = 0.4
export const DEBRIS_DISTANCE_RANDOM = 0.5
export const DEBRIS_LENGTH_BASE = 5
export const DEBRIS_LENGTH_RANDOM = 15

export const BASIC_EXPLOSION_COLOR = [1.0, 0.5, 0.0]  // Orange
export const CORE_COLOR = [1.0, 1.0, 1.0]             // White
export const MID_COLOR = [1.0, 0.7, 0.0]              // Yellow-orange
export const OUTER_COLOR = [1.0, 0.3, 0.0]            // Red-orange
export const SPIKE_COLOR_BASE = [1.0, 0.5, 0.0]       // Orange base
export const SPIKE_COLOR_GREEN_RANDOM = 0.3           // Random green variation
export const DEBRIS_COLOR = [1.0, 0.8, 0.2]           // Yellow-orange

export const MID_ALPHA_MULTIPLIER = 0.8
export const OUTER_ALPHA_MULTIPLIER = 0.6
export const DEBRIS_ALPHA_MULTIPLIER = 0.7
export const ALPHA_FADE_MULTIPLIER = 2

// Spawn behavior
export const PLAYER_STARTING_LIVES = 4

export const PLAYER_SPAWN_FORWARD_PUSH = 60                               // Initial forward velocity when respawning
export const PLAYER_SPAWN_SIDEWAYS_PUSH = 40                              // Initial sideways velocity when respawning
export const PLAYER_SPAWN_DISTANCE_FROM_CENTER_RATIO = 0.42               // How far from center to spawn (fraction of canvas)
export const PLAYER_RESPAWN_DELAY_SECONDS = 3.0                           // Time before player respawns after death

// Player SHIP Physics forces (units per second squared)
export const PLAYER_SHIP_FORWARD_THRUST_FORCE = 300                            // Engine power when pressing forward
export const PLAYER_SHIP_REVERSE_THRUST_FORCE = 400                            // Reverse thruster power
export const PLAYER_SHIP_BRAKING_DECELERATION = 800                            // How fast the ship slows when braking
export const PLAYER_SHIP_STRAFE_THRUST_FORCE = 250                             // Sideways thruster power
export const PLAYER_SHIP_THRUST_FACTOR = 4
export const PLAYER_SHIP_THRUST_DECELERATE_FACTOR = 6
export const PLAYER_SHIP_ROTATION_STEP = Math.PI / 8
export const ROTATION_FACTOR = 6

// Animation ramp speeds (how fast thruster visuals fade in/out)
export const PLAYER_SHIP_STRAFE_THRUST_RAMP_UP_SPEED = 3
export const PLAYER_SHIP_STRAFE_THRUST_RAMP_DOWN_SPEED = 6

// Speed thresholds for visual effects
export const PLAYER_SHIP_BRAKING_VISUAL_THRESHOLD = 10                         // Min speed to show braking jets
export const PLAYER_SHIP_REVERSE_VISUAL_THRESHOLD = 5                          // Min speed to show reverse jets

// Ship geometry ratios (relative to ship size)
export const SHIP_HULL_WIDTH_RATIO = 0.7                           // How wide the hull sides are
export const SHIP_TAIL_NOTCH_HEIGHT_RATIO = 0.4                    // Height of rear tail notch
export const SHIP_TAIL_NOTCH_WIDTH_RATIO = 0.35                    // Width of rear tail notch
export const SHIP_LINE_OFFSETS = [-0.5, 0, 0.5]                    // Offsets for bold line effect

// Rotation thruster jet geometry
export const ROTATION_JET_LENGTH_RATIO = 0.6                       // Length of rotation jets
export const ROTATION_JET_MOUNT_Y_RATIO = 0.5                      // Y position of rotation jet mounts
export const ROTATION_JET_UPPER_SPREAD_RATIO = 0.3                 // Upper jet endpoint spread
export const ROTATION_JET_LOWER_SPREAD_RATIO = 0.7                 // Lower jet endpoint spread

// Braking jet geometry
export const BRAKE_JET_LENGTH_RATIO = 0.8                          // Length of forward braking jets
export const BRAKE_JET_WIDTH_RATIO = 0.2                           // Width of braking jet spread

// Strafe jet geometry
export const STRAFE_JET_MAX_LENGTH_RATIO = 1.2                     // Max length of strafe jets
export const STRAFE_JET_CENTER_LENGTH_RATIO = 0.7                  // Center jet is shorter
export const STRAFE_JET_VERTICAL_SPREAD_RATIO = 0.2                // Vertical spread of strafe jets
export const STRAFE_JET_MOUNT_X_RATIO = 0.5                        // X position of strafe jet mounts

// Main engine flame
export const FLAME_BASE_LENGTH = 1.0                               // Min flame length when thrusting
export const FLAME_LENGTH_MULTIPLIER = 3.2                         // Additional flame length at full thrust
export const FLAME_BASE_WIDTH = 0.2                                // Min flame width
export const FLAME_WIDTH_MULTIPLIER = 0.1                          // Additional flame width at full thrust
export const FLAME_GREEN_BASE = 0.5                                // Base green color value
export const FLAME_GREEN_REDUCTION = 0.2                           // How much green decreases at full thrust

// Thruster jet colors [R, G, B, A]
export const ROTATION_JET_COLOR = [1.0, 0.0, 0.5, 0.9]             // Magenta/pink
export const BRAKE_JET_COLOR = [1.0, 0.0, 0.5, 0.9]                // Magenta/pink
export const STRAFE_JET_COLOR_RGB = [1.0, 0.3, 0.0]                // Orange (alpha added dynamically)
export const STRAFE_JET_ALPHA_MULTIPLIER = 0.9                     // Alpha = strafe_thrust * this

// Weapons
export const MAX_TORPEDO_COUNT = 3
export const FORE_TORPEDO_SIZE = 8
export const AFT_TORPEDO_SIZE = 7
export const AFT_TORPEDO_SPEED_MODIFIER = 0.35
export const AFT_TORPEDO_LIFE_MODIFIER = 1.0
export const AFT_TORPEDO_COLOR = [1.0, 0.5, 0.0]
export const FORE_TORPEDO_COLOR = [1.0, 0.0, 0.1]
export const FIRE_COOLDOWN_TIME = 0.2

export const TORPEDO_JITTER_X = 110
export const TORPEDO_JITTER_Y = 110
export const TORPEDO_JITTER_TIMER = 0.1
