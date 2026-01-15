

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
    const duration = 0.35;

    // Initial "thwip" attack - quick rising tone
    const attackGain = audioCtx.createGain();
    attackGain.gain.setValueAtTime(volume * 0.8, now);
    attackGain.gain.exponentialRampToValueAtTime(volume * 0.3, now + 0.05);
    attackGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    attackGain.connect(audioCtx.destination);

    const attackOsc = audioCtx.createOscillator();
    attackOsc.type = 'sine';
    attackOsc.frequency.setValueAtTime(200 * magnitude, now);
    attackOsc.frequency.exponentialRampToValueAtTime(800 * magnitude, now + 0.04);
    attackOsc.frequency.exponentialRampToValueAtTime(400 * magnitude, now + duration);
    attackOsc.connect(attackGain);
    attackOsc.start(now);
    attackOsc.stop(now + duration);

    // Warbling "photon" sustain with vibrato
    const photonGain = audioCtx.createGain();
    photonGain.gain.setValueAtTime(0.001, now);
    photonGain.gain.exponentialRampToValueAtTime(volume * 0.5, now + 0.03);
    photonGain.gain.setValueAtTime(volume * 0.4, now + 0.1);
    photonGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    photonGain.connect(audioCtx.destination);

    const photonOsc = audioCtx.createOscillator();
    photonOsc.type = 'triangle';
    photonOsc.frequency.setValueAtTime(600 * magnitude, now);
    photonOsc.frequency.setValueAtTime(550 * magnitude, now + 0.1);
    photonOsc.frequency.exponentialRampToValueAtTime(300 * magnitude, now + duration);

    // Vibrato LFO for the warble effect
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.frequency.setValueAtTime(25, now);
    lfoGain.gain.setValueAtTime(30 * magnitude, now);
    lfo.connect(lfoGain);
    lfoGain.connect(photonOsc.frequency);
    lfo.start(now);
    lfo.stop(now + duration);

    photonOsc.connect(photonGain);
    photonOsc.start(now);
    photonOsc.stop(now + duration);

    // Sub-bass punch for weight
    const subGain = audioCtx.createGain();
    subGain.gain.setValueAtTime(volume * 0.6, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    subGain.connect(audioCtx.destination);

    const subOsc = audioCtx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(80 * magnitude, now);
    subOsc.frequency.exponentialRampToValueAtTime(40 * magnitude, now + 0.15);
    subOsc.connect(subGain);
    subOsc.start(now);
    subOsc.stop(now + 0.15);
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

  cannon_fire: (magnitude, volume) => {
    const now = audioCtx.currentTime;
    const duration = 0.25;

    // Create noise buffer for the "Shhhh" component
    const bufferSize = audioCtx.sampleRate * duration;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Bandpass filter for the "rreeet" tonal quality - sweeps up
    const bandpass = audioCtx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(800 * magnitude, now);
    bandpass.frequency.exponentialRampToValueAtTime(3000 * magnitude, now + duration * 0.6);
    bandpass.frequency.exponentialRampToValueAtTime(1500 * magnitude, now + duration);
    bandpass.Q.setValueAtTime(5, now);

    // High frequency oscillator for the "eet" screech
    const screechGain = audioCtx.createGain();
    screechGain.gain.setValueAtTime(0, now);
    screechGain.gain.linearRampToValueAtTime(volume * 0.3, now + duration * 0.3);
    screechGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    screechGain.connect(audioCtx.destination);

    const screechOsc = audioCtx.createOscillator();
    screechOsc.type = 'sawtooth';
    screechOsc.frequency.setValueAtTime(1200 * magnitude, now);
    screechOsc.frequency.exponentialRampToValueAtTime(2500 * magnitude, now + duration * 0.5);
    screechOsc.frequency.exponentialRampToValueAtTime(1800 * magnitude, now + duration);
    screechOsc.connect(screechGain);
    screechOsc.start(now);
    screechOsc.stop(now + duration);

    // Main noise envelope
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(volume * 0.6, now);
    noiseGain.gain.setValueAtTime(volume * 0.6, now + duration * 0.7);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseSource.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);

    noiseSource.start(now);
    noiseSource.stop(now + duration);
  },

  beep: (magnitude, volume) => {
    const now = audioCtx.currentTime;
    const gain = createGain(volume, now);
    createOscillator('square', 440 * magnitude, now, 0.1, gain);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  }
};


export const startMainThruster = (volume = 0.08) => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (mainThrusterOsc) return; // Already playing

  const now = audioCtx.currentTime;
  mainThrusterGain = audioCtx.createGain();
  mainThrusterGain.gain.setValueAtTime(0.001, now);
  mainThrusterGain.gain.exponentialRampToValueAtTime(volume, now + 0.15);
  mainThrusterGain.connect(audioCtx.destination);

  // Main thruster: layered triangle waves for smooth rocket rumble
  const baseFreq = 55; // Low A note

  // Base tone - triangle for smooth low rumble
  mainThrusterOsc = audioCtx.createOscillator();
  mainThrusterOsc.type = 'triangle';
  mainThrusterOsc.frequency.setValueAtTime(baseFreq, now);

  // Second harmonic for richness
  const osc2 = audioCtx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(baseFreq * 2, now);

  // Third harmonic - quieter
  const osc3 = audioCtx.createOscillator();
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(baseFreq * 3, now);

  // Subtle slow vibrato for that engine throb
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.setValueAtTime(6, now); // Slower wobble
  lfoGain.gain.setValueAtTime(3, now);  // Subtle pitch variation
  lfo.connect(lfoGain);
  lfoGain.connect(mainThrusterOsc.frequency);
  lfoGain.connect(osc2.frequency);
  lfo.start(now);

  // Mix the oscillators with different levels
  const mixer = audioCtx.createGain();
  mixer.gain.setValueAtTime(1, now);
  mixer.connect(mainThrusterGain);

  const osc2Gain = audioCtx.createGain();
  osc2Gain.gain.setValueAtTime(0.5, now);

  const osc3Gain = audioCtx.createGain();
  osc3Gain.gain.setValueAtTime(0.25, now);

  mainThrusterOsc.connect(mixer);
  osc2.connect(osc2Gain);
  osc2Gain.connect(mixer);
  osc3.connect(osc3Gain);
  osc3Gain.connect(mixer);

  mainThrusterOsc.start(now);
  osc2.start(now);
  osc3.start(now);

  // Store references for cleanup
  mainThrusterOsc._lfo = lfo;
  mainThrusterOsc._osc2 = osc2;
  mainThrusterOsc._osc3 = osc3;
};

export const stopMainThruster = () => {
  if (!mainThrusterOsc) return;

  const now = audioCtx.currentTime;
  mainThrusterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  const oscToStop = mainThrusterOsc;
  const lfoToStop = mainThrusterOsc._lfo;
  const osc2ToStop = mainThrusterOsc._osc2;
  const osc3ToStop = mainThrusterOsc._osc3;

  setTimeout(() => {
    oscToStop.stop();
    if (lfoToStop) lfoToStop.stop();
    if (osc2ToStop) osc2ToStop.stop();
    if (osc3ToStop) osc3ToStop.stop();
  }, 200);

  mainThrusterOsc = null;
  mainThrusterGain = null;
};

export const startAttitudeThruster = (volume = 0.03) => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (attitudeThrusterOsc) return; // Already playing

  const now = audioCtx.currentTime;
  attitudeThrusterGain = audioCtx.createGain();
  attitudeThrusterGain.gain.setValueAtTime(0.001, now);
  attitudeThrusterGain.gain.exponentialRampToValueAtTime(volume, now + 0.08);
  attitudeThrusterGain.connect(audioCtx.destination);

  // Attitude thrusters: same rocket sound but higher pitched and quieter
  const baseFreq = 110; // Higher than main thruster

  attitudeThrusterOsc = audioCtx.createOscillator();
  attitudeThrusterOsc.type = 'triangle';
  attitudeThrusterOsc.frequency.setValueAtTime(baseFreq, now);

  const osc2 = audioCtx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(baseFreq * 2, now);

  // Faster vibrato for smaller thrusters
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.setValueAtTime(10, now);
  lfoGain.gain.setValueAtTime(4, now);
  lfo.connect(lfoGain);
  lfoGain.connect(attitudeThrusterOsc.frequency);
  lfo.start(now);

  const osc2Gain = audioCtx.createGain();
  osc2Gain.gain.setValueAtTime(0.4, now);

  attitudeThrusterOsc.connect(attitudeThrusterGain);
  osc2.connect(osc2Gain);
  osc2Gain.connect(attitudeThrusterGain);

  attitudeThrusterOsc.start(now);
  osc2.start(now);

  attitudeThrusterOsc._lfo = lfo;
  attitudeThrusterOsc._osc2 = osc2;
};

export const stopAttitudeThruster = () => {
  if (!attitudeThrusterOsc) return;

  const now = audioCtx.currentTime;
  attitudeThrusterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  const oscToStop = attitudeThrusterOsc;
  const lfoToStop = attitudeThrusterOsc._lfo;
  const osc2ToStop = attitudeThrusterOsc._osc2;

  setTimeout(() => {
    oscToStop.stop();
    if (lfoToStop) lfoToStop.stop();
    if (osc2ToStop) osc2ToStop.stop();
  }, 120);

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
