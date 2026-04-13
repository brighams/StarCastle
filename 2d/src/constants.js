export const CANVAS_SIZE = 800;
export const CENTER_Y = CANVAS_SIZE / 2;
export const TOP_RIGHT_Y = 16;

export const WORLD_SIZE = 2400;
export const WORLD_RADIUS = 1200;

export const PLAYER_SPAWN_OUTER_RING_MIN = 2100;
export const PLAYER_SPAWN_OUTER_RING_MAX = 2300;

export const CASTLE_START_COUNT = 3;
export const CASTLE_SPAWN_RADIUS_MIN = 300;
export const CASTLE_SPAWN_RADIUS_MAX = 800;
export const CASTLE_MIN_SEPARATION = 900;

export const RADAR_RADIUS = 80;

export const WINGMAN_MAX_COUNT = 5;
export const WINGMAN_FORMATION_RADIUS = 400;
export const WINGMAN_JOIN_RADIUS = 80;
export const WINGMAN_THRUST_FORCE = 80;
export const WINGMAN_MAX_SPEED = 250;
export const WINGMAN_ROTATION_SPEED = 2.5;
export const WINGMAN_FIRE_COOLDOWN = 1.2;
export const WINGMAN_AIM_TOLERANCE = 0.2;
export const WINGMAN_VELOCITY_DAMPING = 0.98;
export const WINGMAN_MIN_SEPARATION = 120;
export const WINGMAN_SEPARATION_FORCE = 200;
export const WINGMAN_COLOR = [0.0, 1.0, 1.0, 1.0];
export const WINGMAN_TORPEDO_COLOR = [0.0, 1.0, 1.0, 1.0];
export const WINGMAN_RESPAWN_TIME = 30;

export const ENEMY_SPARK_SIZE = 10;
export const ENEMY_DOCK_ARRIVAL_THRESHOLD = 5;
export const ENEMY_SPAWN_VELOCITY = 200;
export const ENEMY_LINGER_BASE_TIME = 2;
export const ENEMY_LINGER_RANDOM_TIME = 3;
export const ENEMY_DOCK_VELOCITY = 100;

export const ENEMY_RETREAT_VELOCITY = 100;
export const ENEMY_VELOCITY_DAMPING = 0.98;

export const ENEMY_PRIMARY_COLOR = [1.0, 0.0, 1.0, 1.0];
export const ENEMY_SECONDARY_COLOR = [1.0, 1.0, 0.0, 0.7];
export const ENEMY_SECONDARY_SIZE_FACTOR = 0.75;

export const ENEMY_SPEED_INCREASE_PER_ROUND = 0.2;
export const ENEMY_STARTING_COUNT = 6;
export const ENEMY_STARTING_SPEED_MULTIPLIER = 1.5;

export const ENEMY_RING_CHANGE_LINGER_BASE = 1;
export const ENEMY_RING_CHANGE_LINGER_RANDOM = 2;
export const ENEMY_RING_CHANGE_CHANCE = 0.3;

export const RING_STARTING_SPEED_MULTIPLIER = 1.0;
export const RING_RESPAWN_TIME = 1.0;
export const RING_SPAWN_INITIAL_RADIUS = 0.001;

export const ENEMY_EXPLOSION_PARTICLES = 20;
export const ENEMY_EXPLOSION_DURATION = 0.5;

export const CASTLE_DESTROYED_CHECK_DELAY = 1200;
export const CASTLE_CENTER_ROTATION_SPEED = 0.8;

export const CANNON_SPARK_SIZE = 24;
export const CANNON_COOL_OFF_TIME = 1.3;
export const CANNON_FIRE_WARMUP_TIME = 200;
export const CANNON_SPARK_SPEED = 300;

export const CANNON_SPARK_COLOR = [0.0, 1.0, 1.0, 1.0];
export const CANNON_COLOR = [0.5, 0.5, 0.5, 1.0];
export const CANNON_THICKNESS = 0.8;

export const CASTLE_CENTRAL_HEX_COLOR = [1.0, 1.0, 1.0, 1.0];
export const CASTLE_CENTRAL_HEX_RADIUS = 15;
export const CASTLE_CENTRAL_HEX_SIDES = 6;

// Movement & Physics

export const CASTLE_CORE_HIT_RADIUS = 15;
export const CASTLE_INNER_RING_RADIUS = 60;

export const TORPEDO_RING_HIT_DISTANCE = 8;
export const TORPEDO_ENEMY_HIT_BUFFER = 2;

export const RING_EXPLOSION_PARTICLES = 15;
export const RING_EXPLOSION_DURATION = 0.5;

export const PLAYER_RING_EXPLOSION_PARTICLES = 25;
export const PLAYER_RING_EXPLOSION_DURATION = 0.8;

export const CASTLE_EXPLOSION_MAX_SIZE = 180;
export const CASTLE_EXPLOSION_LIFE = 1.8;
export const CASTLE_EXPLOSION_SPIKES_BASE = 16;
export const CASTLE_EXPLOSION_SPIKES_RANDOM = 8;
export const CASTLE_EXPLOSION_INITIAL_SIZE = 5;
export const CASTLE_EXPLOSION_DEBRIS_COUNT = 12;
export const CASTLE_EXPLOSION_DEBRIS_SCALE = 1;

export const SHIP_EXPLOSION_MAX_SIZE = 45;
export const SHIP_EXPLOSION_LIFE = 0.8;
export const SHIP_EXPLOSION_SPIKES_BASE = 10;
export const SHIP_EXPLOSION_SPIKES_RANDOM = 4;
export const SHIP_EXPLOSION_INITIAL_SIZE = 2;
export const SHIP_EXPLOSION_DEBRIS_COUNT = 6;
export const SHIP_EXPLOSION_DEBRIS_SCALE = 0.4;

export const SPIKE_ANGLE_VARIATION = 0.3;
export const SPIKE_LENGTH_FACTOR_BASE = 0.6;
export const SPIKE_LENGTH_FACTOR_RANDOM = 0.8;
export const SPIKE_WOBBLE_SPEED_BASE = 2;
export const SPIKE_WOBBLE_SPEED_RANDOM = 4;
export const SPIKE_WOBBLE_AMOUNT_BASE = 0.1;
export const SPIKE_WOBBLE_AMOUNT_RANDOM = 0.2;

export const CORE_SIZE_FACTOR = 0.3;
export const MID_SIZE_FACTOR = 0.6;
export const CORE_SEGMENTS = 12;
export const MID_SEGMENTS = 16;
export const OUTER_SEGMENTS = 20;
export const BASIC_EXPLOSION_SEGMENTS = 8;

export const DEBRIS_MIN_DISTANCE_FACTOR = 0.4;
export const DEBRIS_DISTANCE_RANDOM = 0.5;
export const DEBRIS_LENGTH_BASE = 5;
export const DEBRIS_LENGTH_RANDOM = 15;

export const BASIC_EXPLOSION_COLOR = [1.0, 0.5, 0.0]; // Orange
export const CORE_COLOR = [1.0, 1.0, 1.0]; // White
export const MID_COLOR = [1.0, 0.7, 0.0]; // Yellow-orange
export const OUTER_COLOR = [1.0, 0.3, 0.0]; // Red-orange
export const SPIKE_COLOR_BASE = [1.0, 0.5, 0.0]; // Orange base
export const SPIKE_COLOR_GREEN_RANDOM = 0.3; // Random green variation
export const DEBRIS_COLOR = [1.0, 0.8, 0.2]; // Yellow-orange

export const MID_ALPHA_MULTIPLIER = 0.8;
export const OUTER_ALPHA_MULTIPLIER = 0.6;
export const DEBRIS_ALPHA_MULTIPLIER = 0.7;
export const ALPHA_FADE_MULTIPLIER = 2;

// Spawn behavior
export const PLAYER_STARTING_LIVES = 3;

export const PLAYER_SPAWN_FORWARD_PUSH = 60; // Initial forward velocity when respawning
export const PLAYER_SPAWN_SIDEWAYS_PUSH = 40; // Initial sideways velocity when respawning
export const PLAYER_RESPAWN_DELAY_SECONDS = 3.0; // Time before player respawns after death

// Player SHIP Physics forces (units per second squared)
export const PLAYER_SHIP_FORWARD_THRUST_FORCE = 300; // Engine power when pressing forward
export const PLAYER_SHIP_REVERSE_THRUST_FORCE = 400; // Reverse thruster power
export const PLAYER_SHIP_BRAKING_DECELERATION = 800; // How fast the ship slows when braking
export const PLAYER_SHIP_STRAFE_THRUST_FORCE = 250; // Sideways thruster power
export const PLAYER_SHIP_THRUST_FACTOR = 4;
export const PLAYER_SHIP_THRUST_DECELERATE_FACTOR = 6;
export const PLAYER_SHIP_ROTATION_STEP = Math.PI / 8;
export const ROTATION_FACTOR = 6;

// Animation ramp speeds (how fast thruster visuals fade in/out)
export const PLAYER_SHIP_STRAFE_THRUST_RAMP_UP_SPEED = 3;
export const PLAYER_SHIP_STRAFE_THRUST_RAMP_DOWN_SPEED = 6;

// Speed thresholds for visual effects
export const PLAYER_SHIP_BRAKING_VISUAL_THRESHOLD = 10; // Min speed to show braking jets
export const PLAYER_SHIP_REVERSE_VISUAL_THRESHOLD = 5; // Min speed to show reverse jets

// Ship geometry ratios (relative to ship size)
export const SHIP_HULL_WIDTH_RATIO = 0.7; // How wide the hull sides are
export const SHIP_TAIL_NOTCH_HEIGHT_RATIO = 0.4; // Height of rear tail notch
export const SHIP_TAIL_NOTCH_WIDTH_RATIO = 0.35; // Width of rear tail notch
export const SHIP_LINE_OFFSETS = [-0.5, 0, 0.5]; // Offsets for bold line effect

// Rotation thruster jet geometry
export const ROTATION_JET_LENGTH_RATIO = 0.6; // Length of rotation jets
export const ROTATION_JET_MOUNT_Y_RATIO = 0.5; // Y position of rotation jet mounts
export const ROTATION_JET_UPPER_SPREAD_RATIO = 0.3; // Upper jet endpoint spread
export const ROTATION_JET_LOWER_SPREAD_RATIO = 0.7; // Lower jet endpoint spread

// Braking jet geometry
export const BRAKE_JET_LENGTH_RATIO = 0.8; // Length of forward braking jets
export const BRAKE_JET_WIDTH_RATIO = 0.2; // Width of braking jet spread

// Strafe jet geometry
export const STRAFE_JET_MAX_LENGTH_RATIO = 1.2; // Max length of strafe jets
export const STRAFE_JET_CENTER_LENGTH_RATIO = 0.7; // Center jet is shorter
export const STRAFE_JET_VERTICAL_SPREAD_RATIO = 0.2; // Vertical spread of strafe jets
export const STRAFE_JET_MOUNT_X_RATIO = 0.5; // X position of strafe jet mounts

// Main engine flame
export const FLAME_BASE_LENGTH = 1.0; // Min flame length when thrusting
export const FLAME_LENGTH_MULTIPLIER = 3.2; // Additional flame length at full thrust
export const FLAME_BASE_WIDTH = 0.2; // Min flame width
export const FLAME_WIDTH_MULTIPLIER = 0.1; // Additional flame width at full thrust
export const FLAME_GREEN_BASE = 0.5; // Base green color value
export const FLAME_GREEN_REDUCTION = 0.2; // How much green decreases at full thrust

// Thruster jet colors [R, G, B, A]
export const ROTATION_JET_COLOR = [1.0, 0.0, 0.5, 0.9]; // Magenta/pink
export const BRAKE_JET_COLOR = [1.0, 0.0, 0.5, 0.9]; // Magenta/pink
export const STRAFE_JET_COLOR_RGB = [1.0, 0.3, 0.0]; // Orange (alpha added dynamically)
export const STRAFE_JET_ALPHA_MULTIPLIER = 0.9; // Alpha = strafe_thrust * this

// Weapons
export const MAX_TORPEDO_COUNT = 3;
export const FORE_TORPEDO_SIZE = 8;
export const AFT_TORPEDO_SIZE = 7;
export const AFT_TORPEDO_SPEED_MODIFIER = 0.35;
export const AFT_TORPEDO_LIFE_MODIFIER = 1.0;
export const AFT_TORPEDO_COLOR = [1.0, 0.5, 0.0];
export const FORE_TORPEDO_COLOR = [1.0, 0.0, 0.1];
export const FIRE_COOLDOWN_TIME = 0.2;

export const TORPEDO_JITTER_X = 110;
export const TORPEDO_JITTER_Y = 110;
export const TORPEDO_JITTER_TIMER = 0.1;
export const TORPEDO_JITTER_TIMER_MIN = 0.1;
export const TORPEDO_INNER_SPARK_SIZE_RATIO = 0.75;

// Player ship
export const PLAYER_SIZE = 12;
export const PLAYER_MAX_SPEED = 200;
export const PLAYER_MAX_REVERSE_FACTOR = 0.3;
export const PLAYER_MAX_STRAFE_FACTOR = 0.4;
export const PLAYER_SPAWN_ANIM_TIMER = 1.5;
export const PLAYER_TORPEDO_SPEED = 360;
export const PLAYER_TORPEDO_LIFE = 1800;

// Space mine
export const SPACE_MINE_INNER_SIZE_RATIO = 1 / 3;
export const SPACE_MINE_INNER_SEGMENTS = 4;
export const SPACE_MINE_INNER_COLOR = [0.6, 0.6, 0.6];

// Castle cannon
export const CANNON_ROTATION_SPEED = 2.0;
export const CANNON_LENGTH = 18;

// Castle ring definitions
export const RING_OUTER_RADIUS = 120;
export const RING_OUTER_SEGMENTS = 12;
export const RING_OUTER_ROTATION_SPEED = 0.65;
export const RING_OUTER_COLOR = [0.0, 1.0, 0.0, 1.0];
export const RING_MIDDLE_RADIUS = 90;
export const RING_MIDDLE_SEGMENTS = 8;
export const RING_MIDDLE_ROTATION_SPEED = -0.95;
export const RING_MIDDLE_COLOR = [0.0, 0.0, 1.0, 1.0];
// Inner ring radius uses existing CASTLE_INNER_RING_RADIUS = 60
export const RING_INNER_SEGMENTS = 6;
export const RING_INNER_ROTATION_SPEED = 1.0;
export const RING_INNER_COLOR = [1.0, 1.0, 0.0, 1.0];

// Castle ring glow rendering
export const RING_GLOW_BASE = 0.15;
export const RING_GLOW_PULSE_SPEED = 2.5;
export const RING_GLOW_PULSE_AMOUNT = 0.08;
export const RING_GLOW_OUTER_ALPHA = 0.3;
export const RING_GLOW_INNER_ALPHA = 0.5;
export const RING_GLOW_OFFSET_OUTER = 4;
export const RING_GLOW_OFFSET_INNER = 2;
export const RING_GLOW_OFFSET_FACTOR = 0.3;

// Spark renderer
export const SPARK_ROTATION_SPEED = 2.0;
export const SPARK_LINE_COUNT = 3;

// Stars
export const STAR_COUNT = 2000;
export const STAR_MIN_SIZE = 0.5;
export const STAR_SIZE_RANGE = 2.5;
export const STAR_MIN_TWINKLE_RATE = 0.2;
export const STAR_TWINKLE_RATE_RANGE = 0.8;
export const STAR_MIN_BRIGHTNESS = 0.15;
export const STAR_BRIGHTNESS_RANGE = 0.25;
export const STAR_MIN_ALPHA = 0.05;

// Font / text rendering
export const FONT_CHAR_WIDTH_RATIO = 0.8;
export const FONT_CHAR_SCALE = 6;

// Game loop — enemy spawning
export const ENEMY_SPAWN_INITIAL_DELAY = 1.2;
export const ENEMY_SPAWN_INTERVAL = 3;
export const ENEMY_SPAWN_CHANCE = 0.3;
export const ENEMY_NEW_GAME_SPEED_MULTIPLIER = 1.0;
export const ENEMY_SPEED_INCREASE_CONTINUOUS = 0.02;
export const RING_SPEED_INCREASE_PER_ROUND = 0.01;
export const ENEMY_INITIAL_SPAWN_DELAY_MS = 5000;

// Attract / entice mode
export const ENTICE_DELAY = 5;
export const ENTICE_ANIM_DURATION = 1.5;

// UI layout
export const UI_LIVES_X_START = 30;
export const UI_LIVES_X_SPACING = 25;
export const UI_LIVES_Y = 30;
export const UI_LIVES_SHIP_SIZE = 8;
export const UI_BITCOIN_Y_START = CENTER_Y + 150;
export const UI_BITCOIN_Y_END = 730;
export const UI_TITLE_Y_OFFSET = -300;
export const UI_SUBTITLE_Y_OFFSET = -220;
export const UI_INSTRUCTIONS_Y_OFFSET = 195;
export const UI_HIGH_SCORE_Y_OFFSET = 240;
export const UI_EXIT_Y = 762;
export const UI_ROUND_WON_Y_OFFSET = -200;
export const UI_ROUND_WON_NEXT_Y_OFFSET = 200;
export const UI_ROUND_WON_SCORE_Y_OFFSET = 260;
export const UI_PYRRHIC_TITLE_Y_OFFSET = -312;
export const UI_PYRRHIC_SUBTITLE_Y_OFFSET = -262;
export const UI_PYRRHIC_HINT_Y_OFFSET = -222;
export const UI_HUD_TITLE_X_OFFSET = -32;
export const UI_HUD_TITLE_Y = 16;
export const UI_AUTOPILOT_X = 100;
export const UI_AUTOPILOT_HINT_Y_OFFSET = 25;
export const UI_HUD_SCORE_X_OFFSET = -120;
export const UI_DEBUG_Y_BASE = 758;

// Brain (demo / entice mode AI)
export const BRAIN_TICK = 0.5;
export const BRAIN_BURST_DURATION = 0.35;
export const BRAIN_NEAR_THRESHOLD = 160;
export const BRAIN_FAR_THRESHOLD = 290;
export const BRAIN_AIM_TOLERANCE = 0.22;
export const BRAIN_AIM_JITTER = 0.08;
export const BRAIN_FIRE_CHANCE = 0.35;

// Spark brain (enemy chase AI)
export const SPARK_CLOSE_THRESHOLD = 140;
export const SPARK_FAR_FORCE = 90;
export const SPARK_CLOSE_FORCE = 240;
export const SPARK_SEPARATION_DISTANCE = 50;
export const SPARK_SEPARATION_FORCE = 80;
export const SPARK_JITTER_INTERVAL_MIN = 0.3;
export const SPARK_JITTER_INTERVAL_RAND = 0.4;
export const SPARK_JITTER_STRENGTH = 100;
