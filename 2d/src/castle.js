import {
  CANNON_COLOR,
  CANNON_COOL_OFF_TIME,
  CANNON_FIRE_WARMUP_TIME,
  CANNON_LENGTH,
  CANNON_ROTATION_SPEED,
  CANNON_SPARK_COLOR,
  CANNON_SPARK_SIZE,
  CANNON_SPARK_SPEED,
  CANNON_THICKNESS,
  CASTLE_CENTER_ROTATION_SPEED,
  CASTLE_CENTRAL_HEX_COLOR,
  CASTLE_CENTRAL_HEX_RADIUS,
  CASTLE_CENTRAL_HEX_SIDES,
  CASTLE_DESTROYED_CHECK_DELAY,
  CASTLE_INNER_RING_RADIUS,
  CASTLE_MIN_SEPARATION,
  CASTLE_SPAWN_RADIUS_MIN,
  CASTLE_SPAWN_RADIUS_MAX,
  ENEMY_SPEED_INCREASE_PER_ROUND,
  CASTLE_START_COUNT,
  RING_GLOW_BASE,
  RING_GLOW_INNER_ALPHA,
  RING_GLOW_OFFSET_FACTOR,
  RING_GLOW_OFFSET_INNER,
  RING_GLOW_OFFSET_OUTER,
  RING_GLOW_OUTER_ALPHA,
  RING_GLOW_PULSE_AMOUNT,
  RING_GLOW_PULSE_SPEED,
  RING_INNER_COLOR,
  RING_INNER_ROTATION_SPEED,
  RING_INNER_SEGMENTS,
  RING_MIDDLE_COLOR,
  RING_MIDDLE_RADIUS,
  RING_MIDDLE_ROTATION_SPEED,
  RING_MIDDLE_SEGMENTS,
  RING_OUTER_COLOR,
  RING_OUTER_RADIUS,
  RING_OUTER_ROTATION_SPEED,
  RING_OUTER_SEGMENTS,
  RING_RESPAWN_TIME,
  RING_SPAWN_INITIAL_RADIUS,
  WORLD_RADIUS,
} from "./constants.js";

import { world_transform, world_transform_at } from "./camera.js";
import { draw_line, draw_spark } from "./renderer.js";
import {
  are_rings_destroyed_by_explosion,
  create_castle_explosion,
  is_castle_exploding,
} from "./explosions.js";
import { playSound } from "./sound.js";
import { clear_torpedoes } from "./torpedoes.js";
import { retreat_enemies_to_castle } from "./enemies.js";
import { player } from "./player.js";
import { checkAndUpdateHighScore } from "./score.js";
import { spawn_wingman } from "./wingmen.js";

export let castles = [];

const make_rings = () => [
  {
    round: 0,
    index: 0,
    radius: RING_OUTER_RADIUS,
    segments: RING_OUTER_SEGMENTS,
    rotation: 0,
    rotationSpeed: RING_OUTER_ROTATION_SPEED,
    color: RING_OUTER_COLOR,
  },
  {
    round: 1,
    index: 1,
    radius: RING_MIDDLE_RADIUS,
    segments: RING_MIDDLE_SEGMENTS,
    rotation: 0,
    rotationSpeed: RING_MIDDLE_ROTATION_SPEED,
    color: RING_MIDDLE_COLOR,
  },
  {
    round: 2,
    index: 2,
    radius: CASTLE_INNER_RING_RADIUS,
    segments: RING_INNER_SEGMENTS,
    rotation: 0,
    rotationSpeed: RING_INNER_ROTATION_SPEED,
    color: RING_INNER_COLOR,
  },
];

const create_castle = (x, y) => ({
  x,
  y,
  ring_glow_time: 0,
  center_rotation: 0,
  spawn_in_progress: false,
  rings: make_rings(),
  cannon: {
    angle: 0,
    rotation_speed: CANNON_ROTATION_SPEED,
    length: CANNON_LENGTH,
    is_destroyed: false,
    cool_off_timer: 0,
  },
  cannon_projectile: null,
  is_destroyed: false,
});

const random_castle_position = () => {
  const angle = Math.random() * Math.PI * 2;
  const radius =
    CASTLE_SPAWN_RADIUS_MIN +
    Math.random() * (CASTLE_SPAWN_RADIUS_MAX - CASTLE_SPAWN_RADIUS_MIN);
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
};

export const get_castles = () => castles;
export const get_castle = (index) => castles[index];
export const get_castle_rings = (castle_index = 0) =>
  castles[castle_index]?.rings ?? [];
export const get_castle_cannon = (castle_index = 0) =>
  castles[castle_index]?.cannon;
export const get_castle_projectile = (castle_index = 0) =>
  castles[castle_index]?.cannon_projectile;

export const castle_destroyed = (castle, castle_index, game_state) => {
  castle.is_destroyed = true;
  create_castle_explosion(castle.x, castle.y, castle_index);
  playSound("castle_explode");
  retreat_enemies_to_castle();
  castle.cannon.is_destroyed = true;
  spawn_wingman(game_state.round);
  const destroyed_count = castles.filter((c) => c.is_destroyed).length;
  game_state.score = (game_state.round + 1) * destroyed_count;
  checkAndUpdateHighScore(game_state.score);
  if (castles.every((c) => c.is_destroyed)) {
    setTimeout(
      () => delayed_check_round_won(game_state),
      CASTLE_DESTROYED_CHECK_DELAY,
    );
  }
};

export const delayed_check_round_won = (game_state) => {
  clear_torpedoes();
  if (player.alive) {
    game_state.pyrrhic_victory = false;
    game_state.round_won = true;
  } else {
    game_state.pyrrhic_victory = true;
    game_state.round_won = true;
  }
  game_state.lives += 1;
  game_state.enemy_speed_multiplier += ENEMY_SPEED_INCREASE_PER_ROUND;
};

const has_clear_shot = (castle, angle) => {
  if (castle.cannon.is_destroyed) return false;
  for (const ring of castle.rings) {
    const segment_angle = (Math.PI * 2) / ring.segments;
    let rel_angle = angle - ring.rotation;
    while (rel_angle < 0) rel_angle += Math.PI * 2;
    while (rel_angle >= Math.PI * 2) rel_angle -= Math.PI * 2;
    const face_index = Math.floor(rel_angle / segment_angle);
    const face = ring.faces[face_index];
    if (face && !face.destroyed) return false;
  }
  return true;
};

const init_castle_faces = (castle) => {
  for (const ring of castle.rings) {
    ring.faces = [];
    ring.respawn_timer = 0;
    ring.spawn_radius = RING_SPAWN_INITIAL_RADIUS;
    for (let i = 0; i < ring.segments; i++) {
      ring.faces.push({ index: i, destroyed: false });
    }
  }
  castle.cannon.is_destroyed = false;
  castle.cannon.angle = 0;
  castle.cannon.cool_off_timer = 0;
  castle.cannon_projectile = null;
};

export const reset_castle = (castle_count = 2) => {
  castles = [];

  // const spacing_scale = 1 + castle_count - CASTLE_START_COUNT;
  const castle_spacing = CASTLE_MIN_SEPARATION; // * (0.2 * castle_count);

  for (let i = 0; i < castle_count; i++) {
    let pos;
    let attempts = 0;
    do {
      pos = random_castle_position();
      attempts++;
    } while (
      attempts < 20 &&
      castles.some((c) => {
        const dx = c.x - pos.x;
        const dy = c.y - pos.y;
        return Math.sqrt(dx * dx + dy * dy) < CASTLE_MIN_SEPARATION;
      })
    );
    const castle = create_castle(pos.x, pos.y);
    castle.spawn_in_progress = true;
    init_castle_faces(castle);
    castles.push(castle);
  }
};

export const ring_spawning = () =>
  castles.some(
    (c) =>
      !c.is_destroyed &&
      (c.spawn_in_progress || c.rings.some((r) => r.spawn_radius < r.radius)),
  );

export const update_castle_rings = (dt, player, game_state) => {
  for (const castle of castles) {
    if (castle.is_destroyed) continue;
    update_single_castle(dt, player, game_state, castle);
  }
};

const fire_all_cannons = (player) => {
  for (const c of castles) {
    if (c.is_destroyed || c.cannon_projectile || c.spawn_in_progress) continue;
    const fire_angle = Math.atan2(player.y - c.y, player.x - c.x);
    c.cannon.angle = fire_angle;
    setTimeout(() => {
      c.cannon_projectile = {
        x: c.x + Math.cos(fire_angle) * c.cannon.length,
        y: c.y + Math.sin(fire_angle) * c.cannon.length,
        angle: fire_angle,
        vx: Math.cos(fire_angle) * CANNON_SPARK_SPEED,
        vy: Math.sin(fire_angle) * CANNON_SPARK_SPEED,
        size: CANNON_SPARK_SIZE,
      };
      c.cannon.cool_off_timer = CANNON_COOL_OFF_TIME;
    }, CANNON_FIRE_WARMUP_TIME);
  }
};

const update_single_castle = (dt, player, game_state, castle) => {
  castle.ring_glow_time += dt;
  castle.center_rotation += CASTLE_CENTER_ROTATION_SPEED * dt;

  const cannon = castle.cannon;
  let all_rings_spawned = true;

  for (const ring of castle.rings) {
    ring.rotation += ring.rotationSpeed * dt * game_state.ring_speed_modifier;

    if (castle.spawn_in_progress) {
      if (ring.spawn_radius < ring.radius) {
        ring.spawn_radius += dt * ring.radius;
      }
      if (ring.spawn_radius >= ring.radius) {
        ring.spawn_radius = ring.radius;
      } else {
        all_rings_spawned = false;
      }
    } else if (ring.spawn_radius < ring.radius) {
      ring.spawn_radius += dt * ring.radius;
    }

    if (ring.respawn_timer > 0) {
      ring.respawn_timer -= dt;
      if (ring.respawn_timer <= 0) {
        for (const face of ring.faces) face.destroyed = false;
        ring.respawn_timer = 0;
        ring.spawn_radius = RING_SPAWN_INITIAL_RADIUS;
      }
    } else {
      if (ring.faces.every((face) => face.destroyed)) {
        ring.respawn_timer = RING_RESPAWN_TIME;
      }
    }
  }

  if (castle.spawn_in_progress) {
    if (all_rings_spawned) castle.spawn_in_progress = false;
    return;
  }

  if (player.alive) {
    const target_angle = Math.atan2(player.y - castle.y, player.x - castle.x);

    let angle_diff = target_angle - cannon.angle;
    while (angle_diff > Math.PI) angle_diff -= Math.PI * 2;
    while (angle_diff < -Math.PI) angle_diff += Math.PI * 2;

    const max_rotation = cannon.rotation_speed * dt;
    cannon.angle +=
      Math.abs(angle_diff) < max_rotation
        ? angle_diff
        : Math.sign(angle_diff) * max_rotation;

    if (cannon.cool_off_timer > 0) cannon.cool_off_timer -= dt;

    if (
      !castle.cannon_projectile &&
      cannon.cool_off_timer <= 0 &&
      has_clear_shot(castle, cannon.angle)
    ) {
      playSound("cannon_fire");
      fire_all_cannons(player);
    }
  }

  if (castle.cannon_projectile) {
    castle.cannon_projectile.x += castle.cannon_projectile.vx * dt;
    castle.cannon_projectile.y += castle.cannon_projectile.vy * dt;
    const p = castle.cannon_projectile;
    if (p.x * p.x + p.y * p.y > WORLD_RADIUS * WORLD_RADIUS) {
      castle.cannon_projectile = null;
    }
  }
};

const draw_single_castle = (castle, castle_index) => {
  if (is_castle_exploding(castle_index) || castle.is_destroyed) return;

  const transform = world_transform_at(castle.x, castle.y);
  const proj_transform = world_transform();

  const glow_pulse =
    RING_GLOW_BASE +
    Math.sin(castle.ring_glow_time * RING_GLOW_PULSE_SPEED) *
      RING_GLOW_PULSE_AMOUNT;

  for (const ring of castle.rings) {
    const segment_angle = (Math.PI * 2) / ring.segments;
    const draw_radius =
      ring.spawn_radius < ring.radius ? ring.spawn_radius : ring.radius;
    for (const face of ring.faces) {
      if (face.destroyed) continue;

      const start_angle = face.index * segment_angle + ring.rotation;
      const end_angle = (face.index + 1) * segment_angle + ring.rotation;

      const x1 = Math.cos(start_angle) * draw_radius;
      const y1 = Math.sin(start_angle) * draw_radius;
      const x2 = Math.cos(end_angle) * draw_radius;
      const y2 = Math.sin(end_angle) * draw_radius;

      const glow_color = [
        ring.color[0],
        ring.color[1],
        ring.color[2],
        glow_pulse * RING_GLOW_OUTER_ALPHA,
      ];
      const glow_color_inner = [
        ring.color[0],
        ring.color[1],
        ring.color[2],
        glow_pulse * RING_GLOW_INNER_ALPHA,
      ];

      const mid_angle = (start_angle + end_angle) / 2;

      const ox1_outer =
        x1 +
        Math.cos(start_angle) * RING_GLOW_OFFSET_OUTER -
        Math.cos(mid_angle) * RING_GLOW_OFFSET_OUTER * RING_GLOW_OFFSET_FACTOR;
      const oy1_outer =
        y1 +
        Math.sin(start_angle) * RING_GLOW_OFFSET_OUTER -
        Math.sin(mid_angle) * RING_GLOW_OFFSET_OUTER * RING_GLOW_OFFSET_FACTOR;
      const ox2_outer =
        x2 +
        Math.cos(end_angle) * RING_GLOW_OFFSET_OUTER -
        Math.cos(mid_angle) * RING_GLOW_OFFSET_OUTER * RING_GLOW_OFFSET_FACTOR;
      const oy2_outer =
        y2 +
        Math.sin(end_angle) * RING_GLOW_OFFSET_OUTER -
        Math.sin(mid_angle) * RING_GLOW_OFFSET_OUTER * RING_GLOW_OFFSET_FACTOR;

      draw_line(
        ox1_outer,
        oy1_outer,
        ox2_outer,
        oy2_outer,
        transform,
        glow_color,
      );

      const ox1_inner =
        x1 +
        Math.cos(start_angle) * RING_GLOW_OFFSET_INNER -
        Math.cos(mid_angle) * RING_GLOW_OFFSET_INNER * RING_GLOW_OFFSET_FACTOR;
      const oy1_inner =
        y1 +
        Math.sin(start_angle) * RING_GLOW_OFFSET_INNER -
        Math.sin(mid_angle) * RING_GLOW_OFFSET_INNER * RING_GLOW_OFFSET_FACTOR;
      const ox2_inner =
        x2 +
        Math.cos(end_angle) * RING_GLOW_OFFSET_INNER -
        Math.cos(mid_angle) * RING_GLOW_OFFSET_INNER * RING_GLOW_OFFSET_FACTOR;
      const oy2_inner =
        y2 +
        Math.sin(end_angle) * RING_GLOW_OFFSET_INNER -
        Math.sin(mid_angle) * RING_GLOW_OFFSET_INNER * RING_GLOW_OFFSET_FACTOR;

      draw_line(
        ox1_inner,
        oy1_inner,
        ox2_inner,
        oy2_inner,
        transform,
        glow_color_inner,
      );
      draw_line(x1, y1, x2, y2, transform, ring.color);
    }
  }

  const cannon = castle.cannon;
  const cannon_end_x = Math.cos(cannon.angle) * cannon.length;
  const cannon_end_y = Math.sin(cannon.angle) * cannon.length;
  const perp_x = Math.cos(cannon.angle + Math.PI / 2);
  const perp_y = Math.sin(cannon.angle + Math.PI / 2);

  for (let offset = -CANNON_THICKNESS; offset <= CANNON_THICKNESS; offset++) {
    draw_line(
      perp_x * offset,
      perp_y * offset,
      cannon_end_x + perp_x * offset,
      cannon_end_y + perp_y * offset,
      transform,
      CANNON_COLOR,
    );
  }

  for (let i = 0; i < CASTLE_CENTRAL_HEX_SIDES; i++) {
    const angle1 =
      castle.center_rotation + (i / CASTLE_CENTRAL_HEX_SIDES) * Math.PI * 2;
    const angle2 =
      castle.center_rotation +
      ((i + 1) / CASTLE_CENTRAL_HEX_SIDES) * Math.PI * 2;
    draw_line(
      Math.cos(angle1) * CASTLE_CENTRAL_HEX_RADIUS,
      Math.sin(angle1) * CASTLE_CENTRAL_HEX_RADIUS,
      Math.cos(angle2) * CASTLE_CENTRAL_HEX_RADIUS,
      Math.sin(angle2) * CASTLE_CENTRAL_HEX_RADIUS,
      transform,
      CASTLE_CENTRAL_HEX_COLOR,
    );
  }

  if (castle.cannon_projectile) {
    draw_spark({
      x: castle.cannon_projectile.x,
      y: castle.cannon_projectile.y,
      angle: castle.cannon_projectile.angle,
      size: castle.cannon_projectile.size,
      transform: proj_transform,
      color: CANNON_SPARK_COLOR,
    });
  }
};

export const draw_castle = () => {
  castles.forEach((castle, i) => draw_single_castle(castle, i));
};
