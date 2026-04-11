import {
  TOP_RIGHT_Y,
  RADAR_RADIUS,
  WORLD_RADIUS,
  UI_AUTOPILOT_HINT_Y_OFFSET,
  UI_AUTOPILOT_X,
  UI_BITCOIN_Y_END,
  UI_BITCOIN_Y_START,
  UI_DEBUG_Y_BASE,
  UI_EXIT_Y,
  UI_HIGH_SCORE_Y_OFFSET,
  UI_HUD_SCORE_X_OFFSET,
  UI_HUD_TITLE_X_OFFSET,
  UI_HUD_TITLE_Y,
  UI_INSTRUCTIONS_Y_OFFSET,
  UI_LIVES_SHIP_SIZE,
  UI_LIVES_X_SPACING,
  UI_LIVES_X_START,
  UI_LIVES_Y,
  UI_PYRRHIC_HINT_Y_OFFSET,
  UI_PYRRHIC_SUBTITLE_Y_OFFSET,
  UI_PYRRHIC_TITLE_Y_OFFSET,
  UI_ROUND_WON_NEXT_Y_OFFSET,
  UI_ROUND_WON_SCORE_Y_OFFSET,
  UI_ROUND_WON_Y_OFFSET,
  UI_SUBTITLE_Y_OFFSET,
  UI_TAGLINE_Y_OFFSET,
  UI_TITLE_Y_OFFSET,
} from "./constants.js";
import { identity_matrix } from "./math.js";
import { draw_circle, draw_line, viewport } from "./renderer.js";
import { getHighScore } from "./score.js";
import { game_state } from "./main.js";
import { draw_player_ship, player } from "./player.js";
import { draw_animated_text, draw_text } from "./text.js";
import { get_castles } from "./castle.js";
import { wingmen } from "./wingmen.js";

let infoBox = document.getElementById("infoBox");
let debug_enabled = false;
export const toggle_debug = () => {
  debug_enabled = !debug_enabled;
};

export const toggle_info_box = (show = null) => {
  const visible = show === null ? infoBox.style.display !== "block" : show;
  infoBox.style.display = visible ? "block" : "none";
};

const draw_player_remaining_lives = (lives, transform) => {
  for (let i = 0; i < lives; i++) {
    const ship_x = UI_LIVES_X_START + i * UI_LIVES_X_SPACING;
    draw_player_ship({
      x: ship_x,
      y: UI_LIVES_Y,
      angle: 0,
      size: UI_LIVES_SHIP_SIZE,
      transform,
      color: [1.0, 1.0, 0.0, 1.0],
    });
  }
};

const TITLE_LINES = (transform) => {
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;

  draw_animated_text(
    "STARKEEPERS",
    cx - 1,
    cy + UI_TITLE_Y_OFFSET - 1,
    8,
    transform,
    [1.0, 1.0, 0.0, 1.0],
    3.0,
  );

  draw_animated_text(
    "STARKEEPERS",
    cx + 1,
    cy + UI_TITLE_Y_OFFSET + 1,
    8,
    transform,
    [1.0, 0.0, 0.5, 1.0],
    3.0,
  );

  draw_animated_text(
    "BY BRIGHAM@STARKEEPER.IO",
    cx,
    cy + UI_SUBTITLE_Y_OFFSET,
    1.5,
    transform,
    [1.0, 0.0, 0.5, 1.0],
    3.0,
  );
};

const draw_radar = (transform) => {
  const scale = RADAR_RADIUS / WORLD_RADIUS;
  const rcx = viewport.width - 100;
  const rcy = 100;

  draw_circle(rcx, rcy, RADAR_RADIUS, 48, transform, [0.0, 0.4, 0.4, 0.35]);
  draw_circle(rcx, rcy, RADAR_RADIUS, 48, transform, [0.0, 0.8, 0.8, 0.8]);

  for (const castle of get_castles()) {
    if (castle.is_destroyed) continue;
    const sq = 4;
    const cx = rcx + castle.x * scale;
    const cy = rcy + castle.y * scale;
    draw_line(
      cx - sq,
      cy - sq,
      cx + sq,
      cy - sq,
      transform,
      [1.0, 0.0, 0.0, 1.0],
    );
    draw_line(
      cx + sq,
      cy - sq,
      cx + sq,
      cy + sq,
      transform,
      [1.0, 0.0, 0.0, 1.0],
    );
    draw_line(
      cx + sq,
      cy + sq,
      cx - sq,
      cy + sq,
      transform,
      [1.0, 0.0, 0.0, 1.0],
    );
    draw_line(
      cx - sq,
      cy + sq,
      cx - sq,
      cy - sq,
      transform,
      [1.0, 0.0, 0.0, 1.0],
    );
  }

  const rx = player.x * scale;
  const ry = player.y * scale;
  const rd = Math.sqrt(rx * rx + ry * ry);
  const clamp_r = RADAR_RADIUS - 5;
  const px = rcx + (rd > clamp_r ? (rx / rd) * clamp_r : rx);
  const py = rcy + (rd > clamp_r ? (ry / rd) * clamp_r : ry);
  const xs = 4;
  draw_line(
    px - xs,
    py - xs,
    px + xs,
    py + xs,
    transform,
    [1.0, 1.0, 1.0, 1.0],
  );
  draw_line(
    px + xs,
    py - xs,
    px - xs,
    py + xs,
    transform,
    [1.0, 1.0, 1.0, 1.0],
  );

  for (const wingman of wingmen) {
    if (!wingman.alive) continue;
    const wx = rcx + wingman.x * scale;
    const wy = rcy + wingman.y * scale;
    draw_line(
      wx - xs,
      wy - xs,
      wx + xs,
      wy + xs,
      transform,
      [0.0, 1.0, 1.0, 1.0],
    );
    draw_line(
      wx + xs,
      wy - xs,
      wx - xs,
      wy + xs,
      transform,
      [0.0, 1.0, 1.0, 1.0],
    );
  }
};

export const draw_ui = (lives, score, game_over, round_won) => {
  const transform = identity_matrix();
  const { entice_mode, entice_animation_t } = game_state;
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  const trx = viewport.width - 16;

  if (!game_over && !entice_mode) {
    draw_player_remaining_lives(lives, transform);
  }

  if (game_over) {
    const animating = entice_animation_t >= 0;
    const t_s = animating
      ? entice_animation_t * entice_animation_t * (3 - 2 * entice_animation_t)
      : 0;
    const bitcoin_y =
      UI_BITCOIN_Y_START + (UI_BITCOIN_Y_END - UI_BITCOIN_Y_START) * t_s;

    TITLE_LINES(transform);
    draw_animated_text(
      "INSERT BITCOIN OR PRESS ENTER TO START",
      cx,
      bitcoin_y,
      3,
      transform,
      [0.0, 0.9, 0.9, 1.0],
      3.0,
    );

    const fade = 1 - t_s;
    draw_animated_text(
      "PRESS TAB FOR INSTRUCTIONS",
      cx,
      cy + UI_INSTRUCTIONS_Y_OFFSET,
      2.5,
      transform,
      [1.0, 0.0, 0.533, fade],
      3.0,
    );
    draw_animated_text(
      `HIGH SCORE: ${getHighScore()}`,
      cx,
      cy + UI_HIGH_SCORE_Y_OFFSET,
      2,
      transform,
      [1.0, 1.0, 0.0, fade],
      3.0,
    );
    if (window.self !== window.top) {
      draw_animated_text(
        "PRESS X TO EXIT",
        cx,
        UI_EXIT_Y,
        3,
        transform,
        [1.0, 0.45, 0.0, 1.0],
        2.0,
      );
    }
  } else if (entice_mode) {
    TITLE_LINES(transform);
    draw_animated_text(
      "INSERT BITCOIN OR PRESS ENTER TO START",
      cx,
      UI_BITCOIN_Y_END,
      3,
      transform,
      [0.0, 0.9, 0.9, 1.0],
      3.0,
    );
    if (window.self !== window.top) {
      draw_animated_text(
        "PRESS X TO EXIT",
        cx,
        UI_EXIT_Y,
        3,
        transform,
        [1.0, 0.45, 0.0, 1.0],
        2.0,
      );
    }
  } else if (round_won) {
    if (!game_state.pyrrhic_victory) {
      draw_text(
        "ROUND WON",
        cx,
        cy + UI_ROUND_WON_Y_OFFSET,
        5,
        transform,
        [1.0, 0.84, 0.0, 1.0],
      );
      draw_text(
        "YOU ARE GRANTED ANOTHER SHIP",
        cx,
        cy + UI_TITLE_Y_OFFSET,
        5,
        transform,
        [1.0, 0.84, 0.0, 1.0],
      );
    } else {
      draw_text(
        "PYRRHIC VICTORY!",
        cx,
        cy + UI_PYRRHIC_TITLE_Y_OFFSET,
        5,
        transform,
        [1.0, 0.84, 0.0, 1.0],
      );
      draw_text(
        "A WORTHY SACRIFICE MY STARKEEPER",
        cx,
        cy + UI_PYRRHIC_SUBTITLE_Y_OFFSET,
        3,
        transform,
        [1.0, 0.84, 0.0, 1.0],
      );
      draw_text(
        "NEXT TIME TRY TO SURVIVE",
        cx,
        cy + UI_PYRRHIC_HINT_Y_OFFSET,
        3,
        transform,
        [1.0, 0.0, 0.5, 1.0],
      );
    }
    draw_text(
      "PRESS ENTER TO START THE NEXT ROUND",
      cx,
      cy + UI_ROUND_WON_NEXT_Y_OFFSET,
      3,
      transform,
      [1.0, 0.84, 0.0, 1.0],
    );
    draw_text(
      `HIGH SCORE: ${getHighScore()}`,
      cx,
      cy + UI_ROUND_WON_SCORE_Y_OFFSET,
      2,
      transform,
      [1.0, 1.0, 0.0, 1.0],
    );
    draw_text(
      `SCORE ${score}`,
      trx + UI_HUD_SCORE_X_OFFSET,
      TOP_RIGHT_Y,
      3,
      transform,
      [1.0, 0.0, 0.5, 1.0],
    );
  } else {
    draw_text(
      `HIGH ${getHighScore()} SCORE ${score}`,
      trx + UI_HUD_SCORE_X_OFFSET,
      TOP_RIGHT_Y,
      3,
      transform,
      [1.0, 0.0, 0.5, 1.0],
    );
    draw_text(
      "STARKEEPER ONE",
      cx + UI_HUD_TITLE_X_OFFSET,
      UI_HUD_TITLE_Y,
      3,
      transform,
      [0.0, 1.0, 1.0, 1.0],
    );
    draw_radar(transform);

    if (game_state.autopilot_on) {
      draw_animated_text(
        "AUTOPILOT ACTIVE",
        UI_AUTOPILOT_X,
        TOP_RIGHT_Y,
        2,
        transform,
        [0.0, 1.0, 0.0, 1.0],
        2.0,
      );
      draw_text(
        "PRESS BACKSPACE TO DISABLE",
        UI_AUTOPILOT_X,
        TOP_RIGHT_Y + UI_AUTOPILOT_HINT_Y_OFFSET,
        1.5,
        transform,
        [0.5, 1.0, 0.5, 0.8],
      );
    }

    if (debug_enabled) {
      draw_text(
        `VIEW ${viewport.width}X${viewport.height}`,
        cx,
        UI_DEBUG_Y_BASE,
        1.5,
        transform,
        [0.3, 1.0, 0.3, 1.0],
      );
      draw_text(
        `SHIP ${Math.round(player.x)} ${Math.round(player.y)}`,
        cx,
        UI_DEBUG_Y_BASE + 14,
        1.5,
        transform,
        [0.3, 1.0, 0.3, 1.0],
      );
    }
  }
};
