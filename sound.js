

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

// Looping sound state
let mainThrusterOsc = null;
let mainThrusterGain = null;
let attitudeThrusterOsc = null;
let attitudeThrusterGain = null;

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


export const startMainThruster = (volume = 0.3) => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (mainThrusterOsc) return; // Already playing

  const now = audioCtx.currentTime;
  mainThrusterGain = audioCtx.createGain();
  mainThrusterGain.gain.setValueAtTime(0.001, now);
  mainThrusterGain.gain.exponentialRampToValueAtTime(volume, now + 0.1);
  mainThrusterGain.connect(audioCtx.destination);

  // Main thruster: low rumbling square wave with slight wobble
  mainThrusterOsc = audioCtx.createOscillator();
  mainThrusterOsc.type = 'sawtooth';
  mainThrusterOsc.frequency.setValueAtTime(80, now);

  // Add slight frequency modulation for that 8-bit engine rumble
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.setValueAtTime(15, now);
  lfoGain.gain.setValueAtTime(20, now);
  lfo.connect(lfoGain);
  lfoGain.connect(mainThrusterOsc.frequency);
  lfo.start(now);

  mainThrusterOsc.connect(mainThrusterGain);
  mainThrusterOsc.start(now);

  // Store LFO reference for cleanup
  mainThrusterOsc._lfo = lfo;
  mainThrusterOsc._lfoGain = lfoGain;
};

export const stopMainThruster = () => {
  if (!mainThrusterOsc) return;

  const now = audioCtx.currentTime;
  mainThrusterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  const oscToStop = mainThrusterOsc;
  const lfoToStop = mainThrusterOsc._lfo;
  setTimeout(() => {
    oscToStop.stop();
    if (lfoToStop) lfoToStop.stop();
  }, 150);

  mainThrusterOsc = null;
  mainThrusterGain = null;
};

export const startAttitudeThruster = (volume = 0.15) => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (attitudeThrusterOsc) return; // Already playing

  const now = audioCtx.currentTime;
  attitudeThrusterGain = audioCtx.createGain();
  attitudeThrusterGain.gain.setValueAtTime(0.001, now);
  attitudeThrusterGain.gain.exponentialRampToValueAtTime(volume, now + 0.05);
  attitudeThrusterGain.connect(audioCtx.destination);

  // Attitude thrusters: higher pitched, hissy burst
  attitudeThrusterOsc = audioCtx.createOscillator();
  attitudeThrusterOsc.type = 'square';
  attitudeThrusterOsc.frequency.setValueAtTime(220, now);

  // Rapid pulsing for that retro "pft pft pft" attitude jet sound
  const pulse = audioCtx.createOscillator();
  const pulseGain = audioCtx.createGain();
  pulse.frequency.setValueAtTime(30, now);
  pulseGain.gain.setValueAtTime(60, now);
  pulse.connect(pulseGain);
  pulseGain.connect(attitudeThrusterOsc.frequency);
  pulse.start(now);

  attitudeThrusterOsc.connect(attitudeThrusterGain);
  attitudeThrusterOsc.start(now);

  attitudeThrusterOsc._pulse = pulse;
};

export const stopAttitudeThruster = () => {
  if (!attitudeThrusterOsc) return;

  const now = audioCtx.currentTime;
  attitudeThrusterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  const oscToStop = attitudeThrusterOsc;
  const pulseToStop = attitudeThrusterOsc._pulse;
  setTimeout(() => {
    oscToStop.stop();
    if (pulseToStop) pulseToStop.stop();
  }, 100);

  attitudeThrusterOsc = null;
  attitudeThrusterGain = null;
};

export const playSound = (effectName = 'beep', magnitude = 1.0, volume = 0.5) => {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const effect = effects[effectName] || effects.beep;
  effect(magnitude, volume);
};
