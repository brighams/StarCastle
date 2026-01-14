

// game_start
// game_over
// player_shoot
// ring_explode
// castle_explode
// enemy_explode
// player_explode
// enemy_spawn
// player_spawn

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const createOscillator = (type, frequency, startTime, duration, gainNode) => {
  const osc = audioCtx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);
  osc.connect(gainNode);
  osc.start(startTime);
  osc.stop(startTime + duration);
  return osc;
};

const createGain = (volume, startTime) => {
  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(volume, startTime);
  gainNode.connect(audioCtx.destination);
  return gainNode;
};

const effects = {
  game_start: (magnitude, volume) => {
    const now = audioCtx.currentTime;
    const gain = createGain(volume, now);
    // Ascending arpeggio
    [260, 330, 390, 520].forEach((freq, i) => {
      const osc = createOscillator('square', freq * magnitude, now + i * 0.1, 0.1, gain);
    });
    gain.gain.setValueAtTime(volume, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  },

  game_over: (magnitude, volume) => {
    const now = audioCtx.currentTime;
    const gain = createGain(volume, now);
    // Descending sad tones
    [400, 350, 300, 200].forEach((freq, i) => {
      createOscillator('square', freq * magnitude, now + i * 0.2, 0.2, gain);
    });
    gain.gain.setValueAtTime(volume, now + 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
  },

  player_shoot: (magnitude, volume) => {
    const now = audioCtx.currentTime;
    const gain = createGain(volume, now);
    const osc = createOscillator('square', 880 * magnitude, now, 0.1, gain);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  },

  ring_explode: (magnitude, volume) => {
    const now = audioCtx.currentTime;
    const gain = createGain(volume * 0.5, now);
    // Shimmery explosion
    const osc = createOscillator('triangle', 600 * magnitude, now, 0.3, gain);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  },

  castle_explode: (magnitude, volume) => {
    const now = audioCtx.currentTime;
    const gain = createGain(volume, now);
    // Big booming explosion
    const osc = createOscillator('sawtooth', 150 * magnitude, now, 0.5, gain);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  },

  enemy_explode: (magnitude, volume) => {
    const now = audioCtx.currentTime;
    const gain = createGain(volume, now);
    const osc = createOscillator('sawtooth', 300 * magnitude, now, 0.2, gain);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  },

  player_explode: (magnitude, volume) => {
    const now = audioCtx.currentTime;
    const gain = createGain(volume, now);
    // Dramatic death sound
    const osc = createOscillator('sawtooth', 440 * magnitude, now, 0.4, gain);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  },

  enemy_spawn: (magnitude, volume) => {
    const now = audioCtx.currentTime;
    const gain = createGain(volume * 0.6, now);
    const osc = createOscillator('square', 100 * magnitude, now, 0.15, gain);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  },

  player_spawn: (magnitude, volume) => {
    const now = audioCtx.currentTime;
    const gain = createGain(volume * 0.7, now);
    // Cheerful spawn sound
    [330, 440, 550].forEach((freq, i) => {
      createOscillator('triangle', freq * magnitude, now + i * 0.08, 0.08, gain);
    });
    gain.gain.setValueAtTime(volume * 0.7, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  },

  beep: (magnitude, volume) => {
    const now = audioCtx.currentTime;
    const gain = createGain(volume, now);
    createOscillator('square', 440 * magnitude, now, 0.1, gain);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  }
};

export const playSound = (effectName = 'beep', magnitude = 1.0, volume = 0.5) => {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const effect = effects[effectName] || effects.beep;
  effect(magnitude, volume);
};
