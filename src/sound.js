

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
    const duration = 0.8;

    // Main Gain Envelope
    const mainGain = createGain(volume, now);
    mainGain.gain.setValueAtTime(0.001, now);
    mainGain.gain.exponentialRampToValueAtTime(volume, now + 0.1);
    mainGain.gain.setValueAtTime(volume, now + 0.5);
    mainGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // 1. "Rounded" Low-Pitch Start (Triangle wave)
    const roundOsc = audioCtx.createOscillator();
    roundOsc.type = 'triangle';
    roundOsc.frequency.setValueAtTime(120 * magnitude, now); // Low starting pitch
    roundOsc.frequency.exponentialRampToValueAtTime(400 * magnitude, now + 0.4);
    roundOsc.frequency.linearRampToValueAtTime(500 * magnitude, now + 0.6); // The "L" finish
    roundOsc.connect(mainGain);
    roundOsc.start(now);
    roundOsc.stop(now + duration);

    // 2. Exciting Fuzz Layer (Sawtooth + Noise)
    const fuzzGain = audioCtx.createGain();
    fuzzGain.gain.setValueAtTime(0, now);
    fuzzGain.gain.linearRampToValueAtTime(volume * 0.5, now + 0.15); // Fade in the grit
    fuzzGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    fuzzGain.connect(audioCtx.destination);

    const sawtoothOsc = audioCtx.createOscillator();
    sawtoothOsc.type = 'sawtooth';
    sawtoothOsc.frequency.setValueAtTime(120 * magnitude, now);
    sawtoothOsc.frequency.exponentialRampToValueAtTime(400 * magnitude, now + 0.4);
    sawtoothOsc.connect(fuzzGain);
    sawtoothOsc.start(now);
    sawtoothOsc.stop(now + 0.6);

    // Noise buffer for the texture
    const bufferSize = audioCtx.sampleRate * 0.5;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(400 * magnitude, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(800 * magnitude, now + 0.4);
    noiseFilter.Q.setValueAtTime(1, now);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(fuzzGain);
    noiseSource.start(now);
    noiseSource.stop(now + 0.5);

    // 3. High-pitched stinger at the end
    const stingerStartTime = now + 0.55;
    const stingerGain = createGain(0.001, stingerStartTime);
    stingerGain.gain.exponentialRampToValueAtTime(volume * 0.7, stingerStartTime + 0.05);
    stingerGain.gain.exponentialRampToValueAtTime(0.001, stingerStartTime + 0.2);

    const stingerOsc = audioCtx.createOscillator();
    stingerOsc.type = 'sine';
    stingerOsc.frequency.setValueAtTime(1500 * magnitude, stingerStartTime);
    stingerOsc.frequency.exponentialRampToValueAtTime(2200 * magnitude, stingerStartTime + 0.1);
    stingerOsc.connect(stingerGain);
    stingerOsc.start(stingerStartTime);
    stingerOsc.stop(stingerStartTime + 0.2);
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
    const duration = 0.2; // Shorter and snappier for a laser

    // 1. The Laser "Pew" - Fast downward sweep
    const laserGain = createGain(volume * 0.8, now);
    laserGain.gain.setValueAtTime(volume * 0.8, now);
    laserGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    const laserOsc = audioCtx.createOscillator();
    laserOsc.type = 'square'; // Square wave gives it that retro sci-fi "bite"
    laserOsc.frequency.setValueAtTime(1200 * magnitude, now);
    laserOsc.frequency.exponentialRampToValueAtTime(400 * magnitude, now + duration);
    laserOsc.connect(laserGain);
    laserOsc.start(now);
    laserOsc.stop(now + duration);

    // 2. The "Whoosh" - High-pass noise
    const bufferSize = audioCtx.sampleRate * duration;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(2000 * magnitude, now);

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(volume * 0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 1.5);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    noiseSource.start(now);
    noiseSource.stop(now + duration * 1.5);

    // 3. Initial "Thump" - For mechanical feel
    const thumpGain = createGain(volume * 0.5, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    const thumpOsc = audioCtx.createOscillator();
    thumpOsc.type = 'sine';
    thumpOsc.frequency.setValueAtTime(150 * magnitude, now);
    thumpOsc.connect(thumpGain);
    thumpOsc.start(now);
    thumpOsc.stop(now + 0.05);
  },

  sound_ping: (magnitude, volume) => {
    const now = audioCtx.currentTime;
    const gain = createGain(volume * 0.5, now);
    // Shimmery explosion (formerly ring_explode)
    const osc = createOscillator('triangle', 600 * magnitude, now, 0.3, gain);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  },

  ring_explode: (magnitude, volume) => {
    const now = audioCtx.currentTime;
    const duration = 0.5; // Slightly longer but still punchy

    // 1. Crashing Boom (Low frequency sawtooth)
    const boomGain = createGain(volume * 0.8, now);
    boomGain.gain.setValueAtTime(volume * 0.8, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    const boomOsc = audioCtx.createOscillator();
    boomOsc.type = 'sawtooth';
    boomOsc.frequency.setValueAtTime(150 * magnitude, now);
    boomOsc.frequency.exponentialRampToValueAtTime(40 * magnitude, now + duration);
    boomOsc.connect(boomGain);
    boomOsc.start(now);
    boomOsc.stop(now + duration);

    // 2. Fuzzy Crash (Filtered Noise)
    const bufferSize = audioCtx.sampleRate * duration;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(2000 * magnitude, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(500, now + duration);

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(volume * 0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    noiseSource.start(now);
    noiseSource.stop(now + duration);

    // 3. Sub-bass punch for initial impact
    const subGain = createGain(volume, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    const subOsc = audioCtx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(80 * magnitude, now);
    subOsc.connect(subGain);
    subOsc.start(now);
    subOsc.stop(now + 0.15);
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
    const duration = 1.2; // Much longer for dramatic effect

    // Create noise buffer for the fuzz/explosion texture
    const bufferSize = audioCtx.sampleRate * duration;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    // Noise source with lowpass for rumble
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(2000 * magnitude, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(200, now + duration);
    noiseFilter.Q.setValueAtTime(1, now);

    const noiseGain = audioCtx.createGain();
    // Envelope: quick attack, sustain, then decay
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.exponentialRampToValueAtTime(volume * 0.7, now + 0.02); // Fast attack
    noiseGain.gain.setValueAtTime(volume * 0.6, now + 0.1);
    noiseGain.gain.exponentialRampToValueAtTime(volume * 0.4, now + 0.3);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);

    noiseSource.start(now);
    noiseSource.stop(now + duration);

    // Deep bass "boom" - the kaboom foundation
    const boomGain = audioCtx.createGain();
    boomGain.gain.setValueAtTime(0.001, now);
    boomGain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    boomGain.gain.exponentialRampToValueAtTime(volume * 0.5, now + 0.15);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    boomGain.connect(audioCtx.destination);

    const boomOsc = audioCtx.createOscillator();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(80 * magnitude, now);
    boomOsc.frequency.exponentialRampToValueAtTime(25, now + 0.8);
    boomOsc.connect(boomGain);
    boomOsc.start(now);
    boomOsc.stop(now + 0.8);

    // Mid-frequency crunch - adds the harsh explosion character
    const crunchGain = audioCtx.createGain();
    crunchGain.gain.setValueAtTime(0.001, now);
    crunchGain.gain.exponentialRampToValueAtTime(volume * 0.8, now + 0.01);
    crunchGain.gain.exponentialRampToValueAtTime(volume * 0.3, now + 0.2);
    crunchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    crunchGain.connect(audioCtx.destination);

    const crunchOsc = audioCtx.createOscillator();
    crunchOsc.type = 'sawtooth';
    crunchOsc.frequency.setValueAtTime(300 * magnitude, now);
    crunchOsc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
    crunchOsc.connect(crunchGain);
    crunchOsc.start(now);
    crunchOsc.stop(now + 0.6);

    // Secondary explosion "echo" for added drama
    const echoDelay = 0.15;
    const echoGain = audioCtx.createGain();
    echoGain.gain.setValueAtTime(0.001, now + echoDelay);
    echoGain.gain.exponentialRampToValueAtTime(volume * 0.4, now + echoDelay + 0.02);
    echoGain.gain.exponentialRampToValueAtTime(0.001, now + echoDelay + 0.5);
    echoGain.connect(audioCtx.destination);

    const echoOsc = audioCtx.createOscillator();
    echoOsc.type = 'sawtooth';
    echoOsc.frequency.setValueAtTime(200 * magnitude, now + echoDelay);
    echoOsc.frequency.exponentialRampToValueAtTime(30, now + echoDelay + 0.5);
    echoOsc.connect(echoGain);
    echoOsc.start(now + echoDelay);
    echoOsc.stop(now + echoDelay + 0.5);
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
