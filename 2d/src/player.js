import {
  AFT_TORPEDO_COLOR,
  AFT_TORPEDO_LIFE_MODIFIER,
  AFT_TORPEDO_SIZE,
  AFT_TORPEDO_SPEED_MODIFIER,
  BRAKE_JET_COLOR,
  BRAKE_JET_LENGTH_RATIO,
  BRAKE_JET_WIDTH_RATIO,
  FIRE_COOLDOWN_TIME,
  FLAME_BASE_LENGTH,
  FLAME_BASE_WIDTH,
  FLAME_GREEN_BASE,
  FLAME_GREEN_REDUCTION,
  FLAME_LENGTH_MULTIPLIER,
  FLAME_WIDTH_MULTIPLIER,
  FORE_TORPEDO_COLOR,
  FORE_TORPEDO_SIZE,
  MAX_TORPEDO_COUNT,
  PLAYER_RESPAWN_DELAY_SECONDS,
  PLAYER_SHIP_BRAKING_DECELERATION,
  PLAYER_SHIP_BRAKING_VISUAL_THRESHOLD,
  PLAYER_SHIP_FORWARD_THRUST_FORCE,
  PLAYER_SHIP_REVERSE_THRUST_FORCE,
  PLAYER_SHIP_REVERSE_VISUAL_THRESHOLD,
  PLAYER_SHIP_ROTATION_STEP,
  PLAYER_SHIP_STRAFE_THRUST_FORCE,
  PLAYER_SHIP_STRAFE_THRUST_RAMP_DOWN_SPEED,
  PLAYER_SHIP_STRAFE_THRUST_RAMP_UP_SPEED,
  PLAYER_SHIP_THRUST_DECELERATE_FACTOR,
  PLAYER_SHIP_THRUST_FACTOR,
  PLAYER_SPAWN_FORWARD_PUSH,
  PLAYER_SPAWN_SIDEWAYS_PUSH,
  ROTATION_FACTOR,
  ROTATION_JET_COLOR,
  ROTATION_JET_LENGTH_RATIO,
  ROTATION_JET_LOWER_SPREAD_RATIO,
  ROTATION_JET_MOUNT_Y_RATIO,
  ROTATION_JET_UPPER_SPREAD_RATIO,
  PLAYER_MAX_REVERSE_FACTOR,
  PLAYER_MAX_SPEED,
  PLAYER_MAX_STRAFE_FACTOR,
  PLAYER_SIZE,
  PLAYER_SPAWN_ANIM_TIMER,
  PLAYER_SPAWN_OUTER_RING_MIN,
  PLAYER_SPAWN_OUTER_RING_MAX,
  PLAYER_TORPEDO_LIFE,
  PLAYER_TORPEDO_SPEED,
  SHIP_HULL_WIDTH_RATIO,
  WORLD_RADIUS,
  SPACE_MINE_INNER_COLOR,
  SPACE_MINE_INNER_SEGMENTS,
  SPACE_MINE_INNER_SIZE_RATIO,
  SHIP_LINE_OFFSETS,
  SHIP_TAIL_NOTCH_HEIGHT_RATIO,
  SHIP_TAIL_NOTCH_WIDTH_RATIO,
  STRAFE_JET_ALPHA_MULTIPLIER,
  STRAFE_JET_CENTER_LENGTH_RATIO,
  STRAFE_JET_COLOR_RGB,
  STRAFE_JET_MAX_LENGTH_RATIO,
  STRAFE_JET_MOUNT_X_RATIO,
  STRAFE_JET_VERTICAL_SPREAD_RATIO,
} from "./constants.js";
import {
  playSound,
  startAttitudeThruster,
  startMainThruster,
  stopAttitudeThruster,
  stopMainThruster,
} from "./sound.js";
import { retreat_enemies_to_castle } from "./enemies.js";
import { multiply_matrices, rotate_matrix, translate_matrix } from "./math.js";
import { world_transform } from "./camera.js";
import { draw_circle, draw_line, draw_spark } from "./renderer.js";
import { fire_torpedo, player_torpedoes } from "./torpedoes.js";

export const player = {
  x: 0,
  y: PLAYER_SPAWN_OUTER_RING_MIN,
  angle: 0,
  vel_x: 0,
  vel_y: 0,
  thrust: 0,
  rotation: 0, // -1 for left, 0 for none, 1 for right
  braking: false,
  strafing: 0, // -1 for left, 0 for none, 1 for right
  strafe_thrust: 0.0, // 0.0 to 1.0 for animation ramping
  size: PLAYER_SIZE,
  color: [1.0, 1.0, 1.0, 1.0],
  speed: 0,
  max_speed: PLAYER_MAX_SPEED,
  max_reverse_factor: PLAYER_MAX_REVERSE_FACTOR,
  max_strafe_factor: PLAYER_MAX_STRAFE_FACTOR,
  alive: true,
  respawn_timer: 0,
  spawn_anim_timer: PLAYER_SPAWN_ANIM_TIMER,
  spawn_thrust: { forward: 0, strafe: 0 },
  torpedo_speed: PLAYER_TORPEDO_SPEED,
  torpedo_life: PLAYER_TORPEDO_LIFE,
  fire_cooldown: 0,
};

export const spawn_player = (game_state, dt) => {
  player.respawn_timer -= dt;
  if (player.respawn_timer <= 0) {
    if (game_state.lives > 0) {
      set_random_spawn_position();
      player.alive = true;
      playSound("game_start", 0.5, 0.08);

      // Forward thrust
      player.vel_x += Math.sin(player.angle) * PLAYER_SPAWN_FORWARD_PUSH;
      player.vel_y += -Math.cos(player.angle) * PLAYER_SPAWN_FORWARD_PUSH;

      // Random left or right strafe
      const strafe_direction = Math.random() > 0.5 ? 1 : -1;
      const strafe_x = strafe_direction * Math.cos(player.angle);
      const strafe_y = strafe_direction * Math.sin(player.angle);
      player.vel_x += strafe_x * PLAYER_SPAWN_SIDEWAYS_PUSH;
      player.vel_y += strafe_y * PLAYER_SPAWN_SIDEWAYS_PUSH;
    } else {
      game_state.game_over = true;
      playSound("game_over", 1.0, 0.1);
    }
  }
};

const set_random_spawn_position = () => {
  const random_angle = Math.random() * Math.PI * 2;
  const spawn_radius =
    PLAYER_SPAWN_OUTER_RING_MIN +
    Math.random() * (PLAYER_SPAWN_OUTER_RING_MAX - PLAYER_SPAWN_OUTER_RING_MIN);
  player.x = Math.cos(random_angle) * spawn_radius;
  player.y = Math.sin(random_angle) * spawn_radius;
  player.vel_x = 0;
  player.vel_y = 0;
  player.speed = 0;
  player.angle = Math.atan2(-player.x, player.y);
};

export const reset_player = () => {
  set_random_spawn_position();
  player.alive = true;
  player.respawn_timer = 0;
  player.thrust = 0;
  playSound("game_start", 0.5, 0.08);

  // Add spawn drift like respawn
  // Forward thrust
  player.vel_x += Math.sin(player.angle) * PLAYER_SPAWN_FORWARD_PUSH;
  player.vel_y += -Math.cos(player.angle) * PLAYER_SPAWN_FORWARD_PUSH;

  // Random left or right strafe
  const strafe_direction = Math.random() > 0.5 ? 1 : -1;
  const strafe_x = strafe_direction * Math.cos(player.angle);
  const strafe_y = strafe_direction * Math.sin(player.angle);
  player.vel_x += strafe_x * PLAYER_SPAWN_SIDEWAYS_PUSH;
  player.vel_y += strafe_y * PLAYER_SPAWN_SIDEWAYS_PUSH;
};

export const destroy_player = (player, game_state) => {
  game_state.lives--;
  player.alive = false;
  player.respawn_timer = PLAYER_RESPAWN_DELAY_SECONDS;
  stopMainThruster();
  stopAttitudeThruster();
  playSound("player_explode");
  retreat_enemies_to_castle();
};

const apply_input_events = (keys_pressed, dt, game_state) => {
  let isRotatingOrBraking = false;

  const check_keys = (key) => keys_pressed[key];
  const SHIFT_DOWN = keys_pressed["ShiftKey"];

  const launch_torpedo = () => {
    if (check_keys("Space")) {
      const alive_torpedo_count = player_torpedoes.filter(
        (torpedo) => torpedo.alive,
      ).length;
      if (!game_state.game_over && !game_state.round_won) {
        if (
          player.alive &&
          alive_torpedo_count < MAX_TORPEDO_COUNT &&
          player.fire_cooldown <= 0
        ) {
          player.fire_cooldown = FIRE_COOLDOWN_TIME;
          fire_torpedo({
            x: player.x,
            y: player.y,
            angle: player.angle,
            size: FORE_TORPEDO_SIZE,
            life: player.torpedo_life,
            speed: player.torpedo_speed,
            color: FORE_TORPEDO_COLOR,
            alive: true,
            is_space_mine: false,
          });
        }
      }
    }
  };

  const launch_space_mine = () => {
    if (check_keys("KeyR") || check_keys("KeyF")) {
      if (
        !game_state.game_over &&
        !game_state.round_won &&
        player.alive &&
        player_torpedoes.length < MAX_TORPEDO_COUNT &&
        player.fire_cooldown <= 0
      ) {
        fire_torpedo({
          x: player.x,
          y: player.y,
          angle: player.angle + Math.PI,
          size: AFT_TORPEDO_SIZE,
          speed: player.torpedo_speed * AFT_TORPEDO_SPEED_MODIFIER,
          life: player.torpedo_life * AFT_TORPEDO_LIFE_MODIFIER,
          is_space_mine: true,
          color: AFT_TORPEDO_COLOR,
          alive: true,
        });
        player.fire_cooldown = FIRE_COOLDOWN_TIME;
      }
    }
  };

  const thrust_forward = () => {
    if (check_keys("KeyW")) {
      const thrust_force = PLAYER_SHIP_FORWARD_THRUST_FORCE * dt;
      player.vel_x += Math.sin(player.angle) * thrust_force;
      player.vel_y += -Math.cos(player.angle) * thrust_force;
      player.thrust = Math.min(
        player.thrust + dt * PLAYER_SHIP_THRUST_FACTOR,
        1.0,
      );
      startMainThruster();
    } else {
      // decelerate while not thrusting
      player.thrust = Math.max(
        player.thrust - dt * PLAYER_SHIP_THRUST_DECELERATE_FACTOR,
        0,
      );
      stopMainThruster();
    }
  };

  const thrust_reverse = () => {
    const apply_braking = (current_speed) => {
      const new_speed = Math.max(
        current_speed - PLAYER_SHIP_BRAKING_DECELERATION * dt,
        0,
      );
      const speed_ratio = new_speed / current_speed;
      player.vel_x *= speed_ratio;
      player.vel_y *= speed_ratio;
      player.speed = new_speed;
    };

    const apply_reverse_thrust = (forward_x, forward_y) => {
      const max_reverse_speed = player.max_speed * player.max_reverse_factor;
      const reverse_force = PLAYER_SHIP_REVERSE_THRUST_FORCE * dt;
      player.vel_x -= forward_x * reverse_force;
      player.vel_y -= forward_y * reverse_force;

      // Clamp to max reverse speed
      const new_speed = Math.sqrt(
        player.vel_x * player.vel_x + player.vel_y * player.vel_y,
      );
      if (new_speed > max_reverse_speed) {
        const speed_ratio = max_reverse_speed / new_speed;
        player.vel_x *= speed_ratio;
        player.vel_y *= speed_ratio;
      }
      player.speed = -Math.sqrt(
        player.vel_x * player.vel_x + player.vel_y * player.vel_y,
      );
    };

    if (check_keys("KeyS")) {
      const current_speed = Math.sqrt(
        player.vel_x * player.vel_x + player.vel_y * player.vel_y,
      );

      // Determine if we're moving forward or in reverse
      // Forward direction is (sin(angle), -cos(angle))
      const forward_x = Math.sin(player.angle);
      const forward_y = -Math.cos(player.angle);
      const dot_product = player.vel_x * forward_x + player.vel_y * forward_y;
      const is_moving_forward = dot_product > 0;

      if (is_moving_forward && current_speed > 0) {
        apply_braking(current_speed);
      } else {
        // At zero or already in reverse - apply reverse thrust
        apply_reverse_thrust(forward_x, forward_y);
      }

      player.braking =
        current_speed > PLAYER_SHIP_BRAKING_VISUAL_THRESHOLD ||
        Math.abs(player.speed) > PLAYER_SHIP_REVERSE_VISUAL_THRESHOLD;
      if (player.braking) isRotatingOrBraking = true;
    } else {
      player.braking = false;
    }
  };

  const strafe_left = () => {
    if ((check_keys("KeyA") && SHIFT_DOWN) || check_keys("KeyQ")) {
      player.strafing = 1;

      const strafe_x = Math.cos(player.angle);
      const strafe_y = Math.sin(player.angle);
      const strafe_force = PLAYER_SHIP_STRAFE_THRUST_FORCE * dt;
      player.vel_x += strafe_x * strafe_force;
      player.vel_y += strafe_y * strafe_force;

      player.strafe_thrust = Math.min(
        player.strafe_thrust + dt * PLAYER_SHIP_STRAFE_THRUST_RAMP_UP_SPEED,
        1.0,
      );
      isRotatingOrBraking = true;
      return true;
    }
    return false;
  };

  const strafe_right = () => {
    if ((check_keys("KeyD") && SHIFT_DOWN) || check_keys("KeyE")) {
      player.strafing = -1;

      const strafe_x = -Math.cos(player.angle);
      const strafe_y = -Math.sin(player.angle);
      const strafe_force = PLAYER_SHIP_STRAFE_THRUST_FORCE * dt;
      player.vel_x += strafe_x * strafe_force;
      player.vel_y += strafe_y * strafe_force;

      player.strafe_thrust = Math.min(
        player.strafe_thrust + dt * PLAYER_SHIP_STRAFE_THRUST_RAMP_UP_SPEED,
        1.0,
      );
      isRotatingOrBraking = true;
      return true;
    }
    return false;
  };

  const rotate_left = () => {
    if (check_keys("KeyA") && !SHIFT_DOWN) {
      player.angle -= PLAYER_SHIP_ROTATION_STEP * dt * ROTATION_FACTOR;
      player.rotation = -1;
      isRotatingOrBraking = true;
    }
  };

  const rotate_right = () => {
    if (check_keys("KeyD") && !SHIFT_DOWN) {
      player.angle += PLAYER_SHIP_ROTATION_STEP * dt * ROTATION_FACTOR;
      player.rotation = 1;
      isRotatingOrBraking = true;
    }
  };

  const handle_strafing = () => {
    const did_strafe = strafe_right() || strafe_left();
    if (!did_strafe) {
      player.strafe_thrust = Math.max(
        player.strafe_thrust - dt * PLAYER_SHIP_STRAFE_THRUST_RAMP_DOWN_SPEED,
        0,
      );
    }
  };

  launch_torpedo();
  launch_space_mine();
  rotate_left();
  rotate_right();
  thrust_forward();
  thrust_reverse();
  handle_strafing();

  return isRotatingOrBraking;
};

export const update_player = (dt, keys_pressed, game_state) => {
  if (game_state.game_over) {
    stopMainThruster();
    stopAttitudeThruster();
    return;
  }

  if (!player.alive) {
    if (game_state.round_won) {
      return;
    }
    spawn_player(game_state, dt);
    return;
  }

  // Reset player state for this frame
  player.rotation = 0;
  player.strafing = 0;

  // Update cooldown timer
  if (player.fire_cooldown > 0) {
    player.fire_cooldown -= dt;
  }

  // Process input events
  const isRotatingOrBraking = apply_input_events(keys_pressed, dt, game_state);

  // =================== FINAL SPEED AND POSITION ADJUSTMENTS
  if (isRotatingOrBraking) {
    startAttitudeThruster();
  } else {
    stopAttitudeThruster();
  }

  const current_speed = Math.sqrt(
    player.vel_x * player.vel_x + player.vel_y * player.vel_y,
  );
  if (current_speed > player.max_speed) {
    const speed_ratio = player.max_speed / current_speed;
    player.vel_x *= speed_ratio;
    player.vel_y *= speed_ratio;
  }
  player.speed = Math.min(current_speed, player.max_speed);

  player.x += player.vel_x * dt;
  player.y += player.vel_y * dt;

  const dist_sq = player.x * player.x + player.y * player.y;
  if (dist_sq >= WORLD_RADIUS * WORLD_RADIUS) {
    const dist = Math.sqrt(dist_sq);
    const nx = player.x / dist;
    const ny = player.y / dist;
    const dot = player.vel_x * nx + player.vel_y * ny;
    player.vel_x -= 2 * dot * nx;
    player.vel_y -= 2 * dot * ny;
    player.x = nx * (WORLD_RADIUS - 1);
    player.y = ny * (WORLD_RADIUS - 1);
  }
};

export const draw_space_mine = ({ x, y, angle, size, transform, color }) => {
  draw_spark({ x, y, angle, size, transform, color });
  draw_circle(
    x,
    y,
    size * SPACE_MINE_INNER_SIZE_RATIO,
    SPACE_MINE_INNER_SEGMENTS,
    transform,
    SPACE_MINE_INNER_COLOR,
  );
};

export const draw_player_ship = ({
  x,
  y,
  angle,
  size,
  color,
  thrust = 0,
  rotation = 0,
  braking = false,
  strafing = 0,
  strafe_thrust = 0,
  transform = null,
}) => {
  const base = transform ?? world_transform();
  const ship_transform = multiply_matrices(
    multiply_matrices(base, translate_matrix(x, y)),
    rotate_matrix(angle),
  );

  for (const offset of SHIP_LINE_OFFSETS) {
    draw_line(
      offset,
      -size,
      -size * SHIP_HULL_WIDTH_RATIO + offset,
      size,
      ship_transform,
      color,
    );
    draw_line(
      -size * SHIP_HULL_WIDTH_RATIO + offset,
      size,
      size * SHIP_HULL_WIDTH_RATIO + offset,
      size,
      ship_transform,
      color,
    );
    draw_line(
      size * SHIP_HULL_WIDTH_RATIO + offset,
      size,
      offset,
      -size,
      ship_transform,
      color,
    );
  }

  const tail_height = size * SHIP_TAIL_NOTCH_HEIGHT_RATIO;
  const tail_width = size * SHIP_TAIL_NOTCH_WIDTH_RATIO;
  for (const offset of SHIP_LINE_OFFSETS) {
    draw_line(
      -tail_width + offset,
      size,
      offset,
      size - tail_height,
      ship_transform,
      color,
    );
    draw_line(
      tail_width + offset,
      size,
      offset,
      size - tail_height,
      ship_transform,
      color,
    );
  }

  if (thrust > 0) {
    const flame_length = FLAME_BASE_LENGTH + thrust * FLAME_LENGTH_MULTIPLIER;
    const flame_width = FLAME_BASE_WIDTH + thrust * FLAME_WIDTH_MULTIPLIER;
    const flame_color = [
      1.0,
      FLAME_GREEN_BASE - thrust * FLAME_GREEN_REDUCTION,
      0.0,
      thrust,
    ];

    draw_line(
      0,
      size,
      -size * flame_width,
      size * flame_length,
      ship_transform,
      flame_color,
    );
    draw_line(
      0,
      size,
      size * flame_width,
      size * flame_length,
      ship_transform,
      flame_color,
    );
  }

  // Rotation thruster jets
  if (rotation !== 0) {
    const jet_length = size * ROTATION_JET_LENGTH_RATIO;

    if (rotation > 0) {
      draw_line(
        -size * SHIP_HULL_WIDTH_RATIO,
        -size * ROTATION_JET_MOUNT_Y_RATIO,
        -size * SHIP_HULL_WIDTH_RATIO - jet_length,
        -size * ROTATION_JET_UPPER_SPREAD_RATIO,
        ship_transform,
        ROTATION_JET_COLOR,
      );
      draw_line(
        -size * SHIP_HULL_WIDTH_RATIO,
        -size * ROTATION_JET_MOUNT_Y_RATIO,
        -size * SHIP_HULL_WIDTH_RATIO - jet_length,
        -size * ROTATION_JET_LOWER_SPREAD_RATIO,
        ship_transform,
        ROTATION_JET_COLOR,
      );
    } else {
      draw_line(
        size * SHIP_HULL_WIDTH_RATIO,
        -size * ROTATION_JET_MOUNT_Y_RATIO,
        size * SHIP_HULL_WIDTH_RATIO + jet_length,
        -size * ROTATION_JET_UPPER_SPREAD_RATIO,
        ship_transform,
        ROTATION_JET_COLOR,
      );
      draw_line(
        size * SHIP_HULL_WIDTH_RATIO,
        -size * ROTATION_JET_MOUNT_Y_RATIO,
        size * SHIP_HULL_WIDTH_RATIO + jet_length,
        -size * ROTATION_JET_LOWER_SPREAD_RATIO,
        ship_transform,
        ROTATION_JET_COLOR,
      );
    }
  }

  // Braking jets
  if (braking) {
    const jet_length = size * BRAKE_JET_LENGTH_RATIO;

    draw_line(
      0,
      -size,
      -size * BRAKE_JET_WIDTH_RATIO,
      -size - jet_length,
      ship_transform,
      BRAKE_JET_COLOR,
    );
    draw_line(
      0,
      -size,
      size * BRAKE_JET_WIDTH_RATIO,
      -size - jet_length,
      ship_transform,
      BRAKE_JET_COLOR,
    );
  }

  // Strafe thruster jets
  if (strafe_thrust > 0) {
    const strafe_jet_intensity_color = [
      STRAFE_JET_COLOR_RGB[0],
      STRAFE_JET_COLOR_RGB[1],
      STRAFE_JET_COLOR_RGB[2],
      strafe_thrust * STRAFE_JET_ALPHA_MULTIPLIER,
    ];
    const strafe_jet_length =
      size * STRAFE_JET_MAX_LENGTH_RATIO * strafe_thrust;

    if (strafing > 0) {
      draw_line(
        -size * STRAFE_JET_MOUNT_X_RATIO,
        0,
        -size * STRAFE_JET_MOUNT_X_RATIO - strafe_jet_length,
        size * STRAFE_JET_VERTICAL_SPREAD_RATIO,
        ship_transform,
        strafe_jet_intensity_color,
      );
      draw_line(
        -size * STRAFE_JET_MOUNT_X_RATIO,
        0,
        -size * STRAFE_JET_MOUNT_X_RATIO - strafe_jet_length,
        -size * STRAFE_JET_VERTICAL_SPREAD_RATIO,
        ship_transform,
        strafe_jet_intensity_color,
      );
      draw_line(
        -size * STRAFE_JET_MOUNT_X_RATIO,
        0,
        -size * STRAFE_JET_MOUNT_X_RATIO -
          strafe_jet_length * STRAFE_JET_CENTER_LENGTH_RATIO,
        0,
        ship_transform,
        strafe_jet_intensity_color,
      );
    } else if (strafing < 0) {
      draw_line(
        size * STRAFE_JET_MOUNT_X_RATIO,
        0,
        size * STRAFE_JET_MOUNT_X_RATIO + strafe_jet_length,
        size * STRAFE_JET_VERTICAL_SPREAD_RATIO,
        ship_transform,
        strafe_jet_intensity_color,
      );
      draw_line(
        size * STRAFE_JET_MOUNT_X_RATIO,
        0,
        size * STRAFE_JET_MOUNT_X_RATIO + strafe_jet_length,
        -size * STRAFE_JET_VERTICAL_SPREAD_RATIO,
        ship_transform,
        strafe_jet_intensity_color,
      );
      draw_line(
        size * STRAFE_JET_MOUNT_X_RATIO,
        0,
        size * STRAFE_JET_MOUNT_X_RATIO +
          strafe_jet_length * STRAFE_JET_CENTER_LENGTH_RATIO,
        0,
        ship_transform,
        strafe_jet_intensity_color,
      );
    }
  }
};
